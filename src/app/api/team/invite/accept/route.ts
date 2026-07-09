// src/app/api/team/invite/accept/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripBOM = (s: string) => s.replace(/^﻿/, "").trim();
const supabaseAdmin = createClient(
  stripBOM(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
  stripBOM(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
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
      return NextResponse.json({ error: "招待が見つかりません" }, { status: 400 });
    }
    if (invitation.status !== "pending") {
      const statusJa =
        invitation.status === "accepted" ? "受諾済み"
        : invitation.status === "cancelled" ? "取り消し済み"
        : invitation.status === "expired" ? "期限切れ"
        : invitation.status;
      return NextResponse.json(
        { error: `この招待は既に${statusJa}です` },
        { status: 400 }
      );
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "この招待は期限切れです" }, { status: 400 });
    }

    const teamId: string = invitation.team_id;

    // 招待メールアドレスと受諾ユーザーのメールアドレスが一致するか確認
    const inviteeEmail = (user.email ?? "").trim().toLowerCase();
    const expectedEmail = (invitation.email ?? "").trim().toLowerCase();
    if (!inviteeEmail || inviteeEmail !== expectedEmail) {
      return NextResponse.json(
        {
          error: `この招待は ${expectedEmail} 宛です。現在ログイン中のアカウント（${inviteeEmail || "メールアドレス未設定"}）と異なります。送信先と同じメールアドレスでログインし直してください。`,
        },
        { status: 403 }
      );
    }

    // 重複メンバーチェック
    const { data: existing } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      // 既にメンバーなら invitation を accepted にして冪等成功扱い
      await supabaseAdmin
        .from("team_invitations")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", invitation.id);
      return NextResponse.json({ success: true, alreadyMember: true });
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
      return NextResponse.json({ error: "チームのメンバー上限に達しています" }, { status: 400 });
    }

    // team_members に INSERT
    const { error: memberError } = await supabaseAdmin
      .from("team_members")
      .insert({ team_id: teamId, user_id: userId, role: invitation.role });

    if (memberError) {
      console.error("Failed to insert team member:", JSON.stringify(memberError));
      return NextResponse.json({ error: "チームへの参加に失敗しました" }, { status: 500 });
    }

    // profiles を plan: "team", team_id に UPDATE
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ plan: "team", team_id: teamId })
      .eq("id", userId);

    if (profileError) {
      console.error("Failed to update profile:", JSON.stringify(profileError));
      return NextResponse.json({ error: "プロフィールの更新に失敗しました" }, { status: 500 });
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
