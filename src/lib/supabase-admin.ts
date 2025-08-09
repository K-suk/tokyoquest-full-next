import { createClient } from "@supabase/supabase-js";

// サービスロールキーを使用するAdminクライアントを取得する関数
export function getSupabaseAdmin() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// 後方互換性のために既存の名前でもエクスポート
export const supabaseAdmin = (() => {
  try {
    return getSupabaseAdmin();
  } catch {
    // ビルド時などで環境変数がない場合は null を返す
    return null;
  }
})();
