// netzero/tests/garden-plan.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Garden Plan Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/garden-plan');
  });

  test('should load garden plan page with monthly recommendations', async ({ page }) => {
    // wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // check the page title
    await expect(page.locator('h2')).toContainText("Victoria's Gardening Guide");
    
    // check the monthly recommendations section
    await expect(page.locator('.monthly-tips-container')).toBeVisible();
    
    // check the search function
    await expect(page.locator('.plant-name-search-container')).toBeVisible();
    await expect(page.locator('.filter-dropdown-container')).toBeVisible();
  });

  test('should display monthly plant recommendations', async ({ page }) => {
    // wait for the API data to load
    await page.waitForSelector('.monthly-tips-plantcards', { timeout: 10000 });
    
    // check if there are plant cards displayed
    const plantCards = page.locator('.monthly-tips-plantcards > div');
    await expect(plantCards).toHaveCount(3);
    
    // check the loading status
    const loadingMessage = page.locator('.loading-message');
    if (await loadingMessage.isVisible()) {
      await expect(loadingMessage).toContainText('loading recommendations');
    }
  });

  test('should filter plants by category', async ({ page }) => {
    // select the vegetable category
    await page.selectOption('select', 'Vegetable');
    await page.click('button:has-text("Filter")');
    
    // wait for the results to load
    await page.waitForSelector('.plant-cards-container', { timeout: 10000 });
    
    // check the results title
    await expect(page.locator('.varieties-title')).toContainText('Vegetable');
  });

  test('should filter plants by month', async ({ page }) => {
    // select the month
    await page.selectOption('select:last-child', 'January');
    await page.click('button:has-text("Filter")');
    
    // wait for the results to load
    await page.waitForSelector('.plant-cards-container', { timeout: 10000 });
    
    // check the results title
    await expect(page.locator('.varieties-title')).toContainText('January');
  });

  test('should search plants by name', async ({ page }) => {
    // input the plant name
    await page.fill('input[placeholder*="search"]', 'Tomato');
    
    // wait for the dropdown menu to appear
    await page.waitForSelector('.searchable-dropdown', { timeout: 5000 });
    
    // select the first result
    await page.click('.dropdown-option:first-child');
    await page.click('button:has-text("Search")');
    
    // wait for the plant cards to load
    await page.waitForSelector('.plant-cards-container', { timeout: 10000 });
  });

  test('should display pest tips cards', async ({ page }) => {
    // check the pest tips section
    await expect(page.locator('.pest-tips-container')).toBeVisible();
    
    // check the pest cards
    const pestCards = page.locator('.pest-card');
    await expect(pestCards).toHaveCount(2);
    
    // check the pest cards content
    await expect(page.locator('.pest-card-title')).toContainText('Two-spotted mite');
    await expect(page.locator('.pest-card-title')).toContainText('Tomato potato psyllid');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // simulate an API error
    await page.route('**/plants/month/**', route => route.abort());
    
    // refresh the page
    await page.reload();
    
    // check the error message
    await expect(page.locator('.no-monthly-tips-message')).toContainText('No plants recommendations');
  });
});
