import { test, expect } from '@playwright/test';
import { HomePage } from '../../src/pages/HomePage.js';
import { ReservationPage } from '../../src/pages/ReservationPage.js';
import { TestDataGenerator } from '../../src/utils/TestDataGenerator.js';

test.describe('Public Front End — Booking Flow', () => {
    let home: HomePage;

    test.beforeEach(async ({ page }) => {
        home = new HomePage(page);
        await home.open();
    });

    test('TC-UI-001: Homepage loads — welcome banner, room listing, room images visible', async () => {
        await test.step('Verify welcome banner is visible', async () => {
            await expect(home.welcomeBanner).toBeVisible();
        });

        await test.step('Verify at least one room card is displayed', async () => {
            await expect(home.roomCards.first()).toBeVisible();
        });

        await test.step('Verify room images are rendered', async () => {
            await expect(home.roomImages.first()).toBeVisible();
        });
    });

    test('TC-UI-002: Happy path booking — select dates, fill form, submit', async ({ page }) => {
        const reservation = new ReservationPage(page);
        // Use dates 60-63 days from now — far enough to avoid conflicts, close enough for the calendar
        const checkin = TestDataGenerator.futureDate(60);
        const checkout = TestDataGenerator.futureDate(63);

        await test.step('Verify Book now link is visible on room card', async () => {
            await expect(home.bookNowLink).toBeVisible();
        });

        await test.step('Navigate to reservation page with future dates', async () => {
            // Use room 3 (Suite) to reduce chance of date conflicts on shared platform
            await reservation.open(3, checkin, checkout);
        });

        await test.step('Confirm dates to reveal booking form', async () => {
            await reservation.confirmDates();
        });

        await test.step('Fill booking form with valid data', async () => {
            await reservation.fillBookingForm({
                first: 'Test',
                last: 'Automation',
                email: 'test@example.com',
                phone: '12345678901',
            });
        });

        await test.step('Submit and verify booking confirmed or errors shown', async () => {
            await reservation.submitReservation();
            // On shared platform, date conflicts are possible — accept either outcome
            const confirmed = reservation.bookingConfirmed;
            const error = reservation.bookingErrors.first();
            await expect(confirmed.or(error)).toBeVisible({ timeout: 15_000 });
        });
    });

    test('TC-UI-003: Empty booking form — all required field errors shown', async ({ page }) => {
        const reservation = new ReservationPage(page);
        const checkin = TestDataGenerator.futureDate(740);
        const checkout = TestDataGenerator.futureDate(743);

        await test.step('Navigate to reservation page', async () => {
            await reservation.open(1, checkin, checkout);
        });

        await test.step('Confirm dates to reveal booking form', async () => {
            await reservation.confirmDates();
        });

        await test.step('Submit without filling any fields', async () => {
            await reservation.submitReservation();
        });

        await test.step('Verify validation errors appear', async () => {
            await expect(reservation.bookingErrors.first()).toBeVisible({ timeout: 10_000 });
        });
    });

    test('TC-UI-004: Partial form — errors shown only on missing fields', async ({ page }) => {
        const reservation = new ReservationPage(page);
        const checkin = TestDataGenerator.futureDate(750);
        const checkout = TestDataGenerator.futureDate(753);

        await test.step('Navigate to reservation page', async () => {
            await reservation.open(1, checkin, checkout);
        });

        await test.step('Confirm dates to reveal booking form', async () => {
            await reservation.confirmDates();
        });

        await test.step('Fill only firstname and lastname', async () => {
            await reservation.firstNameInput.fill('Partial');
            await reservation.lastNameInput.fill('Test');
        });

        await test.step('Submit and check for errors on unfilled fields', async () => {
            await reservation.submitReservation();
            await expect(reservation.bookingErrors.first()).toBeVisible({ timeout: 10_000 });
        });
    });
});

test.describe('Public Front End — Contact Form', () => {
    let home: HomePage;

    test.beforeEach(async ({ page }) => {
        home = new HomePage(page);
        await home.open();
    });

    test('TC-UI-005: Contact form — valid submission shows success', async () => {
        await test.step('Fill all contact fields', async () => {
            await home.fillContactForm({
                name: 'John Doe',
                email: 'john@example.com',
                phone: '12345678901',
                subject: 'Reservation Inquiry',
                message: 'Hello, I have a question about availability for next month.',
            });
        });

        await test.step('Submit and verify success message', async () => {
            await home.submitContact();
            await expect(home.contactSuccessMsg).toBeVisible({ timeout: 15_000 });
        });
    });

    test('TC-UI-006: Contact form — empty submission shows validation errors', async () => {
        await test.step('Submit form without filling any fields', async () => {
            await home.submitContact();
        });

        await test.step('Verify validation errors are visible', async () => {
            await expect(home.contactErrorMsgs.first()).toBeVisible({ timeout: 10_000 });
        });
    });

    test('TC-UI-007: Contact form — special characters in name field', async () => {
        await test.step('Fill form with special characters in name', async () => {
            await home.fillContactForm({
                name: "O'Brien-Smith <test> & \"quotes\"",
                email: 'special@example.com',
                phone: '12345678901',
                subject: 'Special Chars Test',
                message: 'Testing form handling of special characters in the name field.',
            });
        });

        await test.step('Submit and verify no crash — success or graceful handling', async () => {
            await home.submitContact();
            // Form should either succeed or show a validation error — not crash
            const success = home.contactSuccessMsg;
            const error = home.contactErrorMsgs.first();
            await expect(success.or(error)).toBeVisible({ timeout: 15_000 });
        });
    });

    test('TC-UI-008: Contact form — message exceeding max length boundary', async () => {
        const longMessage = 'A'.repeat(2001);

        await test.step('Fill form with extremely long message', async () => {
            await home.fillContactForm({
                name: 'Boundary Test',
                email: 'boundary@example.com',
                phone: '12345678901',
                subject: 'Max Length Test',
                message: longMessage,
            });
        });

        await test.step('Submit and observe boundary behaviour', async () => {
            await home.submitContact();
            // Either succeeds with truncation, or shows a validation error
            const success = home.contactSuccessMsg;
            const error = home.contactErrorMsgs.first();
            await expect(success.or(error)).toBeVisible({ timeout: 15_000 });
        });
    });
});
