## Meeting Time Tree

このアプリは，議事録のカードを広い日付の書かれたボード上に，配置して，記録していくアプリである。
議事録のカードは線でつなぐことができ，より視覚的に議事録を扱うことができる。
複数のプロジェクトのミーティング議事録をつなぐことで，よりcreativeかつ視覚的に状況を把握できるようにする。

## 目標

このアプリの目標は，販売売上月10万を目標とする

## 技術スタック

- Next.js 16 + React 19 + TypeScript
- @xyflow/react（ノードベースのビジュアル接続）
- Electron（デスクトップアプリ対応）
- Supabase（認証・DB）
- **Lemon Squeezy（決済 — Merchant of Record モデルで税務・VAT 対応）**
- Tailwind CSS v4
- html-to-image（PNGエクスポート）

## チーム体制

### ①市場調査担当
**役割**: 競合分析・ターゲット調査・市場規模・価格戦略
**使うスキル/ツール**: WebSearch, WebFetch, schedule
**主なタスク**:
- 競合アプリ（Notion, Miro, Confluence等）の価格・機能調査
- ターゲットユーザー（PMO, スタートアップ, エンジニアチーム）の分析
- 無料/有料境界の根拠となるデータ収集

### ②プログラミング担当
**役割**: 機能実装・バグ修正・パフォーマンス改善
**使うスキル/ツール**: feature-dev, code-review, run, verify, commit-commands
**主なタスク**:
- 現状機能の把握と改善
- 新機能の実装（検討事項③を受けて）
- デプロイ準備（ビルド・テスト）

### ③統括担当
**役割**: 意思決定・進捗管理・検討事項の確定
**使うスキル/ツール**: ralph-loop, TaskCreate/TaskUpdate
**主なタスク**:
- 各担当の成果物をレビューして方針確定
- CLAUDE.mdの更新・維持
- 検討事項①〜⑥の確定と優先順位付け

### ④アプリ販売担当
**役割**: 販売プラットフォーム・価格設定・決済フロー
**使うスキル/ツール**: run, verify, WebSearch
**主なタスク**:
- Lemon Squeezy 決済フローの確認・改善
- Webアプリ販売ページの設計
- 将来のApp Store申請準備

### ⑤広報企画担当
**役割**: マーケティング・SNS・ランディングページ
**使うスキル/ツール**: frontend-design, WebSearch, schedule
**主なタスク**:
- ランディングページの設計・実装
- SNS・Product Hunt等での告知企画
- ユーザー獲得獲得施策の立案

---

## 確定事項（2026-05-28 統括レビュー後）

各チームの調査結果を踏まえ、以下を確定とする。

### ①マーケティング（対象・売り込み方）
- **ターゲット**: 日本のスタートアップのPM・テックリード（5〜30人規模のチーム）
- **キャッチコピー**: 「会議の記録を、プロジェクトの地図に変える。」
- **差別化ポイント**: 会議のつながりを可視化・日本語特化・Electronローカル動作
- **優先チャネル**: Zenn/note記事 → Product Hunt → Twitter/X #個人開発
- **フェーズ**: LP公開 → Zenn記事投稿 → Product Hunt申請の順に実施

### ②販売プラットフォーム
- **メイン**: Lemon Squeezy（Merchant of Record — 税務・VAT・返金対応をLSが代行）
- **配布方法**: GitHub Releases + electron-builder（手数料0%・最速）
- **App Store申請**: 将来フェーズ（初回リリース後に検討）
- **Webアプリ版**: Vercelデプロイ（LS Webhook受信のため必須）
- **移行経緯**: 当初 Stripe 直販で実装→税務/法務負担削減のため 2026-05-28 に Lemon Squeezy へ移行

### ③対象デバイス
- **フェーズ1（今）**: Webアプリ版（Vercel）を先行リリース
- **フェーズ2**: Electronデスクトップ版（Windows/Mac）をGitHub Releasesで配布
- **補足**: Electron は API ルートと静的エクスポートが競合するため、決済処理は Web アプリ経由に統一する

### ④販売優位性
- 競合（Miro $8/人、Notion $10/人、Confluence $5.75/人）に対して低価格かつ日本語特化
- 「会議のつながり可視化」という機能軸が競合にない
- ローカル動作（Electron）でオフライン・セキュリティ要件にも対応可能

