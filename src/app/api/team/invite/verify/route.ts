// src/app/api/team/invite/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripBOM = (s: string) => s.replace(/^﻿/, "").trim();
const supabaseAdmin = createClient(
  stripBOM(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
  stripBOM(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    // team_invitations から token で検索
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("team_invitations")
      .select("id, team_id, email, role, status, expires_at")
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 400 });
    }

    // status チェック
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: `Invitation is ${invitation.status}` },
        { status: 400 }
      );
    }

    // 有効期限チェック
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }

    // teams テーブルから team.name を取得
    const { data: team, error: teamError } = await supabaseAdmin
      .from("teams")
      .select("name")
      .eq("id", invitation.team_id)
      .single();

    if (teamError || !team) {
      console.error("Failed to retrieve team:", JSON.stringify(teamError));
      return NextResponse.json({ error: "Team not found" }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      teamName: team.name as string,
      email: invitation.email as string,
      role: invitation.role as string,
    });
  } catch (err) {
    console.error("invite verify GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
