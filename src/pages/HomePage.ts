import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Page Object for the public-facing Home Page — room listing and contact form.
 */
export class HomePage extends BasePage {
    // Hero / page-level
    readonly welcomeBanner: Locator;
    readonly hotelDescription: Locator;
    readonly roomCards: Locator;
    readonly roomImages: Locator;

    // Book now links (per room card — navigates to /reservation/{id})
    readonly bookNowLink: Locator;

    // Contact form
    readonly contactNameInput: Locator;
    readonly contactEmailInput: Locator;
    readonly contactPhoneInput: Locator;
    readonly contactSubjectInput: Locator;
    readonly contactMessageInput: Locator;
    readonly contactSubmitBtn: Locator;
    readonly contactSuccessMsg: Locator;
    readonly contactErrorMsgs: Locator;

    constructor(page: Page) {
        super(page);

        // Hero
        this.welcomeBanner = page.locator('.hotel-description, .hero-content');
        this.hotelDescription = page.locator('.hotel-description p, .hero-content p');
        this.roomCards = page.locator('.hotel-room-info, .room-card');
        this.roomImages = page.locator('.hotel-room-info img, .room-card img');

        // Book now link on room cards
        this.bookNowLink = page.getByRole('link', { name: /book now/i }).first();

        // Contact form
        this.contactNameInput = page.locator('#name');
        this.contactEmailInput = page.locator('#email');
        this.contactPhoneInput = page.locator('#phone');
        this.contactSubjectInput = page.locator('#subject');
        this.contactMessageInput = page.locator('#description');
        this.contactSubmitBtn = page.getByRole('button', { name: /submit/i });
        this.contactSuccessMsg = page.locator('text=/Thanks for getting in touch/i');
        this.contactErrorMsgs = page.locator('.alert-danger, .alert.alert-danger');
    }

    async open() {
        await this.navigate('/');
        await this.welcomeBanner.waitFor({ state: 'visible', timeout: 30_000 });
    }

    async fillContactForm(data: {
        name: string;
        email: string;
        phone: string;
        subject: string;
        message: string;
    }) {
        await this.contactNameInput.fill(data.name);
        await this.contactEmailInput.fill(data.email);
        await this.contactPhoneInput.fill(data.phone);
        await this.contactSubjectInput.fill(data.subject);
        await this.contactMessageInput.fill(data.message);
    }

    async submitContact() {
        await this.contactSubmitBtn.click();
    }
}
