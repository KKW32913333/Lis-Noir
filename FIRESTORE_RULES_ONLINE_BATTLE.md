# Firestore セキュリティルール（オンライン対戦用の追加分）

`firebase-init.js` に実装した内容に対応する、Firestoreのセキュリティルールです。
Firebaseコンソール → Firestore Database → ルール タブに、既存のルールへ追記してください
（`saves`・`leaderboard` 用の既存ルールがあれば、それは残したまま、`battle_rooms` の記述を追加する形になります）。

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 既存のルール（saves, leaderboard など）はそのまま残してください
    // ...

    // ---- オンライン対戦（β）用 ----
    match /battle_rooms/{roomCode} {
      allow read: if request.auth != null;

      // 作成できるのは、自分がhostUidとして登録するリクエストのみ
      allow create: if request.auth != null
        && request.resource.data.hostUid == request.auth.uid
        && request.resource.data.guestUid == null;

      // 更新できるのは、既にhost/guestである本人、
      // または「まだguestが空いている部屋への参加（guestUidをセットする操作）」のみ
      allow update: if request.auth != null && (
        resource.data.hostUid == request.auth.uid ||
        resource.data.guestUid == request.auth.uid ||
        (resource.data.guestUid == null && request.resource.data.guestUid == request.auth.uid)
      );

      allow delete: if request.auth != null && resource.data.hostUid == request.auth.uid;

      match /actions/{actionId} {
        allow read: if request.auth != null;
        // 自分の行動（uidが自分自身のもの）しか書き込めない
        allow create: if request.auth != null
          && request.resource.data.uid == request.auth.uid;
        allow update, delete: if false; // 行動ログは書き込み専用（後から書き換え不可）
      }
    }
  }
}
```

## 反映手順

1. Firebaseコンソール（https://console.firebase.google.com）で `lis-noir` プロジェクトを開く
2. 左メニューから「Firestore Database」→「ルール」タブを開く
3. 既存のルール文の中に、上記の `match /battle_rooms/{roomCode} { ... }` のブロックを追加する（`match /databases/{database}/documents { ... }` の中に入れてください）
4. 「公開」ボタンで反映

## 匿名ログインの有効化（推奨）

メール登録なしでもオンライン対戦を使えるようにするため、匿名ログインの有効化もおすすめします。

1. Firebaseコンソール →「Authentication」→「Sign-in method」タブ
2. 「匿名」を選択し、有効にする

これにより、`firebase-init.js` に追加した `signInAnon()` 関数が使用可能になります（ゲーム側での呼び出し口は、必要に応じて追加します）。
