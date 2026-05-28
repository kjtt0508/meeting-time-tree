// src/app/api/stripe/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { userId, email, plan = "pro" } = await req.json() as {
      userId: string;
      email: string;
      plan?: "pro" | "team";
    };

    // Stripe Customer を作成（または既存のものを取得）
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      // webhook での userId 取得のため metadata を確実に設定
      const existing = customers.data[0];
      if (!existing.metadata?.supabase_user_id) {
        await stripe.customers.update(customerId, { metadata: { supabase_user_id: userId } });
      }
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
    }

    // plan に応じた price ID を選択
    const priceId =
      plan === "team"
        ? process.env.STRIPE_TEAM_PRICE_ID!
        : process.env.STRIPE_PRICE_ID!;

    // チェックアウトセッション作成
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}?upgraded=false`,
      metadata: {
        supabase_user_id: userId,
        type: plan === "team" ? "team" : "pro",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "checkout failed" }, { status: 500 });
  }
}