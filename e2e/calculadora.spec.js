const { test, expect } = require('@playwright/test');
const path = require('path');

const url = 'file://' + path.resolve(__dirname, '..', 'index.html');

async function calcular(page, distancia, tiempo) {
  await page.getByLabel('Distancia (km)').fill(distancia);
  await page.getByLabel('Tiempo').fill(tiempo);
  await page.getByRole('button', { name: 'Calcular' }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto(url);
});

test('10 km en 50:00 muestra las cuatro predicciones con su ritmo', async ({ page }) => {
  await calcular(page, '10', '50:00');

  const filas = page.locator('#tabla-predicciones tbody tr');
  await expect(filas).toHaveCount(4);
  await expect(filas.nth(0).locator('td')).toHaveText(['5K', '23:59', '4:48/km']);
  await expect(filas.nth(1).locator('td')).toHaveText(['10K', '50:00', '5:00/km']);
  await expect(filas.nth(2).locator('td')).toHaveText(['Media maratón', '1:50:19', '5:14/km']);
  await expect(filas.nth(3).locator('td')).toHaveText(['Maratón', '3:50:01', '5:27/km']);
  await expect(page.getByRole('alert')).toBeHidden();
});

test('distancia 0 muestra un error y ninguna tabla', async ({ page }) => {
  await calcular(page, '0', '50:00');
  await expect(page.getByRole('alert')).toHaveText('Escribe la distancia en km, mayor que 0.');
  await expect(page.locator('#tabla-predicciones')).toBeHidden();
});

test('un tiempo mal escrito muestra un error y oculta la tabla anterior', async ({ page }) => {
  await calcular(page, '10', '50:00');
  await calcular(page, '10', '50:7x');
  await expect(page.getByRole('alert')).toHaveText('Escribe el tiempo como h:mm:ss o mm:ss.');
  await expect(page.locator('#tabla-predicciones')).toBeHidden();
});

test('Intro en el formulario también calcula', async ({ page }) => {
  await page.getByLabel('Distancia (km)').fill('21,0975');
  await page.getByLabel('Tiempo').fill('1:50:19');
  await page.getByLabel('Tiempo').press('Enter');
  await expect(page.locator('#tabla-predicciones tbody tr').nth(2).locator('td')).toHaveText(['Media maratón', '1:50:19', '5:14/km']);
});
