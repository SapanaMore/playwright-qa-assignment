import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Page Object for the Admin Login Page (/admin).
 */
export class AdminLoginPage extends BasePage {
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginBtn: Locator;
    readonly errorMessage: Locator;

    constructor(page: Page) {
        super(page);
        this.usernameInput = page.locator('#username');
        this.passwordInput = page.locator('#password');
        this.loginBtn = page.locator('#doLogin');
        this.errorMessage = page.locator('[data-testid="login-error"], .alert-danger');
    }

    async open() {
        await this.navigate('/admin');
        await this.usernameInput.waitFor({ state: 'visible', timeout: 30_000 });
    }

    async login(user: string, pass: string) {
        await this.usernameInput.fill(user);
        await this.passwordInput.fill(pass);
        await this.loginBtn.click();
    }

    /** Verify that the password field masks its input. */
    async getPasswordFieldType(): Promise<string | null> {
        return this.passwordInput.getAttribute('type');
    }
}
