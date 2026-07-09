-- =====================================================================
-- Meeting Time Tree — Row Level Security policies
-- =====================================================================
-- 冪等な定義。Supabase SQL Editor で全文を貼り付けて実行可能。
-- 本番反映後は supabase/rls-audit.sql と supabase/rls-pentest.sql で検証する。
--
-- 設計方針:
--   - クライアント (anon / authenticated キー) は RLS に従う
--   - サーバー (service_role キー) は RLS バイパス → /api/* ルートは全て service_role
--   - profiles の plan/team_id/ls_subscription_id は SECURITY 観点で
--     authenticated からは UPDATE 不可（自己昇格を防ぐ）→ webhook 経由のみ
--   - profiles 行は handle_new_user トリガで自動生成
--   - team_* policy は team_members を参照すると再帰するため、
--     profiles.team_id（user→team 紐付け）と teams.owner_id 経由で判定
-- =====================================================================


-- =====================================================================
-- 1. すべてのユーザーデータテーブルで RLS を有効化
-- =====================================================================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;


-- =====================================================================
-- 1b. role 値の CHECK 制約（policy / アプリ層の role 比較の前提を防御）
-- =====================================================================
--   既存の制約がある場合に備えて DROP → ADD で冪等化
ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_role_check;
ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_role_check
  CHECK (role IN ('owner', 'admin', 'member'));

ALTER TABLE public.team_invitations
  DROP CONSTRAINT IF EXISTS team_invitations_role_check;
ALTER TABLE public.team_invitations
  ADD CONSTRAINT team_invitations_role_check
  CHECK (role IN ('admin', 'member'));  -- 招待では owner ロールは不可


-- =====================================================================
-- 2. ヘルパー関数の撤去（再帰問題のため policy では使用しない）
-- =====================================================================
--   経緯: 当初 is_team_member()/is_team_admin() (SECURITY DEFINER) を
--         policy で呼んでいたが、Supabase Studio から作成した関数の
--         オーナーが BYPASSRLS を効かせられず、関数内部の SELECT が
--         再度 policy を発火して無限再帰した。
--   解決: 関数を撤去し、profiles.team_id（user→team の 1:1 紐付け）と
--         teams.owner_id を直接参照する policy に書き換えた。
--         これで team_members の policy が team_members を再帰参照
--         しなくなる。

-- DROP FUNCTION の前に、関数に依存している旧 policy を先に削除しておく
-- （依存関係エラー回避: 後段でも再 DROP しているが IF EXISTS なので冪等）
DROP POLICY IF EXISTS "teams_member_select" ON public.teams;
DROP POLICY IF EXISTS "team_members_team_select" ON public.team_members;
DROP POLICY IF EXISTS "team_invitations_admin_select" ON public.team_invitations;

-- 過去 Supabase Studio で手動作成した古い policy を一括撤去
-- （rls.sql 管理外の policy が残っていると、OR 結合で意図しない権限が
--   開く可能性があるため、明示的に削除して新 policy 群を単一の真実とする）
DROP POLICY IF EXISTS "自分のedgeのみ"                    ON public.edges;
DROP POLICY IF EXISTS "自分のmeetingのみ"                 ON public.meetings;
DROP POLICY IF EXISTS "自分のprofileのみ"                 ON public.profiles;
DROP POLICY IF EXISTS "自分のprojectのみ"                 ON public.projects;
DROP POLICY IF EXISTS "team_admins_can_read_invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "team_members_can_read_members"    ON public.team_members;
DROP POLICY IF EXISTS "team_members_can_read_team"       ON public.teams;

DROP FUNCTION IF EXISTS public.is_team_member(uuid);
DROP FUNCTION IF EXISTS public.is_team_admin(uuid);


-- =====================================================================
-- 3. profiles — 自分の行のみ閲覧可、書き込みは一切クライアント不可
-- =====================================================================
--   plan / team_id / ls_subscription_id は webhook (service_role) でのみ更新。
--   INSERT も authenticated からは禁止し、auth.users 作成トリガで自動生成する。
--   （クライアント INSERT を許すと、初回作成時に plan='team' を仕込まれる可能性）

DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_delete" ON public.profiles;

CREATE POLICY "profiles_self_select" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- INSERT / UPDATE / DELETE policy は意図的に作成しない → authenticated からは拒否
-- 全ての書き込みは service_role (webhook / API / トリガ) 経由のみ

-- サインアップ時に profiles 行を自動生成するトリガ
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, plan)
  VALUES (NEW.id, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =====================================================================
-- 4. projects — owner のみ全操作可
-- =====================================================================

DROP POLICY IF EXISTS "projects_owner_select" ON public.projects;
DROP POLICY IF EXISTS "projects_owner_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_owner_update" ON public.projects;
DROP POLICY IF EXISTS "projects_owner_delete" ON public.projects;

CREATE POLICY "projects_owner_select" ON public.projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "projects_owner_insert" ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_owner_update" ON public.projects
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_owner_delete" ON public.projects
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- =====================================================================
-- 5. meetings — owner のみ全操作可
-- =====================================================================

DROP POLICY IF EXISTS "meetings_owner_select" ON public.meetings;
DROP POLICY IF EXISTS "meetings_owner_insert" ON public.meetings;
DROP POLICY IF EXISTS "meetings_owner_update" ON public.meetings;
DROP POLICY IF EXISTS "meetings_owner_delete" ON public.meetings;

CREATE POLICY "meetings_owner_select" ON public.meetings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "meetings_owner_insert" ON public.meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "meetings_owner_update" ON public.meetings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "meetings_owner_delete" ON public.meetings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- =====================================================================
-- 6. edges — owner のみ全操作可
-- =====================================================================

DROP POLICY IF EXISTS "edges_owner_select" ON public.edges;
DROP POLICY IF EXISTS "edges_owner_insert" ON public.edges;
DROP POLICY IF EXISTS "edges_owner_update" ON public.edges;
DROP POLICY IF EXISTS "edges_owner_delete" ON public.edges;

CREATE POLICY "edges_owner_select" ON public.edges
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "edges_owner_insert" ON public.edges
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "edges_owner_update" ON public.edges
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "edges_owner_delete" ON public.edges
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- =====================================================================
-- 7. teams — メンバーのみ閲覧可、書き込みは service_role のみ
-- =====================================================================

DROP POLICY IF EXISTS "teams_member_select" ON public.teams;
DROP POLICY IF EXISTS "teams_no_write_insert" ON public.teams;
DROP POLICY IF EXISTS "teams_no_write_update" ON public.teams;
DROP POLICY IF EXISTS "teams_no_write_delete" ON public.teams;

-- 再帰回避: team_members を参照せず、profiles.team_id を経由する。
-- profiles_self_select で id=auth.uid() の行のみ読めるので、
-- 内側の SELECT は他人の team_id を漏らさない。
CREATE POLICY "teams_member_select" ON public.teams
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
  );

-- INSERT / UPDATE / DELETE policy なし → authenticated 不可、service_role のみ


-- =====================================================================
-- 8. team_members — メンバーのみロスター閲覧可、書き込みは service_role のみ
-- =====================================================================

DROP POLICY IF EXISTS "team_members_team_select" ON public.team_members;
DROP POLICY IF EXISTS "team_members_self_select" ON public.team_members;

-- 再帰回避: team_members を参照せず、profiles.team_id 経由でチーム判定。
-- 各ユーザは「自分が属する 1 チームのメンバー全員」を見られる。
-- 自分自身の行は team_id 一致でカバーされるので追加 OR は不要。
CREATE POLICY "team_members_team_select" ON public.team_members
  FOR SELECT
  TO authenticated
  USING (
    team_id = (SELECT team_id FROM public.profiles WHERE id = auth.uid())
  );

-- INSERT / UPDATE / DELETE policy なし → authenticated 不可
-- メンバー追加は /api/team/invite/accept（service_role）経由のみ


-- =====================================================================
-- 9. team_invitations — owner/admin のみ閲覧可、書き込みは service_role のみ
-- =====================================================================
--   token による検証/受諾は /api/team/invite/verify (token), /accept (Bearer)
--   経由で service_role が処理するため、authenticated には SELECT 権限不要。

DROP POLICY IF EXISTS "team_invitations_admin_select" ON public.team_invitations;
DROP POLICY IF EXISTS "team_invitations_owner_select" ON public.team_invitations;

-- 再帰回避: team_members を参照せず、teams.owner_id を直接参照する。
-- 制約: admin ロール（owner ではないが招待を見るべきユーザー）は現状
--       UI フロー上存在しない（招待 role は admin/member のみ作成可だが
--       /api/team/invite を呼べるのは owner/admin、表示は owner 視点のみ）。
--       将来 admin にも招待一覧表示が必要になれば、SECURITY DEFINER の
--       RPC 関数を別途切る方針。
CREATE POLICY "team_invitations_owner_select" ON public.team_invitations
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
  );

-- INSERT / UPDATE / DELETE policy なし → authenticated 不可、service_role のみ


-- =====================================================================
-- END
-- =====================================================================
-- このスクリプト実行後、必ず supabase/rls-audit.sql を実行して
-- ENABLE 状況と policy 一覧を確認すること。
-- =====================================================================
