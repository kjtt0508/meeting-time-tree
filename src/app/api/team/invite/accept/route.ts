// src/app/api/team/invite/accept/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Authorization ヘッダーからアクセストークンを取得してサーバーサイドで検証
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

    const { token } = await req.json() as { token: string };
    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    // token で invitation を取得・検証
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("team_invitations")
      .select("id, team_id, email, role, status, expires_at")
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 400 });
    }
    if (invitation.status !== "pending") {
      return NextResponse.json({ error: `Invitation is ${invitation.status}` }, { status: 400 });
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }

    const teamId: string = invitation.team_id;

    // 重複メンバーチェック
    const { data: existing } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }

    // メンバー数上限チェック
    const { count } = await supabaseAdmin
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId);

    const { data: teamRow } = await supabaseAdmin
      .from("teams")
      .select("max_members")
      .eq("id", teamId)
      .single();

    if (count !== null && teamRow && count >= teamRow.max_members) {
      return NextResponse.json({ error: "Team is full" }, { status: 400 });
    }

    // team_members に INSERT
    const { error: memberError } = await supabaseAdmin
      .from("team_members")
      .insert({ team_id: teamId, user_id: userId, role: invitation.role });

    if (memberError) {
      console.error("Failed to insert team member:", JSON.stringify(memberError));
      return NextResponse.json({ error: "Failed to join team" }, { status: 500 });
    }

    // profiles を plan: "team", team_id に UPDATE
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ plan: "team", team_id: teamId })
      .eq("id", userId);

    if (profileError) {
      console.error("Failed to update profile:", JSON.stringify(profileError));
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // invitation の status を accepted に UPDATE
    await supabaseAdmin
      .from("team_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("invite accept POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