### ⑤無料/有料の境界
| プラン | 内容 |
|--------|------|
| Free   | プロジェクト3件まで、ノード20件/プロジェクト、エクスポート不可 |
| Pro    | プロジェクト無制限、ノード無制限、PDF/PNG エクスポート、優先サポート |
| Team   | Pro機能 + チームメンバー招待（最大5人）、共有プロジェクト |

### ⑥買い切り vs サブスク
- **採用モデル**: 価格案B「買い切り + 軽量サブスク」
  - 買い切り: 3,980円（Electronアプリ永続ライセンス）
  - サブスク Pro: 月980円 / 年7,800円（クラウド同期・アップデート含む）
  - サブスク Team: 月2,980円 / 年24,800円（5人まで）
- **月10万達成シミュレーション**: Pro 50件(49,000円) + Team 17件(50,660円) = 約99,660円

---

## 決定済み価格モデル

| プラン | 月額 | 年額 | 買い切り |
|--------|------|------|----------|
| Free   | 無料 | 無料 | - |
| Pro    | 980円 | 7,800円 | 3,980円（Electron版） |
| Team   | 2,980円（5人） | 24,800円（5人） | - |

- 年払い割引: 月払い比 約33%オフ
- 買い切りは Electron デスクトップ版のみ（Webアプリ版は対象外）

---

## 実装完了済み機能（2026-05-29 時点）

### コア機能
- ✅ プロジェクト作成・削除（カスケード削除済み）
- ✅ 議事録カード追加・編集・削除
- ✅ カード間のエッジ接続・削除UI（`deleteKeyCode` + `onEdgesDelete`）
- ✅ ノード位置の永続化（`meetings.pos_x`/`pos_y` + `onNodeDragStop`）
- ✅ PNG エクスポート（html-to-image、Pro/Team のみ）

### 決済（Lemon Squeezy）
- ✅ チェックアウトフロー（`/api/ls/checkout`）
- ✅ Webhook（`/api/ls/webhook`） — `variant_id` ベースでプラン判定
- ✅ サブスク解約（`/api/ls/cancel`） — 期末解約
- ✅ 買い切り対応（プロフィールに `ls_subscription_id` を保存しないことで解約ボタン非表示）
- ✅ Free/Pro/Team の3ボタン UI（サイドバー）

### チーム機能
- ✅ Team プラン購入で `teams` レコード自動作成 + オーナー登録
- ✅ チーム情報の救済 API（`/api/team/ensure`） — 過去のバグで `teams` 行未作成のユーザーを冪等救済
- ✅ メンバー招待（`/api/team/invite` + `/verify` + `/accept` + Bearer 認証 + メール一致チェック）
- ✅ TeamSettingsModal（招待リンク生成・メンバー一覧・削除・保留中招待管理）
- ✅ 招待バリデーション強化（自己招待・既存メンバー・保留中の重複招待を事前拒否）+ 全エラーメッセージ日本語化（メール不一致時は期待アドレスとログイン中アドレスを明示）+ 既メンバー受諾時は冪等成功扱い

### 法令・LP
- ✅ ランディングページ（`src/components/LandingPage.tsx`）
- ✅ OGP動的生成（`src/app/opengraph-image.tsx`） + Twitter Card メタタグ
- ✅ 利用規約（`/terms`）・プライバシーポリシー（`/privacy`）・特定商取引法表記（`/tokusho` — MoR モデル対応に書き換え済み: 販売事業者=Lemon Squeezy, LLC / サービス提供者=K's Factory / お問い合わせ=ks.factory202605@gmail.com）

