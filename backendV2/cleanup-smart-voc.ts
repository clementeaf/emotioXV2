#!/usr/bin/env ts-node

/**
 * Script para eliminar todo el contenido SmartVOC de la tabla DynamoDB
 * NOTA: Esto NO elimina la tabla, solo los items con SK = 'SMART_VOC_FORM'
 */

import { SmartVOCFormModel } from './src/models/smartVocForm.model';

interface CleanupResult {
  totalFound: number;
  totalDeleted: number;
  errors: string[];
  deletedItems: string[];
}

async function cleanupSmartVOCContent(): Promise<CleanupResult> {
  console.log('🧹 Iniciando limpieza de contenido SmartVOC...');
  
  const result: CleanupResult = {
    totalFound: 0,
    totalDeleted: 0,
    errors: [],
    deletedItems: []
  };

  try {
    // Inicializar el modelo
    const smartVOCModel = new SmartVOCFormModel();
    
    // Obtener todos los formularios SmartVOC
    console.log('📋 Escaneando tabla para encontrar items SmartVOC...');
    const allForms = await smartVOCModel.getAll();
    
    result.totalFound = allForms.length;
    console.log(`📊 Encontrados ${result.totalFound} formularios SmartVOC`);
    
    if (result.totalFound === 0) {
      console.log('✅ No hay contenido SmartVOC para eliminar');
      return result;
    }

    // Mostrar items que se van a eliminar
    console.log('\n📝 Items a eliminar:');
    allForms.forEach((form, index) => {
      console.log(`  ${index + 1}. ID: ${form.id}`);
      console.log(`     Research ID: ${form.researchId}`);
      console.log(`     Preguntas: ${form.questions.length}`);
      console.log(`     Creado: ${form.createdAt}`);
      console.log('');
    });

    // Confirmar eliminación (en modo interactivo)
    if (process.argv.includes('--interactive')) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const confirmation = await new Promise<string>((resolve) => {
        rl.question(`⚠️  ¿Estás seguro de que quieres eliminar ${result.totalFound} formularios SmartVOC? (escribe 'CONFIRMAR' para continuar): `, resolve);
      });

      rl.close();

      if (confirmation !== 'CONFIRMAR') {
        console.log('❌ Operación cancelada por el usuario');
        return result;
      }
    }

    // Eliminar cada formulario
    console.log('\n🗑️  Iniciando eliminación...');
    
    for (let i = 0; i < allForms.length; i++) {
      const form = allForms[i];
      try {
        console.log(`  Eliminando ${i + 1}/${allForms.length}: ${form.id}...`);
        await smartVOCModel.delete(form.id);
        result.totalDeleted++;
        result.deletedItems.push(form.id);
        console.log(`    ✅ Eliminado: ${form.id}`);
      } catch (error: any) {
        const errorMsg = `Error eliminando ${form.id}: ${error.message}`;
        console.log(`    ❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

  } catch (error: any) {
    const errorMsg = `Error general durante la limpieza: ${error.message}`;
    console.error(`❌ ${errorMsg}`);
    result.errors.push(errorMsg);
  }

  return result;
}

async function main() {
  const startTime = Date.now();
  
  console.log('🚀 Iniciando script de limpieza SmartVOC');
  console.log(`📅 Fecha: ${new Date().toISOString()}`);
  console.log(`🗄️  Tabla: ${process.env.DYNAMODB_TABLE || 'No especificada'}`);
  console.log(`🌍 Región: ${process.env.APP_REGION || 'us-east-1'}`);
  console.log('');

  const result = await cleanupSmartVOCContent();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n📊 RESUMEN DE LIMPIEZA:');
  console.log(`⏱️  Duración: ${duration} segundos`);
  console.log(`🔍 Items encontrados: ${result.totalFound}`);
  console.log(`✅ Items eliminados: ${result.totalDeleted}`);
  console.log(`❌ Errores: ${result.errors.length}`);
  
  if (result.deletedItems.length > 0) {
    console.log('\n🗑️  Items eliminados:');
    result.deletedItems.forEach(id => console.log(`  - ${id}`));
  }
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errores encontrados:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }

  const success = result.errors.length === 0 && result.totalDeleted === result.totalFound;
  
  if (success) {
    console.log('\n🎉 ¡Limpieza completada exitosamente!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Limpieza completada con errores');
    process.exit(1);
  }
}

// Ejecutar script solo si es llamado directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Error fatal en script de limpieza:', error);
    process.exit(1);
  });
}

export { cleanupSmartVOCContent, CleanupResult }; 