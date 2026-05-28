// src/app/api/ls/cancel/route.ts

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

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("ls_subscription_id")
      .eq("id", user.id)
      .single();

    const subscriptionId = profile?.ls_subscription_id;
    if (!subscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    // 期末解約（DELETE = cancel at period end）
    const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY!}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("LS cancel error:", JSON.stringify(err));
      return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("LS cancel POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
