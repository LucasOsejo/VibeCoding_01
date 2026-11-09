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

test('sin sesiones muestra un aviso y ninguna tabla', async ({ page }) => {
  await expect(page.getByText('Aún no hay sesiones.')).toBeVisible();
  await expect(page.locator('#tabla-sesiones')).toBeHidden();
});

test('añadir, recargar y borrar una sesión', async ({ page }) => {
  await anadirSesion(page, '2026-11-09', '60', '5');

  const filas = page.locator('#tabla-sesiones tbody tr');
  await expect(filas).toHaveCount(1);
  await expect(filas.first().locator('td')).toHaveText(['09/11/2026', '60', '5', '300', 'Editar Borrar']);

  await page.reload();
  await expect(filas).toHaveCount(1);
  await expect(filas.first().locator('td').nth(3)).toHaveText('300');

  await page.getByRole('button', { name: 'Borrar sesión del 09/11/2026' }).click();
  await expect(filas).toHaveCount(0);
  await expect(page.getByText('Aún no hay sesiones.')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Aún no hay sesiones.')).toBeVisible();
});

test('las sesiones salen de la más reciente a la más antigua y se borra solo la elegida', async ({ page }) => {
  await anadirSesion(page, '2026-11-02', '40', '4');
  await anadirSesion(page, '2026-11-09', '60', '5');
  await anadirSesion(page, '2026-10-30', '30', '3');

  const fechas = page.locator('#tabla-sesiones tbody tr td:first-child');
  await expect(fechas).toHaveText(['09/11/2026', '02/11/2026', '30/10/2026']);

  await page.getByRole('button', { name: 'Borrar sesión del 02/11/2026' }).click();
  await expect(fechas).toHaveText(['09/11/2026', '30/10/2026']);
});

test('RPE 11 muestra un error y no guarda nada', async ({ page }) => {
  await anadirSesion(page, '2026-11-09', '60', '11');
  await expect(page.locator('#error-sesion')).toHaveText('El RPE tiene que ser un número entero de 1 a 10.');
  await expect(page.locator('#tabla-sesiones tbody tr')).toHaveCount(0);
});

test('sin fecha muestra un error', async ({ page }) => {
  await page.getByLabel('Minutos').fill('60');
  await page.getByLabel('Esfuerzo (RPE 1–10)').fill('5');
  await page.getByRole('button', { name: 'Añadir sesión' }).click();
  await expect(page.locator('#error-sesion')).toHaveText('Elige la fecha de la sesión.');
});

test('editar una sesión recalcula su carga y la semanal, y sobrevive a una recarga', async ({ page }) => {
  await anadirSesion(page, '2026-11-09', '60', '5');
  await page.getByRole('button', { name: 'Editar sesión del 09/11/2026' }).click();

  await expect(page.getByLabel('Fecha')).toHaveValue('2026-11-09');
  await expect(page.getByLabel('Minutos')).toHaveValue('60');
  await expect(page.getByLabel('Esfuerzo (RPE 1–10)')).toHaveValue('5');
  await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible();

  await page.getByLabel('Minutos').fill('90');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  const filas = page.locator('#tabla-sesiones tbody tr');
  await expect(filas).toHaveCount(1);
  await expect(filas.first().locator('td').nth(3)).toHaveText('450');
  await expect(page.locator('#tabla-semanas tbody tr').first().locator('td').nth(1)).toHaveText('450');
  await expect(page.getByRole('button', { name: 'Añadir sesión' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar' })).toBeHidden();

  await page.reload();
  await expect(filas.first().locator('td').nth(3)).toHaveText('450');
});

test('cambiar la fecha al editar mueve la sesión de semana', async ({ page }) => {
  await anadirSesion(page, '2026-11-09', '60', '5');
  await page.getByRole('button', { name: 'Editar sesión del 09/11/2026' }).click();
  await page.getByLabel('Fecha').fill('2026-11-08');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(page.locator('#tabla-sesiones tbody tr td:first-child')).toHaveText(['08/11/2026']);
  await expect(page.locator('#tabla-semanas tbody tr td:first-child')).toHaveText(['02/11/2026']);
});

test('cancelar la edición no cambia nada y la siguiente sesión se añade nueva', async ({ page }) => {
  await anadirSesion(page, '2026-11-09', '60', '5');
  await page.getByRole('button', { name: 'Editar sesión del 09/11/2026' }).click();
  await page.getByLabel('Minutos').fill('999');
  await page.getByRole('button', { name: 'Cancelar' }).click();

  const filas = page.locator('#tabla-sesiones tbody tr');
  await expect(filas.first().locator('td').nth(1)).toHaveText('60');
  await expect(page.getByLabel('Minutos')).toHaveValue('');

  await anadirSesion(page, '2026-11-10', '30', '3');
  await expect(filas).toHaveCount(2);
});

test('un RPE de 11 al editar muestra un error y la sesión no cambia', async ({ page }) => {
  await anadirSesion(page, '2026-11-09', '60', '5');
  await page.getByRole('button', { name: 'Editar sesión del 09/11/2026' }).click();
  await page.getByLabel('Esfuerzo (RPE 1–10)').fill('11');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(page.locator('#error-sesion')).toHaveText('El RPE tiene que ser un número entero de 1 a 10.');
  await expect(page.locator('#tabla-sesiones tbody tr').first().locator('td').nth(2)).toHaveText('5');
  await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeVisible();
});

test('borrar la sesión que se está editando vuelve al modo añadir', async ({ page }) => {
  await anadirSesion(page, '2026-11-09', '60', '5');
  await page.getByRole('button', { name: 'Editar sesión del 09/11/2026' }).click();
  await page.getByRole('button', { name: 'Borrar sesión del 09/11/2026' }).click();

  await expect(page.getByRole('button', { name: 'Añadir sesión' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar' })).toBeHidden();
  await expect(page.getByText('Aún no hay sesiones.')).toBeVisible();
});
