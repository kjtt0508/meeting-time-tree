// src/app/api/team/ensure/route.ts
// Team プランユーザーで teams レコードが存在しない場合に作成する救済API

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripBOM = (s: string) => s.replace(/^﻿/, "").trim();

const supabaseAdmin = createClient(
  stripBOM(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
  stripBOM(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const accessToken = authHeader?.replace("Bearer ", "");
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;
    const userEmail = user.email ?? "";

    // 現在のprofile状態を確認
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("plan, team_id")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) {
      console.error("[ensure] profile fetch error:", profileErr?.code, profileErr?.message);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.plan !== "team") {
      return NextResponse.json({ error: "Not a team plan user" }, { status: 403 });
    }

    // 既にteam_idが紐づいているなら、そのチームを返す
    if (profile.team_id) {
      const { data: existing } = await supabaseAdmin
        .from("teams")
        .select("id, name, owner_id, max_members, created_at")
        .eq("id", profile.team_id)
        .single();
      if (existing) {
        return NextResponse.json({
          team: {
            id: existing.id,
            name: existing.name,
            ownerId: existing.owner_id,
            maxMembers: existing.max_members,
            createdAt: existing.created_at,
          },
        });
      }
    }

    // teamを作成
    const teamName = (userEmail.split("@")[0] ?? userId) + "のチーム";
    const { data: newTeam, error: createErr } = await supabaseAdmin
      .from("teams")
      .insert({ name: teamName, owner_id: userId })
      .select("id, name, owner_id, max_members, created_at")
      .single();

    if (createErr || !newTeam) {
      console.error("[ensure] team create error:", createErr?.code, createErr?.message);
      return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }

    // ownerとしてteam_membersに登録
    await supabaseAdmin
      .from("team_members")
      .insert({ team_id: newTeam.id, user_id: userId, role: "owner" });

    // profileにteam_idを紐付け
    await supabaseAdmin
      .from("profiles")
      .update({ team_id: newTeam.id })
      .eq("id", userId);

    return NextResponse.json({
      team: {
        id: newTeam.id,
        name: newTeam.name,
        ownerId: newTeam.owner_id,
        maxMembers: newTeam.max_members,
        createdAt: newTeam.created_at,
      },
    });
  } catch (err) {
    console.error("[ensure] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
