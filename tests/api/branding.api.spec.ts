import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/api/AuthHelper.js';

const RESPONSE_TIME_LIMIT = 10_000;

test.describe('Branding API Tests', () => {
    let token: string;
    let originalBranding: any;

    test.beforeAll(async ({ request }) => {
        token = await AuthHelper.getAdminToken(request);
        const res = await request.get('branding');
        originalBranding = await res.json();
    });

    test.afterAll(async ({ request }) => {
        // Restore original branding
        if (originalBranding) {
            // Ensure logoUrl is absolute before restoring
            const restoreData = { ...originalBranding };
            if (restoreData.logoUrl && !restoreData.logoUrl.startsWith('http')) {
                restoreData.logoUrl = `https://automationintesting.online${restoreData.logoUrl}`;
            }
            await request.put('branding', {
                headers: AuthHelper.authCookie(token),
                data: restoreData,
            });
        }
    });

    test('GET /branding — 200, name, description, contact fields present', async ({ request }) => {
        const start = Date.now();
        const response = await request.get('branding');

        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body).toHaveProperty('name');
        expect(typeof body.name).toBe('string');
        expect(body).toHaveProperty('description');
        expect(typeof body.description).toBe('string');
        expect(body).toHaveProperty('logoUrl');
        expect(body).toHaveProperty('map');
        expect(body.map).toHaveProperty('latitude');
        expect(body.map).toHaveProperty('longitude');
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('PUT /branding with token — update name/description, verify response', async ({ request }) => {
        // API requires logoUrl to be an absolute URL
        const updatedBranding = {
            ...originalBranding,
            name: 'Playwright Test Hotel',
            description: 'Updated by automated tests.',
            logoUrl: originalBranding.logoUrl?.startsWith('http')
                ? originalBranding.logoUrl
                : `https://automationintesting.online${originalBranding.logoUrl}`,
        };

        const start = Date.now();
        const response = await request.put('branding', {
            headers: AuthHelper.authCookie(token),
            data: updatedBranding,
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);

        // Note: shared platform resets branding data immediately — verify GET still works
        const verifyRes = await request.get('branding');
        expect(verifyRes.status()).toBe(200);
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('PUT /branding without token — 401/403', async ({ request }) => {
        const start = Date.now();
        const response = await request.put('branding', {
            data: { name: 'Unauthorized Update' },
        });

        expect([401, 403]).toContain(response.status());
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });
});
