// src/data/sampleData.ts

import { Project, Meeting } from "@/types";

export const sampleProjects: Project[] = [
  { id: "pj-1", name: "Webリニューアル",   color: "#3B82F6", sortOrder: 0 },
  { id: "pj-2", name: "モバイルアプリ開発", color: "#10B981", sortOrder: 1 },
  { id: "pj-3", name: "社内システム改修",   color: "#F59E0B", sortOrder: 2 },
];

export const sampleMeetings: Meeting[] = [
  {
    id: "mtg-1",
    projectId: "pj-1",
    title: "キックオフ会議",
    meetingDate: "2025-01-15",
    decisions: "スケジュール確定、担当割り振り",
    nextTasks: "要件定義ドラフト作成",
    attachmentUrl: "",
  },
  {
    id: "mtg-2",
    projectId: "pj-1",
    title: "要件定義レビュー",
    meetingDate: "2025-02-10",
    decisions: "要件FIX、追加機能は Phase2 へ",
    nextTasks: "設計書作成開始",
    attachmentUrl: "",
  },
  {
    id: "mtg-3",
    projectId: "pj-1",
    title: "デザインレビュー",
    meetingDate: "2025-03-05",
    decisions: "トップページデザイン承認",
    nextTasks: "下層ページデザイン作成",
    attachmentUrl: "",
  },
  {
    id: "mtg-4",
    projectId: "pj-2",
    title: "企画会議",
    meetingDate: "2025-01-20",
    decisions: "ターゲットユーザー決定",
    nextTasks: "競合調査",
    attachmentUrl: "",
  },
  {
    id: "mtg-5",
    projectId: "pj-2",
    title: "技術選定MTG",
    meetingDate: "2025-02-18",
    decisions: "React Native採用",
    nextTasks: "環境構築、プロトタイプ作成",
    attachmentUrl: "",
  },
  {
    id: "mtg-6",
    projectId: "pj-2",
    title: "プロトレビュー",
    meetingDate: "2025-04-01",
    decisions: "UIの方向性OK",
    nextTasks: "API設計開始",
    attachmentUrl: "",
  },
  {
    id: "mtg-7",
    projectId: "pj-3",
    title: "課題ヒアリング",
    meetingDate: "2025-02-01",
    decisions: "改修対象3システムに絞る",
    nextTasks: "現状フロー図作成",
    attachmentUrl: "",
  },
  {
    id: "mtg-8",
    projectId: "pj-3",
    title: "改修方針決定",
    meetingDate: "2025-03-15",
    decisions: "段階的移行に決定",
    nextTasks: "Phase1の詳細設計",
    attachmentUrl: "",
  },
];
