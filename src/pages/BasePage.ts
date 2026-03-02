import { Page, expect } from '@playwright/test';

/**
 * Base Page class with shared utilities for all Page Objects.
 */
export abstract class BasePage {
    public readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigate(path: string = '/') {
        await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    }

    async verifyUrl(partialUrl: string) {
        await expect(this.page).toHaveURL(new RegExp(partialUrl));
    }
}
