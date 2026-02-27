// src/app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getUserId(event: Stripe.Event): string | null {
  const obj = event.data.object;

  // checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = obj as Stripe.Checkout.Session;
    return session.metadata?.supabase_user_id ?? null;
  }

  // invoice.payment_succeeded / invoice.payment_failed
  if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
    const invoice = obj as Stripe.Invoice;
    // invoice の subscription から metadata を取得
    return (invoice as unknown as Record<string, unknown>)
      ?.subscription_details
      ? null // subscription_details経由は複雑なのでcheckout時のみ対応
      : null;
  }

  // customer.subscription.deleted
  if (event.type === "customer.subscription.deleted") {
    const subscription = obj as Stripe.Subscription;
    return subscription.metadata?.supabase_user_id ?? null;
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

  const userId = getUserId(event);
  console.log(`userId: ${userId}`);

  if (!userId) {
    return NextResponse.json({ received: true });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "invoice.payment_succeeded":
      console.log(`Upgrading user ${userId} to pro`);
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ plan: "pro" })
        .eq("id", userId)
        .select();
      console.log("Update result:", JSON.stringify(updateData));
      console.log("Update error:", JSON.stringify(updateError));
      break;

    case "customer.subscription.deleted":
    case "invoice.payment_failed":
      console.log(`Downgrading user ${userId} to free`);
      await supabaseAdmin
        .from("profiles")
        .update({ plan: "free" })
        .eq("id", userId);
      break;
  }

  return NextResponse.json({ received: true });
}