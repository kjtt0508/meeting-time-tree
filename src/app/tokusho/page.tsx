// src/app/tokusho/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | Meeting Time Tree",
};

export default function TokushoPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
            ← トップに戻る
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">特定商取引法に基づく表記</h1>
        <p className="text-slate-400 text-sm mb-10">最終更新: 2026年5月28日</p>

        <div className="bg-yellow-900/30 border border-yellow-600/40 rounded-lg px-5 py-4 mb-8 text-sm text-yellow-200">
          ⚠️ 以下の項目（<span className="font-bold text-yellow-100">[要記入]</span>）は販売者が記入してください。日本の特定商取引法により、有料サービス提供者に開示が義務付けられています。
        </div>

        <table className="w-full text-sm border-collapse">
          <tbody>
            {[
              { label: "販売業者", value: "[要記入: 氏名または法人名]" },
              { label: "代表者", value: "[要記入: 代表者氏名]" },
              {
                label: "所在地",
                value: (
                  <span>
                    [要記入: 住所]
                    <br />
                    <span className="text-slate-400 text-xs">
                      ※ 個人の場合、請求があれば速やかに開示します。メールでお問い合わせください。
                    </span>
                  </span>
                ),
              },
              { label: "電話番号", value: "[要記入: 電話番号 または 「お問い合わせフォーム対応」と記載]" },
              {
                label: "メールアドレス",
                value: (
                  <a href="mailto:scandal.what.is.your.standard@gmail.com" className="text-blue-400 hover:underline">
                    scandal.what.is.your.standard@gmail.com
                  </a>
                ),
              },
              {
                label: "販売価格",
                value: (
                  <ul className="space-y-1">
                    <li>Freeプラン: 無料</li>
                    <li>Proプラン: 月額 ¥980（税込）/ 年額 ¥7,800（税込）</li>
                    <li>Teamプラン: 月額 ¥2,980（税込）/ 年額 ¥24,800（税込）</li>
                  </ul>
                ),
              },
              { label: "支払い方法", value: "クレジットカード（Visa / Mastercard / American Express 等）" },
              { label: "支払い時期", value: "ご契約時および毎月（または毎年）の更新日に自動決済" },
              {
                label: "サービス提供時期",
                value: "決済完了後、即時にご利用いただけます",
              },
              {
                label: "返品・キャンセルについて",
                value: (
                  <span>
                    サブスクリプションはいつでも解約可能です。解約後は次回更新日まで引き続きご利用いただけます。
                    <br />
                    デジタルコンテンツの性質上、購入済み期間に対する返金は原則として対応しておりません。
                    ただしシステム障害等、当サービスの瑕疵による場合は個別に対応します。
                  </span>
                ),
              },
              { label: "動作環境", value: "Google Chrome / Firefox / Safari / Edge の最新版推奨（インターネット接続が必要）" },
            ].map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-slate-800/40" : ""}>
                <td className="py-4 px-4 font-medium text-white whitespace-nowrap align-top w-40 border-b border-slate-700/50">
                  {row.label}
                </td>
                <td className="py-4 px-4 text-slate-300 border-b border-slate-700/50 leading-relaxed">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
