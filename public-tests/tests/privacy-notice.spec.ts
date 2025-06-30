import { expect, test } from '@playwright/test';

test.describe('Página de Aviso de Privacidad', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/privacy');
  });

  test('debe cargar la página correctamente', async ({ page }) => {
    // Verificar que la página se carga
    await expect(page).toHaveTitle(/Aviso de Privacidad/);

    // Verificar elementos principales
    await expect(page.locator('h1')).toContainText('Aviso de Privacidad');
    await expect(page.locator('text=Protegemos su privacidad')).toBeVisible();
  });

  test('debe mostrar el componente PrivacyNotice', async ({ page }) => {
    // Verificar que el componente PrivacyNotice está presente
    await expect(page.locator('[data-testid="privacy-notice"]')).toBeVisible();

    // Verificar secciones principales del aviso
    await expect(page.locator('text=Información del Responsable')).toBeVisible();
    await expect(page.locator('text=Datos Personales Recopilados')).toBeVisible();
    await expect(page.locator('text=Propósito del Tratamiento')).toBeVisible();
    await expect(page.locator('text=Base Legal')).toBeVisible();
  });

  test('debe tener navegación funcional', async ({ page }) => {
    // Verificar breadcrumb
    await expect(page.locator('text=Inicio')).toBeVisible();

    // Verificar enlaces en el footer
    await expect(page.locator('a[href="/privacy"]')).toBeVisible();
    await expect(page.locator('a[href="/terms"]')).toBeVisible();
    await expect(page.locator('a[href="/cookies"]')).toBeVisible();
  });

  test('debe mostrar información de contacto', async ({ page }) => {
    // Verificar información de contacto
    await expect(page.locator('text=privacy@emotiox.com')).toBeVisible();
    await expect(page.locator('text=dpo@emotiox.com')).toBeVisible();
  });

  test('debe tener enlaces a documentos relacionados', async ({ page }) => {
    // Verificar enlaces a documentos relacionados
    await expect(page.locator('a[href="/terms"]')).toBeVisible();
    await expect(page.locator('a[href="/cookies"]')).toBeVisible();
    await expect(page.locator('a[href="/gdpr-test"]')).toBeVisible();
  });

  test('debe permitir navegación de vuelta al inicio', async ({ page }) => {
    // Hacer clic en "Volver al inicio"
    await page.click('text=← Volver al inicio');

    // Verificar que se navega correctamente
    await expect(page).toHaveURL('/');
  });

  test('debe mostrar fecha de actualización', async ({ page }) => {
    // Verificar que muestra la fecha de actualización
    await expect(page.locator('text=Última actualización:')).toBeVisible();
  });

  test('debe indicar cumplimiento GDPR', async ({ page }) => {
    // Verificar indicador de cumplimiento GDPR
    await expect(page.locator('text=Cumple GDPR')).toBeVisible();
  });

  test('debe tener navegación por secciones', async ({ page }) => {
    // Verificar que las secciones son navegables
    const sections = [
      'Información del Responsable',
      'Datos Personales Recopilados',
      'Propósito del Tratamiento',
      'Base Legal',
      'Compartición de Datos',
      'Seguridad de Datos',
      'Retención de Datos',
      'Derechos del Usuario',
      'Contacto'
    ];

    for (const section of sections) {
      await expect(page.locator(`text=${section}`)).toBeVisible();
    }
  });

  test('debe ser accesible', async ({ page }) => {
    // Verificar estructura semántica
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2')).toBeVisible();

    // Verificar que los enlaces tienen texto descriptivo
    const links = page.locator('a');
    const linkCount = await links.count();

    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      expect(text?.trim()).toBeTruthy();
    }
  });

  test('debe funcionar en modo móvil', async ({ page }) => {
    // Cambiar a vista móvil
    await page.setViewportSize({ width: 375, height: 667 });

    // Verificar que el contenido es responsive
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="privacy-notice"]')).toBeVisible();

    // Verificar que los enlaces son accesibles en móvil
    await expect(page.locator('a[href="/privacy"]')).toBeVisible();
  });
});
