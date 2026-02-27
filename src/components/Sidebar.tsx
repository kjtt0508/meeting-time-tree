// src/components/Sidebar.tsx

"use client";

import React, { useState } from "react";
import { Project } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface Props {
  projects: Project[];
  onAddProject: (project: Project) => void;
  onAddMeeting: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B",
  "#EF4444", "#8B5CF6", "#EC4899",
];

export default function Sidebar({ projects, onAddProject, onAddMeeting, onDeleteProject }: Props) {
  const [newName, setNewName] = useState("");
  const [selColor, setSelColor] = useState(PRESET_COLORS[0]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAddProject({
      id: uuidv4(),
      name: newName.trim(),
      color: selColor,
      sortOrder: projects.length,
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
      </div>
    </aside>
  );
}