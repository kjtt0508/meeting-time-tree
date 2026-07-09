// Lemon Squeezy チェックアウト作成 API の単体テスト
// LS API への fetch はスタブし、リクエスト整形とバリデーションを検証する

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../../src/app/api/ls/checkout/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/ls/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/ls/checkout — バリデーション", () => {
  it("userId なしは 400（LS API を呼ばない）", async () => {
    const res = await POST(makeRequest({ email: "a@example.com" }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("email なしは 400", async () => {
    const res = await POST(makeRequest({ userId: "u-1" }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("未知のプランは 400", async () => {
    const res = await POST(
      makeRequest({ userId: "u-1", email: "a@example.com", plan: "gold" })
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid plan" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/ls/checkout — LS API リクエスト整形", () => {
  function stubCheckoutSuccess(url = "https://checkout.lemonsqueezy.test/xyz") {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { attributes: { url } } }),
    });
  }

  interface CheckoutRequestBody {
    data: {
      attributes: {
        checkout_data: { email: string; custom: { user_id: string } };
      };
      relationships: {
        store: { data: { id: string } };
        variant: { data: { id: string } };
      };
    };
  }

  function sentBody(): CheckoutRequestBody {
    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    return JSON.parse(init.body);
  }

  it.each([
    ["pro", "1716502"],
    ["team", "1716458"],
    ["one_time", "1716493"],
  ])("plan=%s は variant %s でチェックアウトを作る", async (plan, variantId) => {
    stubCheckoutSuccess();
    const res = await POST(
      makeRequest({ userId: "u-1", email: "a@example.com", plan })
    );
    expect(res.status).toBe(200);
    const body = sentBody();
    expect(body.data.relationships.variant.data.id).toBe(variantId);
    expect(body.data.relationships.store.data.id).toBe("12345");
  });

  it("plan 省略時は pro になる", async () => {
    stubCheckoutSuccess();
    await POST(makeRequest({ userId: "u-1", email: "a@example.com" }));
    expect(sentBody().data.relationships.variant.data.id).toBe("1716502");
  });

  it("custom_data に user_id を埋め、レスポンスにチェックアウト URL を返す", async () => {
    stubCheckoutSuccess("https://checkout.lemonsqueezy.test/abc");
    const res = await POST(
      makeRequest({ userId: "user-uuid-1", email: "a@example.com", plan: "team" })
    );
    const body = sentBody();
    expect(body.data.attributes.checkout_data.custom.user_id).toBe("user-uuid-1");
    expect(body.data.attributes.checkout_data.email).toBe("a@example.com");
    expect(await res.json()).toEqual({
      url: "https://checkout.lemonsqueezy.test/abc",
    });
  });

  it("LS API がエラーを返したら 500", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ errors: [{ detail: "Unauthorized" }] }),
    });
    const res = await POST(
      makeRequest({ userId: "u-1", email: "a@example.com", plan: "pro" })
    );
    expect(res.status).toBe(500);
  });
});
