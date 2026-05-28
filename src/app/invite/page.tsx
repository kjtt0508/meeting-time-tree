// src/app/invite/page.tsx

"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthScreen from "@/components/AuthScreen";

interface InviteInfo {
  teamName: string;
  token: string;
}

function InvitePageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "accepted">("loading");
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/team/invite/verify?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
          setStatus("invalid");
          return;
        }
        const data = await res.json();
        setInviteInfo({ teamName: data.teamName, token });
        setStatus("valid");
      } catch {
        setStatus("invalid");
      }
    })();
  }, [token]);

  const handleAccept = useCallback(async () => {
    if (!token) return;
    setAccepting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("ログインが必要です"); setAccepting(false); return; }
      const res = await fetch("/api/team/invite/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "参加に失敗しました" }));
        setError(body.error ?? "参加に失敗しました");
        return;
      }
      setStatus("accepted");
      // Redirect to home after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch {
      setError("参加に失敗しました。もう一度お試しください。");
    } finally {
      setAccepting(false);
    }
  }, [token]);

  // After login, auto-accept if token is valid
  useEffect(() => {
    if (isLoggedIn && status === "valid" && sessionStorage.getItem("pendingInviteToken") === token) {
      sessionStorage.removeItem("pendingInviteToken");
      handleAccept();
    }
  }, [isLoggedIn, status, token, handleAccept]);

  const handleLoginThenAccept = () => {
    sessionStorage.setItem("pendingInviteToken", token);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      {/* Loading */}
      {status === "loading" && (
        <div className="text-gray-400 text-sm">招待を確認中...</div>
      )}

      {/* Invalid */}
      {status === "invalid" && (
        <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-white mb-2">招待リンクが無効です</h1>
          <p className="text-gray-400 text-sm">
            このリンクは期限切れか、すでに使用済みです。
            <br />チームオーナーに新しい招待リンクを依頼してください。
          </p>
          <a
            href="/"
            className="mt-6 inline-block px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
          >
            トップに戻る
          </a>
        </div>
      )}

      {/* Accepted */}
      {status === "accepted" && (
        <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-xl font-bold text-white mb-2">チームに参加しました</h1>
          <p className="text-gray-400 text-sm">ホームにリダイレクトします...</p>
        </div>
      )}

      {/* Valid */}
      {status === "valid" && inviteInfo && (
        <>
          {/* Not logged in: show auth */}
          {isLoggedIn === false && (
            <div className="w-full max-w-md">
              <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 mb-4 text-center">
                <h1 className="text-xl font-bold text-white mb-1">
                  {inviteInfo.teamName} に招待されています
                </h1>
                <p className="text-gray-400 text-sm">
                  参加するにはログインまたはアカウント作成が必要です
                </p>
              </div>
              <div onClick={handleLoginThenAccept}>
                <AuthScreen />
              </div>
            </div>
          )}

          {/* Logged in: show accept button */}
          {isLoggedIn === true && (
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
              <div className="text-5xl mb-4">👥</div>
              <h1 className="text-xl font-bold text-white mb-2">
                {inviteInfo.teamName} に招待されています
              </h1>
              <p className="text-gray-400 text-sm mb-6">
                このチームに参加しますか？
              </p>
              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-900/50 text-red-300">
                  {error}
                </div>
              )}
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 font-semibold transition-colors"
              >
                {accepting ? "処理中..." : "参加する"}
              </button>
              <a
                href="/"
                className="mt-3 inline-block text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                キャンセル
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    }>
      <InvitePageInner />
    </Suspense>
  );
}
