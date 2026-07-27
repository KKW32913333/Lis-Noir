# オンライン対戦機能：Firebase側の実装仕様（ドラフト）

この文書は、`firebase-init.js`（私が編集・動作確認できない範囲のファイル）に対して、
Firebase側の開発者が実装する必要がある内容をまとめたものです。
ゲーム側（`cg-game.js`）は、この仕様に沿って `window.LisNoirCloud` の新しい関数を呼び出す前提で実装します。

## 設計方針

- **ターン制カードゲームである点を活かし、「完全リアルタイム同期」ではなく「行動ログの同期（ロックステップ方式）」を採用**します。
  - 両プレイヤーの端末は、まったく同じゲームエンジン（`cg-game.js`）で動いています。
  - 盤面の全データを毎回同期するのではなく、「誰が」「何をしたか」という行動（アクション）だけをFirestoreに書き込み、相手の端末がそれを読み取って自分のローカルで再生（reproduce）する方式です。
  - これにより通信量が少なく、往復編集での不具合（例：フィールドのHP不一致）が起きにくくなります。
- 初期リリースとしては、**サーバー側での不正防止（チート対策）は行いません**（クライアント主導・信頼ベース）。試験運用としては許容範囲ですが、正式リリース時はCloud Functionsによる検証層の追加を推奨します。

## Firestoreのデータ構造

### コレクション：`battle_rooms/{roomCode}`

`roomCode` は6桁程度の英数字（例：`A3F9K2`）。既存の「デッキ共有コード」機能とは別の、新規のコード体系です。

```
battle_rooms/{roomCode}
├─ hostUid: string            ホスト側のFirebase Auth UID
├─ hostName: string           ホスト側のプレイヤー名
├─ hostDeck: string[]         ホスト側のデッキ（カードIDの配列）
├─ hostLeaderId: string       ホスト側のリーダーID
├─ guestUid: string | null    ゲスト側のUID（参加前はnull）
├─ guestName: string | null
├─ guestDeck: string[] | null
├─ guestLeaderId: string | null
├─ status: 'waiting' | 'active' | 'finished'
├─ createdAt: serverTimestamp
├─ startedAt: serverTimestamp | null
├─ winnerUid: string | null
├─ initialSeed: {              ホストが決めた「山札シャッフル結果」と「初期手札」。
│    hostShuffledDeck: string[],   両者が同じ内容を見るために必須（乱数のズレ防止）
│    guestShuffledDeck: string[],
│    hostInitialHand: string[],
│    guestInitialHand: string[]
│  }
└─ actions: [                  行動ログ（末尾に追記していく配列、または サブコレクションでも可）
     { seq: number, uid: string, turn: number, type: string, payload: object, at: serverTimestamp }
   ]
```

**`type`の例**：`play_card`（カードを場に出す）、`cast_spell`、`play_field`、`equip_card`、`attack`（誰が誰を攻撃したか）、`end_turn`、`use_ultimate`、`draw_choice`（引く/引かないの選択）、`surrender`（投了）

### 補足：なぜ`actions`を配列ではなくサブコレクションにするか
書き込み頻度・同時実行の衝突を考えると、`battle_rooms/{roomCode}/actions/{seq}` のようなサブコレクションにし、`onSnapshot`でリアルタイム購読する設計を推奨します（Firestoreのドキュメントサイズ上限や、配列への追記が競合しやすい問題を避けるため）。

## 必要な関数（`window.LisNoirCloud`に追加）

既存の関数（`saveCloud`, `loadCloud`, `updateLeaderboard`等）と同じ、Promiseベースの命名規則に合わせています。

```js
// 部屋を作成し、部屋コードを返す
async function createBattleRoom({ hostName, hostDeck, hostLeaderId, hostShuffledDeck, hostInitialHand }) {
  // battle_rooms に新規ドキュメントを作成し、roomCode を生成して返す
  // 戻り値: string（roomCode）
}

// コードで部屋に参加する
async function joinBattleRoom(roomCode, { guestName, guestDeck, guestLeaderId, guestShuffledDeck, guestInitialHand }) {
  // 該当ドキュメントの guest* フィールドを埋め、status を 'active' に更新
  // 戻り値: 部屋の全データ（host側の情報を含む）、または部屋が存在しない/満員の場合はエラー
}

// 部屋の状態変化をリアルタイムに購読する（相手の参加、対戦終了などを検知）
function listenToBattleRoom(roomCode, onUpdate) {
  // onSnapshot を使い、ドキュメントが更新されるたびに onUpdate(roomData) を呼ぶ
  // 戻り値: 購読解除用の関数（unsubscribe）
}

// 行動ログの購読（新しいactionが追加されたら都度呼ばれる）
function listenToBattleActions(roomCode, onNewAction) {
  // actions サブコレクションを onSnapshot で購読し、新規追加されたものだけ onNewAction(action) を呼ぶ
  // 戻り値: unsubscribe関数
}

// 自分の行動をFirestoreに書き込む
async function submitBattleAction(roomCode, action) {
  // actions サブコレクションに action を追加（seq は Firestore側でインクリメント、
  // もしくはクライアント側で連番管理してもよい）
}

// 対戦終了を記録する
async function finishBattleRoom(roomCode, winnerUid) {
  // status を 'finished' に、winnerUid をセット
}

// 部屋を離脱・削除する（マッチング中のキャンセル等）
async function leaveBattleRoom(roomCode) {
  // 自分が host かつ guest 未参加ならドキュメントを削除、
  // guest 側の離脱なら「相手が退出しました」を検知できるようフラグを立てる
}
```

## セキュリティルール（Firestore Rules）の考え方

```
match /battle_rooms/{roomCode} {
  // 誰でも部屋コードを知っていれば読み書き可能にする（招待コード方式のため）
  // ただし、host/guestどちらでもない第三者が勝手にhostDeck等を書き換えられないよう、
  // フィールド単位で「自分の情報しか書けない」制約を入れることを推奨
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.resource.data.hostUid == request.auth.uid;
  allow update: if request.auth != null && (
    resource.data.hostUid == request.auth.uid ||
    resource.data.guestUid == request.auth.uid ||
    resource.data.guestUid == null // 参加（guestUid のセット）を許可
  );

  match /actions/{actionId} {
    allow read: if request.auth != null;
    allow create: if request.auth != null &&
      request.resource.data.uid == request.auth.uid; // 自分の行動しか書き込めない
  }
}
```

## 認証について

現状、匿名でも遊べるゲーム内容ですが、オンライン対戦には「相手を識別するID」が必要なため、**Firebase Authenticationへのログイン（既存のメール/パスワード機能、または匿名ログイン`signInAnonymously`の追加）が事実上必須**になります。匿名ログインを追加すれば、メールアドレス登録なしでも対戦できるようにできます（推奨）。

## 想定コスト・注意点

- Firestoreの読み書き回数に応じた従量課金が発生します。1対戦あたりの行動数はおおよそ数十件程度（カードプレイ・攻撃・ターン終了の合計）なので、個人開発規模であればFirebaseの無料枠（Sparkプラン）内に収まる可能性が高いです。
- `onSnapshot`によるリアルタイム購読は、接続を維持する分バッテリー消費がやや増える可能性があります（対戦中のみ購読し、対戦終了後は必ずunsubscribeする設計にしています）。

---

以上の内容で `firebase-init.js` 側の実装が完了次第、ゲーム側のマッチング画面・対戦ロジックと接続できます。次のセクションでは、ゲーム側（今回のプロジェクトで実装可能な範囲）の実装を進めます。
