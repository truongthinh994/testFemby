import {defineConfig} from '@playwright/test';
import {resolve} from 'node:path';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testDir: './tests/local-e2e',
  outputDir: './test-results-local/artifacts',
  reporter: [['list'], ['json', {outputFile: 'test-results-local/results.json'}]],
  use: {...base.use, baseURL: 'http://127.0.0.1:3200',
    ...(process.env.PLAYWRIGHT_BROWSER_CHANNEL ? {launchOptions: {channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL}} : {}),
  },
  webServer: {
    command: 'npm run local', url: 'http://127.0.0.1:3200/auth/login', reuseExistingServer: false, timeout: 120_000,
    env: {TOEIC_LOCAL_APP_PORT: '3200', TOEIC_LOCAL_API_PORT: '54331', TOEIC_LOCAL_DIST_DIR: '.next-local-e2e', TOEIC_LOCAL_DATA_DIR: resolve('work', 'local-e2e-' + Date.now())},
  },
});
