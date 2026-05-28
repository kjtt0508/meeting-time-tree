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
- Stripe（決済）
- Tailwind CSS v4

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
- Stripe決済フローの確認・改善
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
- **メイン**: Stripe直販（現状実装を活かす）
- **配布方法**: GitHub Releases + electron-builder（手数料0%・最速）
- **App Store申請**: 将来フェーズ（初回リリース後に検討）
- **Webアプリ版**: Vercelデプロイ（Stripeウェブフック受信のため必須）

### ③対象デバイス
- **フェーズ1（今）**: Webアプリ版（Vercel）を先行リリース
- **フェーズ2**: Electronデスクトップ版（Windows/Mac）をGitHub Releasesで配布
- **補足**: ElectronはStripe APIルートと静的エクスポートが競合するため、決済処理はWebアプリ経由に統一する

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

## 優先タスクリスト（2026-05-28 更新）

### A. リリースブロッカー — ✅ 全完了

1. ~~**`cancel/route.ts` の解約バグ修正**~~ ✅ 完了
2. ~~**`webhook/route.ts` の `invoice.payment_succeeded` バグ修正**~~ ✅ 完了
3. ~~**`deleteProject` のカスケード削除漏れ修正**~~ ✅ 完了
4. ~~**カスタムエッジの削除UIを接続**~~ ✅ 完了（`deleteKeyCode` + `onEdgesDelete` 追加）

### B. デプロイ前設定 — ✅ ほぼ完了

5. ~~`layout.tsx` のタイトル変更~~ ✅ "Meeting Time Tree" に変更済み
6. ~~`NEXT_PUBLIC_APP_URL` を本番URLに変更~~ ✅ `https://meeting-timetree.vercel.app` に設定済み
7. **Stripe キーを本番キー (`sk_live_`) に差し替え** — 未対応（現在テストキー）
8. **Supabase RLS ポリシーを本番環境で確認・適用** — 未対応
9. ~~`electron-builder` の `appId` を正式名称に変更~~ ✅ `com.kajiwara.meeting-timetree` に変更済み

### C. リリース前必須 — ✅ ほぼ完了

10. ~~**ランディングページ作成**~~ ✅ `src/components/LandingPage.tsx` 実装済み
11. **OGP画像作成** (`public/og-image.png`) — 未対応（SNS・Product Hunt 申請に必須）

### D. リリース後の機能追加 — 実装/設計完了

12. ~~**PNG エクスポート機能**~~ ✅ 実装完了（html2canvas、Proのみ有効）
13. ~~**チームメンバー招待機能**~~ ✅ 実装完了
    - Supabase: `teams` / `team_members` / `team_invitations` テーブル作成済み（RLS 設定済み）
    - API: `/api/team/invite` / `/api/team/invite/verify` / `/api/team/invite/accept` / `/api/team/members`
    - UI: `TeamSettingsModal.tsx` / `src/app/invite/page.tsx`
    - セキュリティ: Bearer トークン認証 + 招待メールアドレス一致チェック（IDOR 対策）
14. **Electron オフライン対応強化** — 設計書完成（実装 Phase 1〜2 で 3〜5日）
    - dexie.js（IndexedDB）でオフラインキャッシュ推奨
    - Optimistic Update + Sync Queue で Supabase と同期
    - Stripe は `NEXT_PUBLIC_API_URL` + deep link で対応
15. ~~**買い切りライセンス発行フロー**~~ ✅ 実装完了（`/api/stripe/one-time`、Sidebar に紫ボタン追加）
    - **残作業**: Stripe ダッシュボードで Price 作成 → `STRIPE_ONE_TIME_PRICE_ID` を Vercel 環境変数に追加

---

## デプロイ状況（2026-05-28）

- **本番URL**: https://meeting-timetree.vercel.app
- **GitHub**: https://github.com/kjtt0508/meeting-time-tree
- **Stripe Webhook**: `we_1TblSSGtgsBuZW0N7FUV8Q4c`（本番エンドポイント登録済み）
- **Vercel 環境変数**: 8変数設定済み（`STRIPE_ONE_TIME_PRICE_ID` のみ未設定）

---

## 残タスク（優先順）

1. **Stripe 本番キーへの切り替え**（`sk_live_` / `pk_live_`）— 課金開始に必須
2. **`STRIPE_ONE_TIME_PRICE_ID` 作成・設定**（Stripe ダッシュボード → Vercel env add）
3. ~~**Supabase 外部キー CASCADE 制約追加**~~ ✅ 完了（edges/meetings に ON DELETE CASCADE 設定済み）
4. **Supabase RLS ポリシー本番確認**
4. **OGP画像作成**（`public/og-image.png`）
5. **Zenn/note 記事投稿 → Product Hunt 申請**
6. **GitHub Releases で Electron 版を配布**
7. ~~**D-13 チームメンバー招待機能の実装**~~ ✅ 完了
8. **D-14 Electron オフライン対応の実装**（設計書あり）

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
