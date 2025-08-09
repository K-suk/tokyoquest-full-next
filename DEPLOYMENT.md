# TokyoQuest Deployment Guide

このガイドでは、TokyoQuestアプリケーションをGoogle Cloud Runに自動デプロイする方法を説明します。

## 前提条件

- Google Cloud Platformアカウント
- GitHubレポジトリ
- 必要な環境変数の値

## 方法1: Google Cloud Build (推奨)

### 1. 初期設定

1. Google Cloud Console でプロジェクトを作成または選択
2. 必要なAPIを有効化：
   - Cloud Build API
   - Cloud Run API
   - Container Registry API

### 2. Cloud Build トリガーの設定

#### オプションA: セットアップスクリプトを使用

```bash
# スクリプト内のプロジェクトIDとGitHub情報を編集
vim setup-cloud-build.sh

# スクリプトを実行
./setup-cloud-build.sh
```

#### オプションB: 手動設定

1. [Google Cloud Console](https://console.cloud.google.com/cloud-build/triggers) でCloud Buildトリガーページを開く
2. 「トリガーを作成」をクリック
3. 以下の設定を行う：
   - **名前**: tokyoquest-deploy
   - **リージョン**: グローバル
   - **イベント**: ブランチにプッシュ
   - **ソース**: あなたのGitHubレポジトリを接続
   - **ブランチ**: ^main$
   - **構成**: Cloud Build 構成ファイル (yaml または json)
   - **ファイルの場所**: cloudbuild.yaml

### 3. 環境変数の設定

トリガーの「代入変数」セクションで以下の変数を設定：

```
_NEXTAUTH_URL: https://your-app-url.run.app
_NEXTAUTH_SECRET: your-nextauth-secret
_GOOGLE_CLIENT_ID: your-google-client-id
_GOOGLE_CLIENT_SECRET: your-google-client-secret
_DATABASE_URL: your-database-url
_SUPABASE_URL: your-supabase-url
_SUPABASE_ANON_KEY: your-supabase-anon-key
_ADMIN_SECURITY_TOKEN: your-admin-security-token
_SUPABASE_SERVICE_ROLE_KEY: your-supabase-service-role-key
```

## 方法2: GitHub Actions

### 1. GitHub Secrets の設定

GitHubレポジトリの Settings > Secrets and variables > Actions で以下のシークレットを追加：

```
GCP_PROJECT_ID: your-gcp-project-id
GCP_SA_KEY: your-service-account-json-key
NEXTAUTH_URL: https://your-app-url.run.app
NEXTAUTH_SECRET: your-nextauth-secret
GOOGLE_CLIENT_ID: your-google-client-id
GOOGLE_CLIENT_SECRET: your-google-client-secret
DATABASE_URL: your-database-url
SUPABASE_URL: your-supabase-url
SUPABASE_ANON_KEY: your-supabase-anon-key
ADMIN_SECURITY_TOKEN: your-admin-security-token
SUPABASE_SERVICE_ROLE_KEY: your-supabase-service-role-key
```

### 2. サービスアカウントの作成

```bash
# サービスアカウントを作成
gcloud iam service-accounts create github-actions \
    --display-name="GitHub Actions"

# 必要な権限を付与
gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:github-actions@your-project-id.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:github-actions@your-project-id.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:github-actions@your-project-id.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

# JSONキーを作成
gcloud iam service-accounts keys create key.json \
    --iam-account=github-actions@your-project-id.iam.gserviceaccount.com
```

## ローカル開発での Docker テスト

```bash
# 環境変数ファイルを作成
cp .env.example .env.local
# .env.local に適切な値を設定

# Dockerイメージをビルド
docker build \
  --build-arg NEXTAUTH_URL="http://localhost:3000" \
  --build-arg NEXTAUTH_SECRET="your-secret" \
  # ... その他の環境変数
  -t tokyoquest .

# コンテナを実行
docker run -p 8080:8080 tokyoquest
```

## トラブルシューティング

### ビルドエラー

1. **Prisma client generation error**:
   - DATABASE_URLが正しく設定されているか確認
   - Prismaスキーマに構文エラーがないか確認

2. **環境変数が読み込まれない**:
   - Cloud Buildの代入変数が正しく設定されているか確認
   - ARGとENVが正しくDockerfileに記述されているか確認

3. **デプロイメントタイムアウト**:
   - cloudbuild.yamlのtimeoutを増やす
   - machineTypeをより高性能なものに変更

### デプロイメント後のエラー

1. **503 Service Unavailable**:
   - Cloud Runサービスのログを確認
   - 環境変数が正しく設定されているか確認

2. **データベース接続エラー**:
   - DATABASE_URLが正しいか確認
   - ネットワーク設定を確認

## 自動デプロイメントの流れ

1. mainブランチにコードをプッシュ
2. Cloud BuildまたはGitHub Actionsがトリガー
3. Dockerイメージがビルド
4. Container Registryにプッシュ
5. Cloud Runサービスが更新
6. 新しいバージョンがデプロイ完了

## 料金について

- Cloud Build: 1日120分まで無料
- Cloud Run: 月200万リクエストまで無料
- Container Registry: 0.5GBまで無料

大規模なアプリケーションの場合は、料金を確認してください。
