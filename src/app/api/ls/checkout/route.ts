// src/app/api/ls/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";

const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY!;
const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID!;

const VARIANT: Record<string, string | undefined> = {
  pro:      process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID,
  team:     process.env.LEMONSQUEEZY_TEAM_MONTHLY_VARIANT_ID,
  one_time: process.env.LEMONSQUEEZY_ONE_TIME_VARIANT_ID,
};

export async function POST(req: NextRequest) {
  try {
    const { userId, email, plan = "pro" } = await req.json() as {
      userId: string;
      email: string;
      plan?: "pro" | "team" | "one_time";
    };

    if (!userId || !email) {
      return NextResponse.json({ error: "userId and email are required" }, { status: 400 });
    }

    const variantId = VARIANT[plan];
    if (!variantId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://meeting-timetree.vercel.app")
      .replace(/^﻿/, "").trim();

    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${LS_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email,
              custom: { user_id: userId, type: plan },
            },
            product_options: {
              redirect_url: `${appUrl}/?upgraded=true`,
              receipt_button_text: "アプリに戻る",
              receipt_thank_you_note: "ご購入ありがとうございます！",
            },
          },
          relationships: {
            store:   { data: { type: "stores",   id: LS_STORE_ID } },
            variant: { data: { type: "variants",  id: variantId  } },
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("LS checkout error:", JSON.stringify(err));
      return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ url: data.data.attributes.url });
  } catch (err) {
    console.error("LS checkout POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
