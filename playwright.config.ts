import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', {outputFile: 'test-results/results.json'}]],
  timeout: 90_000,
  expect: {timeout: 15_000},
  use: {baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {},
  },
  webServer: [
    {command: 'npx tsx tests/fixtures/supabase-server.ts', url: 'http://127.0.0.1:54329/health', reuseExistingServer: false, timeout: 60_000, env: {TOEIC_LOCAL_DEMO: '0', NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3100'}},
    {command: 'npm run dev -- --hostname 127.0.0.1 --port 3100', url: 'http://127.0.0.1:3100/auth/login', reuseExistingServer: false, timeout: 120_000,
      env: {TOEIC_LOCAL_DEMO: '0', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54329', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'local-test-key', NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3100'},
    },
  ],
});
