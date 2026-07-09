// src/app/tokusho/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | Meeting Time Tree",
};

type Row = { label: string; value: ReactNode };

const rows: Row[] = [
  {
    label: "販売事業者（Merchant of Record）",
    value: (
      <span>
        Lemon Squeezy, LLC（米国法人）
        <br />
        222 South Main Street Suite 500, Salt Lake City, UT 84101, USA
        <br />
        <span className="text-slate-400 text-xs">
          ※ 本サービスの決済・領収書発行・税務・返金対応は Merchant of Record として
          Lemon Squeezy, LLC が行います。最新の連絡先・住所等は{" "}
          <a
            href="https://www.lemonsqueezy.com/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Lemon Squeezy 利用規約
          </a>{" "}
          をご確認ください。
        </span>
      </span>
    ),
  },
  {
    label: "サービス提供者",
    value: "K's Factory",
  },
  {
    label: "お問い合わせ先",
    value: (
      <a
        href="mailto:ks.factory202605@gmail.com"
        className="text-blue-400 hover:underline"
      >
        ks.factory202605@gmail.com
      </a>
    ),
  },
  {
    label: "所在地",
    value: (
      <span>
        請求があれば遅滞なく開示します。
        <br />
        <span className="text-slate-400 text-xs">
          上記お問い合わせ先までメールにてご連絡ください。
        </span>
      </span>
    ),
  },
  {
    label: "電話番号",
    value: (
      <span>
        お問い合わせフォーム（メール）にて対応いたします。
        <br />
        <span className="text-slate-400 text-xs">
          請求があれば遅滞なく開示します。
        </span>
      </span>
    ),
  },
  {
    label: "販売価格",
    value: (
      <ul className="space-y-1">
        <li>Free プラン: 無料</li>
        <li>Pro プラン: 月額 ¥980（税込）/ 年額 ¥7,800（税込）</li>
        <li>Team プラン: 月額 ¥2,980（税込）/ 年額 ¥24,800（税込）</li>
        <li>買い切り（Electron 版）: ¥3,980（税込）</li>
      </ul>
    ),
  },
  {
    label: "商品代金以外の必要料金",
    value: "インターネット接続料金等はお客様のご負担となります。",
  },
  {
    label: "支払い方法",
    value:
      "クレジットカード（Visa / Mastercard / American Express 等、Lemon Squeezy が対応する決済手段）",
  },
  {
    label: "支払い時期",
    value:
      "ご契約時に初回決済、以降はサブスクリプションプランの更新日に自動決済（買い切りプランは購入時のみ）",
  },
  {
    label: "サービス提供時期",
    value: "決済完了後、即時にご利用いただけます。",
  },
  {
    label: "返品・キャンセルについて",
    value: (
      <span>
        サブスクリプションはアプリ内よりいつでも解約可能です。解約後は次回更新日まで引き続きご利用いただけます。
        <br />
        デジタルコンテンツの性質上、購入済み期間に対する返金は原則として対応しておりません。ただしシステム障害等、当サービスの瑕疵による場合は個別に対応します。
        <br />
        <span className="text-slate-400 text-xs">
          ※ 返金請求は Merchant of Record である Lemon Squeezy が受け付けます。
          上記お問い合わせ先からご連絡いただければ取次対応も可能です。
        </span>
      </span>
    ),
  },
  {
    label: "動作環境",
    value:
      "Google Chrome / Firefox / Safari / Edge の最新版推奨（インターネット接続が必要）",
  },
];

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
        <p className="text-slate-400 text-sm mb-10">最終更新: 2026年5月29日</p>

        <div className="bg-slate-800/60 border border-slate-700 rounded-lg px-5 py-4 mb-8 text-sm text-slate-300 leading-relaxed">
          本サービス（Meeting Time Tree）の決済は、Merchant of Record モデルにより
          <span className="font-semibold text-white"> Lemon Squeezy, LLC </span>
          が販売事業者として行います。お客様の購入契約は Lemon Squeezy との間で成立し、
          領収書発行・税務処理・返金対応は Lemon Squeezy が担当します。
          ソフトウェア自体の提供は K's Factory が行います。
        </div>

        <table className="w-full text-sm border-collapse">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-slate-800/40" : ""}>
                <td className="py-4 px-4 font-medium text-white whitespace-nowrap align-top w-48 border-b border-slate-700/50">
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
