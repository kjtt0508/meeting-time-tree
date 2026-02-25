// src/components/TimelineBackground.tsx

"use client";

import React from "react";
import { COLUMN_START_X, TIME_ORIGIN_Y, PIXELS_PER_DAY } from "@/utils/layout";

interface Props {
  earliestDate: string;
  monthCount: number; // 表示する月数
}

export default function TimelineBackground({
  earliestDate,
  monthCount,
}: Props) {
  const labels: { label: string; y: number }[] = [];

  const start = new Date(earliestDate);
  // 月初めに揃える
  const baseMonth = new Date(start.getFullYear(), start.getMonth(), 1);

  for (let i = 0; i < monthCount; i++) {
    const d = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + i, 1);
    const diffDays =
      (d.getTime() - new Date(earliestDate).getTime()) / (1000 * 60 * 60 * 24);
    const y = TIME_ORIGIN_Y + diffDays * PIXELS_PER_DAY;

    labels.push({
      label: `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      y,
    });
  }

  return (
    <>
      {labels.map((item) => (
        <React.Fragment key={item.label}>
          {/* 月ラベル */}
          <div
            className="absolute text-xs text-gray-400 font-mono select-none pointer-events-none"
            style={{
              left: 12,
              top: item.y - 8,
            }}
          >
            {item.label}
          </div>
          {/* 横線 */}
          <div
            className="absolute border-t border-dashed border-gray-200 pointer-events-none"
            style={{
              left: COLUMN_START_X - 20,
              top: item.y,
              width: 1400,
            }}
          />
        </React.Fragment>
      ))}
    </>
  );
}
