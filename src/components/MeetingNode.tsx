// src/components/MeetingNode.tsx

"use client";

import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface MeetingNodeData {
  label: string;
  meetingDate: string;
  decisions: string;
  nextTasks: string;
  attachmentUrl: string;
  projectColor: string;
  onOpenDetail: (nodeId: string) => void;
  [key: string]: unknown;
}

export default function MeetingNode({ id, data }: NodeProps) {
  const d = data as MeetingNodeData;

  return (
    <div
      className="w-[240px] rounded-lg shadow-md bg-white border-l-4 cursor-pointer
                 hover:shadow-lg transition-shadow"
      style={{ borderLeftColor: d.projectColor }}
      onClick={() => d.onOpenDetail(id)}
    >
      {/* 上部の接続ハンドル */}
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />

      <div className="p-3">
        {/* 日付 */}
        <p className="text-xs text-gray-400 mb-1">{d.meetingDate}</p>
        {/* 議題 */}
        <p className="text-sm font-bold text-gray-800 leading-tight mb-2">
          {d.label}
        </p>
        {/* 決定事項（1行プレビュー） */}
        {d.decisions && (
          <p className="text-xs text-gray-500 truncate">
            ✅ {d.decisions}
          </p>
        )}
        {/* 次回課題（1行プレビュー） */}
        {d.nextTasks && (
          <p className="text-xs text-gray-500 truncate">
            📋 {d.nextTasks}
          </p>
        )}
      </div>

      {/* 下部の接続ハンドル */}
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}
