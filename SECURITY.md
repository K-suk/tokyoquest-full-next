# セキュリティ強化ガイド

## 🛡️ 実装したセキュリティ対策

### 1. Client Components の Props 露出対策

#### 問題
- Client Component の props はブラウザに露出する
- 機密情報（パスワード、トークンなど）が誤って露出するリスク

#### 対策
- **DTO（データ転送オブジェクト）パターンの導入**
  - `src/lib/dto.ts` で安全なデータ構造を定義
  - Client Component に渡すデータを明示的に制御
- **Prisma のグローバル Omit 設定**
  - `src/lib/prisma.ts` で機密フィールドを自動除外
  - うっかりミスを防ぐ

#### 使用例
```typescript
// 安全なDTO変換
const userDTO = toUserDTO(user);
<ProfileHeader user={userDTO} session={session} />
```

### 2. Server Actions の引数セキュリティ

#### 問題
- Server Actions の引数は詐称可能
- ユーザーID などを引数で渡すと危険

#### 対策
- **操作されたくないデータは引数で渡さない**
- **サーバーサイドでセッションから取得**

#### 使用例
```typescript
// ❌ 危険
async function updateProfile(userId: string, profile: string) { ... }

// ✅ 安全
async function updateProfile(profile: string) {
  const session = await getServerSession(authOptions);
  const userId = session.user.id;
  // ...
}
```

### 3. 認証チェックの適切な実装

#### 問題
- middleware では DB アクセス不可
- layout での認証チェックは情報漏洩のリスク

#### 対策
- **page.tsx や server actions で個別チェック**
- **共通化された認証ユーティリティ関数**

#### 使用例
```typescript
// src/lib/auth.ts の関数を使用
import { requireAuth, requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  const session = await requireAdmin(); // 適切な場所でチェック
  // ...
}
```

### 4. セキュリティヘッダーの追加

#### 実装内容
- **X-Frame-Options**: クリックジャッキング対策
- **X-Content-Type-Options**: MIME型スニッフィング対策
- **Referrer-Policy**: リファラー情報の制御
- **X-XSS-Protection**: XSS攻撃対策
- **Strict-Transport-Security**: HTTPS強制
- **Content-Security-Policy**: リソース読み込み制御

### 5. 入力検証とサニタイゼーション

#### 実装済み
- API ルートでの入力検証
- XSS 対策
- レート制限
- 環境変数検証

## 🔍 セキュリティチェックリスト

### 開発時の注意点
- [ ] Client Component の props に機密情報を含めない
- [ ] Server Actions でユーザー操作可能な引数を避ける
- [ ] 認証チェックは適切な場所（page.tsx, server actions）で行う
- [ ] データベースクエリで必要なフィールドのみ取得
- [ ] エラーメッセージに機密情報を含めない

### デプロイ時の確認
- [ ] 環境変数が適切に設定されている
- [ ] セキュリティヘッダーが有効
- [ ] HTTPS が有効
- [ ] 不要なファイルが公開されていない

## 📚 参考資料

- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)

## 🚨 セキュリティインシデント対応

### 発見時の対応手順
1. 即座に該当機能を無効化
2. 影響範囲の調査
3. セキュリティパッチの適用
4. ユーザーへの通知（必要に応じて）
5. 再発防止策の検討

### 連絡先
- セキュリティ問題の報告: [セキュリティチーム]
- 緊急時: [緊急連絡先] 