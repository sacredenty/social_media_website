const { test, expect } = require('@playwright/test');

// Comment functionality test
test.describe('Comment System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:8000/index.html');
    
    // Wait for page to load
    await page.waitForSelector('.post');
  });

  test('should open comment modal when clicking comment button', async ({ page }) => {
    // Click on the first comment button
    await page.click('.action-btn:has-text("Comment")');
    
    // Check if modal appears
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Check if modal has correct title
    await expect(page.locator('.modal-content h2')).toContainText('Write a Comment');
    
    // Check if textarea exists
    await expect(page.locator('#commentContent')).toBeVisible();
  });

  test('should allow typing in comment textarea', async ({ page }) => {
    // Open comment modal
    await page.click('.action-btn:has-text("Comment")');
    
    // Wait for modal to appear
    await page.waitForSelector('.modal-overlay');
    
    // Focus on textarea
    await page.focus('#commentContent');
    
    // Type a test comment
    const testComment = 'This is a test comment from Playwright';
    await page.fill('#commentContent', testComment);
    
    // Verify the text was entered
    const textareaValue = await page.inputValue('#commentContent');
    expect(textareaValue).toBe(testComment);
  });

  test('should submit comment successfully', async ({ page }) => {
    // Open comment modal
    await page.click('.action-btn:has-text("Comment")');
    
    // Wait for modal
    await page.waitForSelector('.modal-overlay');
    
    // Type a comment
    await page.fill('#commentContent', 'Test comment submission');
    
    // Click submit button
    await page.click('.modal-confirm:has-text("Post Comment")');
    
    // Wait for modal to close
    await page.waitForSelector('.modal-overlay', { state: 'hidden' });
    
    // Check for success notification
    await expect(page.locator('.success-notification')).toBeVisible();
    
    // Verify comment appears in comments section
    await page.click('.action-btn:has-text("Comment")'); // Reopen comments
    await expect(page.locator('.comments-list')).toContainText('Test comment submission');
  });

  test('should handle reply functionality', async ({ page }) => {
    // First, create a comment to reply to
    await page.click('.action-btn:has-text("Comment")');
    await page.waitForSelector('.modal-overlay');
    await page.fill('#commentContent', 'Original comment');
    await page.click('.modal-confirm:has-text("Post Comment")');
    await page.waitForSelector('.modal-overlay', { state: 'hidden' });
    
    // Reopen comments
    await page.click('.action-btn:has-text("Comment")');
    await page.waitForSelector('.comments-list');
    
    // Click reply button
    await page.click('.comment-reply-btn');
    
    // Check reply modal appears
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-content h2')).toContainText('Reply to Comment');
    
    // Type reply
    await page.fill('#replyContent', 'This is a reply');
    
    // Submit reply
    await page.click('.modal-confirm:has-text("Reply")');
    
    // Check for success
    await expect(page.locator('.success-notification')).toBeVisible();
  });

  test('should handle comment likes', async ({ page }) => {
    // Create a comment first
    await page.click('.action-btn:has-text("Comment")');
    await page.waitForSelector('.modal-overlay');
    await page.fill('#commentContent', 'Comment to like');
    await page.click('.modal-confirm:has-text("Post Comment")');
    await page.waitForSelector('.modal-overlay', { state: 'hidden' });
    
    // Reopen comments
    await page.click('.action-btn:has-text("Comment")');
    await page.waitForSelector('.comments-list');
    
    // Like the comment
    await page.click('.comment-like-btn');
    
    // Check if like button is activated
    await expect(page.locator('.comment-like-btn i')).toHaveClass(/fas/);
  });

  test('should toggle comments section visibility', async ({ page }) => {
    // Initially comments should be hidden
    await expect(page.locator('.comments-section')).toBeHidden();
    
    // Click comment button to show
    await page.click('.action-btn:has-text("Comment")');
    
    // Comments section should be visible
    await expect(page.locator('.comments-section')).toBeVisible();
    
    // Click comment button again to hide
    await page.click('.action-btn:has-text("Comment")');
    
    // Comments section should be hidden again
    await expect(page.locator('.comments-section')).toBeHidden();
  });
});
