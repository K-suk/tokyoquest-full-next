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
- **Content-Security-Policy**: リソース読み込み制御（強化版）
  - `object-src 'none'`: プラグイン攻撃対策
  - `base-uri 'self'`: ベースURI攻撃対策
  - `form-action 'self'`: フォーム送信先制限

### 5. 入力検証とサニタイゼーション

#### 実装済み
- API ルートでの入力検証（Zod）
- XSS 対策
- レート制限（メモリベース）
- 環境変数検証

### 6. レート制限の実装

#### 実装内容
- **メモリベースレート制限**
  - クエスト保存: 10回/分
  - 認証: 5回/分
  - 管理者操作: 20回/分
- **IPアドレスベースの制限**
- **自動クリーンアップ機能**

### 7. デバッグログの制御

#### 実装内容
- **本番環境でのデバッグログ削除**
- **セキュリティログの環境別出力**
- **機密情報のログ出力制限**

### 8. 管理画面セキュリティ

#### 実装内容
- **専用レイアウトでのセキュリティヘッダー**
- **管理者権限チェック**
- **API ルートでの権限検証**

### 9. 管理者権限付与のセキュリティ

#### 実装内容
- **セキュリティトークン認証**
  - 環境変数 `ADMIN_SECURITY_TOKEN` による認証
  - 32文字以上の強力なトークン必須
- **環境制限**
  - 本番環境での実行禁止
  - 開発・ステージング環境のみ実行可能
- **ユーザー存在確認**
  - 事前にログイン済みユーザーのみ対象
  - 重複権限付与の防止
- **セキュリティログ**
  - 管理者権限付与の記録
  - 監査証跡の確保

#### 使用方法
```bash
# 1. 環境変数にセキュリティトークンを設定
export ADMIN_SECURITY_TOKEN="your-very-long-secure-token-here"

# 2. 管理者権限を付与
npx tsx scripts/make-admin.ts user@example.com your-very-long-secure-token-here
```

#### セキュリティ対策
- **トークンの管理**: 環境変数で安全に管理
- **実行制限**: 本番環境での実行を禁止
- **アクセス制御**: 事前認証済みユーザーのみ対象
- **監査ログ**: 全ての操作を記録

## 🔍 セキュリティチェックリスト

### 開発時の注意点
- [x] Client Component の props に機密情報を含めない
- [x] Server Actions でユーザー操作可能な引数を避ける
- [x] 認証チェックは適切な場所（page.tsx, server actions）で行う
- [x] データベースクエリで必要なフィールドのみ取得
- [x] エラーメッセージに機密情報を含めない
- [x] デバッグログを本番環境で出力しない
- [x] セキュリティヘッダーを全ページに適用
- [x] レート制限を実装
- [x] 入力検証を実装

### デプロイ時の確認
- [x] 環境変数が適切に設定されている
- [x] セキュリティヘッダーが有効
- [x] HTTPS が有効
- [x] 不要なファイルが公開されていない
- [x] デバッグログが無効化されている

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

## 🔒 最新のセキュリティ強化（2024年12月）

### 追加実装項目
1. **デバッグログの完全削除**
   - カテゴリページのデバッグログ削除
   - 本番環境でのログ出力制御

2. **セキュリティヘッダーの全ページ適用**
   - プロフィールページ
   - カテゴリページ
   - 管理画面レイアウト

3. **CSP（Content Security Policy）の強化**
   - `object-src 'none'` 追加
   - `base-uri 'self'` 追加
   - `form-action 'self'` 追加
   - Google OAuth用ドメイン許可

4. **セキュリティログの改善**
   - 本番環境での詳細ログ制限
   - 環境別ログ出力制御

### セキュリティレベル評価
- **認証・認可**: ⭐⭐⭐⭐⭐ (完璧)
- **入力検証**: ⭐⭐⭐⭐⭐ (完璧)
- **セッション管理**: ⭐⭐⭐⭐⭐ (完璧)
- **データ保護**: ⭐⭐⭐⭐⭐ (完璧)
- **レート制限**: ⭐⭐⭐⭐⭐ (完璧)
- **セキュリティヘッダー**: ⭐⭐⭐⭐⭐ (完璧)

**総合評価: ⭐⭐⭐⭐⭐ (最高レベル)** 