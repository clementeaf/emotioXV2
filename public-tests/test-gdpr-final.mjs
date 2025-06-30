#!/usr/bin/env node

/**
 * Test final para validar el modal de consentimiento GDPR
 */

import { chromium } from 'playwright';

const TEST_CONFIG = {
  localUrl: 'http://localhost:5173',
  timeout: 30000,
  headless: false
};

class FinalGDPRTest {
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
    console.log('🚀 Iniciando test final de GDPR...');
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

  async testWaitForGeolocation() {
    // Esperar a que termine la carga de geolocalización
    console.log('⏳ Esperando a que termine la carga de geolocalización...');

    // Esperar hasta que el botón esté habilitado o aparezca un error
    await this.page.waitForFunction(() => {
      const button = document.querySelector('[data-testid="request-location-button"]');
      const loadingText = document.querySelector('[data-testid="is-loading"]');
      const errorText = document.querySelector('[data-testid="geolocation-error"]');

      // Si hay error, continuar
      if (errorText && errorText.textContent) {
        return true;
      }

      // Si no está cargando, continuar
      if (loadingText && loadingText.textContent === 'No') {
        return true;
      }

      // Si el botón está habilitado, continuar
      if (button && !button.disabled) {
        return true;
      }

      return false;
    }, { timeout: 15000 });

    console.log('✅ Geolocalización terminó de cargar');
  }

  async testButtonsAreEnabled() {
    // Verificar que los botones están habilitados
    const requestButton = await this.page.locator('[data-testid="request-location-button"]');
    const resetButton = await this.page.locator('[data-testid="reset-button"]');

    if (!await requestButton.isVisible()) {
      throw new Error('Botón de solicitar ubicación no encontrado');
    }

    // Verificar si el botón está habilitado
    const isDisabled = await requestButton.isDisabled();
    if (isDisabled) {
      console.log('⚠️ Botón está deshabilitado, verificando estado...');

      // Verificar si hay error de geolocalización
      const errorElement = await this.page.locator('[data-testid="geolocation-error"]');
      if (await errorElement.isVisible()) {
        console.log('✅ Error de geolocalización detectado (esperado en test)');
        return;
      }

      throw new Error('Botón de solicitar ubicación está deshabilitado sin razón aparente');
    }

    console.log('✅ Botones están habilitados');
  }

  async testManualModalTrigger() {
    // Limpiar localStorage primero
    await this.page.evaluate(() => {
      localStorage.removeItem('emotio_gdpr_consent');
    });

    // Verificar si el botón está habilitado
    const requestButton = await this.page.locator('[data-testid="request-location-button"]');
    const isDisabled = await requestButton.isDisabled();

    if (isDisabled) {
      console.log('⚠️ Botón deshabilitado, usando reset para limpiar estado...');
      await this.page.click('[data-testid="reset-button"]');
      await this.page.waitForTimeout(2000);
    }

    // Hacer clic en el botón de solicitar ubicación
    await this.page.click('[data-testid="request-location-button"]');
    await this.page.waitForTimeout(3000);

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

    if (!await modalTitle.isVisible()) {
      throw new Error('Título del modal no encontrado');
    }

    if (!await acceptButton.isVisible()) {
      throw new Error('Botón de aceptar no encontrado');
    }

    if (!await rejectButton.isVisible()) {
      throw new Error('Botón de rechazar no encontrado');
    }

    console.log('✅ Contenido del modal GDPR completo');
  }

  async testAcceptConsent() {
    // Aceptar consentimiento
    await this.page.click('[data-testid="gdpr-modal-accept"]');
    await this.page.waitForTimeout(3000);

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

    // Resetear estado
    await this.page.click('[data-testid="reset-button"]');
    await this.page.waitForTimeout(2000);

    // Hacer clic en solicitar ubicación para mostrar modal
    await this.page.click('[data-testid="request-location-button"]');
    await this.page.waitForTimeout(3000);

    // Rechazar consentimiento
    await this.page.click('[data-testid="gdpr-modal-reject"]');
    await this.page.waitForTimeout(3000);

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

  async testPersistence() {
    // Verificar que el modal no aparece después de haber consentido
    await this.page.reload();
    await this.page.waitForTimeout(3000);

    // Verificar que el modal no aparece
    const modal = await this.page.locator('[data-testid="gdpr-modal"]');
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

    console.log('✅ Persistencia del consentimiento funciona correctamente');
  }

  async runAllTests() {
    try {
      await this.init();

      await this.runTest('Página se carga correctamente', () => this.testPageLoads());
      await this.runTest('Componente existe', () => this.testComponentExists());
      await this.runTest('Esperar carga de geolocalización', () => this.testWaitForGeolocation());
      await this.runTest('Botones están habilitados', () => this.testButtonsAreEnabled());
      await this.runTest('Modal aparece manualmente', () => this.testManualModalTrigger());
      await this.runTest('Contenido del modal completo', () => this.testModalContent());
      await this.runTest('Aceptar consentimiento funciona', () => this.testAcceptConsent());
      await this.runTest('Rechazar consentimiento funciona', () => this.testRejectConsent());
      await this.runTest('Persistencia del consentimiento', () => this.testPersistence());

      this.printResults();
    } catch (error) {
      console.error('❌ Error durante la ejecución de tests:', error);
    } finally {
      await this.cleanup();
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DEL TEST FINAL DE GDPR');
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
  const test = new FinalGDPRTest();
  await test.runAllTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
