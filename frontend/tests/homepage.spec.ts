import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display IEU prominently', async ({ page }) => {
    await page.goto('/');

    // Check that IEU is visible in the hero section
    await expect(page.locator('text=IEU')).toBeVisible();
    await expect(page.locator('text=Indice d\'Équipement Urbain')).toBeVisible();
    
    // Check the main IEU section is prominent
    const ieuSection = page.locator('div:has-text("Indice d\'Équipement Urbain")').first();
    await expect(ieuSection).toBeVisible();
    
    // Verify IEU is in the gradient title
    const ieuTitle = page.locator('h2:has-text("IEU")');
    await expect(ieuTitle).toBeVisible();
  });

  test('should display Analytics & IEU combined card', async ({ page }) => {
    await page.goto('/');

    // Check that the combined Analytics & IEU card exists
    await expect(page.locator('text=Analytics & IEU')).toBeVisible();
    
    // Check for IEU badge
    await expect(page.locator('.inline-flex:has-text("IEU")')).toBeVisible();
    
    // Check for Analytics badge
    await expect(page.locator('.inline-flex:has-text("Analytics")')).toBeVisible();
    
    // Check for Reporting badge
    await expect(page.locator('.inline-flex:has-text("Reporting")')).toBeVisible();
  });

  test('should display B2G Administration card', async ({ page }) => {
    await page.goto('/');

    // Check B2G Administration card
    await expect(page.locator('text=Administration')).toBeVisible();
    await expect(page.locator('text=Gestion de l\'arborescence administrative B2G configurable')).toBeVisible();
    await expect(page.locator('.inline-flex:has-text("B2G")')).toBeVisible();
  });

  test('should have all main feature cards', async ({ page }) => {
    await page.goto('/');

    // Check all 5 main feature cards are present
    await expect(page.locator('text=Référentiel')).toBeVisible();
    await expect(page.locator('text=Projets')).toBeVisible(); 
    await expect(page.locator('text=Conformité')).toBeVisible();
    await expect(page.locator('text=Analytics & IEU')).toBeVisible();
    await expect(page.locator('text=Administration')).toBeVisible();
  });

  test('should have correct navigation buttons', async ({ page }) => {
    await page.goto('/');

    // Check main CTA buttons
    await expect(page.locator('text=Commencer gratuitement')).toBeVisible();
    await expect(page.locator('text=Se connecter')).toBeVisible();
    
    // Check that buttons are clickable
    const registerButton = page.locator('text=Commencer gratuitement');
    const loginButton = page.locator('text=Se connecter');
    
    await expect(registerButton).toBeEnabled();
    await expect(loginButton).toBeEnabled();
  });

  test('should highlight IEU with proper styling', async ({ page }) => {
    await page.goto('/');

    // Check that IEU has gradient styling in the hero section
    const ieuHeroTitle = page.locator('h2 span:has-text("IEU")');
    await expect(ieuHeroTitle).toHaveClass(/bg-gradient-to-r/);
    
    // Check that the IEU section has proper background and styling
    const ieuSection = page.locator('div:has-text("Calculez et analysez les indices d\'équipement urbain")');
    await expect(ieuSection).toBeVisible();
  });
});