// チーム系 API — 認証必須の入口ガードの単体テスト
// Authorization ヘッダーなしで supabase に接続せず 401/400 を返すことを確認する

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as invitePost, DELETE as inviteDelete } from "../../src/app/api/team/invite/route";
import { POST as acceptPost } from "../../src/app/api/team/invite/accept/route";
import { GET as verifyGet } from "../../src/app/api/team/invite/verify/route";

describe("チーム招待 API の認証ガード", () => {
  it("POST /api/team/invite — 未認証は 401", async () => {
    const req = new NextRequest("http://localhost/api/team/invite", {
      method: "POST",
      body: JSON.stringify({ teamId: "t-1", email: "b@example.com" }),
    });
    const res = await invitePost(req);
    expect(res.status).toBe(401);
  });

  it("DELETE /api/team/invite — 未認証は 401", async () => {
    const req = new NextRequest(
      "http://localhost/api/team/invite?invitationId=i-1",
      { method: "DELETE" }
    );
    const res = await inviteDelete(req);
    expect(res.status).toBe(401);
  });

  it("POST /api/team/invite/accept — 未認証は 401", async () => {
    const req = new NextRequest("http://localhost/api/team/invite/accept", {
      method: "POST",
      body: JSON.stringify({ token: "tok" }),
    });
    const res = await acceptPost(req);
    expect(res.status).toBe(401);
  });

  it("GET /api/team/invite/verify — token なしは 400", async () => {
    const req = new NextRequest("http://localhost/api/team/invite/verify");
    const res = await verifyGet(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "token is required" });
  });
});
