// 打鍵テスト — 実ブラウザ (Chromium) でユーザー操作を再現するスモークテスト
//
// 実行: node tests/e2e/dakken.mjs
// 前提: 本番ビルドのローカルサーバー (INTEGRATION_BASE_URL, 省略時
//       http://localhost:3100) が起動していること。
// 流れ: LP 表示 → ログイン → プロジェクト作成 → 会議カード追加 →
//       モーダル確認 → DB 反映確認 → コンソールエラー 0 件を確認
// 後始末: テストユーザー削除（CASCADE で作成データも消える）

import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASE_URL = process.env.INTEGRATION_BASE_URL ?? "http://localhost:3100";
const SHOT_DIR = path.join(root, "tests/e2e/screenshots");
mkdirSync(SHOT_DIR, { recursive: true });

const env = {};
for (const line of readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.replace(/^﻿/, "").match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "").trim();
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const USER = {
  email: `mtt-dakken-${Date.now()}@example.com`,
  password: "Dakken-pass-1234",
};

let pass = 0, fail = 0;
const failures = [];
function check(name, cond, detail = "") {
  if (cond) { pass++; console.log(`  OK   ${name}`); }
  else { fail++; failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

async function pollDb(fn, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function main() {
  let userId = null;
  const browser = await chromium.launch();
  try {
    console.log("SETUP: 確認済みテストユーザー作成");
    const { data, error } = await admin.auth.admin.createUser({ ...USER, email_confirm: true });
    if (error) throw new Error(`createUser: ${error.message}`);
    userId = data.user.id;

    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
    page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

    // ---- 1. ランディングページ ----
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SHOT_DIR, "01-landing.png") });
    const loginBtn = page.getByRole("button", { name: "ログイン" }).first();
    check("1. LP が表示されログインボタンがある", await loginBtn.isVisible());

    // ---- 2. ログイン ----
    await loginBtn.click();
    await page.locator('input[type="email"]').waitFor({ timeout: 5000 });
    await page.screenshot({ path: path.join(SHOT_DIR, "02-auth.png") });
    await page.locator('input[type="email"]').fill(USER.email);
    await page.locator('input[type="password"]').fill(USER.password);
    await page.locator('input[type="password"]').press("Enter");

    // サイドバー（New Project 入力欄）が出ればログイン成功
    const pjInput = page.getByPlaceholder("プロジェクト名");
    await pjInput.waitFor({ timeout: 15000 });
    await page.screenshot({ path: path.join(SHOT_DIR, "03-canvas.png") });
    check("2. ログイン成功でキャンバス画面に遷移", true);
    check("2b. Free プランバッジが表示される", await page.getByText("Free", { exact: true }).first().isVisible());
    check("2c. アップグレード導線（Pro/Team/買い切り）が表示される",
      await page.getByRole("button", { name: /Proにアップグレード/ }).isVisible()
      && await page.getByRole("button", { name: /Teamプラン/ }).isVisible()
      && await page.getByRole("button", { name: /買い切り/ }).isVisible());

    // ---- 3. プロジェクト作成 ----
    await pjInput.fill("打鍵テストPJ");
    await page.getByRole("button", { name: "追加", exact: true }).click();
    await page.getByText("打鍵テストPJ").first().waitFor({ timeout: 8000 });
    check("3. プロジェクトがサイドバーに表示される", true);
    const pjInDb = await pollDb(async () => {
      const { data: rows } = await admin.from("projects").select("id").eq("user_id", userId);
      return rows?.length === 1;
    });
    check("3b. プロジェクトが DB に保存される", pjInDb);

    // ---- 4. 会議カード追加 ----
    await page.getByRole("button", { name: "+ 会議" }).click();
    // 追加直後は詳細モーダルが開く
    const modalVisible = await page.getByText("新しい会議").first().isVisible({ timeout: 5000 }).catch(() => false);
    await page.screenshot({ path: path.join(SHOT_DIR, "04-meeting-modal.png") });
    check("4. 会議カードが作成されモーダル/カードが表示される", modalVisible);
    const mtInDb = await pollDb(async () => {
      const { data: rows } = await admin.from("meetings").select("id, title").eq("user_id", userId);
      return rows?.length === 1 && rows[0].title === "新しい会議";
    });
    check("4b. 会議が DB に保存される", mtInDb);

    // ---- 5. リロードしても永続化されている（再打鍵相当） ----
    await page.reload({ waitUntil: "networkidle" });
    await page.getByText("打鍵テストPJ").first().waitFor({ timeout: 15000 });
    check("5. リロード後もプロジェクトが残っている", true);
    await page.screenshot({ path: path.join(SHOT_DIR, "05-after-reload.png") });

    // ---- 6. 静的ページの打鍵（フッターリンク先） ----
    for (const [p, text] of [["/terms", "利用規約"], ["/privacy", "プライバシー"], ["/tokusho", "特定商取引法"]]) {
      await page.goto(`${BASE_URL}${p}`, { waitUntil: "domcontentloaded" });
      const found = await page.getByText(text).first().isVisible().catch(() => false);
      check(`6. ${p} が表示され「${text}」を含む`, found);
    }

    // ---- 7. コンソールエラー ----
    const realErrors = consoleErrors.filter((e) => !e.includes("favicon"));
    check("7. ブラウザコンソールにエラーなし", realErrors.length === 0, JSON.stringify(realErrors.slice(0, 3)));
  } finally {
    await browser.close();
    if (userId) {
      console.log("CLEANUP: テストユーザー削除");
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) console.log(`  WARN deleteUser: ${error.message}`);
    }
  }

  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  console.log(`スクリーンショット: ${SHOT_DIR}`);
  if (failures.length) console.log("失敗:", failures.join(" / "));
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
