// src/app/terms/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "利用規約 | Meeting Time Tree",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
            ← トップに戻る
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">利用規約</h1>
        <p className="text-slate-400 text-sm mb-10">最終更新: 2026年5月28日</p>

        <div className="space-y-10 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第1条（適用）</h2>
            <p>
              本利用規約（以下「本規約」）は、Meeting Time Tree（以下「本サービス」）の利用条件を定めるものです。
              ユーザーの皆さまには、本規約に同意いただいた上で本サービスをご利用いただきます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第2条（利用登録）</h2>
            <p>
              登録希望者がメールアドレスを用いてアカウントを作成した時点で、本規約に同意したものとみなします。
              未成年者の場合は保護者の同意を得た上でご利用ください。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第3条（料金・支払い）</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>無料プランは永続的に無料でご利用いただけます（機能制限あり）。</li>
              <li>有料プラン（Pro・Team）は月額または年額の前払いサブスクリプション制です。</li>
              <li>料金はクレジットカード（Stripe）による決済となります。</li>
              <li>月額プランは毎月同日に自動更新されます。</li>
              <li>年額プランは毎年同日に自動更新されます。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第4条（解約・返金）</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>サブスクリプションはいつでも解約できます。解約後は次回更新日まで引き続きご利用いただけます。</li>
              <li>解約後の残存期間に対する返金は原則として行いません。</li>
              <li>システム障害等、当サービスの瑕疵による長期間の利用不能が発生した場合は、個別に対応いたします。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第5条（禁止事項）</h2>
            <p className="mb-2">以下の行為を禁止します。</p>
            <ul className="list-disc list-inside space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>サービスのサーバーやネットワークに過度な負荷をかける行為</li>
              <li>他のユーザーまたは第三者の知的財産権を侵害する行為</li>
              <li>本サービスの運営を妨害するおそれのある行為</li>
              <li>アカウントを第三者に貸与・譲渡する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第6条（サービスの変更・停止）</h2>
            <p>
              当サービスは、ユーザーへの事前通知なく、サービス内容の変更、一時停止、終了を行う場合があります。
              これによりユーザーに損害が生じた場合でも、当サービスは責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第7条（免責事項）</h2>
            <p>
              当サービスは現状有姿で提供されます。データの損失、サービスの中断その他の損害について、
              当サービスは法令上の強行規定を除き一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第8条（準拠法・裁判管轄）</h2>
            <p>
              本規約の解釈には日本法を適用します。
              本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第9条（規約の変更）</h2>
            <p>
              当サービスは必要に応じて本規約を変更できます。
              変更後の規約は本ページに掲示した時点で効力を生じます。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
