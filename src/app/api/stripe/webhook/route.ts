// src/app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserId(event: Stripe.Event): Promise<string | null> {
  const obj = event.data.object;

  if (event.type === "checkout.session.completed") {
    const session = obj as Stripe.Checkout.Session;
    return session.metadata?.supabase_user_id ?? null;
  }

  if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
    const invoice = obj as Stripe.Invoice;
    const customerId = typeof invoice.customer === "string"
      ? invoice.customer
      : (invoice.customer as Stripe.Customer | null)?.id;
    if (!customerId) return null;
    try {
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      return customer.metadata?.supabase_user_id ?? null;
    } catch {
      return null;
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = obj as Stripe.Subscription;
    const customerId = typeof subscription.customer === "string"
      ? subscription.customer
      : (subscription.customer as Stripe.Customer | null)?.id;
    if (!customerId) return null;
    try {
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      return customer.metadata?.supabase_user_id ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "no signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return NextResponse.json({ error: "webhook signature failed" }, { status: 400 });
  }

  console.log(`Received event: ${event.type}`);

  const userId = await getUserId(event);
  console.log(`userId: ${userId}`);

  if (!userId) {
    return NextResponse.json({ received: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadataType = session.metadata?.type;

      if (metadataType === "team") {
        // Team プラン: チーム作成 → team_members に owner 追加 → profiles 更新
        console.log(`Creating team for user ${userId}`);

        // ユーザーのメールアドレスを取得してチーム名を生成
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        const email = authUser?.user?.email ?? "";
        const teamName = (email.split("@")[0] ?? userId) + "のチーム";

        // teams テーブルに新規チームを INSERT
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

        // team_members に owner を INSERT
        const { error: memberError } = await supabaseAdmin
          .from("team_members")
          .insert({ team_id: teamId, user_id: userId, role: "owner" });

        if (memberError) {
          console.error("Failed to insert team owner:", JSON.stringify(memberError));
        }

        // profiles を plan: "team", team_id に UPDATE
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ plan: "team", team_id: teamId })
          .eq("id", userId)
          .select();
        console.log("Team plan update result:", JSON.stringify(updateData));
        console.log("Team plan update error:", JSON.stringify(updateError));
      } else {
        // Pro プラン（既存フロー）
        const isOneTime = metadataType === "one_time";
        console.log(`Upgrading user ${userId} to pro (type: ${isOneTime ? "one_time" : "subscription"})`);
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ plan: "pro" })
          .eq("id", userId)
          .select();
        console.log("Update result:", JSON.stringify(updateData));
        console.log("Update error:", JSON.stringify(updateError));
      }
      break;
    }

    case "invoice.payment_succeeded": {
      // team プランユーザーを誤って pro に上書きしない
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .single();
      if (profile?.plan !== "team") {
        console.log(`Upgrading user ${userId} to pro`);
        await supabaseAdmin.from("profiles").update({ plan: "pro" }).eq("id", userId);
      }
      break;
    }

    case "customer.subscription.deleted":
    case "invoice.payment_failed": {
      console.log(`Downgrading user ${userId} to free`);
      // チームオーナーが解約した場合、全メンバーのプランも free に戻す
      const { data: ownerProfile } = await supabaseAdmin
        .from("profiles")
        .select("plan, team_id")
        .eq("id", userId)
        .single();
      if (ownerProfile?.plan === "team" && ownerProfile?.team_id) {
        const teamId = ownerProfile.team_id;
        const { data: members } = await supabaseAdmin
          .from("team_members")
          .select("user_id")
          .eq("team_id", teamId);
        if (members) {
          for (const m of members) {
            await supabaseAdmin
              .from("profiles")
              .update({ plan: "free", team_id: null })
              .eq("id", m.user_id);
          }
        }
        await supabaseAdmin.from("team_members").delete().eq("team_id", teamId);
        await supabaseAdmin.from("teams").delete().eq("id", teamId);
      } else {
        await supabaseAdmin
          .from("profiles")
          .update({ plan: "free", team_id: null })
          .eq("id", userId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}