### インフラ
- ✅ Supabase: 2026-07-09 に新プロジェクト（ref: `ztpsqwndwflxyhwuplfb`, 東京リージョン）へ移行 — 旧プロジェクト `hxoduclhqwramihdtkvd` はアカウント不明のため放棄。旧データは引き継がず全ユーザー再登録
- ✅ Supabase スキーマ: `supabase/schema.sql`（全7テーブル + FK + CASCADE + CHECK + index）を Management API 経由で適用済み
- ✅ Supabase RLS: `supabase/rls.sql` を本番適用済み（2026-07-09）。監査クエリで全7テーブル RLS 有効・policy 数期待値一致・`handle_new_user` トリガ作成を確認済み。実機 2 アカウントテストは未実施
- ✅ Supabase Auth: Site URL = `https://meeting-timetree.vercel.app`, リダイレクト許可 = 本番 + `http://localhost:3000/**`
- ✅ Vercel 本番デプロイ（`https://meeting-timetree.vercel.app`） — 環境変数を新 Supabase の値に差し替え、旧 Stripe 変数は削除済み（2026-07-09）
- ✅ electron-builder appId `com.kajiwara.meeting-timetree` 設定済み

---

## デプロイ状況（2026-05-29）

- **本番URL**: https://meeting-timetree.vercel.app
- **GitHub**: https://github.com/kjtt0508/meeting-time-tree
- **決済**: Lemon Squeezy（テストモード — 本番モードへの切り替えが残作業）
- **LS Webhook**: 本番エンドポイント `https://meeting-timetree.vercel.app/api/ls/webhook` を LS テストモードで登録済み
- **Vercel 環境変数（設定済み）**:
  - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
  - `LEMONSQUEEZY_API_KEY` / `LEMONSQUEEZY_STORE_ID` / `LEMONSQUEEZY_WEBHOOK_SECRET`
  - `LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID` (1716502)
  - `LEMONSQUEEZY_TEAM_MONTHLY_VARIANT_ID` (1716458)
  - `LEMONSQUEEZY_ONE_TIME_VARIANT_ID` (1716493)
  - `NEXT_PUBLIC_APP_URL`

---

## 残タスク（優先順 — 2026-05-29 時点）

> 2026-07-09 更新: Supabase を新プロジェクトへ移行し、schema.sql + rls.sql を適用済み。

1. **【最優先】実機 2 アカウントテスト** — 新 Supabase での動作確認（サインアップ→プロジェクト作成→RLS 分離確認）。手順は「セッションログ（2026-05-29）」の次回着手タスク #1 手順5を参照
2. **Lemon Squeezy 本番モードへの切り替え** — 本番APIキー・WebhookSecret・Variant IDの差し替え
3. **Zenn/note 記事投稿 → Product Hunt 申請**
4. **GitHub Releases で Electron 版を配布**
5. **D-14 Electron オフライン対応の実装**（設計書あり — dexie.js + Optimistic Update + Sync Queue）

### 完了済み（このセッション）
- ~~チーム招待の自己招待エラー対応~~ → 招待生成時の事前バリデーション追加 + accept側エラー日本語化 + 既メンバー冪等成功
- ~~`/tokusho` の `[要記入]` 箇所~~ → MoR モデル対応に書き換え（Lemon Squeezy を販売事業者として明記、K's Factory をサービス提供者として記載）
- ~~Supabase RLS ポリシー定義~~ → `supabase/rls.sql` / `rls-audit.sql` / `rls-pentest.sql` を整備（本番 SQL Editor での反映は未実施）

### Electron オフライン対応 設計サマリ
- dexie.js（IndexedDB）でローカルキャッシュ
- Optimistic Update + Sync Queue で Supabase と同期
- 決済は `NEXT_PUBLIC_API_URL`（Webアプリ）+ deep link で対応
- Phase 1〜2 で実装規模 3〜5日

---

## 検討事項（初期・確定済み）

~~①マーケティング作業~~  → 確定済み（上記「確定事項①」参照）
~~②販売プラットフォームはどうするか~~ → 確定済み（上記「確定事項②」参照）
~~③対象デバイスはどうするか~~ → 確定済み（上記「確定事項③」参照）
~~④販売優位性はあるのか調査~~ → 確定済み（上記「確定事項④」参照）
~~⑤無料部分と有料部分の境目は~~ → 確定済み（上記「確定事項⑤」参照）
~~⑥買い切りorサブスクなのか~~ → 確定済み（上記「確定事項⑥」参照）

---

## 権限設定

`.claude/settings.json` にてファイル編集・git・PowerShell操作の許可確認を省略済み。

---

## セッションログ（2026-05-29）

### 解決済みの問題

