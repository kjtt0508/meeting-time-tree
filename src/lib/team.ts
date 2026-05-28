// src/lib/team.ts
// チーム関連のクライアントサイド CRUD

import { supabase } from "./supabase";
import { Team, TeamMember, TeamInvitation } from "@/types";

export async function fetchMyTeam(userId: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", userId)
    .single();

  if (error || !data?.team_id) return null;

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", data.team_id)
    .single();

  if (teamError || !team) return null;

  return {
    id: team.id,
    name: team.name,
    ownerId: team.owner_id,
    maxMembers: team.max_members,
    createdAt: team.created_at,
  };
}

export async function fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .order("joined_at");

  if (error) return [];

  return data.map((row) => ({
    id: row.id,
    teamId: row.team_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
  }));
}

export async function fetchTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
  const { data, error } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("team_id", teamId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return [];

  return data.map((row) => ({
    id: row.id,
    teamId: row.team_id,
    invitedBy: row.invited_by,
    email: row.email,
    token: row.token,
    role: row.role,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}
