// src/types/index.ts

export interface Project {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export interface Meeting {
  id: string;
  projectId: string;
  title: string;
  meetingDate: string;       // "YYYY-MM-DD"
  decisions: string;
  nextTasks: string;
  attachmentUrl: string;
}

export interface MeetingEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
}