| # | 問題 | 原因 | 対応 |
|---|---|---|---|
| 1 | Proプラン購入後にfreeのまま | webhook遅延 + Supabase update silent fail | 2秒×15回ポーリング + エラーログ追加 + profile upsertフォールバック（`src/app/api/ls/webhook/route.ts`） |
| 2 | 解約ボタンが401エラー | `SUPABASE_SERVICE_ROLE_KEY` の BOM 文字 | `stripBOM()` を全LS/teamルートに適用 |
| 3 | 買い切りなのに「解約」ボタン表示 | `plan==="pro"` だけで判定していた | `fetchPlanInfo()` 追加 → `isSubscription`（=`ls_subscription_id`の有無）で判定 |
| 4 | エクスポートボタンが失敗 | html2canvas が ReactFlow の CSS transform 非対応 | `html-to-image` に置き換え + `getNodesBounds`/`getViewportForBounds` で1920×1080フィット |
| 5 | サイドバーに Team プラン購入ボタンが無い | 設計漏れ | サイドバーに青Teamボタン追加 + `handleUpgrade(plan)` 引数化 |
| 6 | どのボタン押してもLS購入画面が同じ | LSは1商品内のバリエーション選択方式 | webhook で `custom_data.type` ではなく `variant_id` から判定（`LEMONSQUEEZY_*_VARIANT_ID` 比較） |
| 7 | 「チームを管理」ボタンが無反応 | 過去バグで `teams` レコード未作成 → モーダルが `team===null` で return null | `/api/team/ensure` 救済API を新設、ボタン押下時に冪等作成 |
| 8 | 招待リンクにアクセスできない | URL生成時に `NEXT_PUBLIC_APP_URL` の BOM が混入 | `stripBOM()` 適用（`src/app/api/team/invite/route.ts:72`） |
| 9 | ノード位置が保存されない | meetings に pos_x/pos_y 未保存 | カラム追加 + `updateMeetingPosition()` + `onNodeDragStop` |
| 10 | 初期ズームが小さすぎ | `DEFAULT_ZOOM = 0.12` | `0.5` に変更 |

### 追加した Supabase スキーマ変更
- `ALTER TABLE meetings ADD COLUMN pos_x REAL, ADD COLUMN pos_y REAL;`（ノード位置保存用）

### Lemon Squeezy 環境変数（テストモード）
- `LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID` = `1716502`（¥980）
- `LEMONSQUEEZY_TEAM_MONTHLY_VARIANT_ID` = `1716458`（¥2,980）
- `LEMONSQUEEZY_ONE_TIME_VARIANT_ID` = `1716493`（¥3,980）

---

## 🚧 次回着手タスク（優先順）

### 1. **【最優先】Supabase RLS 本番反映**

整備済みファイル: `supabase/rls.sql` / `supabase/rls-audit.sql` / `supabase/rls-pentest.sql`

**手順**:
1. Supabase Studio → SQL Editor を開く（**postgres ロール推奨**）
2. `supabase/rls.sql` を全文コピペして実行 → 全テーブルで RLS ENABLE + policy + helper関数 + handle_new_user トリガが作成される（冪等）
3. `supabase/rls-audit.sql` を実行し、各セクション (A〜G) の期待結果と一致するか目視確認
   - A: 全 7 テーブルが rls_enabled=true
   - B/C: policy 数が期待値（profiles=1, projects/meetings/edges=4 each, teams/team_members/team_invitations=1）
   - D: is_team_member/is_team_admin が SECURITY DEFINER で 2 件
   - E: authenticated に EXECUTE 権限あり
   - F/G: 結果 0 行
4. `supabase/rls-pentest.sql` の冒頭で 2 ユーザー uid（被害者・攻撃者）を実値に置換 → 実行
   - **TEST 0 (sanity) が FAIL** の場合は SQL Editor ベースは諦め、下記の実機テストに切替
   - TEST 1〜12 が全て `>>> OK` になることを確認
5. **実機 2 アカウントテスト**（必須）:
   - 別ブラウザ/シークレットで A・B 2 アカウント作成
   - A でプロジェクト作成 → meeting 追加 → edge 接続
   - B でログインして A のデータが**画面上一切見えない**ことを確認
   - B でアプリ内のあらゆる操作（新規作成・編集・削除・Pro 購入）を行い、A のデータが影響を受けないこと
