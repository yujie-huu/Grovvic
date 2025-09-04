// netzero/tests/plant-detail.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Plant Detail Page Tests', () => {
  test('should load plant detail page', async ({ page }) => {
    // directly access the plant detail page
    await page.goto('/plant-detail/Amaranth-Caudatus-Red');
    
    // wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // check the page elements
    await expect(page.locator('.plant-detail-title')).toBeVisible();
    await expect(page.locator('.back-button')).toBeVisible();
  });

  test('should display plant overview correctly', async ({ page }) => {
    await page.goto('/plant-detail/Amaranth-Caudatus-Red');
    
    // check the overview section
    await expect(page.locator('.plant-overview')).toBeVisible();
    await expect(page.locator('.overview-content')).toBeVisible();
    
    // check the image and text layout
    await expect(page.locator('.plant-detail-image')).toBeVisible();
    await expect(page.locator('.plant-basic-info')).toBeVisible();
  });

  test('should display quick info cards', async ({ page }) => {
    await page.goto('/plant-detail/Amaranth-Caudatus-Red');
    
    // wait for the quick info cards to load
    await page.waitForSelector('.quick-info-grid', { timeout: 10000 });
    
    // check the number of info cards
    const infoCards = page.locator('.info-card');
    await expect(infoCards).toHaveCount(9);
    
    // check the specific information
    await expect(page.locator('.info-card h3')).toContainText('Sowing Method');
    await expect(page.locator('.info-card h3')).toContainText('Germination');
  });

  test('should display detailed sections', async ({ page }) => {
    await page.goto('/plant-detail/Amaranth-Caudatus-Red');
    
    // check the detailed sections
    await expect(page.locator('.detailed-sections')).toBeVisible();
    await expect(page.locator('.detail-section')).toBeVisible();
    
    // check the specific sections
    await expect(page.locator('.section-title')).toContainText('Preparation');
    await expect(page.locator('.section-title')).toContainText('How to Sow');
    await expect(page.locator('.section-title')).toContainText('How to Grow');
  });

  test('should handle back navigation', async ({ page }) => {
    await page.goto('/plant-detail/Amaranth-Caudatus-Red');
    
    // click the back button
    await page.click('.back-button');
    
    // check if it returns to the previous page
    await expect(page).not.toHaveURL(/plant-detail/);
  });

  test('should handle missing plant data', async ({ page }) => {
    // access the non-existent plant
    await page.goto('/plant-detail/NonExistentPlant');
    
    // check the error handling
    await expect(page.locator('.error-container')).toBeVisible();
    await expect(page.locator('.error-container')).toContainText('Plant Not Found');
  });

  test('should format overview text correctly', async ({ page }) => {
    await page.goto('/plant-detail/Amaranth-Caudatus-Red');
    
    // check the formatted overview text
    await expect(page.locator('.overview-text strong')).toContainText('Botanical name:');
    
    // check the ✦ symbol and line break
    await expect(page.locator('.bullet-point')).toContainText('✦');
  });
});
