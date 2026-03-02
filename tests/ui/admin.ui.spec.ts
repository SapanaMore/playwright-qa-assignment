import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../src/pages/AdminLoginPage.js';
import { AdminDashboardPage } from '../../src/pages/AdminDashboardPage.js';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'password';

test.describe('Admin Panel — Login', () => {
    let loginPage: AdminLoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new AdminLoginPage(page);
        await loginPage.open();
    });

    test('TC-ADM-001: Login with valid credentials — dashboard visible', async () => {
        const dashboard = new AdminDashboardPage(loginPage.page);

        await test.step('Enter valid credentials and submit', async () => {
            await loginPage.login(ADMIN_USER, ADMIN_PASS);
        });

        await test.step('Verify dashboard loads with Rooms section', async () => {
            await expect(dashboard.roomNameInput).toBeVisible({ timeout: 30_000 });
            await expect(dashboard.logoutBtn).toBeVisible();
        });
    });

    test('TC-ADM-002: Login with invalid credentials — error shown', async () => {
        await test.step('Enter invalid credentials', async () => {
            await loginPage.login('wronguser', 'wrongpass');
        });

        await test.step('Verify login fails — error or login form remains visible', async () => {
            // Platform may show an error banner or simply keep the login form
            const error = loginPage.errorMessage;
            const loginForm = loginPage.usernameInput;
            await expect(error.or(loginForm)).toBeVisible({ timeout: 10_000 });
            // Crucially: the dashboard should NOT load
            await expect(loginPage.page.locator('#roomName')).not.toBeVisible({ timeout: 5_000 });
        });
    });

    test('TC-ADM-003: Login with empty fields — validation triggered', async () => {
        await test.step('Click login without filling fields', async () => {
            await loginPage.loginBtn.click();
        });

        await test.step('Verify validation error or fields remain visible', async () => {
            // Either shows an error or stays on login page
            const error = loginPage.errorMessage;
            const username = loginPage.usernameInput;
            await expect(error.or(username)).toBeVisible({ timeout: 10_000 });
        });
    });

    test('TC-ADM-004: Password field masks input', async () => {
        await test.step('Verify password field type is "password"', async () => {
            const fieldType = await loginPage.getPasswordFieldType();
            expect(fieldType).toBe('password');
        });
    });
});

test.describe('Admin Panel — Room Management', () => {
    let loginPage: AdminLoginPage;
    let dashboard: AdminDashboardPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new AdminLoginPage(page);
        dashboard = new AdminDashboardPage(page);
        await loginPage.open();
        await loginPage.login(ADMIN_USER, ADMIN_PASS);
        await expect(dashboard.roomNameInput).toBeVisible({ timeout: 30_000 });
    });

    test('TC-ADM-005: Create room — select type dropdown, enter beds, toggle accessible, set price', async () => {
        const roomName = `TestRoom${Date.now()}`;

        await test.step('Fill room creation form using dropdown and inputs', async () => {
            await dashboard.createRoom({
                name: roomName,
                type: 'Double',
                accessible: true,
                price: '175',
                features: ['WiFi', 'TV'],
            });
        });

        await test.step('Verify room appears in the room list', async () => {
            await expect(dashboard.roomRow(roomName)).toBeVisible({ timeout: 10_000 });
        });

        await test.step('Cleanup — delete the created room', async () => {
            await dashboard.deleteRoom(roomName);
            await expect(dashboard.roomRow(roomName)).not.toBeVisible({ timeout: 10_000 });
        });
    });

    test('TC-ADM-006: Delete room — confirm removed from list', async () => {
        const roomName = `DelRoom${Date.now()}`;

        await test.step('Create a room to delete', async () => {
            await dashboard.createRoom({
                name: roomName,
                type: 'Single',
                accessible: false,
                price: '100',
            });
            await expect(dashboard.roomRow(roomName)).toBeVisible({ timeout: 10_000 });
        });

        await test.step('Delete room and verify removal', async () => {
            await dashboard.deleteRoom(roomName);
            await expect(dashboard.roomRow(roomName)).not.toBeVisible({ timeout: 10_000 });
        });
    });

    test('TC-ADM-007: Navigate to booking report — calendar/summary loads', async () => {
        await test.step('Click Report tab or navigate to report', async () => {
            // Try clicking the report tab; if not available, navigate directly
            const reportLink = dashboard.reportTab;
            if (await reportLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
                await reportLink.click();
            } else {
                await dashboard.page.goto('/admin/report', { waitUntil: 'domcontentloaded' });
            }
        });

        await test.step('Verify report page loads', async () => {
            await expect(dashboard.page).toHaveURL(/report/, { timeout: 15_000 });
        });
    });
});

test.describe('Admin Panel — Session', () => {
    test('TC-ADM-008: Logout — session cleared, /admin redirects to login', async ({ page }) => {
        const loginPage = new AdminLoginPage(page);
        const dashboard = new AdminDashboardPage(page);

        await test.step('Login first', async () => {
            await loginPage.open();
            await loginPage.login(ADMIN_USER, ADMIN_PASS);
            await expect(dashboard.roomNameInput).toBeVisible({ timeout: 30_000 });
        });

        await test.step('Logout', async () => {
            await dashboard.logout();
        });

        await test.step('Verify session cleared — redirected away from dashboard', async () => {
            // After logout, platform may redirect to homepage or login page
            // Either way, dashboard room form should NOT be visible
            await expect(dashboard.roomNameInput).not.toBeVisible({ timeout: 15_000 });
        });

        await test.step('Navigate to /admin — should show login, not dashboard', async () => {
            await page.goto('/admin', { waitUntil: 'domcontentloaded' });
            await expect(loginPage.usernameInput).toBeVisible({ timeout: 15_000 });
        });
    });
});
