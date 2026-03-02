import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/api/AuthHelper.js';
import { TestDataGenerator } from '../../src/utils/TestDataGenerator.js';

const RESPONSE_TIME_LIMIT = 10_000;

test.describe.serial('Room API Tests', () => {
    let token: string;
    let createdRoomId: number;
    let roomPayload: ReturnType<typeof TestDataGenerator.generateRoom>;

    test.beforeAll(async ({ request }) => {
        token = await AuthHelper.getAdminToken(request);
    });

    test.afterAll(async ({ request }) => {
        if (createdRoomId) {
            await request.delete(`room/${createdRoomId}`, {
                headers: AuthHelper.authCookie(token),
            }).catch(() => {});
        }
    });

    test('GET /room — 200, list of rooms returned', async ({ request }) => {
        const start = Date.now();
        const response = await request.get('room');

        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(Array.isArray(body.rooms)).toBeTruthy();
        if (body.rooms.length > 0) {
            expect(body.rooms[0]).toHaveProperty('roomid');
            expect(body.rooms[0]).toHaveProperty('roomName');
            expect(body.rooms[0]).toHaveProperty('type');
            expect(body.rooms[0]).toHaveProperty('roomPrice');
        }
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('POST /room with token — create room, verify fields', async ({ request }) => {
        roomPayload = TestDataGenerator.generateRoom();
        const start = Date.now();
        const response = await request.post('room', {
            headers: AuthHelper.authCookie(token),
            data: roomPayload,
        });

        expect(response.status()).toBe(200);

        // Find the room in the list
        const getRes = await request.get('room');
        const rooms = (await getRes.json()).rooms;
        const created = rooms.find((r: any) => r.roomName === roomPayload.roomName);
        expect(created).toBeDefined();
        expect(created.type).toBe(roomPayload.type);
        expect(created.accessible).toBe(roomPayload.accessible);
        expect(created.roomPrice).toBe(roomPayload.roomPrice);
        createdRoomId = created.roomid;
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('PUT /room/{id} with token — update room, verify changes', async ({ request }) => {
        const updated = {
            ...roomPayload,
            roomName: `Updated${createdRoomId}`,
            roomPrice: 250,
        };
        const start = Date.now();
        const response = await request.put(`room/${createdRoomId}`, {
            headers: AuthHelper.authCookie(token),
            data: updated,
        });

        expect(response.status()).toBe(200);

        // Verify via GET
        const getRes = await request.get('room');
        const rooms = (await getRes.json()).rooms;
        const found = rooms.find((r: any) => r.roomid === createdRoomId);
        expect(found).toBeDefined();
        expect(found.roomName).toBe(updated.roomName);
        expect(found.roomPrice).toBe(updated.roomPrice);
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('POST /room without token — 401/403', async ({ request }) => {
        const start = Date.now();
        const response = await request.post('room', {
            data: TestDataGenerator.generateRoom(),
        });

        expect([401, 403]).toContain(response.status());
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('PUT /room/{id} without token — 401/403', async ({ request }) => {
        const start = Date.now();
        const response = await request.put(`room/${createdRoomId}`, {
            data: TestDataGenerator.generateRoom(),
        });

        expect([401, 403]).toContain(response.status());
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('DELETE /room/{id} with token — room removed from list', async ({ request }) => {
        const start = Date.now();
        const response = await request.delete(`room/${createdRoomId}`, {
            headers: AuthHelper.authCookie(token),
        });

        expect(response.status()).toBe(200);

        const getRes = await request.get('room');
        const rooms = (await getRes.json()).rooms;
        const found = rooms.find((r: any) => r.roomid === createdRoomId);
        expect(found).toBeUndefined();
        createdRoomId = 0;
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('DELETE /room/{id} without token — 401/403', async ({ request }) => {
        const start = Date.now();
        const response = await request.delete('room/999');

        expect([401, 403]).toContain(response.status());
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });
});
