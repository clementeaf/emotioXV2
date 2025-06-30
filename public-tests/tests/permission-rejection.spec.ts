import { expect, test } from '@playwright/test';

test.describe('Manejo de Rechazos de Permisos', () => {
  test.beforeEach(async ({ page }) => {
    // Mock de geolocalización para simular rechazo
    await page.addInitScript(() => {
      // Mock de navigator.geolocation
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: any, error: any) => {
            // Simular rechazo de permiso
            error({
              code: 1, // PERMISSION_DENIED
              message: 'User denied geolocation'
            });
          }
        },
        writable: true
      });

      // Mock de permissions API
      Object.defineProperty(navigator, 'permissions', {
        value: {
          query: () => Promise.resolve({ state: 'denied' })
        },
        writable: true
      });
    });

    await page.goto('/gdpr-test');
  });

  test('debe mostrar notificación cuando se rechaza permiso GPS', async ({ page }) => {
    // Solicitar ubicación
    await page.click('[data-testid="request-location-btn"]');

    // Esperar a que aparezca la notificación de rechazo
    await expect(page.locator('[data-testid="permission-rejection-notice"]')).toBeVisible();

    // Verificar mensaje de error
    await expect(page.locator('text=Permiso de ubicación denegado por el usuario')).toBeVisible();
  });

  test('debe permitir reintentar con GPS', async ({ page }) => {
    // Solicitar ubicación
    await page.click('[data-testid="request-location-btn"]');

    // Esperar notificación de rechazo
    await expect(page.locator('[data-testid="permission-rejection-notice"]')).toBeVisible();

    // Hacer clic en reintentar
    await page.click('[data-testid="permission-rejection-retry"]');

    // Verificar que se intenta nuevamente
    await expect(page.locator('[data-testid="permission-rejection-notice"]')).toBeVisible();
  });

  test('debe permitir usar ubicación por IP', async ({ page }) => {
    // Mock de respuesta de IP
    await page.route('https://ipapi.co/json/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          latitude: 40.7128,
          longitude: -74.0060,
          city: 'New York',
          country_name: 'United States'
        })
      });
    });

    // Solicitar ubicación
    await page.click('[data-testid="request-location-btn"]');

    // Esperar notificación de rechazo
    await expect(page.locator('[data-testid="permission-rejection-notice"]')).toBeVisible();

    // Hacer clic en usar IP
    await page.click('[data-testid="permission-rejection-ip"]');

    // Verificar que se obtiene ubicación por IP
    await expect(page.locator('text=Ubicación obtenida (IP)')).toBeVisible();
  });

  test('debe permitir descartar notificación', async ({ page }) => {
    // Solicitar ubicación
    await page.click('[data-testid="request-location-btn"]');

    // Esperar notificación de rechazo
    await expect(page.locator('[data-testid="permission-rejection-notice"]')).toBeVisible();

    // Hacer clic en descartar
    await page.click('[data-testid="permission-rejection-dismiss"]');

    // Verificar que la notificación desaparece
    await expect(page.locator('[data-testid="permission-rejection-notice"]')).not.toBeVisible();
  });

  test('debe mostrar opción de ubicación aproximada en modal GDPR', async ({ page }) => {
    // Solicitar consentimiento GDPR
    await page.click('[data-testid="request-consent-btn"]');

    // Verificar que aparece el modal
    await expect(page.locator('[data-testid="gdpr-modal"]')).toBeVisible();

    // Verificar que aparece la opción de ubicación aproximada
    await expect(page.locator('[data-testid="gdpr-modal-use-ip"]')).toBeVisible();
    await expect(page.locator('text=📍 Usar ubicación aproximada')).toBeVisible();
  });

  test('debe manejar error de geolocalización no soportada', async ({ page }) => {
    // Mock de navegador sin geolocalización
    await page.addInitScript(() => {
      delete (navigator as any).geolocation;
    });

    await page.reload();

    // Solicitar ubicación
    await page.click('[data-testid="request-location-btn"]');

    // Verificar mensaje de error apropiado
    await expect(page.locator('text=Geolocalización no soportada en este navegador')).toBeVisible();
  });

  test('debe manejar timeout de geolocalización', async ({ page }) => {
    // Mock de timeout
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: any, error: any) => {
            setTimeout(() => {
              error({
                code: 3, // TIMEOUT
                message: 'Geolocation request timed out'
              });
            }, 100);
          }
        },
        writable: true
      });
    });

    await page.reload();

    // Solicitar ubicación
    await page.click('[data-testid="request-location-btn"]');

    // Verificar mensaje de timeout
    await expect(page.locator('text=Tiempo de espera agotado para obtener ubicación')).toBeVisible();
  });

  test('debe manejar posición no disponible', async ({ page }) => {
    // Mock de posición no disponible
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: any, error: any) => {
            error({
              code: 2, // POSITION_UNAVAILABLE
              message: 'Position information is unavailable'
            });
          }
        },
        writable: true
      });
    });

    await page.reload();

    // Solicitar ubicación
    await page.click('[data-testid="request-location-btn"]');

    // Verificar mensaje de posición no disponible
    await expect(page.locator('text=Información de ubicación no disponible')).toBeVisible();
  });

  test('debe mostrar información de ayuda en notificación', async ({ page }) => {
    // Solicitar ubicación
    await page.click('[data-testid="request-location-btn"]');

    // Esperar notificación de rechazo
    await expect(page.locator('[data-testid="permission-rejection-notice"]')).toBeVisible();

    // Verificar información de ayuda
    await expect(page.locator('text=💡 Consejo: Para permitir ubicación')).toBeVisible();
    await expect(page.locator('text=haga clic en el ícono de ubicación')).toBeVisible();
  });

  test('debe mantener estado de permisos entre navegaciones', async ({ page }) => {
    // Solicitar ubicación
    await page.click('[data-testid="request-location-btn"]');

    // Verificar que se marca como intentado
    await expect(page.locator('text=Intentó GPS: Sí')).toBeVisible();

    // Navegar a otra página y volver
    await page.goto('/');
    await page.goto('/gdpr-test');

    // Verificar que el estado se mantiene
    await expect(page.locator('text=Intentó GPS: Sí')).toBeVisible();
  });
});
