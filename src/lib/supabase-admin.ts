import { createClient } from "@supabase/supabase-js";

// サービスロールキーを使用するAdminクライアント
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
