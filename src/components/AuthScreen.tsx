// src/components/AuthScreen.tsx

"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) {
      setMessage({ text: "メールアドレスとパスワードを入力してください", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "確認メールを送信しました。メールを確認してください。", type: "success" });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ text: "メールアドレスまたはパスワードが違います", type: "error" });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
        {/* タイトル */}
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Meeting Timetree
        </h1>
        <p className="text-gray-400 text-center text-sm mb-8">
          会議の流れを時系列で可視化
        </p>

        {/* タブ */}
        <div className="flex bg-gray-700 rounded-lg p-1 mb-6">
          <button
            onClick={() => { setMode("login"); setMessage(null); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-blue-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => { setMode("signup"); setMessage(null); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-blue-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            新規登録
          </button>
        </div>

        {/* フォーム */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="your@email.com"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="8文字以上"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* メッセージ */}
        {message && (
          <div className={`mt-4 px-4 py-3 rounded-lg text-sm ${
            message.type === "error"
              ? "bg-red-900/50 text-red-300"
              : "bg-green-900/50 text-green-300"
          }`}>
            {message.text}
          </div>
        )}

        {/* ボタン */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg py-3 text-sm font-medium transition-colors"
        >
          {loading ? "処理中..." : mode === "login" ? "ログイン" : "アカウント作成"}
        </button>
      </div>
    </div>
  );
}