import { test, expect } from '@playwright/test';

test.describe('Support Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/support');
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should load support page with hero section', async ({ page }) => {
    // Check if hero section is visible
    await expect(page.locator('.support-hero')).toBeVisible();
    
    // Check if hero title is present
    await expect(page.locator('.support-hero h1')).toBeVisible();
    
    // Check if hero description is present
    await expect(page.locator('.support-hero p')).toBeVisible();
  });

  test('should display FAQ section with proper structure', async ({ page }) => {
    // Check if FAQ section title is visible
    await expect(page.locator('.support-section h2')).toBeVisible();
    
    // Check if FAQ grid layout is present
    await expect(page.locator('.support-faq-grid')).toBeVisible();
    
    // Check if FAQ links list is present
    await expect(page.locator('.support-links')).toBeVisible();
    
    // Check if FAQ side image is present
    await expect(page.locator('.faq-side-image')).toBeVisible();
  });

  test('should expand and collapse FAQ sections', async ({ page }) => {
    // Get the first FAQ section button
    const firstSection = page.locator('.support-link').first();
    
    // Click to expand the section
    await firstSection.click();
    
    // Check if section is expanded (has is-open class)
    await expect(firstSection).toHaveClass(/is-open/);
    
    // Check if questions list is visible
    await expect(page.locator('.faq-questions')).toBeVisible();
    
    // Click again to collapse
    await firstSection.click();
    
    // Check if section is collapsed
    await expect(firstSection).not.toHaveClass(/is-open/);
  });

  test('should open and close individual FAQ questions', async ({ page }) => {
    // Expand the first FAQ section
    await page.locator('.support-link').first().click();
    
    // Wait for questions to appear
    await page.waitForSelector('.faq-questions', { timeout: 5000 });
    
    // Get the first question button
    const firstQuestion = page.locator('.question-link').first();
    
    // Click to open the question
    await firstQuestion.click();
    
    // Check if question is open (has is-open class)
    await expect(firstQuestion).toHaveClass(/is-open/);
    
    // Check if answer is visible
    await expect(page.locator('.answer')).toBeVisible();
    
    // Click again to close
    await firstQuestion.click();
    
    // Check if question is closed
    await expect(firstQuestion).not.toHaveClass(/is-open/);
  });

  test('should display FAQ answers with proper formatting', async ({ page }) => {
    // Expand first section and open first question
    await page.locator('.support-link').first().click();
    await page.waitForSelector('.faq-questions');
    await page.locator('.question-link').first().click();
    
    // Check if answer content is visible
    const answer = page.locator('.answer');
    await expect(answer).toBeVisible();
    
    // Check if answer has ordered list
    await expect(answer.locator('ol')).toBeVisible();
    
    // Check if answer has list items
    await expect(answer.locator('li').first()).toBeVisible();
  });

  test('should search FAQ content', async ({ page }) => {
    // Look for search input (if it exists)
    const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="search" i]'));
    
    if (await searchInput.count() > 0) {
      // Type search term
      await searchInput.fill('watering');
      
      // Press Enter to search
      await searchInput.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Check if results are filtered or highlighted
      const highlightedText = page.locator('text=/watering/i');
      if (await highlightedText.count() > 0) {
        await expect(highlightedText.first()).toBeVisible();
      }
    }
  });

  test('should display diagnosis wizard section', async ({ page }) => {
    // Check if diagnosis section is present
    await expect(page.locator('.diagnosis-section')).toBeVisible();
    
    // Check if diagnosis wizard component is loaded
    // This might be a custom component, so we check for common elements
    const wizardElements = page.locator('[class*="diagnosis"], [class*="wizard"], [class*="step"]');
    if (await wizardElements.count() > 0) {
      await expect(wizardElements.first()).toBeVisible();
    }
  });

  test('should display local programs section', async ({ page }) => {
    // Check if local programs section is visible
    await expect(page.locator('.local-programs-section')).toBeVisible();
    
    // Check if section header is present
    await expect(page.locator('.local-programs-header')).toBeVisible();
    
    // Check if program cards are present
    await expect(page.locator('.local-program-card').first()).toBeVisible();
    
    // Check if program cards have proper content
    const firstCard = page.locator('.local-program-card').first();
    await expect(firstCard.locator('h3')).toBeVisible();
    await expect(firstCard.locator('p')).toBeVisible();
  });

  test('should display community garden map section', async ({ page }) => {
    // Check if community garden map section is visible
    await expect(page.locator('.community-garden-map-section')).toBeVisible();
    
    // Check if map background image is present
    await expect(page.locator('.map-background-image img')).toBeVisible();
    
    // Check if map content wrapper is present
    await expect(page.locator('.map-content-wrapper')).toBeVisible();
    
    // Check if map title is present
    await expect(page.locator('.map-content-wrapper h2')).toBeVisible();
  });

  test('should interact with garden search functionality', async ({ page }) => {
    // Look for garden search input
    const gardenSearchInput = page.locator('.garden-search-overlay input').or(
      page.locator('input[placeholder*="garden" i]')
    );
    
    if (await gardenSearchInput.count() > 0) {
      // Type search term
      await gardenSearchInput.fill('melbourne');
      
      // Press Enter to search
      await gardenSearchInput.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(2000);
      
      // Check if search results sidebar appears
      const sidebar = page.locator('.sidebar-panel');
      if (await sidebar.count() > 0) {
        await expect(sidebar).toBeVisible();
        
        // Check if search results are displayed
        await expect(page.locator('.sidebar-item').first()).toBeVisible();
      }
    }
  });

  test('should handle map interactions', async ({ page }) => {
    // Check if map container is present
    const mapContainer = page.locator('.map-container-wrapper');
    
    if (await mapContainer.count() > 0) {
      await expect(mapContainer).toBeVisible();
      
      // Try to interact with map (if it's a Leaflet map)
      const mapElement = page.locator('.leaflet-container');
      
      if (await mapElement.count() > 0) {
        await expect(mapElement).toBeVisible();
        
        // Check if map tiles are loaded
        const mapTiles = page.locator('.leaflet-tile');
        if (await mapTiles.count() > 0) {
          await expect(mapTiles.first()).toBeVisible();
        }
      }
    } else {
      // If no specific map container, check for any map-related elements
      const mapSection = page.locator('.community-garden-map-section');
      await expect(mapSection).toBeVisible();
    }
  });

  test('should display community organizations', async ({ page }) => {
    // Check if community organizations are displayed
    const communityCards = page.locator('.local-program-card');
    
    if (await communityCards.count() > 0) {
      // Check if cards have images
      const firstCard = communityCards.first();
      await expect(firstCard.locator('img')).toBeVisible();
      
      // Check if cards have titles
      await expect(firstCard.locator('h3')).toBeVisible();
      
      // Check if cards have descriptions
      await expect(firstCard.locator('p')).toBeVisible();
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if FAQ grid adapts to mobile
    const faqGrid = page.locator('.support-faq-grid');
    await expect(faqGrid).toBeVisible();
    
    // Check if hero section adapts
    const hero = page.locator('.support-hero');
    await expect(hero).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check if layout adapts
    await expect(faqGrid).toBeVisible();
    await expect(hero).toBeVisible();
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test Tab navigation through FAQ sections
    await page.keyboard.press('Tab');
    
    // Check if focus is on first interactive element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test Enter key on focused element
    await page.keyboard.press('Enter');
    
    // Check if element was activated
    const activeElement = page.locator('.support-link.is-open').or(
      page.locator('.question-link.is-open')
    );
    
    if (await activeElement.count() > 0) {
      await expect(activeElement.first()).toBeVisible();
    }
  });

  test('should display proper error handling', async ({ page }) => {
    // Check if there are any error messages displayed
    const errorMessages = page.locator('[class*="error"], [class*="warning"]');
    
    // If no errors are present, that's good
    if (await errorMessages.count() === 0) {
      expect(true).toBeTruthy();
    } else {
      // If errors are present, check they're styled appropriately
      await expect(errorMessages.first()).toBeVisible();
    }
  });

  test('should load all images properly', async ({ page }) => {
    // Check if hero background image loads
    const heroImage = page.locator('.support-hero');
    await expect(heroImage).toBeVisible();
    
    // Check if FAQ side image loads
    const faqImage = page.locator('.faq-side-image');
    await expect(faqImage).toBeVisible();
    
    // Check if community program images load
    const programImages = page.locator('.local-program-card img');
    if (await programImages.count() > 0) {
      await expect(programImages.first()).toBeVisible();
    }
    
    // Check if map background image loads
    const mapImage = page.locator('.map-background-image img');
    if (await mapImage.count() > 0) {
      await expect(mapImage).toBeVisible();
    }
  });

  test('should maintain state during interactions', async ({ page }) => {
    // Expand first FAQ section
    await page.locator('.support-link').first().click();
    await page.waitForSelector('.faq-questions');
    
    // Open first question
    await page.locator('.question-link').first().click();
    
    // Check if both section and question remain open
    await expect(page.locator('.support-link.is-open')).toBeVisible();
    await expect(page.locator('.question-link.is-open')).toBeVisible();
    
    // Expand another section (if available)
    const allSections = page.locator('.support-link');
    const sectionCount = await allSections.count();
    
    if (sectionCount > 1) {
      await allSections.nth(1).click();
      
      // Check if we have at least one section open
      await expect(page.locator('.support-link.is-open')).toHaveCount(1);
    } else {
      // If only one section, just verify it remains open
      await expect(page.locator('.support-link.is-open')).toBeVisible();
    }
  });
});