6. 不備があれば `rls.sql` の policy を修正して 2〜5 を再実行

**設計判断（レビュー + 実行時エラー反映）**:
- `profiles` は INSERT も含めて authenticated からの書き込みを一切許可せず、`handle_new_user` トリガで auth.users 作成時に自動生成 → 自己昇格の経路を恒久封鎖
- `team_*` 系 policy は **`profiles.team_id` と `teams.owner_id` を直接参照する非再帰設計** に変更（当初 SECURITY DEFINER 関数で実装したが、Supabase の権限環境で BYPASSRLS が効かず `team_members` policy が無限再帰した）
- `teams` SELECT は `owner_id = auth.uid() OR id = (SELECT team_id FROM profiles WHERE id = auth.uid())`
- `team_members` SELECT は `team_id = (SELECT team_id FROM profiles WHERE id = auth.uid())`
- `team_invitations` SELECT は `team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())` — owner のみ（admin の閲覧が必要になれば SECURITY DEFINER RPC を別途追加）
- `team_members.role` / `team_invitations.role` に CHECK 制約 → ロール値域を DB レベルで保証

### 2. Lemon Squeezy 本番モードへの切り替え
- 本番APIキー発行 → Vercel 環境変数 `LEMONSQUEEZY_API_KEY` 差し替え
- Webhook URL を本番モードで再登録 → `LEMONSQUEEZY_WEBHOOK_SECRET` 更新
- 本番モードの Variant ID で `LEMONSQUEEZY_*_VARIANT_ID` を上書き

### 3. Zenn/note 記事投稿 → Product Hunt 申請

### 4. Electron 版を GitHub Releases で配布

### 5. D-14 Electron オフライン対応の実装（設計書あり）

---

## 既知のアプリケーションレベル問題（RLS では塞げない、別途対応）

### Team 招待 accept による plan 上書き問題
**症状**: Pro プラン購読中のユーザーが Team 招待を accept すると、`profiles.plan = "team"` に上書きされ、`ls_subscription_id` は温存される。その後 team から外れると `plan = "free", team_id = null` に戻るが、`ls_subscription_id` だけが残った状態に。

**関連ファイル**:
- `src/app/api/team/invite/accept/route.ts:113-117` — plan 上書き
- `src/app/api/team/members/route.ts:130-133` — kick 時の profile 戻し

**対応方針案**:
- accept 時に既存の `ls_subscription_id` があれば「Team 加入で Pro が無効化されます」旨を確認 UI で表示
- または team_members に `previous_plan` カラムを追加して accept 前の状態を退避し、kick 時に復元

---

## ✅ 本セッション完了タスク（2026-05-29 後半）

### C. Supabase RLS ポリシー整備
**新規ファイル**:
- `supabase/rls.sql` — 全 7 テーブルの RLS ENABLE + policy + helper関数 (`is_team_member`, `is_team_admin`) + `handle_new_user` トリガ + role CHECK 制約。冪等な定義
- `supabase/rls-audit.sql` — A〜G の 7 セクションで RLS 状態を確認するクエリ集
- `supabase/rls-pentest.sql` — TEST 0 (sanity) + TEST 1〜12 の攻撃シミュレーション（BEGIN ... ROLLBACK で本番影響なし）

**設計ポイント**:
- profiles の書き込み（INSERT/UPDATE/DELETE）は authenticated に一切許可せず、トリガ + service_role のみに集約
- helper 関数は SECURITY DEFINER + search_path 固定で再帰回避
- pr-review-toolkit:code-reviewer に網羅性レビューを依頼し、High/Medium 指摘 (H-1, M-1, M-3, M-4, L-1, L-2, L-3, L-5) を全て反映済み

**残作業**: 本番 SQL Editor での適用 + 実機 2 アカウントテスト（手順は「🚧 次回着手タスク #1」を参照）

### A. チーム招待バリデーション強化
**変更ファイル**:
- `src/app/api/team/invite/route.ts` — 招待生成 POST に事前バリデーション追加
  - 自分自身のメールへの招待を 400 で拒否
  - 既にチームメンバーの場合は 400 で拒否（`auth.admin.listUsers` で email→user_id 解決後に `team_members` をチェック）
  - 既存の pending 招待がある場合は 400 で拒否
  - DB保存時に email を `trim().toLowerCase()` で正規化
  - 全エラーメッセージを日本語化
