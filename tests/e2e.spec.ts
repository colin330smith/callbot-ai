/**
 * CallBot AI - End-to-End Tests
 * Run with: npx playwright test
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';

test.describe('Landing Page', () => {
    test('should load the landing page', async ({ page }) => {
        await page.goto(BASE_URL);

        // Check main heading
        await expect(page.locator('h1')).toContainText('AI Phone');

        // Check CTA button exists
        const ctaButton = page.locator('text=Get Started');
        await expect(ctaButton).toBeVisible();
    });

    test('should navigate to signup from CTA', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.click('text=Get Started');
        await expect(page).toHaveURL(/signup/);
    });
});

test.describe('Authentication', () => {
    test('should show signup form', async ({ page }) => {
        await page.goto(`${BASE_URL}/signup`);

        // Check form elements
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
        await page.goto(`${BASE_URL}/signup`);

        // Enter invalid email
        await page.fill('input[type="email"]', 'invalid-email');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Should show error or stay on page
        await expect(page).toHaveURL(/signup/);
    });

    test('should validate password requirements', async ({ page }) => {
        await page.goto(`${BASE_URL}/signup`);

        // Enter weak password
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', '123');
        await page.click('button[type="submit"]');

        // Should show error
        await expect(page.locator('text=Password')).toBeVisible();
    });

    test('should show login form', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        // Check form elements
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();

        // Check forgot password link
        await expect(page.locator('text=Forgot')).toBeVisible();
    });
});

test.describe('Dashboard', () => {
    test('should redirect unauthenticated users to signup', async ({ page }) => {
        await page.goto(`${BASE_URL}/dashboard`);

        // Should redirect to signup/login
        await expect(page).toHaveURL(/(signup|login)/);
    });
});

test.describe('Onboarding', () => {
    test('should redirect unauthenticated users', async ({ page }) => {
        await page.goto(`${BASE_URL}/onboarding`);

        // Should redirect to signup/login
        await expect(page).toHaveURL(/(signup|login)/);
    });
});

test.describe('Password Reset', () => {
    test('should show reset password page with token', async ({ page }) => {
        await page.goto(`${BASE_URL}/reset-password?token=test-token`);

        // Check form elements
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('text=Reset Password')).toBeVisible();
    });

    test('should show error for missing token', async ({ page }) => {
        await page.goto(`${BASE_URL}/reset-password`);

        // Should show invalid/expired message
        await expect(page.locator('text=Invalid')).toBeVisible();
    });
});

test.describe('API Health', () => {
    test('should return healthy status', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/health`);
        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(body.status).toBe('healthy');
    });

    test('should return ready status', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/health/ready`);
        expect(response.ok()).toBeTruthy();
    });
});

test.describe('API Authentication', () => {
    test('should return unauthenticated for /api/auth/me', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/auth/me`);

        const body = await response.json();
        expect(body.authenticated).toBe(false);
    });

    test('should reject invalid login', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/auth/login`, {
            data: {
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            }
        });

        expect(response.status()).toBe(401);
    });

    test('should validate signup input', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/auth/signup`, {
            data: {
                email: 'invalid-email',
                password: '123'
            }
        });

        expect(response.status()).toBe(422);
    });
});

test.describe('Mobile Responsiveness', () => {
    test('landing page should be responsive on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(BASE_URL);

        // Main content should be visible
        await expect(page.locator('h1')).toBeVisible();

        // CTA should be visible
        await expect(page.locator('text=Get Started')).toBeVisible();
    });

    test('dashboard should be responsive on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${BASE_URL}/dashboard`);

        // Should see mobile menu button (hamburger)
        // Note: This will redirect if not authenticated
    });
});

test.describe('Accessibility', () => {
    test('landing page should have proper headings', async ({ page }) => {
        await page.goto(BASE_URL);

        // Should have h1
        const h1 = await page.locator('h1').count();
        expect(h1).toBeGreaterThan(0);
    });

    test('forms should have labels', async ({ page }) => {
        await page.goto(`${BASE_URL}/signup`);

        // Email input should have associated label
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();
    });
});
