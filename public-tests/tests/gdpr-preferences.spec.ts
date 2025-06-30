import { expect, test } from '@playwright/test';

test.describe('Sistema de Preferencias GDPR', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gdpr-test');
  });

  test('debe mostrar checkbox de recordar decisión en modal GDPR', async ({ page }) => {
    // Solicitar consentimiento
    await page.click('[data-testid="request-consent-btn"]');

    // Verificar que aparece el modal
    await expect(page.locator('[data-testid="gdpr-modal"]')).toBeVisible();

    // Verificar que aparece el checkbox de recordar decisión
    await expect(page.locator('#remember-decision')).toBeVisible();
    await expect(page.locator('text=Recordar mi decisión')).toBeVisible();
  });

  test('debe recordar decisión cuando checkbox está marcado', async ({ page }) => {
    // Solicitar consentimiento
    await page.click('[data-testid="request-consent-btn"]');

    // Marcar checkbox de recordar decisión
    await page.check('#remember-decision');

    // Aceptar consentimiento
    await page.click('[data-testid="gdpr-modal-accept"]');

    // Verificar que el consentimiento se guardó
    await expect(page.locator('text=Consentimiento: Aceptado')).toBeVisible();
    await expect(page.locator('text=Recordar decisión: Habilitado')).toBeVisible();

    // Solicitar consentimiento nuevamente
    await page.click('[data-testid="request-consent-btn"]');

    // Verificar que no aparece el modal (porque ya recordó la decisión)
    await expect(page.locator('[data-testid="gdpr-modal"]')).not.toBeVisible();
  });

  test('debe mostrar modal nuevamente cuando recordar decisión está desmarcado', async ({ page }) => {
    // Solicitar consentimiento
    await page.click('[data-testid="request-consent-btn"]');

    // Desmarcar checkbox de recordar decisión
    await page.uncheck('#remember-decision');

    // Aceptar consentimiento
    await page.click('[data-testid="gdpr-modal-accept"]');

    // Solicitar consentimiento nuevamente
    await page.click('[data-testid="request-consent-btn"]');

    // Verificar que aparece el modal nuevamente
    await expect(page.locator('[data-testid="gdpr-modal"]')).toBeVisible();
  });

  test('debe abrir panel de preferencias', async ({ page }) => {
    // Hacer clic en configurar preferencias
    await page.click('text=⚙️ Configurar Preferencias');

    // Verificar que aparece el panel de preferencias
    await expect(page.locator('[data-testid="gdpr-preferences-panel"]')).toBeVisible();
    await expect(page.locator('text=Configuración de Privacidad')).toBeVisible();
  });

  test('debe permitir configurar preferencias de recordar decisión', async ({ page }) => {
    // Abrir panel de preferencias
    await page.click('text=⚙️ Configurar Preferencias');

    // Verificar que aparece la opción de recordar decisión
    await expect(page.locator('#pref-remember-decision')).toBeVisible();

    // Cambiar preferencia
    await page.uncheck('#pref-remember-decision');

    // Verificar que se actualiza el estado
    await expect(page.locator('text=Estado actual: No recordando decisiones')).toBeVisible();
  });

  test('debe permitir configurar auto-aceptación', async ({ page }) => {
    // Abrir panel de preferencias
    await page.click('text=⚙️ Configurar Preferencias');

    // Verificar que aparece la opción de auto-aceptar
    await expect(page.locator('#pref-auto-accept')).toBeVisible();

    // Habilitar auto-aceptación
    await page.check('#pref-auto-accept');

    // Verificar que se actualiza el estado
    await expect(page.locator('text=Auto-aceptación: Habilitada')).toBeVisible();
  });

  test('debe permitir configurar frecuencia de notificaciones', async ({ page }) => {
    // Abrir panel de preferencias
    await page.click('text=⚙️ Configurar Preferencias');

    // Cambiar frecuencia a "Nunca"
    await page.selectOption('select', 'never');

    // Verificar que se actualiza
    await expect(page.locator('select')).toHaveValue('never');
  });

  test('debe permitir resetear preferencias', async ({ page }) => {
    // Abrir panel de preferencias
    await page.click('text=⚙️ Configurar Preferencias');

    // Cambiar una preferencia
    await page.uncheck('#pref-remember-decision');

    // Hacer clic en resetear
    await page.click('[data-testid="gdpr-preferences-reset"]');

    // Confirmar reset
    await page.click('text=OK');

    // Verificar que se reseteó
    await expect(page.locator('#pref-remember-decision')).toBeChecked();
  });

  test('debe mantener historial de consentimientos', async ({ page }) => {
    // Solicitar consentimiento con recordar decisión
    await page.click('[data-testid="request-consent-btn"]');
    await page.check('#remember-decision');
    await page.click('[data-testid="gdpr-modal-accept"]');

    // Verificar que aparece en el historial
    await expect(page.locator('text=Consentimiento almacenado: granted')).toBeVisible();
    await expect(page.locator('text=Total de investigaciones en historial: 1')).toBeVisible();
  });

  test('debe respetar preferencias de frecuencia', async ({ page }) => {
    // Configurar frecuencia a "Una vez"
    await page.click('text=⚙️ Configurar Preferencias');
    await page.selectOption('select', 'once');
    await page.click('[data-testid="gdpr-preferences-save"]');

    // Solicitar consentimiento
    await page.click('[data-testid="request-consent-btn"]');
    await page.check('#remember-decision');
    await page.click('[data-testid="gdpr-modal-accept"]');

    // Solicitar consentimiento nuevamente
    await page.click('[data-testid="request-consent-btn"]');

    // Verificar que no aparece el modal (frecuencia "una vez")
    await expect(page.locator('[data-testid="gdpr-modal"]')).not.toBeVisible();
  });

  test('debe permitir auto-aceptación cuando está habilitada', async ({ page }) => {
    // Habilitar auto-aceptación
    await page.click('text=⚙️ Configurar Preferencias');
    await page.check('#pref-auto-accept');
    await page.click('[data-testid="gdpr-preferences-save"]');

    // Solicitar consentimiento
    await page.click('[data-testid="request-consent-btn"]');

    // Verificar que se acepta automáticamente
    await expect(page.locator('text=Consentimiento: Aceptado')).toBeVisible();
    await expect(page.locator('[data-testid="gdpr-modal"]')).not.toBeVisible();
  });

  test('debe mostrar información de debug completa', async ({ page }) => {
    // Verificar que aparece la información de debug
    await expect(page.locator('text=Información de Debug')).toBeVisible();

    // Verificar que incluye información de preferencias
    await expect(page.locator('text=preferences')).toBeVisible();
    await expect(page.locator('text=consentInfo')).toBeVisible();
  });

  test('debe permitir resetear consentimiento', async ({ page }) => {
    // Dar consentimiento
    await page.click('[data-testid="request-consent-btn"]');
    await page.click('[data-testid="gdpr-modal-accept"]');

    // Verificar que se aceptó
    await expect(page.locator('text=Consentimiento: Aceptado')).toBeVisible();

    // Resetear consentimiento
    await page.click('text=🔄 Resetear Consentimiento');

    // Verificar que se reseteó
    await expect(page.locator('text=Consentimiento: Pendiente')).toBeVisible();
  });

  test('debe cerrar panel de preferencias correctamente', async ({ page }) => {
    // Abrir panel de preferencias
    await page.click('text=⚙️ Configurar Preferencias');

    // Verificar que está abierto
    await expect(page.locator('[data-testid="gdpr-preferences-panel"]')).toBeVisible();

    // Cerrar panel
    await page.click('[data-testid="gdpr-preferences-close"]');

    // Verificar que se cerró
    await expect(page.locator('[data-testid="gdpr-preferences-panel"]')).not.toBeVisible();
  });
});
