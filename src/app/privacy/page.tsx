// src/app/privacy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Meeting Time Tree",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
            ← トップに戻る
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">プライバシーポリシー</h1>
        <p className="text-slate-400 text-sm mb-10">最終更新: 2026年5月28日</p>

        <div className="space-y-10 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. 収集する情報</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">メールアドレス</strong> — アカウント作成・ログイン・お問い合わせ対応のため</li>
              <li><strong className="text-white">ユーザーが入力したデータ</strong> — プロジェクト名、会議カードの内容（議題・決定事項等）</li>
              <li><strong className="text-white">決済情報</strong> — クレジットカード情報はStripeが直接処理します。当サービスはカード番号を保持しません</li>
              <li><strong className="text-white">利用ログ</strong> — エラー診断・サービス改善のためのアクセスログ</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. 利用目的</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>本サービスの提供・運営・改善</li>
              <li>ご本人確認および不正利用の防止</li>
              <li>料金の請求・決済処理</li>
              <li>重要なサービス変更のご連絡</li>
              <li>お問い合わせへの回答</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. 第三者への提供</h2>
            <p className="mb-3">以下の場合を除き、個人情報を第三者に提供しません。</p>
            <ul className="list-disc list-inside space-y-2">
              <li>法令に基づく場合</li>
              <li>生命・財産の保護に必要な場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. 外部サービス</h2>
            <ul className="space-y-3">
              <li>
                <strong className="text-white">Supabase</strong> — 認証・データベース（
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">プライバシーポリシー</a>
                ）
              </li>
              <li>
                <strong className="text-white">Stripe</strong> — 決済処理（
                <a href="https://stripe.com/jp/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">プライバシーポリシー</a>
                ）
              </li>
              <li>
                <strong className="text-white">Vercel</strong> — ホスティング（
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">プライバシーポリシー</a>
                ）
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Cookie</h2>
            <p>
              当サービスはセッション維持のためにCookieおよびローカルストレージを使用します。
              ブラウザの設定でCookieを無効にするとログイン機能が動作しなくなる場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. 情報の削除</h2>
            <p>
              アカウントおよびデータの削除をご希望の場合は、下記お問い合わせ先までご連絡ください。
              速やかに対応いたします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. お問い合わせ</h2>
            <p>
              個人情報に関するお問い合わせは、
              <a href="mailto:scandal.what.is.your.standard@gmail.com" className="text-blue-400 hover:underline ml-1">
                scandal.what.is.your.standard@gmail.com
              </a>
              までご連絡ください。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
