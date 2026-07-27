// =========================================================
// firebase-init.js - Lis Noir クラウドセーブ連携
// Firebase Authentication（メール/パスワード）+ Firestore を使用
// =========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBY4434KJ5z4RcZesQ_V05wUfvS5WisMJI",
  authDomain: "lis-noir.firebaseapp.com",
  projectId: "lis-noir",
  storageBucket: "lis-noir.firebasestorage.app",
  messagingSenderId: "230605287961",
  appId: "1:230605287961:web:0e29dacbd3dc4a5a00b088",
  measurementId: "G-N0JG8FSG2R",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let authReady = false;
const authChangeListeners = [];

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  authReady = true;
  authChangeListeners.forEach((cb) => cb(user));
});

function friendlyAuthError(err) {
  const code = err && err.code ? err.code : '';
  const map = {
    'auth/email-already-in-use': 'このメールアドレスは既に登録されています。ログインをお試しください。',
    'auth/invalid-email': 'メールアドレスの形式が正しくありません。',
    'auth/weak-password': 'パスワードは6文字以上にしてください。',
    'auth/user-not-found': 'アカウントが見つかりません。メールアドレスをご確認ください。',
    'auth/wrong-password': 'パスワードが違います。',
    'auth/invalid-credential': 'メールアドレスまたはパスワードが正しくありません。',
    'auth/too-many-requests': '試行回数が多すぎます。しばらく待ってから再度お試しください。',
  };
  return map[code] || ('エラーが発生しました（' + code + '）');
}

// オンライン対戦の部屋コードを生成する（紛らわしい 0/O, 1/I を除いた6桁の英数字）
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

