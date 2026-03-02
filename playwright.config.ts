import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    testDir: './tests',
    timeout: 90_000,
    expect: {
        timeout: 15_000,
    },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { open: 'never' }],
        ['list'],
    ],
    use: {
        baseURL: process.env.BASE_URL || 'https://automationintesting.online',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'off',
    },
    projects: [
        {
            name: 'API',
            testMatch: /.*\.api\.spec\.ts/,
            use: {
                baseURL: process.env.BASE_API_URL || 'https://automationintesting.online/api/',
                extraHTTPHeaders: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            },
        },
        {
            name: 'UI',
            testMatch: /.*\.ui\.spec\.ts/,
            dependencies: ['API'],
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 720 },
                actionTimeout: 15_000,
                navigationTimeout: 30_000,
            },
        },
    ],
    outputDir: 'test-results/',
});
