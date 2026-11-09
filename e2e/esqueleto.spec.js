const { test, expect } = require('@playwright/test');
const path = require('path');

const url = 'file://' + path.resolve(__dirname, '..', 'index.html');

test('la app se abre y muestra su nombre y los dos apartados', async ({ page }) => {
  const errores = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errores.push(msg.text()); });
  page.on('pageerror', (err) => errores.push(err.message));

  await page.goto(url);

  await expect(page).toHaveTitle('Tempo');
  await expect(page.getByRole('heading', { level: 1, name: 'Tempo' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Calculadora' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Diario de carga' })).toBeVisible();
  expect(errores).toEqual([]);
});
