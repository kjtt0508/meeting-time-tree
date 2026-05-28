// src/types/index.ts

export interface Project {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  createdDate?: string;
}

export interface Meeting {
  id: string;
  projectId: string;
  title: string;
  meetingDate: string;
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

export type Plan = "free" | "pro" | "team";

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  maxMembers: number;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  email?: string;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  invitedBy: string;
  email: string;
  token: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string;
  createdAt: string;
}
