import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Page Object for the Admin Dashboard (rooms, reports, messages, branding).
 */
export class AdminDashboardPage extends BasePage {
    // Navigation
    readonly logoutBtn: Locator;
    readonly roomsTab: Locator;
    readonly reportTab: Locator;
    readonly brandingTab: Locator;
    readonly messagesTab: Locator;

    // Room creation form
    readonly roomNameInput: Locator;
    readonly typeSelect: Locator;
    readonly accessibleSelect: Locator;
    readonly roomPriceInput: Locator;
    readonly wifiCheckbox: Locator;
    readonly tvCheckbox: Locator;
    readonly safeCheckbox: Locator;
    readonly createRoomBtn: Locator;

    // Room list
    readonly roomRows: Locator;

    constructor(page: Page) {
        super(page);

        this.logoutBtn = page.getByRole('button', { name: 'Logout' });
        this.roomsTab = page.locator('.nav-link[href*="room"]');
        this.reportTab = page.locator('.nav-link[href*="report"]');
        this.brandingTab = page.locator('.nav-link[href*="branding"]');
        this.messagesTab = page.locator('.nav-link[href*="message"]');

        this.roomNameInput = page.locator('#roomName');
        this.typeSelect = page.locator('#type');
        this.accessibleSelect = page.locator('#accessible');
        this.roomPriceInput = page.locator('#roomPrice');
        this.wifiCheckbox = page.locator('#wifiCheckbox');
        this.tvCheckbox = page.locator('#tvCheckbox');
        this.safeCheckbox = page.locator('#safeCheckbox');
        this.createRoomBtn = page.locator('#createRoom');

        this.roomRows = page.locator('[data-testid="roomlisting"]');
    }

    async createRoom(data: {
        name: string;
        type: string;
        accessible: boolean;
        price: string;
        features?: string[];
    }) {
        await this.roomNameInput.fill(data.name);
        await this.typeSelect.selectOption(data.type);
        await this.accessibleSelect.selectOption(data.accessible ? 'true' : 'false');
        await this.roomPriceInput.fill(data.price);

        if (data.features?.includes('WiFi')) await this.wifiCheckbox.check();
        if (data.features?.includes('TV')) await this.tvCheckbox.check();
        if (data.features?.includes('Safe')) await this.safeCheckbox.check();

        await this.createRoomBtn.click();
    }

    /** Get the room row locator that contains the given text. */
    roomRow(roomName: string): Locator {
        return this.roomRows.filter({ hasText: roomName });
    }

    async deleteRoom(roomName: string) {
        const row = this.roomRow(roomName);
        await row.locator('.roomDelete, [data-testid="roomDelete"]').click();
    }

    async editRoom(roomName: string) {
        const row = this.roomRow(roomName);
        await row.locator('.roomEdit, [data-testid="roomEdit"]').click();
    }

    async logout() {
        await this.logoutBtn.click();
    }

    async navigateToReport() {
        await this.reportTab.click();
    }

    async navigateToMessages() {
        await this.messagesTab.click();
    }

    async navigateToBranding() {
        await this.brandingTab.click();
    }
}
