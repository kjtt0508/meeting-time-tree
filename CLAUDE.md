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

### 法令・LP
- ✅ ランディングページ（`src/components/LandingPage.tsx`）
- ✅ OGP動的生成（`src/app/opengraph-image.tsx`） + Twitter Card メタタグ
- ✅ 利用規約（`/terms`）・プライバシーポリシー（`/privacy`）・特定商取引法表記（`/tokusho`）

### インフラ
- ✅ Supabase: edges/meetings に `ON DELETE CASCADE` 設定済み
- ✅ Supabase RLS: teams/team_members/team_invitations に適用済み（本番環境での最終確認は残）
- ✅ Vercel 本番デプロイ（`https://meeting-timetree.vercel.app`）
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

> 詳細な「次回着手タスク」は本ドキュメント末尾の「セッションログ（2026-05-29）」セクションを参照。

1. **【最優先】チーム招待の自己招待エラー対応** — 「This invitation is for a different email address」の改善
2. **Lemon Squeezy 本番モードへの切り替え** — 本番APIキー・WebhookSecret・Variant IDの差し替え
3. **`/tokusho` の `[要記入]` 箇所** — 事業者名・住所・電話番号の記入
4. **Supabase RLS ポリシー本番確認** — 一通り作成済みだが、本番環境で動作確認
5. **Zenn/note 記事投稿 → Product Hunt 申請**
6. **GitHub Releases で Electron 版を配布**
7. **D-14 Electron オフライン対応の実装**（設計書あり — dexie.js + Optimistic Update + Sync Queue）

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

### 1. **【最優先】チーム招待の自己招待エラー対応**
**症状**: 招待ページで「This invitation is for a different email address」エラー

**原因**: `/api/team/invite/accept/route.ts:48-55` — 招待メールアドレスと受諾ユーザーのメールアドレスが一致しないと 403 を返す（IDOR対策）。オーナーが自分自身を招待した、または別のメールアドレスでログイン中の場合に発生。

**修正方針候補**:
- (a) オーナーが自分自身を招待した場合は許可する（同一userIdなら即チームメンバーに追加）
- (b) 招待生成時に既存メンバー/オーナーへの招待を拒否する
- (c) エラーメッセージを日本語化して原因を明示（「この招待は別のメールアドレス宛です。送信先と同じアカウントでログインしてください」）

→ (a) + (c) の組み合わせ推奨。

**関連ファイル**:
- `src/app/api/team/invite/accept/route.ts:48-55`（メール一致チェック）
- `src/app/api/team/invite/route.ts`（招待生成 — 自分宛拒否の事前チェック追加）
- `src/app/invite/page.tsx`（エラー表示の日本語化）

### 2. Lemon Squeezy 本番モードへの切り替え
- 本番APIキー発行 → Vercel 環境変数 `LEMONSQUEEZY_API_KEY` 差し替え
- Webhook URL を本番モードで再登録 → `LEMONSQUEEZY_WEBHOOK_SECRET` 更新
- 本番モードの Variant ID で `LEMONSQUEEZY_*_VARIANT_ID` を上書き

### 3. `/tokusho`（特定商取引法表記）の `[要記入]` 箇所を実情報で埋める
事業者名・住所・電話番号

### 4. Supabase RLS ポリシー本番確認

### 5. Zenn/note 記事投稿 → Product Hunt 申請

### 6. Electron 版を GitHub Releases で配布

### 7. D-14 Electron オフライン対応の実装（設計書あり）

---

## 🐛 既知の繰り返しパターン

**Windows UTF-8 BOM 汚染**: Vercel 環境変数を Windows 上でテキスト編集すると先頭に `﻿` が付くことがある。新しく `process.env.FOO` を fetch ヘッダー / URL / Supabase client に渡すコードを追加する際は、必ず `stripBOM()` を経由する。

```ts
const stripBOM = (s: string) => s.replace(/^﻿/, "").trim();
```

適用済み箇所: `src/lib/supabase.ts`, `src/app/layout.tsx`, `src/app/api/ls/{checkout,webhook,cancel}/route.ts`, `src/app/api/team/{invite,invite/verify,invite/accept,members,ensure}/route.ts`

