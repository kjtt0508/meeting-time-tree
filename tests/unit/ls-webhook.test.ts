// Lemon Squeezy webhook — 署名検証まわりの単体テスト
// DB に触れる前段（署名不正 / user_id なし）で完結するパスのみを対象とする

import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { POST } from "../../src/app/api/ls/webhook/route";

const SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;

function sign(body: string, secret: string = SECRET): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

function makeRequest(body: string, signature?: string): NextRequest {
  const headers = new Headers();
  if (signature !== undefined) headers.set("x-signature", signature);
  return new NextRequest("http://localhost/api/ls/webhook", {
    method: "POST",
    body,
    headers,
  });
}

const eventWithoutUserId = JSON.stringify({
  meta: { event_name: "order_created", custom_data: {} },
  data: { attributes: {} },
});

describe("POST /api/ls/webhook — 署名検証", () => {
  it("署名ヘッダーなしは 400", async () => {
    const res = await POST(makeRequest(eventWithoutUserId));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid signature" });
  });

  it("不正な署名は 400", async () => {
    const res = await POST(makeRequest(eventWithoutUserId, "deadbeef"));
    expect(res.status).toBe(400);
  });

  it("別のシークレットで作った署名は 400", async () => {
    const forged = sign(eventWithoutUserId, "attacker-secret");
    const res = await POST(makeRequest(eventWithoutUserId, forged));
    expect(res.status).toBe(400);
  });

  it("hex ですらない署名でも 500 にならず 400", async () => {
    const res = await POST(makeRequest(eventWithoutUserId, "not-hex-at-all!!"));
    expect(res.status).toBe(400);
  });

  it("本文を 1 バイトでも改竄すると 400", async () => {
    const valid = sign(eventWithoutUserId);
    const tampered = eventWithoutUserId.replace("order_created", "order_creates");
    const res = await POST(makeRequest(tampered, valid));
    expect(res.status).toBe(400);
  });

  it("正しい署名 + user_id なしイベントは 200 { received: true }（DB 未接触で返る）", async () => {
    const res = await POST(makeRequest(eventWithoutUserId, sign(eventWithoutUserId)));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });
});
