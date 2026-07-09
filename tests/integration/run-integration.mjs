// 結合テスト — 実 Supabase プロジェクトに対して RLS 分離・トリガ・CASCADE・
// チーム招待 API フローを検証する。
//
// 実行: node tests/integration/run-integration.mjs
// 前提: .env.local に新 Supabase の URL/キーがあること。
//       チーム招待フロー（TEST 9〜12）はローカルサーバー (INTEGRATION_BASE_URL,
//       省略時 http://localhost:3100) が起動していること。
// 後始末: 作成したテストユーザー2名を削除（CASCADE で全データが消える）

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ---- .env.local を読む（BOM 除去込み） ----
const env = {};
for (const line of readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.replace(/^﻿/, "").match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "").trim();
}

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = process.env.INTEGRATION_BASE_URL ?? "http://localhost:3100";

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

const ts = Date.now();
const USER_A = { email: `mtt-itest-a-${ts}@example.com`, password: "Itest-passA-1234" };
const USER_B = { email: `mtt-itest-b-${ts}@example.com`, password: "Itest-passB-1234" };

let pass = 0, fail = 0;
const failures = [];
function check(name, cond, detail = "") {
  if (cond) { pass++; console.log(`  OK   ${name}`); }
  else { fail++; failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

function anonClient() {
  return createClient(URL_, ANON, { auth: { persistSession: false } });
}

async function main() {
  const cleanup = { userIds: [] };
  try {
    // ---- SETUP: ユーザー2名作成 ----
    console.log("SETUP: テストユーザー作成");
    const [ra, rb] = await Promise.all([
      admin.auth.admin.createUser({ ...USER_A, email_confirm: true }),
      admin.auth.admin.createUser({ ...USER_B, email_confirm: true }),
    ]);
    if (ra.error || rb.error) throw new Error(`createUser failed: ${ra.error?.message ?? rb.error?.message}`);
    const uidA = ra.data.user.id, uidB = rb.data.user.id;
    cleanup.userIds.push(uidA, uidB);

    // TEST 1: handle_new_user トリガで profiles が自動生成される
    const { data: profs } = await admin.from("profiles").select("id, plan").in("id", [uidA, uidB]);
    check("1. トリガで profiles 2行が plan=free で自動生成", profs?.length === 2 && profs.every(p => p.plan === "free"), JSON.stringify(profs));

    // ---- サインイン ----
    const cliA = anonClient(), cliB = anonClient();
    const [sa, sb] = await Promise.all([
      cliA.auth.signInWithPassword(USER_A),
      cliB.auth.signInWithPassword(USER_B),
    ]);
    if (sa.error || sb.error) throw new Error(`signIn failed: ${sa.error?.message ?? sb.error?.message}`);
    const tokenA = sa.data.session.access_token;
    const tokenB = sb.data.session.access_token;

    // TEST 2: A がプロジェクト・会議・エッジを作成できる
    const projId = crypto.randomUUID();
    const m1 = crypto.randomUUID(), m2 = crypto.randomUUID();
    const { error: pe } = await cliA.from("projects").insert({ id: projId, user_id: uidA, name: "統合テスト", color: "#ff0000", sort_order: 0, created_date: "2026-07-10" });
    const { error: me } = await cliA.from("meetings").insert([
      { id: m1, user_id: uidA, project_id: projId, title: "会議1", meeting_date: "2026-07-10", decisions: "d", next_tasks: "n", attachment_url: "" },
      { id: m2, user_id: uidA, project_id: projId, title: "会議2", meeting_date: "2026-07-11", decisions: "d", next_tasks: "n", attachment_url: "" },
    ]);
    const edgeId = `e-custom-${m1}-${m2}-${ts}`;
    const { error: ee } = await cliA.from("edges").insert({ id: edgeId, user_id: uidA, source: m1, target: m2 });
    check("2. A が project/meeting/edge を INSERT できる", !pe && !me && !ee, JSON.stringify({ pe, me, ee }));

    // TEST 3: A は自分のデータを読める
    const { data: aProj } = await cliA.from("projects").select("id");
    const { data: aMeet } = await cliA.from("meetings").select("id");
    check("3. A は自分の project/meeting を SELECT できる", aProj?.length === 1 && aMeet?.length === 2);

    // TEST 4: B からは A のデータが一切見えない（RLS SELECT 分離）
    const [bp, bm, be, bprof] = await Promise.all([
      cliB.from("projects").select("id"),
      cliB.from("meetings").select("id"),
      cliB.from("edges").select("id"),
      cliB.from("profiles").select("id"),
    ]);
    check("4. B には A の project/meeting/edge が 0 行", bp.data?.length === 0 && bm.data?.length === 0 && be.data?.length === 0);
    check("4b. B に見える profiles は自分の 1 行のみ", bprof.data?.length === 1 && bprof.data[0].id === uidB);

    // TEST 5: B は A になりすまして INSERT できない
    const { error: spoofErr } = await cliB.from("projects").insert({ id: crypto.randomUUID(), user_id: uidA, name: "spoof", color: "#000", sort_order: 0 });
    check("5. B が user_id=A で project INSERT → RLS violation", !!spoofErr, "エラーになるべき");

    // TEST 6: B は A の meeting を UPDATE できない（0行影響）
    const { data: updData } = await cliB.from("meetings").update({ title: "hacked" }).eq("id", m1).select();
    const { data: m1row } = await admin.from("meetings").select("title").eq("id", m1).single();
    check("6. B による A の meeting UPDATE は無効", (updData?.length ?? 0) === 0 && m1row?.title === "会議1");

    // TEST 7: B は自分の plan を自己昇格できない（profiles 書き込み全面禁止）
    const { data: planData } = await cliB.from("profiles").update({ plan: "team" }).eq("id", uidB).select();
    const { data: bProfRow } = await admin.from("profiles").select("plan").eq("id", uidB).single();
    check("7. B の plan 自己昇格が無効（free のまま）", (planData?.length ?? 0) === 0 && bProfRow?.plan === "free");

    // TEST 8: project 削除で meetings/edges が CASCADE 削除
    const delProj = crypto.randomUUID(), delMeet = crypto.randomUUID();
    await admin.from("projects").insert({ id: delProj, user_id: uidA, name: "casc", color: "#000", sort_order: 1 });
    await admin.from("meetings").insert({ id: delMeet, user_id: uidA, project_id: delProj, title: "c", meeting_date: "2026-07-10" });
    await admin.from("projects").delete().eq("id", delProj);
    const { data: cascMeet } = await admin.from("meetings").select("id").eq("id", delMeet);
    check("8. projects 削除 → meetings が CASCADE 削除", cascMeet?.length === 0);

    // ---- チーム招待フロー（ローカルサーバー経由の API E2E） ----
    let serverUp = false;
    try {
      const ping = await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) });
      serverUp = ping.ok;
    } catch { /* サーバーなし */ }

    if (!serverUp) {
      console.log(`SKIP: ${BASE_URL} が起動していないため TEST 9〜12（招待フロー）をスキップ`);
    } else {
      // webhook の Team 購入処理を service_role で再現（teams 作成 + owner 登録）
      const { data: team } = await admin.from("teams").insert({ name: "統合テストチーム", owner_id: uidA }).select("id").single();
      await admin.from("team_members").insert({ team_id: team.id, user_id: uidA, role: "owner" });
      await admin.from("profiles").update({ plan: "team", team_id: team.id }).eq("id", uidA);

      // TEST 9: A が B を招待 → inviteUrl が返る
      const invRes = await fetch(`${BASE_URL}/api/team/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ teamId: team.id, email: USER_B.email }),
      });
      const invJson = await invRes.json();
      const token = invJson.inviteUrl?.split("token=")[1];
      check("9. POST /api/team/invite → inviteUrl 取得", invRes.status === 200 && !!token, JSON.stringify(invJson));

      // TEST 9b: 自己招待は 400
      const selfRes = await fetch(`${BASE_URL}/api/team/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ teamId: team.id, email: USER_A.email }),
      });
      check("9b. 自己招待は 400 拒否", selfRes.status === 400);

      // TEST 10: verify → チーム名が返る
      const verRes = await fetch(`${BASE_URL}/api/team/invite/verify?token=${token}`);
      const verJson = await verRes.json();
      check("10. GET /verify → valid + チーム名", verRes.status === 200 && verJson.valid === true && verJson.teamName === "統合テストチーム", JSON.stringify(verJson));

      // TEST 11: B が accept → team_members 追加 + plan=team
      const accRes = await fetch(`${BASE_URL}/api/team/invite/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenB}` },
        body: JSON.stringify({ token }),
      });
      const { data: bAfter } = await admin.from("profiles").select("plan, team_id").eq("id", uidB).single();
      const { data: members } = await admin.from("team_members").select("user_id").eq("team_id", team.id);
      check("11. POST /accept → B が plan=team でメンバー入り", accRes.status === 200 && bAfter?.plan === "team" && bAfter?.team_id === team.id && members?.length === 2, JSON.stringify({ status: accRes.status, bAfter }));

      // TEST 12: B から team とメンバー一覧が RLS 越しに見える
      const { data: bTeam } = await cliB.from("teams").select("name").eq("id", team.id);
      const { data: bMembers } = await cliB.from("team_members").select("user_id").eq("team_id", team.id);
      check("12. B が teams/team_members を SELECT できる（メンバー閲覧権）", bTeam?.length === 1 && bMembers?.length === 2);
    }
  } finally {
    // ---- CLEANUP: ユーザー削除（CASCADE で全テストデータ消滅） ----
    console.log("CLEANUP: テストユーザー削除");
    for (const uid of cleanup.userIds) {
      const { error } = await admin.auth.admin.deleteUser(uid);
      if (error) console.log(`  WARN deleteUser(${uid}): ${error.message}`);
    }
  }

  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  if (failures.length) console.log("失敗:", failures.join(" / "));
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
