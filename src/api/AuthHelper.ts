import { APIRequestContext, expect } from '@playwright/test';

/**
 * Reusable authentication helper with token caching.
 * Retrieves and caches admin tokens for protected API operations.
 */
export class AuthHelper {
    private static token: string | null = null;

    /**
     * Get an admin token, returning cached value when available.
     * Token is sent as Cookie header: token=<value> per platform docs.
     */
    static async getAdminToken(request: APIRequestContext): Promise<string> {
        if (this.token) return this.token;

        const username = process.env.ADMIN_USER || 'admin';
        const password = process.env.ADMIN_PASS || 'password';

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const response = await request.post('auth/login', {
                    data: { username, password },
                    timeout: 30_000,
                });

                expect(response.status()).toBe(200);

                const body = await response.json();

                if (body.token) {
                    this.token = body.token;
                    return this.token as string;
                }

                // Fallback: check set-cookie header
                const cookies = response.headers()['set-cookie'];
                if (cookies) {
                    const match = cookies.match(/token=([^;]+)/);
                    if (match) {
                        this.token = match[1];
                        return this.token;
                    }
                }

                throw new Error('Token not found in response body or cookies');
            } catch (err: unknown) {
                lastError = err instanceof Error ? err : new Error(String(err));
                if (attempt < 3) {
                    await new Promise(r => setTimeout(r, 2_000 * attempt));
                }
            }
        }

        throw new Error(`Failed to get auth token after 3 attempts: ${lastError?.message}`);
    }

    /** Build the Cookie header object for authenticated requests. */
    static authCookie(token: string): Record<string, string> {
        return { Cookie: `token=${token}` };
    }

    /** Clear the cached token (useful between test suites). */
    static clearToken(): void {
        this.token = null;
    }
}
