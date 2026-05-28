"use client";

import { useState } from "react";
import AuthScreen from "./AuthScreen";

const PLANS = [
  {
    name: "Free",
    price: "¥0",
    period: "",
    description: "まず試してみたい方に",
    features: [
      "プロジェクト 3件まで",
      "会議カード 20件 / プロジェクト",
      "エッジ（接続線）無制限",
      "基本タイムライン表示",
    ],
    cta: "無料で始める",
    highlight: false,
  },
  {
    name: "Pro",
    price: "¥980",
    period: "/ 月",
    description: "個人・フリーランスの方に",
    features: [
      "プロジェクト無制限",
      "会議カード無制限",
      "エッジ（接続線）無制限",
      "PDF / PNG エクスポート",
      "優先サポート",
    ],
    cta: "Proで始める",
    highlight: true,
    badge: "人気No.1",
    yearly: "年払い ¥7,800（2ヶ月分お得）",
  },
  {
    name: "Team",
    price: "¥2,980",
    period: "/ 月",
    description: "チームで使いたい方に",
    features: [
      "Pro の全機能",
      "チームメンバー招待（5人まで）",
      "共有プロジェクト",
      "権限管理",
    ],
    cta: "Teamで始める",
    highlight: false,
    yearly: "年払い ¥24,800（2ヶ月分お得）",
  },
];

