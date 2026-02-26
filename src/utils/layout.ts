// src/utils/layout.ts

import { Project, Meeting } from "@/types";

// --- 定数 ---
const COLUMN_WIDTH = 300;
const COLUMN_GAP = 40;
const COLUMN_START_X = 100;
const TIME_ORIGIN_Y = 80;        // キャンバス上端の余白
const PIXELS_PER_DAY = 100;       // 1日あたりのピクセル数（カード高さに合わせて調整）

/**
 * 会議日 → Y座標
 * 全会議の最古日を基準にオフセット計算
 */
export function dateToY(dateStr: string, earliestDate: string): number {
  const d = new Date(dateStr).getTime();
  const origin = new Date(earliestDate).getTime();
  const diffDays = (d - origin) / (1000 * 60 * 60 * 24);
  return TIME_ORIGIN_Y + diffDays * PIXELS_PER_DAY;
}

/**
 * プロジェクトの sortOrder → X座標
 */
export function projectToX(project: Project): number {
  return COLUMN_START_X + project.sortOrder * (COLUMN_WIDTH + COLUMN_GAP);
}

/**
 * 全会議の最古日を取得
 */
export function getEarliestDate(meetings: Meeting[]): string {
  return meetings.reduce(
    (min, m) => (m.meetingDate < min ? m.meetingDate : min),
    meetings[0]?.meetingDate ?? "2025-01-01"
  );
}

/**
 * 全会議の最新日を取得
 */
export function getLatestDate(meetings: Meeting[]): string {
  return meetings.reduce(
    (max, m) => (m.meetingDate > max ? m.meetingDate : max),
    meetings[0]?.meetingDate ?? "2025-12-31"
  );
}

export { COLUMN_WIDTH, COLUMN_GAP, COLUMN_START_X, TIME_ORIGIN_Y, PIXELS_PER_DAY };
