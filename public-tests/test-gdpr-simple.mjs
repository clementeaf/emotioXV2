#!/usr/bin/env node

/**
 * Test simple para validar el modal de consentimiento GDPR
 */

import { chromium } from 'playwright';

const TEST_CONFIG = {
  localUrl: 'http://localhost:5173',
  timeout: 30000,
  headless: false
};

class SimpleGDPRTest {
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
    console.log('🚀 Iniciando test simple de GDPR...');
    this.browser = await chromium.launch({
      headless: TEST_CONFIG.headless,
      args: ['--disable-web-security']
    });

    const context = await this.browser.newContext({
      permissions: ['geolocation'],
      geolocation: { latitude: 40.4168, longitude: -3.7038 },
      locale: 'es-ES'
    });

    this.page = await context.newPage();
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

  async testPageLoads() {
    await this.page.goto(`${TEST_CONFIG.localUrl}/gdpr-test`);
    await this.page.waitForTimeout(3000);

    // Verificar que la página se carga
    const title = await this.page.locator('text=Test de Consentimiento GDPR');
    if (!await title.isVisible()) {
      throw new Error('Página de test GDPR no se cargó correctamente');
    }

    console.log('✅ Página cargada correctamente');
  }

  async testComponentExists() {
    // Verificar que el componente de ejemplo existe
    const component = await this.page.locator('text=Geolocalización con Consentimiento GDPR');
    if (!await component.isVisible()) {
      throw new Error('Componente GDPRGeolocationExample no se renderizó');
    }

    console.log('✅ Componente GDPRGeolocationExample encontrado');
  }

  async testButtonsExist() {
    // Verificar que los botones existen
    const requestButton = await this.page.locator('[data-testid="request-location-button"]');
    const resetButton = await this.page.locator('[data-testid="reset-button"]');

    if (!await requestButton.isVisible() || !await resetButton.isVisible()) {
      throw new Error('Botones de control no encontrados');
    }

    console.log('✅ Botones de control encontrados');
  }

  async testManualModalTrigger() {
    // Limpiar localStorage primero
    await this.page.evaluate(() => {
      localStorage.removeItem('emotio_gdpr_consent');
    });

    // Hacer clic en el botón de solicitar ubicación
    await this.page.click('[data-testid="request-location-button"]');
    await this.page.waitForTimeout(2000);

    // Verificar que el modal aparece
    const modal = await this.page.locator('[data-testid="gdpr-modal"]');
    if (!await modal.isVisible()) {
      throw new Error('Modal GDPR no apareció después de hacer clic en solicitar ubicación');
    }

    console.log('✅ Modal GDPR apareció correctamente');
  }

  async testModalContent() {
    // Verificar contenido del modal
    const modalTitle = await this.page.locator('[data-testid="gdpr-modal-title"]');
    const acceptButton = await this.page.locator('[data-testid="gdpr-modal-accept"]');
    const rejectButton = await this.page.locator('[data-testid="gdpr-modal-reject"]');

    if (!await modalTitle.isVisible() || !await acceptButton.isVisible() || !await rejectButton.isVisible()) {
      throw new Error('Contenido del modal GDPR incompleto');
    }

    console.log('✅ Contenido del modal GDPR completo');
  }

  async testAcceptConsent() {
    // Aceptar consentimiento
    await this.page.click('[data-testid="gdpr-modal-accept"]');
    await this.page.waitForTimeout(2000);

    // Verificar que el modal se cierra
    const modal = await this.page.locator('[data-testid="gdpr-modal"]');
    if (await modal.isVisible()) {
      throw new Error('Modal no se cerró después de aceptar');
    }

    // Verificar localStorage
    const localStorage = await this.page.evaluate(() => {
      return localStorage.getItem('emotio_gdpr_consent');
    });

    if (!localStorage) {
      throw new Error('Consentimiento no se guardó en localStorage');
    }

    const consentData = JSON.parse(localStorage);
    if (!consentData.hasConsented) {
      throw new Error('Estado de consentimiento incorrecto');
    }

    console.log('✅ Consentimiento aceptado y guardado correctamente');
  }

  async testRejectConsent() {
    // Limpiar localStorage
    await this.page.evaluate(() => {
      localStorage.removeItem('emotio_gdpr_consent');
    });

    // Hacer clic en solicitar ubicación para mostrar modal
    await this.page.click('[data-testid="request-location-button"]');
    await this.page.waitForTimeout(2000);

    // Rechazar consentimiento
    await this.page.click('[data-testid="gdpr-modal-reject"]');
    await this.page.waitForTimeout(2000);

    // Verificar localStorage
    const localStorage = await this.page.evaluate(() => {
      return localStorage.getItem('emotio_gdpr_consent');
    });

    if (!localStorage) {
      throw new Error('Rechazo no se guardó en localStorage');
    }

    const consentData = JSON.parse(localStorage);
    if (!consentData.hasRejected) {
      throw new Error('Estado de rechazo incorrecto');
    }

    console.log('✅ Consentimiento rechazado y guardado correctamente');
  }

  async runAllTests() {
    try {
      await this.init();

      await this.runTest('Página se carga correctamente', () => this.testPageLoads());
      await this.runTest('Componente existe', () => this.testComponentExists());
      await this.runTest('Botones de control existen', () => this.testButtonsExist());
      await this.runTest('Modal aparece manualmente', () => this.testManualModalTrigger());
      await this.runTest('Contenido del modal completo', () => this.testModalContent());
      await this.runTest('Aceptar consentimiento funciona', () => this.testAcceptConsent());
      await this.runTest('Rechazar consentimiento funciona', () => this.testRejectConsent());

      this.printResults();
    } catch (error) {
      console.error('❌ Error durante la ejecución de tests:', error);
    } finally {
      await this.cleanup();
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DEL TEST SIMPLE DE GDPR');
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
  const test = new SimpleGDPRTest();
  await test.runAllTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
