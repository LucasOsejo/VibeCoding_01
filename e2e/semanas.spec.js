const { test, expect } = require('@playwright/test');
const path = require('path');

const url = 'file://' + path.resolve(__dirname, '..', 'index.html');

async function anadirSesion(page, fecha, minutos, rpe) {
  await page.getByLabel('Fecha').fill(fecha);
  await page.getByLabel('Minutos').fill(minutos);
  await page.getByLabel('Esfuerzo (RPE 1–10)').fill(rpe);
  await page.getByRole('button', { name: 'Añadir sesión' }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto(url);
});

test('avisa si la carga sube más de un 15 % y deja de avisar al bajar a 1150', async ({ page }) => {
  await anadirSesion(page, '2026-11-02', '100', '10'); // semana del 2/11: 1000
  await anadirSesion(page, '2026-11-09', '100', '10'); // semana del 9/11: 1000
  await anadirSesion(page, '2026-11-10', '15', '10'); //                 + 150
  await anadirSesion(page, '2026-11-11', '1', '10'); //                  + 10 = 1160

  const semanas = page.locator('#tabla-semanas tbody tr');
  await expect(semanas).toHaveCount(2);
  await expect(semanas.nth(0).locator('td')).toHaveText(['09/11/2026', '1160', '+16 %', '⚠ Sube más de un 15 %']);
  await expect(semanas.nth(0)).toHaveClass(/aviso/);
  await expect(semanas.nth(1).locator('td')).toHaveText(['02/11/2026', '1000', '—', '']);

  await page.getByRole('button', { name: 'Borrar sesión del 11/11/2026' }).click();
  await expect(semanas.nth(0).locator('td')).toHaveText(['09/11/2026', '1150', '+15 %', '']);
  await expect(semanas.nth(0)).not.toHaveClass(/aviso/);
});

test('el domingo 8/11 y el lunes 9/11 cuentan en semanas distintas', async ({ page }) => {
  await anadirSesion(page, '2026-11-08', '30', '2');
  await anadirSesion(page, '2026-11-09', '40', '2');

  const semanas = page.locator('#tabla-semanas tbody tr td:first-child');
  await expect(semanas).toHaveText(['09/11/2026', '02/11/2026']);
});

test('sin sesiones no se muestra la tabla de semanas', async ({ page }) => {
  await expect(page.locator('#tabla-semanas')).toBeHidden();
});
