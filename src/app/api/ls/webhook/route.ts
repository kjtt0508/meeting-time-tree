// src/app/api/ls/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const stripBOM = (s: string) => s.replace(/^﻿/, "").trim();

const supabaseAdmin = createClient(
  stripBOM(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
  stripBOM(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
);

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(digest, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  if (!signature || !verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventName: string = event.meta?.event_name ?? "";
  const customData = event.meta?.custom_data ?? {};
  const userId: string | undefined = customData.user_id;
  const type: string = customData.type ?? "pro"; // "pro" | "team" | "one_time"

  console.log(`LS event: ${eventName}, userId: ${userId}, type: ${type}`);

  if (!userId) {
    return NextResponse.json({ received: true });
  }

  // admin接続テスト + profilesレコード確認
  const { data: profileCheck, error: profileCheckErr } = await supabaseAdmin
    .from("profiles")
    .select("id, plan")
    .eq("id", userId)
    .single();

  if (profileCheckErr) {
    console.error("[webhook] profiles SELECT error - code:", profileCheckErr.code, "msg:", profileCheckErr.message, "userId:", userId);
  } else {
    console.log("[webhook] profiles SELECT ok - userId:", userId, "currentPlan:", profileCheck?.plan);
  }

  if (profileCheckErr?.code === "PGRST116" || !profileCheck) {
    // profilesレコードが存在しない → upsertで作成
    await supabaseAdmin.from("profiles").upsert({ id: userId, plan: "free" }, { onConflict: "id" });
    console.log("[webhook] profiles upserted for userId:", userId);
  }

  switch (eventName) {
    // ─── 一括購入 ─────────────────────────────────────────────
    case "order_created": {
      if (event.data.attributes.status === "paid") {
        const { error: e } = await supabaseAdmin.from("profiles").update({ plan: "pro" }).eq("id", userId);
        if (e) console.error("[order_created] update error - code:", e.code, "msg:", e.message, "userId:", userId);
        else console.log("[order_created] plan→pro userId:", userId);
      }
      break;
    }

    // ─── サブスク開始 ─────────────────────────────────────────
    case "subscription_created": {
      const subscriptionId: string = event.data.id;
      const userEmail: string = event.data.attributes.user_email ?? "";

      console.log("[subscription_created] userId:", userId, "subscriptionId:", subscriptionId, "type:", type);

      if (type === "team") {
        const teamName = (userEmail.split("@")[0] ?? userId) + "のチーム";

        const { data: teamData, error: teamError } = await supabaseAdmin
          .from("teams")
          .insert({ name: teamName, owner_id: userId })
          .select("id")
          .single();

        if (teamError || !teamData) {
          console.error("[subscription_created] team create error - code:", teamError?.code, "msg:", teamError?.message);
          break;
        }

        const teamId: string = teamData.id;
        await supabaseAdmin.from("team_members").insert({ team_id: teamId, user_id: userId, role: "owner" });
        const { error: teamUpdateError } = await supabaseAdmin.from("profiles")
          .update({ plan: "team", team_id: teamId, ls_subscription_id: subscriptionId })
          .eq("id", userId);
        if (teamUpdateError) console.error("[subscription_created] team profile update error - code:", teamUpdateError.code, "msg:", teamUpdateError.message);
        else console.log("[subscription_created] plan→team userId:", userId);
      } else {
        const { error: proUpdateError } = await supabaseAdmin.from("profiles")
          .update({ plan: "pro", ls_subscription_id: subscriptionId })
          .eq("id", userId);
        if (proUpdateError) console.error("[subscription_created] pro update error - code:", proUpdateError.code, "msg:", proUpdateError.message, "userId:", userId);
        else console.log("[subscription_created] plan→pro userId:", userId);
      }
      break;
    }

    // ─── 更新成功（期間継続） ──────────────────────────────────
    case "subscription_payment_success": {
      if (profileCheck?.plan !== "team") {
        const { error: e } = await supabaseAdmin.from("profiles").update({ plan: "pro" }).eq("id", userId);
        if (e) console.error("[subscription_payment_success] update error - code:", e.code, "msg:", e.message);
        else console.log("[subscription_payment_success] plan→pro userId:", userId);
      }
      break;
    }

    // ─── サブスク終了（期末解約 or 支払い失敗後） ──────────────
    case "subscription_expired": {
      const { data: ownerProfile } = await supabaseAdmin
        .from("profiles").select("plan, team_id").eq("id", userId).single();

      if (ownerProfile?.plan === "team" && ownerProfile?.team_id) {
        const teamId = ownerProfile.team_id;
        const { data: members } = await supabaseAdmin
          .from("team_members").select("user_id").eq("team_id", teamId);
        if (members) {
          for (const m of members) {
            await supabaseAdmin.from("profiles")
              .update({ plan: "free", team_id: null, ls_subscription_id: null })
              .eq("id", m.user_id);
          }
        }
        await supabaseAdmin.from("team_members").delete().eq("team_id", teamId);
        await supabaseAdmin.from("teams").delete().eq("id", teamId);
      } else {
        await supabaseAdmin.from("profiles")
          .update({ plan: "free", ls_subscription_id: null })
          .eq("id", userId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