- `src/app/api/team/invite/accept/route.ts` — 受諾 POST のエラー文言整備
  - メール不一致時に **期待アドレスとログイン中アドレスの両方** を出す
  - 既メンバー検出時は `invitations.status = accepted` に更新して冪等成功
  - 全エラーメッセージを日本語化
- `src/app/invite/page.tsx` — 変更なし（API 側が日本語エラーを返すので既存表示で対応可）

### B. `/tokusho` を MoR モデル対応に書き換え
**変更ファイル**: `src/app/tokusho/page.tsx`
- 冒頭の黄色 ⚠️ 注意書きを削除 → MoR 説明ボックスに置換
- 「販売事業者（Merchant of Record）」: Lemon Squeezy, LLC（米国法人）/ 222 South Main Street Suite 500, Salt Lake City, UT 84101, USA + LS 利用規約リンク
- 「サービス提供者」欄を新設: K's Factory
- 「お問い合わせ先」: ks.factory202605@gmail.com
- 「所在地」: 「請求があれば遅滞なく開示」運用（個人住所の公開を回避）
- 「電話番号」: 「メール対応 / 請求があれば遅滞なく開示」
- 「販売価格」に買い切り ¥3,980 を追加
- 「返品・キャンセル」に「返金は LS が受付」の補足追加

---

## 🐛 既知の繰り返しパターン

**Windows UTF-8 BOM 汚染**: Vercel 環境変数を Windows 上でテキスト編集すると先頭に `﻿` が付くことがある。新しく `process.env.FOO` を fetch ヘッダー / URL / Supabase client に渡すコードを追加する際は、必ず `stripBOM()` を経由する。

```ts
const stripBOM = (s: string) => s.replace(/^﻿/, "").trim();
```

適用済み箇所: `src/lib/supabase.ts`, `src/app/layout.tsx`, `src/app/api/ls/{checkout,webhook,cancel}/route.ts`, `src/app/api/team/{invite,invite/verify,invite/accept,members,ensure}/route.ts`


---

## セッションログ（2026-07-09）— Supabase 新プロジェクト移行

旧 Supabase プロジェクト（`hxoduclhqwramihdtkvd`）のアカウントが不明になったため、新アカウントでプロジェクトを作り直した。

### 実施内容
1. **未コミット分の整理**: 5/29 の成果物（招待バリデーション・tokusho MoR・RLS SQL）をコミット。GitHub コラボレータ招待（tkajiwaracingroup2012）で push 権限を解決し、origin/main を最新化
2. **`supabase/schema.sql` 新規作成**: コード（`src/lib/db.ts`, `src/lib/team.ts`, API ルート）から全7テーブルの完全スキーマを逆算。注意点: `edges.id` は ReactFlow 由来の**文字列**（`e-custom-<src>-<tgt>-<ts>`）なので text 型、projects/meetings の id はクライアント uuidv4。`team_invitations.token` は DB デフォルト（`gen_random_bytes(24)` hex）で自動生成される前提（API は INSERT 後に SELECT で token を取得する実装）
3. **新プロジェクト（ref: `ztpsqwndwflxyhwuplfb`, 東京）に Management API で適用**: `schema.sql` → `rls.sql` → 監査クエリ（全テーブル RLS 有効、policy 数一致、トリガ確認）まで完了
4. **Auth 設定**: Site URL / uri_allow_list を Management API（`PATCH /v1/projects/{ref}/config/auth`）で設定
5. **環境変数差し替え**: `.env.local` を新キーで書き直し（BOM なし）。Vercel CLI をインストール → production の `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` を差し替え、旧 Stripe 変数 6 個を削除 → 本番再デプロイ

### 学び・運用メモ
- Supabase Management API（`POST /v1/projects/{ref}/database/query` + `sbp_` トークン）で SQL 適用が自動化できる。Studio SQL Editor 手作業は不要
- Vercel CLI 認証はユーザーの `vercel login`（ブラウザ）が必要。以後は `vercel env add/rm` + `vercel redeploy` で完結
- **旧プロジェクトのデータは移行していない**（販売前のためテストデータのみ）。全ユーザーは再サインアップが必要
