// =========================================================
// firebase-init.js - Lis Noir クラウドセーブ連携
// Firebase Authentication（メール/パスワード）+ Firestore を使用
// =========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
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

window.LisNoirCloud = {
  signUp(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
      .catch((err) => { throw new Error(friendlyAuthError(err)); });
  },
  signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
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
};
