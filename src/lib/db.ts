// src/lib/db.ts
// Supabase との CRUD 操作をまとめたデータアクセス層

import { supabase } from "./supabase";
import { Project, Meeting } from "@/types";

// ---- Projects ----

export async function fetchProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order");

  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    sortOrder: row.sort_order,
    createdDate: row.created_date,
  }));
}

export async function insertProject(userId: string, project: Project): Promise<void> {
  const { error } = await supabase.from("projects").insert({
    id: project.id,
    user_id: userId,
    name: project.name,
    color: project.color,
    sort_order: project.sortOrder,
    created_date: project.createdDate,
  });
  if (error) throw error;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

// ---- Meetings ----

export async function fetchMeetings(userId: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("user_id", userId)
    .order("meeting_date");

  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    meetingDate: row.meeting_date,
    decisions: row.decisions,
    nextTasks: row.next_tasks,
    attachmentUrl: row.attachment_url,
  }));
}

export async function insertMeeting(userId: string, meeting: Meeting): Promise<void> {
  const { error } = await supabase.from("meetings").insert({
    id: meeting.id,
    user_id: userId,
    project_id: meeting.projectId,
    title: meeting.title,
    meeting_date: meeting.meetingDate,
    decisions: meeting.decisions,
    next_tasks: meeting.nextTasks,
    attachment_url: meeting.attachmentUrl,
  });
  if (error) throw error;
}

export async function updateMeeting(meeting: Meeting): Promise<void> {
  const { error } = await supabase
    .from("meetings")
    .update({
      title: meeting.title,
      meeting_date: meeting.meetingDate,
      decisions: meeting.decisions,
      next_tasks: meeting.nextTasks,
      attachment_url: meeting.attachmentUrl,
    })
    .eq("id", meeting.id);
  if (error) throw error;
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  const { error } = await supabase.from("meetings").delete().eq("id", meetingId);
  if (error) throw error;
}

// ---- Plan ----

export async function fetchPlan(userId: string): Promise<"free" | "pro"> {
  const { data, error } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (error) return "free";
  return data.plan as "free" | "pro";
}