import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/api/AuthHelper.js';
import { TestDataGenerator } from '../../src/utils/TestDataGenerator.js';

const RESPONSE_TIME_LIMIT = 10_000;

test.describe.serial('Message API Tests', () => {
    let token: string;
    let createdMessageId: number;
    let messagePayload: ReturnType<typeof TestDataGenerator.generateMessage>;

    test.beforeAll(async ({ request }) => {
        token = await AuthHelper.getAdminToken(request);
    });

    test('POST /message — guest can send a message', async ({ request }) => {
        messagePayload = TestDataGenerator.generateMessage();
        const start = Date.now();
        const response = await request.post('message', { data: messagePayload });

        expect(response.status()).toBe(200);

        // Find the message in the admin list
        const listRes = await request.get('message', {
            headers: AuthHelper.authCookie(token),
        });
        const messages = (await listRes.json()).messages;
        const created = messages.find((m: any) => m.subject === messagePayload.subject);
        expect(created).toBeDefined();
        createdMessageId = created.id;

        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('GET /message with token — 200, list returned', async ({ request }) => {
        const start = Date.now();
        const response = await request.get('message', {
            headers: AuthHelper.authCookie(token),
        });

        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(Array.isArray(body.messages)).toBeTruthy();
        expect(body.messages.length).toBeGreaterThan(0);
        expect(body.messages[0]).toHaveProperty('id');
        expect(body.messages[0]).toHaveProperty('name');
        expect(body.messages[0]).toHaveProperty('subject');
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('GET /message/{id} with token — 200, correct message data', async ({ request }) => {
        const start = Date.now();
        const response = await request.get(`message/${createdMessageId}`, {
            headers: AuthHelper.authCookie(token),
        });

        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body).toHaveProperty('messageid');
        expect(body).toHaveProperty('name');
        expect(body).toHaveProperty('email');
        expect(body).toHaveProperty('phone');
        expect(body).toHaveProperty('subject');
        expect(body).toHaveProperty('description');
        expect(body.name).toBe(messagePayload.name);
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('DELETE /message/{id} with token — message removed', async ({ request }) => {
        const response = await request.delete(`message/${createdMessageId}`, {
            headers: AuthHelper.authCookie(token),
        });

        expect(response.status()).toBe(200);

        // Verify it's gone — this GET may be slow due to platform behaviour
        const getRes = await request.get(`message/${createdMessageId}`, {
            headers: AuthHelper.authCookie(token),
        });
        expect([404, 500]).toContain(getRes.status());
    });

    test('GET /message without token — returns list summary', async ({ request }) => {
        const start = Date.now();
        const response = await request.get('message');

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('messages');
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('DELETE /message/{id} without token — 401/403', async ({ request }) => {
        // Create a temp message first
        const tempMsg = TestDataGenerator.generateMessage();
        await request.post('message', { data: tempMsg });
        const listRes = await request.get('message', {
            headers: AuthHelper.authCookie(token),
        });
        const messages = (await listRes.json()).messages;
        const temp = messages.find((m: any) => m.subject === tempMsg.subject);

        if (temp) {
            const start = Date.now();
            const response = await request.delete(`message/${temp.id}`);

            expect([401, 403]).toContain(response.status());

            // Cleanup
            await request.delete(`message/${temp.id}`, {
                headers: AuthHelper.authCookie(token),
            });
            expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
        }
    });
});
