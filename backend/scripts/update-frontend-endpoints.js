const fs = require('fs');
const path = require('path');

// Rutas de los archivos
const sourceFile = path.join(__dirname, '..', 'endpoints.json');
const targetFile = path.join(__dirname, '..', '..', 'frontend', 'src', 'config', 'endpoints.json');

// Función para copiar el archivo
function copyEndpointsFile() {
  try {
    // Leer el archivo de endpoints
    const endpoints = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
    
    // Crear el directorio de destino si no existe
    const targetDir = path.dirname(targetFile);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Escribir el archivo en el frontend
    fs.writeFileSync(targetFile, JSON.stringify(endpoints, null, 2));
    
    console.log('✅ Archivo endpoints.json copiado exitosamente al frontend');
  } catch (error) {
    console.error('❌ Error al copiar endpoints.json:', error);
    process.exit(1);
  }
}

copyEndpointsFile(); 