// netzero/tests/utils/test-helpers.js
const { expect } = require('@playwright/test');

// wait for the API request to complete
async function waitForAPIResponse(page, urlPattern) {
  await page.waitForResponse(response => 
    response.url().includes(urlPattern) && response.status() === 200
  );
}

// check if the page is at the top
async function checkPageScrollTop(page) {
  const scrollTop = await page.evaluate(() => window.pageYOffset);
  expect(scrollTop).toBe(0);
}

// simulate user input
async function typeWithDelay(page, selector, text, delay = 100) {
  await page.click(selector);
  await page.fill(selector, '');
  for (const char of text) {
    await page.type(selector, char, { delay });
  }
}

// check the responsive design
async function testResponsiveDesign(page, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(1000); // wait for the layout to adjust
  
  // check if the key elements are visible
  await expect(page.locator('nav')).toBeVisible();
  await expect(page.locator('main')).toBeVisible();
}

module.exports = {
  waitForAPIResponse,
  checkPageScrollTop,
  typeWithDelay,
  testResponsiveDesign
};
