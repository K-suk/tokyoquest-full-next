import { createClient } from "@supabase/supabase-js";

// Supabaseクライアントを取得する関数
export function getSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

// 後方互換性のために既存の名前でもエクスポート
export const supabase = (() => {
  try {
    return getSupabase();
  } catch {
    // ビルド時などで環境変数がない場合は null を返す
    return null;
  }
})();