window.LisNoirCloud = {
  signUp(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
      .catch((err) => { throw new Error(friendlyAuthError(err)); });
  },
  signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
      .catch((err) => { throw new Error(friendlyAuthError(err)); });
  },
  signInAnon() {
    return signInAnonymously(auth)
      .then((cred) => { currentUser = cred.user; return cred; })
      .catch((err) => { throw new Error(friendlyAuthError(err)); });
  },
  signOutUser() {
    return signOut(auth);
  },
  onAuthChange(cb) {
    authChangeListeners.push(cb);
    if (authReady) cb(currentUser);
  },
  getUser() {
    return currentUser;
  },
  async saveCloud(stateObj) {
    if (!currentUser) throw new Error('not logged in');
    await setDoc(doc(db, 'saves', currentUser.uid), {
      data: JSON.stringify(stateObj),
      updatedAt: Date.now(),
    });
  },
  async loadCloud() {
    if (!currentUser) throw new Error('not logged in');
    const snap = await getDoc(doc(db, 'saves', currentUser.uid));
    if (!snap.exists()) return null;
    const raw = snap.data();
    return raw && raw.data ? JSON.parse(raw.data) : null;
  },
  async updateLeaderboard(displayName, trophy) {
    if (!currentUser) return;
    await setDoc(doc(db, 'leaderboard', currentUser.uid), {
      displayName: displayName || 'プレイヤー',
      trophy: trophy || 0,
      updatedAt: Date.now(),
    });
  },
  async getLeaderboard(topN) {
    const q = query(collection(db, 'leaderboard'), orderBy('trophy', 'desc'), limit(topN || 50));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach((d) => list.push({ uid: d.id, ...d.data() }));
    return list;
  },

  // ---------------------------------------------------------
  // オンライン対戦（β）
  // ---------------------------------------------------------

  // 部屋を作成し、部屋コードを返す
  async createBattleRoom({ hostName, hostDeck, hostLeaderId, hostShuffledDeck, hostInitialHand }) {
    if (!currentUser) throw new Error('ログインが必要です');
    // 紛らわしい文字（0/O, 1/I）を除いた6桁コード。既存コードと衝突した場合は数回まで再試行する
    for (let attempt = 0; attempt < 8; attempt++) {
      const roomCode = generateRoomCode();
      const roomRef = doc(db, 'battle_rooms', roomCode);
      const existing = await getDoc(roomRef);
      if (existing.exists()) continue;
      await setDoc(roomRef, {
        hostUid: currentUser.uid,
        hostName: hostName || 'プレイヤー',
        hostDeck: hostDeck || [],
        hostLeaderId: hostLeaderId || null,
        guestUid: null,
        guestName: null,
        guestDeck: null,
        guestLeaderId: null,
        status: 'waiting',
        createdAt: serverTimestamp(),
        startedAt: null,
        finishedAt: null,
        winnerUid: null,
        hostLeft: false,
        guestLeft: false,
        initialSeed: {
          hostShuffledDeck: hostShuffledDeck || [],
          guestShuffledDeck: null,
          hostInitialHand: hostInitialHand || [],
          guestInitialHand: null,
        },
      });
      return roomCode;
    }
    throw new Error('部屋の作成に失敗しました。もう一度お試しください。');
  },

  // コードで部屋に参加する（同時参加による競合を避けるため、トランザクションで処理する）
  async joinBattleRoom(roomCode, { guestName, guestDeck, guestLeaderId, guestShuffledDeck, guestInitialHand }) {
    if (!currentUser) throw new Error('ログインが必要です');
    const roomRef = doc(db, 'battle_rooms', String(roomCode).toUpperCase());
    const result = await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) throw new Error('部屋が見つかりません。コードをご確認ください。');
      const data = snap.data();
      if (data.hostUid === currentUser.uid) throw new Error('自分が作成した部屋には参加できません。');
      if (data.status !== 'waiting') throw new Error('この部屋はすでに開始済み、または終了しています。');
      if (data.guestUid) throw new Error('この部屋はすでに満員です。');
      const updates = {
        guestUid: currentUser.uid,
        guestName: guestName || 'プレイヤー',
        guestDeck: guestDeck || [],
        guestLeaderId: guestLeaderId || null,
        status: 'active',
        startedAt: serverTimestamp(),
        'initialSeed.guestShuffledDeck': guestShuffledDeck || [],
        'initialSeed.guestInitialHand': guestInitialHand || [],
      };
      tx.update(roomRef, updates);
      return { ...data, ...updates };
    });
    return result;
  },

  // 部屋の状態変化をリアルタイムに購読する（相手の参加、対戦終了などを検知）
  listenToBattleRoom(roomCode, onUpdate) {
    const roomRef = doc(db, 'battle_rooms', String(roomCode).toUpperCase());
    return onSnapshot(roomRef, (snap) => {
      onUpdate(snap.exists() ? { roomCode, ...snap.data() } : null);
    }, (err) => {
      console.error('listenToBattleRoom failed', err);
    });
  },

  // 行動ログの購読（新しいactionが追加されたら都度呼ばれる）
  listenToBattleActions(roomCode, onNewAction) {
    const actionsRef = collection(db, 'battle_rooms', String(roomCode).toUpperCase(), 'actions');
    const q = query(actionsRef, orderBy('at', 'asc'));
    return onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') onNewAction({ id: change.doc.id, ...change.doc.data() });
      });
    }, (err) => {
      console.error('listenToBattleActions failed', err);
    });
  },

  // 自分の行動をFirestoreに書き込む
  async submitBattleAction(roomCode, action) {
    if (!currentUser) throw new Error('ログインが必要です');
    const actionsRef = collection(db, 'battle_rooms', String(roomCode).toUpperCase(), 'actions');
    await addDoc(actionsRef, {
      uid: currentUser.uid,
      turn: action.turn,
      type: action.type,
      payload: action.payload || {},
      at: serverTimestamp(),
    });
  },

  // 対戦終了を記録する
  async finishBattleRoom(roomCode, winnerUid) {
    const roomRef = doc(db, 'battle_rooms', String(roomCode).toUpperCase());
    await updateDoc(roomRef, {
      status: 'finished',
      winnerUid: winnerUid || null,
      finishedAt: serverTimestamp(),
    });
  },

  // 部屋を離脱・削除する（マッチング中のキャンセル、対戦中の投了など）
  async leaveBattleRoom(roomCode) {
    if (!currentUser) return;
    const roomRef = doc(db, 'battle_rooms', String(roomCode).toUpperCase());
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.hostUid === currentUser.uid && !data.guestUid) {
      // ホストで、まだ誰も参加していない待機中の部屋は削除する
      await deleteDoc(roomRef);
      return;
    }
    // 参加済みの対戦からの離脱は、相手に伝わるようフラグを立てて終了扱いにする
    const field = data.hostUid === currentUser.uid ? 'hostLeft' : 'guestLeft';
    await updateDoc(roomRef, { [field]: true, status: 'finished' });
  },
};