const FEATURES = [
  {
    icon: "🗺️",
    title: "会議のつながりを可視化",
    desc: "複数の会議を線でつなぎ、意思決定の流れを一目で把握。「あの決定はどこから来たのか」がすぐわかる。",
  },
  {
    icon: "📅",
    title: "日付タイムライン",
    desc: "2020年〜2100年に対応した無限タイムライン。プロジェクトの歴史を時系列で俯瞰できる。",
  },
  {
    icon: "🔗",
    title: "クロスプロジェクト接続",
    desc: "別プロジェクトの会議カード同士も線でつなげる。組織横断のつながりを表現。",
  },
  {
    icon: "💻",
    title: "デスクトップアプリ対応",
    desc: "Electron製デスクトップ版でオフライン動作。セキュリティポリシーが厳しい環境でも安心。",
  },
  {
    icon: "🌏",
    title: "日本語完全対応",
    desc: "UIから操作説明まですべて日本語。日本のビジネス慣習に合わせた設計。",
  },
  {
    icon: "⚡",
    title: "シンプルで高速",
    desc: "必要な機能だけを極限まで研ぎ澄ませた設計。起動から議事録追加まで数秒。",
  },
];

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <button
          onClick={() => setShowAuth(false)}
          className="mb-4 text-slate-400 hover:text-white text-sm flex items-center gap-1"
        >
          ← トップに戻る
        </button>
        <AuthScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Meeting Time Tree
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAuth(true)}
            className="text-slate-300 hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            ログイン
          </button>
          <button
            onClick={() => setShowAuth(true)}
            className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-medium transition"
          >
            無料で始める
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700/50">
            🎉 現在ベータ公開中 — 無料でお試しいただけます
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            会議の記録を、<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              プロジェクトの地図
            </span>
            に変える。
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            議事録カードをタイムライン上に配置し、線でつなぐ。
            複数プロジェクトの意思決定の流れを一目で把握できる、
            新しいビジュアル議事録ツール。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowAuth(true)}
              className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-lg transition shadow-lg shadow-blue-900/40"
            >
              無料で始める →
            </button>
            <button
              onClick={() => setShowAuth(true)}
              className="px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-lg transition border border-slate-700"
            >
              デモを見る
            </button>
          </div>
          <p className="mt-4 text-slate-500 text-sm">クレジットカード不要 · プロジェクト3件まで永久無料</p>
        </div>

        {/* Canvas mockup */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl shadow-black/60 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-slate-400 text-xs">Meeting Time Tree</span>
            </div>
            <div className="p-6 h-72 flex items-center justify-center bg-slate-900 relative overflow-hidden">
              {/* Simplified canvas preview */}
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "radial-gradient(circle, #334155 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
              <div className="relative flex gap-16 items-start mt-4">
                {[
                  { color: "#3b82f6", label: "プロダクト開発", cards: ["キックオフ 1/5", "設計MTG 1/12", "レビュー 1/20"] },
                  { color: "#a855f7", label: "マーケティング", cards: ["戦略会議 1/8", "LP検討 1/15", "告知計画 1/22"] },
                ].map((col) => (
                  <div key={col.label} className="flex flex-col items-center gap-3">
                    <div className="px-3 py-1 rounded-md text-xs font-bold text-white" style={{ background: col.color }}>
                      {col.label}
                    </div>
                    {col.cards.map((card) => (
                      <div key={card} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-xs text-slate-200 w-36 text-center shadow">
                        {card}
                      </div>
                    ))}
                  </div>
                ))}
                {/* Cross-project edge hint */}
                <svg className="absolute top-20 left-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
                  <defs>
                    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="3" refY="2" orient="auto">
                      <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
                    </marker>
                  </defs>
                  <path d="M 72 60 C 120 60, 120 40, 176 40" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 3" fill="none" markerEnd="url(#arrowhead)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">こんな悩み、ありませんか？</h2>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: "😵", title: "議事録がバラバラ", desc: "フォルダの中に埋もれて、過去の決定事項を探すのに毎回時間がかかる。" },
            { icon: "🤔", title: "会議の繋がりが見えない", desc: "「この決定、どのMTGで決まったんだっけ？」前回からの流れが追えない。" },
            { icon: "📊", title: "全体像が把握できない", desc: "複数プロジェクトが並行すると、何がどこまで進んでいるか全然わからない。" },
          ].map((item) => (
            <div key={item.title} className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/50">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">3ステップで始められる</h2>
          <p className="text-slate-400">複雑な設定なし。すぐ使えます。</p>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "プロジェクトを作る", desc: "プロジェクト名とカラーを決めるだけ。5秒で完了。" },
            { step: "02", title: "会議カードを追加", desc: "議題・日付・決定事項・次回課題を入力。必要な項目だけ埋めてOK。" },
            { step: "03", title: "カード同士を線でつなぐ", desc: "ドラッグで別プロジェクトのカードにも接続。会議の因果関係を可視化。" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4 text-lg font-black">
                {item.step}
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">必要な機能がすべて揃っている</h2>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/50 hover:border-blue-700/50 transition">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6" id="pricing">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">シンプルな料金プラン</h2>
          <p className="text-slate-400">まず無料で試して、気に入ったらアップグレード。</p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border flex flex-col ${
                plan.highlight
                  ? "bg-gradient-to-b from-blue-900/40 to-slate-900 border-blue-500/50 shadow-xl shadow-blue-900/30"
                  : "bg-slate-800/60 border-slate-700/50"
              }`}
            >
              {plan.badge && (
                <div className="inline-block mb-3 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white self-start">
                  {plan.badge}
                </div>
              )}
              <div className="text-sm text-slate-400 mb-1">{plan.name}</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-slate-400 mb-1">{plan.period}</span>
              </div>
              {plan.yearly && <p className="text-xs text-blue-400 mb-3">{plan.yearly}</p>}
              <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setShowAuth(true)}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition ${
                  plan.highlight
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-slate-700 hover:bg-slate-600 text-white"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-2xl p-10 border border-blue-700/30">
          <h2 className="text-3xl font-bold mb-4">今すぐ始めよう</h2>
          <p className="text-slate-300 mb-6">クレジットカード不要。1分で登録完了。</p>
          <button
            onClick={() => setShowAuth(true)}
            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-lg transition"
          >
            無料アカウントを作る →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>© 2026 Meeting Time Tree · <button onClick={() => setShowAuth(true)} className="hover:text-slate-300 transition">ログイン</button></p>
      </footer>
    </div>
  );
}
