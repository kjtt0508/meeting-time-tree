// src/components/TimelineRuler.tsx
// ReactFlow の外側に position:fixed で配置する時間軸ルーラー
// ※ useViewport() を使うため ReactFlow の子として呼ぶが、
//    実際の DOM は ReactFlow 外に portal せず、
//    親から渡した viewport 値を使って描画する。
//
// 【呼び出し側】
//   <TimelineRulerInner> は ReactFlow 内に置いて viewport を取得し、
//   実描画は <TimelineRulerDisplay> として fixed div で行う。

"use client";

import React from "react";
import { useViewport } from "@xyflow/react";
import { TIME_ORIGIN_Y, PIXELS_PER_DAY } from "@/utils/layout";

const RULER_START = new Date("2020-01-01");
const RULER_END   = new Date("2100-12-31");
const RULER_WIDTH = 72;

function dateToCanvasY(date: Date, originDate: Date): number {
  const diffDays = (date.getTime() - originDate.getTime()) / 86400000;
  return TIME_ORIGIN_Y + diffDays * PIXELS_PER_DAY;
}

interface DisplayProps {
  earliestDate: string;
  sidebarWidth: number;
  viewY: number;
  zoom: number;
}

function TimelineRulerDisplay({ earliestDate, sidebarWidth, viewY, zoom }: DisplayProps) {
  const originDate = new Date(earliestDate);
  const screenHeight = typeof window !== "undefined" ? window.innerHeight : 900;
  const msPerDay = 86400000;

  // 画面上に見えているcanvasY範囲
  const canvasTop    = (0            - viewY) / zoom;
  const canvasBottom = (screenHeight - viewY) / zoom;

  const visibleStart = new Date(originDate.getTime() + ((canvasTop    - TIME_ORIGIN_Y) / PIXELS_PER_DAY) * msPerDay);
  const visibleEnd   = new Date(originDate.getTime() + ((canvasBottom - TIME_ORIGIN_Y) / PIXELS_PER_DAY) * msPerDay);

  const renderStart = new Date(Math.max(visibleStart.getTime() - 7 * msPerDay, RULER_START.getTime()));
  const renderEnd   = new Date(Math.min(visibleEnd.getTime()   + 7 * msPerDay, RULER_END.getTime()));

  // PIXELS_PER_DAY=100 なので zoom=0.1 でも 10px/day → 常に日表示できる
  // ズームが極端に小さい場合のみ間引く
  const pixPerDay = PIXELS_PER_DAY * zoom;
  const showDays   = pixPerDay >= 2;
  const showWeeks  = pixPerDay >= 0.5;

  type Tick = { key: string; screenY: number; kind: "month" | "week" | "day"; label: string };
  const ticks: Tick[] = [];

  const cur = new Date(renderStart);
  cur.setHours(0, 0, 0, 0);

  while (cur <= renderEnd) {
    const canvasY = dateToCanvasY(cur, originDate);
    const screenY = canvasY * zoom + viewY;

    const isMonthStart = cur.getDate() === 1;
    const isWeekStart  = cur.getDay() === 1;

    let kind: Tick["kind"];
    let label = "";

    if (isMonthStart) {
      kind = "month";
      label = cur.getMonth() === 0
        ? `${cur.getFullYear()}`
        : `${cur.getMonth() + 1}月`;
    } else if (isWeekStart && showWeeks) {
      kind = "week";
      label = `${cur.getMonth() + 1}/${String(cur.getDate()).padStart(2, "0")}`;
    } else if (showDays) {
      kind = "day";
      label = String(cur.getDate());
    } else {
      cur.setDate(cur.getDate() + 1);
      continue;
    }

    ticks.push({ key: cur.toISOString(), screenY, kind, label });
    cur.setDate(cur.getDate() + 1);
  }

  const fontSize = Math.min(11, Math.max(7, zoom * 11));

  const S = {
    month: { line: 20, lineColor: "#475569", color: "#0f172a", fw: 700, dy: -8 },
    week:  { line: 12, lineColor: "#94a3b8", color: "#475569", fw: 500, dy: -6 },
    day:   { line:  6, lineColor: "#cbd5e1", color: "#94a3b8", fw: 400, dy: -5 },
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: sidebarWidth,
        width: RULER_WIDTH,
        height: "100vh",
        background: "rgba(248,250,252,0.97)",
        borderRight: "1px solid #cbd5e1",
        overflow: "hidden",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 20,
      }}
    >
      {ticks.map(({ key, screenY, kind, label }) => {
        const s = S[kind];
        return (
          <div key={key} style={{ position: "absolute", left: 0, right: 0, top: screenY }}>
            <div style={{
              position: "absolute", right: 0,
              width: s.line, height: 0,
              borderTop: `1px solid ${s.lineColor}`,
            }} />
            {label && (
              <span style={{
                position: "absolute", left: 3, top: s.dy,
                fontSize, color: s.color, fontWeight: s.fw,
                whiteSpace: "nowrap", fontFamily: "monospace", lineHeight: 1,
              }}>
                {label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ReactFlow内に置くラッパー（useViewportを使うため）
interface Props {
  earliestDate: string;
  sidebarWidth?: number;
}

export default function TimelineRuler({ earliestDate, sidebarWidth = 0 }: Props) {
  const { y: viewY, zoom } = useViewport();

  return (
    <TimelineRulerDisplay
      earliestDate={earliestDate}
      sidebarWidth={sidebarWidth}
      viewY={viewY}
      zoom={zoom}
    />
  );
}