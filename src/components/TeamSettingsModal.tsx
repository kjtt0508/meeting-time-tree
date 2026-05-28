// src/components/TeamSettingsModal.tsx

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Team, TeamInvitation, TeamMember } from "@/types";
import { fetchTeamInvitations } from "@/lib/team";
import { supabase } from "@/lib/supabase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  userId: string;
}

export default function TeamSettingsModal({ isOpen, onClose, team, userId }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  const load = useCallback(async () => {
    if (!team) return;
    setLoadingMembers(true);
    const token = await getAccessToken();
    const [membersRes, invs] = await Promise.all([
      token
        ? fetch(`/api/team/members?teamId=${team.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()).then((d) => d.members ?? [])
        : Promise.resolve([]),
      fetchTeamInvitations(team.id),
    ]);
    setMembers(membersRes);
    setInvitations(invs);
    setLoadingMembers(false);
  }, [team]);

  useEffect(() => {
    if (isOpen && team) {
      load();
      setInviteEmail("");
      setInviteLink(null);
      setCopied(false);
    }
  }, [isOpen, team, load]);

  if (!isOpen || !team) return null;

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteLink(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) { alert("ログインが必要です"); return; }
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ teamId: team.id, email: inviteEmail.trim() }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "招待に失敗しました" }));
        alert(error ?? "招待に失敗しました");
        return;
      }
      const { inviteUrl } = await res.json();
      setInviteLink(inviteUrl);
      setInviteEmail("");
      await load();
    } catch {
      alert("招待リンクの生成に失敗しました。もう一度お試しください。");
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("このメンバーをチームから削除しますか？")) return;
    const accessToken = await getAccessToken();
    if (!accessToken) return;
    const res = await fetch(`/api/team/members?memberId=${memberId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } else {
      alert("削除に失敗しました。もう一度お試しください。");
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("この招待をキャンセルしますか？")) return;
    const accessToken = await getAccessToken();
    if (!accessToken) return;
    const res = await fetch(`/api/team/invite?invitationId=${invitationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } else {
      alert("招待のキャンセルに失敗しました。");
    }
  };

  const isOwner = team.ownerId === userId;

  const roleLabel = (role: TeamMember["role"]) => {
    if (role === "owner") return "オーナー";
    if (role === "admin") return "管理者";
    return "メンバー";
  };

  const formatExpiry = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} まで`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold">{team.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {members.length} / {team.maxMembers} 人
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Members */}
          <section>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              メンバー
            </h3>
            {loadingMembers ? (
              <p className="text-sm text-gray-400">読み込み中...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400">メンバーがいません</p>
            ) : (
              <ul className="space-y-2">
                {members.map((member) => {
                  const canDelete =
                    isOwner &&
                    member.role !== "owner" &&
                    member.userId !== userId;
                  return (
                    <li
                      key={member.id}
                      className="flex items-center justify-between bg-gray-700/60 rounded-lg px-3 py-2"
                    >
                      <div>
                        <p className="text-sm">
                          {member.email ?? member.userId}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {roleLabel(member.role)}
                        </p>
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-xs text-red-400 hover:text-red-300 bg-gray-800 hover:bg-gray-700 rounded px-2 py-1 transition-colors"
                        >
                          削除
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Invite form */}
          {isOwner && (
            <section>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                メンバーを招待
              </h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  placeholder="招待するメールアドレス"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {inviting ? "生成中..." : "招待リンクを生成"}
                </button>
              </div>

              {inviteLink && (
                <div className="mt-3 bg-gray-700/60 rounded-lg px-3 py-3">
                  <p className="text-xs text-gray-400 mb-2">招待リンクが生成されました（7日間有効）</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteLink}
                      className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 outline-none truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="text-xs bg-gray-600 hover:bg-gray-500 rounded px-2 py-1 transition-colors whitespace-nowrap"
                    >
                      {copied ? "コピー済み" : "コピー"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Pending invitations */}
          {isOwner && invitations.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                保留中の招待
              </h3>
              <ul className="space-y-2">
                {invitations.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between bg-gray-700/60 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-sm">{inv.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatExpiry(inv.expiresAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(inv.id)}
                      className="text-xs text-red-400 hover:text-red-300 bg-gray-800 hover:bg-gray-700 rounded px-2 py-1 transition-colors"
                    >
                      キャンセル
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
