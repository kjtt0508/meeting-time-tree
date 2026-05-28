// src/app/api/team/invite/route.ts

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

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamId, email, role = "member" } = await req.json() as {
      teamId: string;
      email: string;
      role?: "admin" | "member";
    };

    if (!teamId || !email) {
      return NextResponse.json({ error: "teamId and email are required" }, { status: 400 });
    }

    // リクエストユーザーがそのチームのオーナーまたは admin か確認
    const { data: membership } = await supabaseAdmin
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // team_invitations に INSERT
    const { error: insertError } = await supabaseAdmin
      .from("team_invitations")
      .insert({ team_id: teamId, email, role, invited_by: user.id });

    if (insertError) {
      console.error("Failed to insert invitation:", JSON.stringify(insertError));
      return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
    }

    // INSERT した行の token を SELECT
    const { data: inviteData, error: selectError } = await supabaseAdmin
      .from("team_invitations")
      .select("token")
      .eq("team_id", teamId)
      .eq("email", email)
      .eq("invited_by", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (selectError || !inviteData) {
      return NextResponse.json({ error: "Failed to retrieve invitation token" }, { status: 500 });
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${inviteData.token}`;
    return NextResponse.json({ inviteUrl });
  } catch (err) {
    console.error("invite POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const invitationId = searchParams.get("invitationId");
    if (!invitationId) {
      return NextResponse.json({ error: "invitationId is required" }, { status: 400 });
    }

    // 招待の存在確認とチーム所属確認
    const { data: invitation } = await supabaseAdmin
      .from("team_invitations")
      .select("team_id")
      .eq("id", invitationId)
      .maybeSingle();

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // リクエストユーザーがそのチームのオーナーまたは admin か確認
    const { data: membership } = await supabaseAdmin
      .from("team_members")
      .select("role")
      .eq("team_id", invitation.team_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await supabaseAdmin
      .from("team_invitations")
      .update({ status: "cancelled" })
      .eq("id", invitationId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("invite DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
