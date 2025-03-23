const { exec } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const stage = process.argv[2] || 'dev';

// Función para ejecutar comandos
const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error ejecutando comando: ${error}`);
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
};

async function checkAwsCredentials() {
  try {
    console.log(`Verificando credenciales AWS para el entorno: ${stage}`);

    // Verificar que aws-cli está instalado
    try {
      await execCommand('aws --version');
      console.log('✅ AWS CLI está instalado');
    } catch (error) {
      console.error('❌ AWS CLI no está instalado. Por favor, instálalo primero.');
      process.exit(1);
    }

    // Verificar que tenemos credenciales configuradas
    try {
      const identity = await execCommand('aws sts get-caller-identity');
      console.log('✅ Credenciales AWS configuradas correctamente');
      console.log(identity);
    } catch (error) {
      console.error('❌ Error al verificar credenciales AWS. Asegúrate de configurar tus credenciales.');
      console.error('Ejecuta: aws configure');
      process.exit(1);
    }

    // Verificar permisos necesarios
    const requiredServices = ['lambda', 'apigateway', 'dynamodb', 'ses'];
    for (const service of requiredServices) {
      try {
        await execCommand(`aws ${service} help`);
        console.log(`✅ Acceso a ${service} verificado`);
      } catch (error) {
        console.error(`❌ Error al verificar acceso a ${service}`);
        console.error('Asegúrate de tener los permisos necesarios configurados en IAM');
        process.exit(1);
      }
    }

    console.log('✅ Todas las verificaciones completadas exitosamente');
  } catch (error) {
    console.error('Error durante la verificación:', error);
    process.exit(1);
  }
}

checkAwsCredentials(); 