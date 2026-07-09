-- =====================================================================
-- Meeting Time Tree — RLS 状態監査クエリ
-- =====================================================================
-- 読み取りのみ。Supabase SQL Editor（postgres ロール）で実行。
-- 各クエリには「期待される結果」をコメントで併記。
-- =====================================================================


-- ---------------------------------------------------------------------
-- A. 全ユーザーデータテーブルで RLS が ENABLE されているか
-- ---------------------------------------------------------------------
-- 期待: 全 7 テーブルが rls_enabled = true
SELECT
  n.nspname AS schema,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname IN (
    'profiles', 'projects', 'meetings', 'edges',
    'teams', 'team_members', 'team_invitations'
  )
ORDER BY c.relname;


-- ---------------------------------------------------------------------
-- B. 設定されている全ポリシーをテーブル別に列挙
-- ---------------------------------------------------------------------
-- 期待: rls.sql で定義した policy 名がそれぞれ表示される
--   profiles:         self_select のみ（INSERT/UPDATE/DELETE は無いのが正解）
--   projects:         owner_select, owner_insert, owner_update, owner_delete
--   meetings:         owner_select, owner_insert, owner_update, owner_delete
--   edges:            owner_select, owner_insert, owner_update, owner_delete
--   teams:            member_select のみ
--   team_members:     team_select のみ
--   team_invitations: owner_select のみ
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd          AS command,
  qual         AS using_expr,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;


-- ---------------------------------------------------------------------
-- C. テーブル別ポリシー数の確認（一覧不一致の早期発見）
-- ---------------------------------------------------------------------
-- 期待: 上記コメントと一致
SELECT
  tablename,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') AS n_select,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') AS n_insert,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') AS n_update,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') AS n_delete,
  COUNT(*) AS total
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'projects', 'meetings', 'edges',
    'teams', 'team_members', 'team_invitations'
  )
GROUP BY tablename
ORDER BY tablename;


-- ---------------------------------------------------------------------
-- D. （旧）ヘルパー関数 is_team_member / is_team_admin が撤去されているか
-- ---------------------------------------------------------------------
-- 経緯: 当初 SECURITY DEFINER 関数を使っていたが、Supabase の権限環境で
--       BYPASSRLS が効かず無限再帰した。profiles.team_id / teams.owner_id を
--       直接参照する policy 設計に変更したため、この関数は撤去済み。
-- 期待: 結果 0 行
SELECT
  n.nspname    AS schema,
  p.proname    AS function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('is_team_member', 'is_team_admin');


-- ---------------------------------------------------------------------
-- E. handle_new_user トリガが auth.users に登録されているか
-- ---------------------------------------------------------------------
-- 期待: 1 行（tgname = 'on_auth_user_created' / tgenabled = 'O'）
SELECT
  t.tgname AS trigger_name,
  c.relname AS table_name,
  n.nspname AS table_schema,
  t.tgenabled AS enabled_status,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created'
  AND NOT t.tgisinternal;


-- ---------------------------------------------------------------------
-- F. 期待される全テーブルで RLS が ENABLE か（明示列挙）
-- ---------------------------------------------------------------------
-- 期待: 結果 0 行
--   profiles は列名 `id` なので動的検出では取りこぼすため明示列挙する
WITH expected(table_name) AS (
  VALUES
    ('profiles'),
    ('projects'),
    ('meetings'),
    ('edges'),
    ('teams'),
    ('team_members'),
    ('team_invitations')
)
SELECT e.table_name,
       COALESCE(c.relrowsecurity, false) AS rls_enabled
FROM expected e
LEFT JOIN pg_class c ON c.relname = e.table_name
LEFT JOIN pg_namespace n ON c.relnamespace = n.oid AND n.nspname = 'public'
WHERE COALESCE(c.relrowsecurity, false) = false;


-- ---------------------------------------------------------------------
-- G. profile に authenticated 向け UPDATE policy が存在していないか
-- ---------------------------------------------------------------------
-- 期待: 結果 0 行
--   ※ plan / team_id / ls_subscription_id の自己昇格防止のため
--      authenticated は profile を UPDATE できてはならない
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND cmd IN ('UPDATE', 'DELETE')
  AND 'authenticated' = ANY(roles);


-- =====================================================================
-- END
-- =====================================================================
-- 上記 A〜G で異常がなければ、続いて rls-pentest.sql で
-- 実攻撃シナリオの動作確認を行うこと。
-- =====================================================================
