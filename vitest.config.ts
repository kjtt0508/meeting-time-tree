import { defineConfig } from "vitest/config";

// 単体テストは実 Supabase / Lemon Squeezy に接続しない。
// route.ts がモジュール読み込み時に env を要求するため、ダミー値をここで注入する。
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://unit-test-dummy.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "dummy-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "dummy-service-role-key",
      LEMONSQUEEZY_API_KEY: "dummy-ls-api-key",
      LEMONSQUEEZY_STORE_ID: "12345",
      LEMONSQUEEZY_WEBHOOK_SECRET: "unit-test-webhook-secret",
      LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID: "1716502",
      LEMONSQUEEZY_TEAM_MONTHLY_VARIANT_ID: "1716458",
      LEMONSQUEEZY_ONE_TIME_VARIANT_ID: "1716493",
      NEXT_PUBLIC_APP_URL: "https://unit-test.example.com",
    },
  },
});
