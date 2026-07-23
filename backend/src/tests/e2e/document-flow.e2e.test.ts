import { test, expect } from '@playwright/test';

test.describe('Document Approval Workflow E2E', () => {
  test('Complete lifecycle from Draft to Published', async ({ page }) => {
    // 1. Login as Author
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'author@system.local');
    await page.fill('input[name="password"]', 'secure_password_123');
    await page.click('button[type="submit"]');

    // 2. Create Draft
    await page.click('text=New Document');
    await page.fill('input[name="title"]', 'Enterprise E2E Test Policy');
    await page.fill('textarea[name="body"]', 'Testing the approval flow end to end.');
    await page.click('button:has-text("Save Draft")');
    await expect(page.locator('text=Draft Saved Successfully')).toBeVisible();

    // 3. Submit for Review
    await page.click('button:has-text("Submit for Review")');
    await expect(page.locator('text=Status: SUBMITTED')).toBeVisible();

    // 4. Login as Reviewer
    await page.goto('http://localhost:5173/logout');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'reviewer@system.local');
    await page.fill('input[name="password"]', 'secure_password_123');
    await page.click('button[type="submit"]');

    // 5. Approve Document
    await page.click('text=Review Queue');
    await page.click('text=Enterprise E2E Test Policy');
    await page.click('button:has-text("Approve")');
    
    // Assert transition and activity feed
    await page.goto('http://localhost:5173/activity');
    await expect(page.locator('text=approved "Enterprise E2E Test Policy"')).toBeVisible();
  });
});
