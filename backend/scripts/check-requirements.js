/**
 * Script para verificar requisitos de instalación
 * - Verifica las versiones de Node.js y npm
 * - Comprueba la instalación de AWS CLI
 * - Verifica la presencia de AWS credentials
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Requisitos mínimos
const REQUIREMENTS = {
  node: '14.0.0',
  npm: '6.0.0',
};

// Función principal
function checkRequirements() {
  console.log('🔍 Verificando requisitos de instalación...');
  
  let allPassed = true;
  
  // Verificar Node.js
  allPassed = checkNodeVersion() && allPassed;
  
  // Verificar npm
  allPassed = checkNpmVersion() && allPassed;
  
  // Verificar AWS CLI
  allPassed = checkAwsCli() && allPassed;
  
  // Verificar AWS credentials
  allPassed = checkAwsCredentials() && allPassed;
  
  if (allPassed) {
    console.log('✅ Todos los requisitos cumplidos. Listo para desplegar!');
    return 0;
  } else {
    console.error('❌ Algunos requisitos no se cumplen. Por favor, corrige los problemas antes de desplegar.');
    return 1;
  }
}

// Verificar versión de Node.js
function checkNodeVersion() {
  try {
    const nodeVersion = process.version.replace('v', '');
    console.log(`📋 Node.js versión: ${nodeVersion}`);
    
    if (compareVersions(nodeVersion, REQUIREMENTS.node) < 0) {
      console.error(`❌ Se requiere Node.js ${REQUIREMENTS.node} o superior. Actualmente: ${nodeVersion}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error al verificar la versión de Node.js:', error.message);
    return false;
  }
}

// Verificar versión de npm
function checkNpmVersion() {
  try {
    const npmVersion = execSync('npm --version').toString().trim();
    console.log(`📋 npm versión: ${npmVersion}`);
    
    if (compareVersions(npmVersion, REQUIREMENTS.npm) < 0) {
      console.error(`❌ Se requiere npm ${REQUIREMENTS.npm} o superior. Actualmente: ${npmVersion}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error al verificar la versión de npm:', error.message);
    return false;
  }
}

// Verificar AWS CLI
function checkAwsCli() {
  try {
    const awsVersionOutput = execSync('aws --version').toString().trim();
    console.log(`📋 AWS CLI: ${awsVersionOutput}`);
    return true;
  } catch (error) {
    console.error('❌ AWS CLI no está instalado o no está en el PATH. Por favor, instala AWS CLI.');
    console.error('   https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html');
    return false;
  }
}

// Verificar AWS credentials
function checkAwsCredentials() {
  try {
    // Verificar archivo de credenciales
    const credentialsPath = path.join(os.homedir(), '.aws', 'credentials');
    const configPath = path.join(os.homedir(), '.aws', 'config');
    
    if (!fs.existsSync(credentialsPath) && !fs.existsSync(configPath)) {
      console.error('❌ No se encontraron archivos de configuración de AWS.');
      console.error('   Ejecuta `aws configure` para configurar tus credenciales.');
      return false;
    }
    
    // Verificar si se pueden acceder a las credenciales
    try {
      execSync('aws sts get-caller-identity', { stdio: 'pipe' });
      console.log('✅ AWS credentials configuradas correctamente');
      return true;
    } catch (error) {
      console.error('❌ No se pudieron validar las credenciales de AWS. Asegúrate de tener configuradas tus credenciales correctamente.');
      console.error('   Error:', error.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error al verificar las credenciales de AWS:', error.message);
    return false;
  }
}

// Comparar versiones semánticas
function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const valA = partsA[i] || 0;
    const valB = partsB[i] || 0;
    
    if (valA > valB) return 1;
    if (valA < valB) return -1;
  }
  
  return 0;
}

// Ejecutar script si se llama directamente
if (require.main === module) {
  process.exit(checkRequirements());
}

module.exports = checkRequirements; 