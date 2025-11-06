/**
 * Script para copiar archivos de declaración de tipos a node_modules/@types/
 * Esto asegura que TypeScript los encuentre con moduleResolution: "node"
 */

const fs = require('fs');
const path = require('path');

const sourceTypesDir = path.join(__dirname, '..', 'types');
const targetTypesDir = path.join(__dirname, '..', 'node_modules', '@types');

// Crear directorios de destino si no existen
const seesoTargetDir = path.join(targetTypesDir, 'seeso');
const webgazerTargetDir = path.join(targetTypesDir, 'webgazer');

if (!fs.existsSync(seesoTargetDir)) {
  fs.mkdirSync(seesoTargetDir, { recursive: true });
}

if (!fs.existsSync(webgazerTargetDir)) {
  fs.mkdirSync(webgazerTargetDir, { recursive: true });
}

// Copiar archivos de declaración
const seesoSource = path.join(sourceTypesDir, 'seeso.d.ts');
const seesoTarget = path.join(seesoTargetDir, 'index.d.ts');

const webgazerSource = path.join(sourceTypesDir, 'webgazer.d.ts');
const webgazerTarget = path.join(webgazerTargetDir, 'index.d.ts');

if (fs.existsSync(seesoSource)) {
  fs.copyFileSync(seesoSource, seesoTarget);
  console.log('✅ Copiado seeso.d.ts a node_modules/@types/seeso/index.d.ts');
}

if (fs.existsSync(webgazerSource)) {
  fs.copyFileSync(webgazerSource, webgazerTarget);
  console.log('✅ Copiado webgazer.d.ts a node_modules/@types/webgazer/index.d.ts');
}

console.log('✅ Setup de tipos completado');

