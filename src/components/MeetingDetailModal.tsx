// src/components/MeetingDetailModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Meeting } from "@/types";

interface Props {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Meeting) => void;
  onDelete: (id: string) => void;
}

export default function MeetingDetailModal({
  meeting,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [form, setForm] = useState<Meeting | null>(null);

  useEffect(() => {
    setForm(meeting ? { ...meeting } : null);
  }, [meeting]);

  if (!isOpen || !form) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">会議カード編集</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* 議題 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              議題
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2
                         focus:ring-blue-400 outline-none"
            />
          </div>

          {/* 会議日 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              会議日
            </label>
            <input
              type="date"
              name="meetingDate"
              value={form.meetingDate}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2
                         focus:ring-blue-400 outline-none"
            />
          </div>

          {/* 決定事項 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              決定事項
            </label>
            <textarea
              name="decisions"
              value={form.decisions}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2
                         focus:ring-blue-400 outline-none resize-none"
            />
          </div>

          {/* 次回課題 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              次回課題
            </label>
            <textarea
              name="nextTasks"
              value={form.nextTasks}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2
                         focus:ring-blue-400 outline-none resize-none"
            />
          </div>

          {/* 添付資料リンク */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              添付資料リンク
            </label>
            <input
              name="attachmentUrl"
              value={form.attachmentUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2
                         focus:ring-blue-400 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <button
            onClick={() => onDelete(form.id)}
            className="text-sm text-red-500 hover:text-red-700"
          >
            削除
          </button>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100"
            >
              キャンセル
            </button>
            <button
              onClick={() => onSave(form)}
              className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white
                         hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
