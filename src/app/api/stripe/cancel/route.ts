// src/app/api/stripe/cancel/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    // StripeのCustomerを取得
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return NextResponse.json({ error: "customer not found" }, { status: 404 });
    }

    const customerId = customers.data[0].id;

    // アクティブなサブスクリプションを取得
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: "no active subscription" }, { status: 404 });
    }

    // 期末で解約（即時解約ではなく次回更新時にキャンセル）
    // DB更新はStripe Webhookの customer.subscription.deleted 受信時に行う
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "cancel failed" }, { status: 500 });
  }
}