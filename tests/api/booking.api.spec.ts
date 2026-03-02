import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/api/AuthHelper.js';
import { TestDataGenerator } from '../../src/utils/TestDataGenerator.js';

const RESPONSE_TIME_LIMIT = 10_000;

test.describe.serial('Booking API — Read', () => {
    let token: string;
    let roomId: number;
    let bookingId: number;

    test.beforeAll(async ({ request }) => {
        token = await AuthHelper.getAdminToken(request);

        // Create a dedicated room so tests are fully independent
        const room = TestDataGenerator.generateRoom();
        const res = await request.post('room', {
            headers: AuthHelper.authCookie(token),
            data: room,
        });
        expect(res.ok()).toBeTruthy();

        const rooms = await (await request.get('room')).json();
        const created = rooms.rooms.find((r: any) => r.roomName === room.roomName);
        expect(created).toBeDefined();
        roomId = created.roomid;

        // Create a booking inside that room
        const booking = TestDataGenerator.generateBooking(roomId);
        const bookRes = await request.post('booking', { data: booking });
        expect(bookRes.status()).toBe(201);
        const bookBody = await bookRes.json();
        bookingId = bookBody.bookingid;
    });

    test.afterAll(async ({ request }) => {
        if (bookingId) {
            await request.delete(`booking/${bookingId}`, {
                headers: AuthHelper.authCookie(token),
            });
        }
        if (roomId) {
            await request.delete(`room/${roomId}`, {
                headers: AuthHelper.authCookie(token),
            });
        }
    });

    test('GET /booking?roomid — 200, array with bookingid', async ({ request }) => {
        const response = await request.get(`booking?roomid=${roomId}`, {
            headers: AuthHelper.authCookie(token),
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body.bookings)).toBeTruthy();
        expect(body.bookings.length).toBeGreaterThan(0);
        expect(body.bookings[0]).toHaveProperty('bookingid');
    });

    test('GET /booking/{id} — 200, all fields present', async ({ request }) => {
        const start = Date.now();
        const response = await request.get(`booking/${bookingId}`, {
            headers: AuthHelper.authCookie(token),
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.bookingid).toBe(bookingId);
        expect(body).toHaveProperty('roomid');
        expect(body).toHaveProperty('firstname');
        expect(body).toHaveProperty('lastname');
        expect(body).toHaveProperty('depositpaid');
        expect(body).toHaveProperty('bookingdates');
        expect(body.bookingdates).toHaveProperty('checkin');
        expect(body.bookingdates).toHaveProperty('checkout');
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('GET /booking/{id} — invalid ID returns 404', async ({ request }) => {
        const start = Date.now();
        const response = await request.get('booking/999999999', {
            headers: AuthHelper.authCookie(token),
        });

        expect(response.status()).toBe(404);
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });
});

test.describe.serial('Booking API — CRUD', () => {
    let token: string;
    let roomId: number;
    let bookingId: number;
    let bookingPayload: ReturnType<typeof TestDataGenerator.generateBooking>;

    test.beforeAll(async ({ request }) => {
        token = await AuthHelper.getAdminToken(request);

        const room = TestDataGenerator.generateRoom();
        await request.post('room', {
            headers: AuthHelper.authCookie(token),
            data: room,
        });
        const rooms = await (await request.get('room')).json();
        const created = rooms.rooms.find((r: any) => r.roomName === room.roomName);
        roomId = created.roomid;
    });

    test.afterAll(async ({ request }) => {
        if (bookingId) {
            await request.delete(`booking/${bookingId}`, {
                headers: AuthHelper.authCookie(token),
            }).catch(() => {});
        }
        if (roomId) {
            await request.delete(`room/${roomId}`, {
                headers: AuthHelper.authCookie(token),
            });
        }
    });

    test('POST /booking — valid payload returns 201 with bookingid and matching fields', async ({ request }) => {
        bookingPayload = TestDataGenerator.generateBooking(roomId);
        const start = Date.now();
        const response = await request.post('booking', { data: bookingPayload });

        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body).toHaveProperty('bookingid');
        expect(body.roomid).toBe(roomId);
        expect(body.firstname).toBe(bookingPayload.firstname);
        expect(body.lastname).toBe(bookingPayload.lastname);
        expect(body.depositpaid).toBe(bookingPayload.depositpaid);
        bookingId = body.bookingid;

        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('POST /booking — missing firstname returns error', async ({ request }) => {
        const payload = TestDataGenerator.generateBooking(roomId);
        // Use different dates to avoid conflict with the booking above
        payload.bookingdates = {
            checkin: TestDataGenerator.futureDate(1100),
            checkout: TestDataGenerator.futureDate(1103),
        };
        const { firstname, ...incomplete } = payload;

        const start = Date.now();
        const response = await request.post('booking', { data: incomplete });

        expect(response.ok()).toBeFalsy();
        const body = await response.json();
        expect(body.errors || body.error).toBeDefined();
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('POST /booking — checkin after checkout returns error', async ({ request }) => {
        const payload = TestDataGenerator.generateBooking(roomId);
        payload.bookingdates = {
            checkin: TestDataGenerator.futureDate(1200),
            checkout: TestDataGenerator.futureDate(1195), // checkout BEFORE checkin
        };

        const start = Date.now();
        const response = await request.post('booking', { data: payload });

        const body = await response.json();
        expect(body.error || body.errors).toBeDefined();
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('PUT /booking/{id} with token — 200, fields updated', async ({ request }) => {
        const updated = TestDataGenerator.generateBooking(roomId);
        // Keep dates the same as the original to avoid conflicts
        updated.bookingdates = bookingPayload.bookingdates;

        const start = Date.now();
        const response = await request.put(`booking/${bookingId}`, {
            headers: AuthHelper.authCookie(token),
            data: { ...updated, bookingid: bookingId },
        });

        expect(response.status()).toBe(200);

        // Verify update persisted
        const getRes = await request.get(`booking/${bookingId}`, {
            headers: AuthHelper.authCookie(token),
        });
        const getBody = await getRes.json();
        expect(getBody.firstname).toBe(updated.firstname);
        expect(getBody.lastname).toBe(updated.lastname);
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('PUT /booking/{id} without token — 401/403', async ({ request }) => {
        const start = Date.now();
        const response = await request.put(`booking/${bookingId}`, {
            data: TestDataGenerator.generateBooking(roomId),
        });

        expect([401, 403]).toContain(response.status());
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('DELETE /booking/{id} with token — booking removed', async ({ request }) => {
        const start = Date.now();
        const response = await request.delete(`booking/${bookingId}`, {
            headers: AuthHelper.authCookie(token),
        });

        expect([200, 201]).toContain(response.status());

        // Subsequent GET returns 404
        const getRes = await request.get(`booking/${bookingId}`, {
            headers: AuthHelper.authCookie(token),
        });
        expect(getRes.status()).toBe(404);
        bookingId = 0; // prevent afterAll double-delete
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });

    test('DELETE /booking/{id} without token — 401/403', async ({ request }) => {
        // Create a temp booking to delete
        const payload = TestDataGenerator.generateBooking(roomId);
        payload.bookingdates = {
            checkin: TestDataGenerator.futureDate(1300),
            checkout: TestDataGenerator.futureDate(1303),
        };
        const createRes = await request.post('booking', { data: payload });
        const tempId = (await createRes.json()).bookingid;

        const start = Date.now();
        const response = await request.delete(`booking/${tempId}`);

        expect([401, 403]).toContain(response.status());

        // Cleanup
        await request.delete(`booking/${tempId}`, {
            headers: AuthHelper.authCookie(token),
        });
        expect.soft(Date.now() - start).toBeLessThan(RESPONSE_TIME_LIMIT);
    });
});
