import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Page Object for the Reservation page (/reservation/{roomId}).
 * Contains the booking form with guest details and calendar.
 */
export class ReservationPage extends BasePage {
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly emailInput: Locator;
    readonly phoneInput: Locator;
    readonly reserveBtn: Locator;
    readonly bookingErrors: Locator;
    readonly bookingConfirmed: Locator;
    readonly returnHomeBtn: Locator;

    constructor(page: Page) {
        super(page);
        this.firstNameInput = page.locator('.room-firstname');
        this.lastNameInput = page.locator('.room-lastname');
        this.emailInput = page.locator('.room-email');
        this.phoneInput = page.locator('.room-phone');
        this.reserveBtn = page.getByRole('button', { name: /reserve now/i });
        this.bookingErrors = page.locator('.alert-danger');
        this.bookingConfirmed = page.getByText('Booking Confirmed');
        this.returnHomeBtn = page.getByRole('link', { name: /return home/i });
    }

    async open(roomId: number, checkin: string, checkout: string) {
        await this.navigate(`/reservation/${roomId}?checkin=${checkin}&checkout=${checkout}`);
        await this.reserveBtn.waitFor({ state: 'visible', timeout: 15_000 });
    }

    /** Click "Reserve Now" on the calendar view to confirm dates and reveal the booking form. */
    async confirmDates() {
        await this.reserveBtn.click();
        await this.firstNameInput.waitFor({ state: 'visible', timeout: 15_000 });
    }

    async fillBookingForm(data: {
        first: string;
        last: string;
        email: string;
        phone: string;
    }) {
        await this.firstNameInput.fill(data.first);
        await this.lastNameInput.fill(data.last);
        await this.emailInput.fill(data.email);
        await this.phoneInput.fill(data.phone);
    }

    async submitReservation() {
        await this.reserveBtn.click();
    }
}
