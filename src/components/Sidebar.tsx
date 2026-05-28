// src/components/Sidebar.tsx

"use client";

import React, { useState } from "react";
import { Plan, Project } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface Props {
  projects: Project[];
  plan: Plan;
  onAddProject: (project: Project) => void;
  onAddMeeting: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onLogout: () => void;
  onUpgrade: () => void;
  onBuyOnce: () => void;
  onCancel: () => void;
  onExport: () => void;
  onTeamSettings: () => void;
}

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B",
  "#EF4444", "#8B5CF6", "#EC4899",
];

export default function Sidebar({ projects, plan, onAddProject, onAddMeeting, onDeleteProject, onLogout, onUpgrade, onBuyOnce, onCancel, onExport, onTeamSettings }: Props) {
  const [newName, setNewName] = useState("");
  const [selColor, setSelColor] = useState(PRESET_COLORS[0]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAddProject({
      id: uuidv4(),
      name: newName.trim(),
      color: selColor,
      sortOrder: projects.length === 0 ? 0 : Math.max(...projects.map((p) => p.sortOrder)) + 1,
      createdDate: new Date().toISOString().slice(0, 10),
    });
    setNewName("");
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId((prev) => (prev === projectId ? null : projectId));
  };

  const handleDelete = (projectId: string) => {
    onDeleteProject(projectId);
    setSelectedProjectId(null);
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="px-4 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold tracking-wide">Meeting Timetree</h1>
        <div className="flex items-center justify-between mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full inline-block ${
            plan === "team"
              ? "bg-blue-600 text-white"
              : plan === "pro"
              ? "bg-yellow-500 text-black"
              : "bg-gray-700 text-gray-300"
          }`}>
            {plan === "team" ? "✦ Team" : plan === "pro" ? "✦ Pro" : "Free"}
          </span>
          <button
            onClick={onExport}
            className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 transition-colors ${
              plan === "pro" || plan === "team"
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-800 text-gray-500 cursor-pointer"
            }`}
            title={plan === "pro" || plan === "team" ? "PNGとしてエクスポート" : "Proプランでご利用可能"}
          >
            ↓ エクスポート
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Projects</p>

        {projects.map((pj) => (
          <div key={pj.id}>
            <div
              className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => handleProjectClick(pj.id)}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pj.color }} />
                <span className="text-sm">{pj.name}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onAddMeeting(pj.id); }}
                className="text-xs bg-gray-700 hover:bg-gray-600 rounded px-2 py-1"
                title="会議を追加"
              >
                + 会議
              </button>
            </div>

            {/* 選択時に削除ボタンを表示 */}
            {selectedProjectId === pj.id && (
              <div className="mt-1 mx-1 flex justify-end">
                <button
                  onClick={() => handleDelete(pj.id)}
                  className="text-xs text-red-400 hover:text-red-300 bg-gray-800 hover:bg-gray-700 rounded px-3 py-1 transition-colors"
                >
                  🗑 プロジェクトを削除
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-4 border-t border-gray-700 space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider">New Project</p>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="プロジェクト名"
          className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setSelColor(c)}
              className={`w-6 h-6 rounded-full border-2 ${selColor === c ? "border-white" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button
          onClick={handleAdd}
          className="w-full bg-blue-500 hover:bg-blue-600 rounded-lg py-2 text-sm font-medium"
        >
          追加
        </button>
        {plan === "free" ? (
          <>
            <button
              onClick={onUpgrade}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg py-2 text-sm font-medium"
            >
              ✦ Proにアップグレード
            </button>
            <button
              onClick={onBuyOnce}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-lg py-2 text-sm font-medium"
            >
              買い切り ¥3,980（永久ライセンス）
            </button>
          </>
        ) : plan === "team" ? (
          <button
            onClick={onTeamSettings}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            チームを管理
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="w-full text-red-400 hover:text-red-300 bg-gray-800 hover:bg-gray-700 rounded-lg py-2 text-sm transition-colors"
          >
            サブスクリプションを解約
          </button>
        )}
        <button
          onClick={onLogout}
          className="w-full text-gray-400 hover:text-white text-xs py-1"
        >
          ログアウト
        </button>
      </div>
    </aside>
  );
}