import { test, expect } from '@playwright/test';

const RESPONSE_TIME_LIMIT = 10_000;

test.describe('Auth API Tests', () => {
    test('POST /auth/login — valid credentials returns 200 with token', async ({ request }) => {
        const start = Date.now();

        const response = await request.post('auth/login', {
            data: {
                username: process.env.ADMIN_USER || 'admin',
                password: process.env.ADMIN_PASS || 'password',
            },
        });

        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body).toHaveProperty('token');
        expect(typeof body.token).toBe('string');
        expect(body.token.length).toBeGreaterThan(0);

        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('POST /auth/login — invalid credentials returns error', async ({ request }) => {
        const start = Date.now();

        const response = await request.post('auth/login', {
            data: {
                username: 'invaliduser',
                password: 'invalidpass',
            },
        });

        // Platform returns 401 for invalid credentials
        expect([401, 403]).toContain(response.status());

        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('POST /auth/login — empty body returns error', async ({ request }) => {
        const start = Date.now();

        const response = await request.post('auth/login', {
            data: {},
        });

        // Empty credentials should not produce a valid token
        if (response.status() === 200) {
            const body = await response.json();
            expect(body.token).toBeUndefined();
        } else {
            expect(response.status()).toBeGreaterThanOrEqual(400);
        }

        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });
});
