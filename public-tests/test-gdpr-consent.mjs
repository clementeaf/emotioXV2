#!/usr/bin/env node

/**
 * Test automatizado para validar el modal de consentimiento GDPR
 * y su integración con geolocalización
 */

import { chromium } from 'playwright';

const TEST_CONFIG = {
  localUrl: 'http://localhost:5173',
  productionUrl: 'https://emotiox.com',
  timeout: 30000,
  headless: false // Cambiar a true para ejecutar sin interfaz gráfica
};

class GDPRConsentTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async init() {
    console.log('🚀 Iniciando test de consentimiento GDPR...');
    this.browser = await chromium.launch({
      headless: TEST_CONFIG.headless,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });

    // Crear contexto con permisos de geolocalización
    const context = await this.browser.newContext({
      permissions: ['geolocation'],
      geolocation: { latitude: 40.4168, longitude: -3.7038 },
      locale: 'es-ES'
    });

    this.page = await context.newPage();

    // Interceptar y mockear la API de geolocalización
    await this.page.addInitScript(() => {
      // Mock de geolocalización para testing
      if (navigator.geolocation) {
        const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
        navigator.geolocation.getCurrentPosition = function(success, error, options) {
          // Simular ubicación de Madrid
          const mockPosition = {
            coords: {
              latitude: 40.4168,
              longitude: -3.7038,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          };
          setTimeout(() => success(mockPosition), 100);
        };
      }
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTest(testName, testFunction) {
    this.results.total++;
    console.log(`\n📋 Ejecutando: ${testName}`);

    try {
      await testFunction();
      this.results.passed++;
      console.log(`✅ ${testName} - PASÓ`);
      this.results.details.push({ test: testName, status: 'PASSED' });
    } catch (error) {
      this.results.failed++;
      console.log(`❌ ${testName} - FALLÓ: ${error.message}`);
      this.results.details.push({ test: testName, status: 'FAILED', error: error.message });
    }
  }

  async testModalRendering() {
    await this.page.goto(`${TEST_CONFIG.localUrl}/#gdpr-test`);
    await this.page.waitForTimeout(3000);

    // Verificar que el modal se renderiza correctamente
    const modal = await this.page.locator('[data-testid="gdpr-modal"]').first();
    if (!await modal.isVisible()) {
      throw new Error('Modal GDPR no es visible');
    }

    // Verificar elementos del modal
    const title = await this.page.locator('text=Consentimiento de Geolocalización');
    if (!await title.isVisible()) {
      throw new Error('Título del modal no encontrado');
    }

    const acceptButton = await this.page.locator('button:has-text("Aceptar")');
    const rejectButton = await this.page.locator('button:has-text("Rechazar")');

    if (!await acceptButton.isVisible() || !await rejectButton.isVisible()) {
      throw new Error('Botones de aceptar/rechazar no encontrados');
    }
  }

  async testAcceptConsent() {
    await this.page.goto(`${TEST_CONFIG.localUrl}/#gdpr-test`);
    await this.page.waitForTimeout(3000);

    // Hacer clic en aceptar
    await this.page.click('button:has-text("Aceptar")');
    await this.page.waitForTimeout(2000);

    // Verificar que el modal se cierra
    const modal = await this.page.locator('[data-testid="gdpr-modal"]').first();
    if (await modal.isVisible()) {
      throw new Error('Modal no se cerró después de aceptar');
    }

    // Verificar que se guarda el consentimiento en localStorage
    const localStorage = await this.page.evaluate(() => {
      return localStorage.getItem('emotio_gdpr_consent');
    });

    if (!localStorage) {
      throw new Error('Consentimiento no se guardó en localStorage');
    }

    const consentData = JSON.parse(localStorage);
    if (!consentData.hasConsented || consentData.hasRejected) {
      throw new Error('Estado de consentimiento incorrecto después de aceptar');
    }
  }

  async testRejectConsent() {
    await this.page.goto(`${TEST_CONFIG.localUrl}/#gdpr-test`);
    await this.page.waitForTimeout(3000);

    // Hacer clic en rechazar
    await this.page.click('button:has-text("Rechazar")');
    await this.page.waitForTimeout(2000);

    // Verificar que el modal se cierra
    const modal = await this.page.locator('[data-testid="gdpr-modal"]').first();
    if (await modal.isVisible()) {
      throw new Error('Modal no se cerró después de rechazar');
    }

    // Verificar que se guarda el rechazo en localStorage
    const localStorage = await this.page.evaluate(() => {
      return localStorage.getItem('emotio_gdpr_consent');
    });

    if (!localStorage) {
      throw new Error('Rechazo no se guardó en localStorage');
    }

    const consentData = JSON.parse(localStorage);
    if (consentData.hasConsented || !consentData.hasRejected) {
      throw new Error('Estado de rechazo incorrecto');
    }
  }

  async testGeolocationAfterConsent() {
    await this.page.goto(`${TEST_CONFIG.localUrl}/#gdpr-test`);
    await this.page.waitForTimeout(3000);

    // Aceptar consentimiento
    await this.page.click('button:has-text("Aceptar")');
    await this.page.waitForTimeout(3000);

    // Verificar que se obtiene la ubicación
    const locationData = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const locationElement = document.querySelector('[data-testid="location-data"]');
          if (locationElement) {
            resolve(locationElement.textContent);
          } else {
            resolve(null);
          }
        }, 3000);
      });
    });

    if (!locationData) {
      throw new Error('No se obtuvieron datos de ubicación después del consentimiento');
    }
  }

  async testGeolocationWithoutConsent() {
    // Limpiar localStorage
    await this.page.evaluate(() => {
      localStorage.removeItem('emotio_gdpr_consent');
    });

    await this.page.goto(`${TEST_CONFIG.localUrl}/#gdpr-test`);
    await this.page.waitForTimeout(3000);

    // Rechazar consentimiento
    await this.page.click('button:has-text("Rechazar")');
    await this.page.waitForTimeout(3000);

    // Verificar que NO se obtiene ubicación precisa
    const locationData = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const gpsElement = document.querySelector('[data-testid="gps-coordinates"]');
          resolve(gpsElement ? gpsElement.textContent : null);
        }, 3000);
      });
    });

    if (locationData && locationData.includes('40.4168')) {
      throw new Error('Se obtuvo ubicación GPS sin consentimiento');
    }
  }

  async testPersistence() {
    // Aceptar consentimiento
    await this.page.goto(`${TEST_CONFIG.localUrl}/#gdpr-test`);
    await this.page.waitForTimeout(3000);
    await this.page.click('button:has-text("Aceptar")');
    await this.page.waitForTimeout(2000);

    // Recargar página
    await this.page.reload();
    await this.page.waitForTimeout(3000);

    // Verificar que el modal no aparece
    const modal = await this.page.locator('[data-testid="gdpr-modal"]').first();
    if (await modal.isVisible()) {
      throw new Error('Modal aparece después de haber consentido');
    }

    // Verificar que se puede usar geolocalización
    const canUseGeolocation = await this.page.evaluate(() => {
      const consentElement = document.querySelector('[data-testid="can-use-geolocation"]');
      return consentElement ? consentElement.textContent.includes('Sí') : false;
    });

    if (!canUseGeolocation) {
      throw new Error('No se puede usar geolocalización después de consentir');
    }
  }

  async testResearchSpecificConsent() {
    // Limpiar localStorage
    await this.page.evaluate(() => {
      localStorage.removeItem('emotio_gdpr_consent');
    });

    await this.page.goto(`${TEST_CONFIG.localUrl}/#gdpr-test?researchId=test-research-123`);
    await this.page.waitForTimeout(3000);

    // Aceptar consentimiento
    await this.page.click('button:has-text("Aceptar")');
    await this.page.waitForTimeout(2000);

    // Verificar que se guarda con el researchId correcto
    const localStorage = await this.page.evaluate(() => {
      return localStorage.getItem('emotio_gdpr_consent');
    });

    const consentData = JSON.parse(localStorage);
    if (consentData.researchId !== 'test-research-123') {
      throw new Error('ResearchId no se guardó correctamente');
    }
  }

  async runAllTests() {
    try {
      await this.init();

      await this.runTest('Modal se renderiza correctamente', () => this.testModalRendering());
      await this.runTest('Aceptar consentimiento funciona', () => this.testAcceptConsent());
      await this.runTest('Rechazar consentimiento funciona', () => this.testRejectConsent());
      await this.runTest('Geolocalización después de consentir', () => this.testGeolocationAfterConsent());
      await this.runTest('Sin geolocalización sin consentimiento', () => this.testGeolocationWithoutConsent());
      await this.runTest('Persistencia del consentimiento', () => this.testPersistence());
      await this.runTest('Consentimiento específico por investigación', () => this.testResearchSpecificConsent());

      this.printResults();
    } catch (error) {
      console.error('❌ Error durante la ejecución de tests:', error);
    } finally {
      await this.cleanup();
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DEL TEST DE CONSENTIMIENTO GDPR');
    console.log('='.repeat(60));
    console.log(`✅ Pasaron: ${this.results.passed}`);
    console.log(`❌ Fallaron: ${this.results.failed}`);
    console.log(`📋 Total: ${this.results.total}`);
    console.log(`📈 Porcentaje de éxito: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

    if (this.results.failed > 0) {
      console.log('\n🔍 Detalles de fallos:');
      this.results.details
        .filter(detail => detail.status === 'FAILED')
        .forEach(detail => {
          console.log(`  ❌ ${detail.test}: ${detail.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Ejecutar tests
async function main() {
  const test = new GDPRConsentTest();
  await test.runAllTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
