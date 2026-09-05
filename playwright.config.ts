import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      APP_URL: "http://127.0.0.1:3000",
      NEXTAUTH_URL: "http://127.0.0.1:3000",
      AUTH_SECRET: "playwright-only-fake-auth-secret-32-characters",
      TRUST_PROXY: "true",
      AVATAR_E2E_FIXTURE: "true",
      AVATAR_STORAGE_DIR:
        process.env.AVATAR_TEST_STORAGE_DIR ??
        "/tmp/our-space-avatar-e2e-storage",
      TEST_DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        "postgresql://our_space:our_space_test@127.0.0.1:5432/our_space_test?schema=public",
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        "postgresql://our_space:our_space_test@127.0.0.1:5432/our_space_test?schema=public",
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        extraHTTPHeaders: { "x-forwarded-for": "198.51.100.100" },
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"],
        channel: "chrome",
        extraHTTPHeaders: { "x-forwarded-for": "198.51.100.200" },
      },
    },
  ],
});
