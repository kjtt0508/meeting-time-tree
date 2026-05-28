// src/app/api/ls/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

  switch (eventName) {
    // ─── 一括購入 ─────────────────────────────────────────────
    case "order_created": {
      if (event.data.attributes.status === "paid") {
        const { error: e } = await supabaseAdmin.from("profiles").update({ plan: "pro" }).eq("id", userId);
        if (e) console.error("order_created update error:", JSON.stringify(e), "userId:", userId);
        else console.log("order_created: plan→pro userId:", userId);
      }
      break;
    }

    // ─── サブスク開始 ─────────────────────────────────────────
    case "subscription_created": {
      const subscriptionId: string = event.data.id;
      const userEmail: string = event.data.attributes.user_email ?? "";

      console.log("subscription_created: userId:", userId, "subscriptionId:", subscriptionId, "type:", type);

      if (type === "team") {
        const teamName = (userEmail.split("@")[0] ?? userId) + "のチーム";

        const { data: teamData, error: teamError } = await supabaseAdmin
          .from("teams")
          .insert({ name: teamName, owner_id: userId })
          .select("id")
          .single();

        if (teamError || !teamData) {
          console.error("Failed to create team:", JSON.stringify(teamError));
          break;
        }

        const teamId: string = teamData.id;
        await supabaseAdmin.from("team_members").insert({ team_id: teamId, user_id: userId, role: "owner" });
        const { error: teamUpdateError } = await supabaseAdmin.from("profiles")
          .update({ plan: "team", team_id: teamId, ls_subscription_id: subscriptionId })
          .eq("id", userId);
        if (teamUpdateError) console.error("team profile update error:", JSON.stringify(teamUpdateError));
        else console.log("subscription_created: plan→team userId:", userId);
      } else {
        const { error: proUpdateError } = await supabaseAdmin.from("profiles")
          .update({ plan: "pro", ls_subscription_id: subscriptionId })
          .eq("id", userId);
        if (proUpdateError) console.error("pro profile update error:", JSON.stringify(proUpdateError), "userId:", userId);
        else console.log("subscription_created: plan→pro userId:", userId);
      }
      break;
    }

    // ─── 更新成功（期間継続） ──────────────────────────────────
    case "subscription_payment_success": {
      const { data: profile } = await supabaseAdmin
        .from("profiles").select("plan").eq("id", userId).single();
      if (profile?.plan !== "team") {
        const { error: e } = await supabaseAdmin.from("profiles").update({ plan: "pro" }).eq("id", userId);
        if (e) console.error("subscription_payment_success update error:", JSON.stringify(e));
        else console.log("subscription_payment_success: plan→pro userId:", userId);
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
