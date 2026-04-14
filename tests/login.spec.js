const { test, expect } = require('@playwright/test');

const URL = 'https://the-internet.herokuapp.com/login';

test.describe('Login - The Internet', () => {

  test('Login exitoso con credenciales válidas', async ({ page }) => {
    await page.goto(URL);
    await page.fill('#username', 'tomsmith');
   // await page.fill('#password', 'SuperSecretPassword!');
   await page.fill('#password', 'contrasenaincorrecta');
    await page.click('button[type="submit"]');
    await expect(page.locator('.flash.success')).toBeVisible();
  });

  test('Login fallido con credenciales inválidas', async ({ page }) => {
    await page.goto(URL);
    await page.fill('#username', 'tomsmith');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('.flash.error')).toBeVisible();
  });

});