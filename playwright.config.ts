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
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        "postgresql://our_space:our_space_test@127.0.0.1:5432/our_space_test?schema=public",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"], channel: "chrome" },
    },
  ],
});
