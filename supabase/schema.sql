-- =====================================================================
-- Meeting Time Tree — 完全スキーマ定義（新規 Supabase プロジェクト用）
-- =====================================================================
-- 実行順序:
--   1. この schema.sql を SQL Editor で実行（テーブル・制約・インデックス）
--   2. 続けて rls.sql を実行（RLS 有効化 + policy + handle_new_user トリガ）
--   3. rls-audit.sql で検証
--
-- コードベース（src/lib/db.ts, src/lib/team.ts, /api/**）から逆算した
-- カラム定義。クライアントは projects/meetings の id を uuidv4 で生成し、
-- edges の id は "e-custom-<src>-<tgt>-<ts>" 形式の文字列を生成する。
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- teams（profiles.team_id が参照するため先に作成）
-- ---------------------------------------------------------------------
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  max_members integer not null default 5,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- profiles（auth.users と 1:1。行は handle_new_user トリガで自動生成）
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  plan               text not null default 'free'
                     check (plan in ('free', 'pro', 'team')),
  team_id            uuid references public.teams(id) on delete set null,
  ls_subscription_id text,
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id           uuid primary key,            -- クライアント側 uuidv4
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  color        text not null,
  sort_order   integer not null default 0,
  created_date text,                        -- ISO 日付文字列
  created_at   timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);

-- ---------------------------------------------------------------------
-- meetings
-- ---------------------------------------------------------------------
create table if not exists public.meetings (
  id             uuid primary key,          -- クライアント側 uuidv4
  user_id        uuid not null references auth.users(id) on delete cascade,
  project_id     uuid not null references public.projects(id) on delete cascade,
  title          text not null default '',
  meeting_date   text not null default '',  -- "YYYY-MM-DD"（文字列ソートで日付順になる）
  decisions      text not null default '',
  next_tasks     text not null default '',
  attachment_url text not null default '',
  pos_x          real,
  pos_y          real,
  created_at     timestamptz not null default now()
);

create index if not exists meetings_user_id_idx    on public.meetings (user_id);
create index if not exists meetings_project_id_idx on public.meetings (project_id);

-- ---------------------------------------------------------------------
-- edges（議事録カード間の接続。id は ReactFlow 由来の文字列）
-- ---------------------------------------------------------------------
create table if not exists public.edges (
  id         text primary key,              -- "e-custom-<source>-<target>-<timestamp>"
  user_id    uuid not null references auth.users(id) on delete cascade,
  source     uuid not null references public.meetings(id) on delete cascade,
  target     uuid not null references public.meetings(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists edges_user_id_idx on public.edges (user_id);
create index if not exists edges_source_idx  on public.edges (source);
create index if not exists edges_target_idx  on public.edges (target);

-- ---------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------
create table if not exists public.team_members (
  id        uuid primary key default gen_random_uuid(),
  team_id   uuid not null references public.teams(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member'
            check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index if not exists team_members_team_id_idx on public.team_members (team_id);
create index if not exists team_members_user_id_idx on public.team_members (user_id);

-- ---------------------------------------------------------------------
-- team_invitations（token は DB デフォルトで自動生成 — API は INSERT 後に SELECT で取得）
-- ---------------------------------------------------------------------
create table if not exists public.team_invitations (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  invited_by  uuid references auth.users(id) on delete set null,
  email       text not null,
  token       text not null unique default encode(gen_random_bytes(24), 'hex'),
  role        text not null default 'member'
              check (role in ('admin', 'member')),
  status      text not null default 'pending'
              check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists team_invitations_team_id_idx on public.team_invitations (team_id);
create index if not exists team_invitations_token_idx   on public.team_invitations (token);

-- ---------------------------------------------------------------------
-- ロール権限 GRANT（Supabase 標準構成の再現）
-- ---------------------------------------------------------------------
-- Studio 以外（Management API / psql / マイグレーション）でテーブルを作ると
-- anon / authenticated / service_role へのテーブル権限が付かず、
-- アプリからのアクセスが全て 42501 (permission denied) になる。
-- RLS が行レベルの分離を担保するため、テーブルレベルは ALL を付与してよい。

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- =====================================================================
-- END — 続けて rls.sql を実行すること
-- =====================================================================
