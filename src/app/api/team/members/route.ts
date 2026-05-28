// src/app/api/team/members/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripBOM = (s: string) => s.replace(/^﻿/, "").trim();
const supabaseAdmin = createClient(
  stripBOM(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
  stripBOM(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
);

async function getAuthUser(req: NextRequest) {
  const accessToken = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!accessToken) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken);
  return user ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");
    if (!teamId) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 });
    }

    // リクエストユーザーがそのチームのメンバーか確認
    const { data: membership } = await supabaseAdmin
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: members, error: membersError } = await supabaseAdmin
      .from("team_members")
      .select("id, user_id, role, joined_at")
      .eq("team_id", teamId)
      .order("joined_at", { ascending: true });

    if (membersError) {
      return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ members: [] });
    }

    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) {
      return NextResponse.json({ error: "Failed to fetch user emails" }, { status: 500 });
    }

    const userEmailMap = new Map<string, string>(
      usersData.users.map((u) => [u.id, u.email ?? ""])
    );

    const result = members.map((m) => ({
      id: m.id as string,
      userId: m.user_id as string,
      role: m.role as string,
      joinedAt: m.joined_at as string,
      email: userEmailMap.get(m.user_id as string) ?? "",
    }));

    return NextResponse.json({ members: result });
  } catch (err) {
    console.error("members GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    // 削除対象メンバーの情報を取得
    const { data: member } = await supabaseAdmin
      .from("team_members")
      .select("user_id, team_id, role")
      .eq("id", memberId)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // リクエストユーザーがそのチームのオーナーか確認
    const { data: callerMembership } = await supabaseAdmin
      .from("team_members")
      .select("role")
      .eq("team_id", member.team_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!callerMembership || callerMembership.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // オーナー自身は削除不可
    if (member.role === "owner") {
      return NextResponse.json({ error: "Cannot remove team owner" }, { status: 400 });
    }

    const targetUserId: string = member.user_id;

    const { error: deleteError } = await supabaseAdmin
      .from("team_members")
      .delete()
      .eq("id", memberId);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
    }

    await supabaseAdmin
      .from("profiles")
      .update({ plan: "free", team_id: null })
      .eq("id", targetUserId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("members DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
