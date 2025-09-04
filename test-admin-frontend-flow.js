#!/usr/bin/env node

/**
 * Test automatizado para verificar que el frontend está consumiendo 
 * correctamente el endpoint AWS cuando se autentica en admin
 */

const puppeteer = require('puppeteer');

async function testAdminFlow() {
  console.log('🧪 Testing Admin Frontend to AWS API Flow\n');

  let browser;
  try {
    // Iniciar navegador
    browser = await puppeteer.launch({ 
      headless: false,  // Ver el navegador
      devtools: true,   // Abrir DevTools
      defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Interceptar requests de red para verificar llamadas a AWS
    const awsRequests = [];
    await page.setRequestInterception(true);
    
    page.on('request', (req) => {
      if (req.url().includes('execute-api.us-east-1.amazonaws.com')) {
        awsRequests.push({
          url: req.url(),
          method: req.method(),
          headers: req.headers()
        });
        console.log(`🌐 AWS API Call: ${req.method()} ${req.url()}`);
      }
      req.continue();
    });
    
    // Interceptar respuestas de red
    page.on('response', async (response) => {
      if (response.url().includes('execute-api.us-east-1.amazonaws.com')) {
        const status = response.status();
        console.log(`📡 AWS API Response: ${status} ${response.url()}`);
        
        if (response.url().includes('/admin/users')) {
          try {
            const data = await response.json();
            console.log(`✅ AWS API Data: ${data.success ? 'SUCCESS' : 'FAILED'}, Users: ${data.data?.length || 0}`);
          } catch (e) {
            console.log('⚠️ Could not parse AWS API response as JSON');
          }
        }
      }
    });
    
    console.log('🔗 Navegando a admin users page...');
    await page.goto('http://localhost:3000/admin/users');
    
    // Esperar a que la página cargue
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    console.log('🔐 Ingresando clave secreta...');
    // Ingresar la clave secreta
    await page.type('input[type="password"]', 'admin2025!');
    
    // Hacer click en "Acceder"
    await page.click('button:contains("Acceder")');
    
    // Esperar un poco para que se ejecute la autenticación y la llamada a la API
    await page.waitForTimeout(3000);
    
    // Verificar resultados
    console.log('\n📊 Test Results:');
    console.log('===============');
    
    if (awsRequests.length > 0) {
      console.log(`✅ SUCCESS: ${awsRequests.length} AWS API calls detected`);
      awsRequests.forEach((req, i) => {
        console.log(`   ${i+1}. ${req.method} ${req.url}`);
        console.log(`      Authorization: ${req.headers.authorization ? 'YES' : 'NO'}`);
      });
    } else {
      console.log('❌ FAILED: No AWS API calls detected');
    }
    
    // Verificar si hay usuarios en la página
    const usersTable = await page.$('table, .user-list, [data-testid="users"]');
    if (usersTable) {
      console.log('✅ SUCCESS: Users table/list found in DOM');
    } else {
      console.log('⚠️ WARNING: No users table/list found in DOM');
    }
    
    // Esperar un poco más para ver los resultados
    console.log('\n⏳ Waiting 10 seconds to observe results...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Verificar si puppeteer está disponible
try {
  require('puppeteer');
  testAdminFlow();
} catch (e) {
  console.log('⚠️ Puppeteer not available, running manual check instead...');
  
  // Manual check - verificar logs del servidor
  console.log('🔍 Manual verification steps:');
  console.log('1. Go to: http://localhost:3000/admin/users');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Go to Network tab');
  console.log('4. Enter secret key: admin2025!');
  console.log('5. Look for requests to: execute-api.us-east-1.amazonaws.com');
  console.log('6. Check Console for: "📡 Parsed JSON data"');
}