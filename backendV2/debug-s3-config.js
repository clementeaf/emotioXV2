#!/usr/bin/env node

/**
 * Script para debuggear la configuración actual del S3Service
 */

const { S3Service } = require('./src/services/s3.service.ts');

async function debugS3Config() {
    console.log('🔍 Debuggeando configuración S3...');
    console.log('');
    
    // Mostrar variables de entorno relevantes
    console.log('📋 Variables de entorno:');
    console.log(`   S3_BUCKET_NAME: ${process.env.S3_BUCKET_NAME || 'undefined'}`);
    console.log(`   APP_REGION: ${process.env.APP_REGION || 'undefined'}`);
    console.log(`   STAGE: ${process.env.STAGE || 'undefined'}`);
    console.log(`   SERVICE_NAME: ${process.env.SERVICE_NAME || 'undefined'}`);
    console.log('');
    
    // Crear instancia de S3Service para ver la configuración
    try {
        console.log('🏗️  Creando instancia de S3Service...');
        const s3Service = new S3Service();
        console.log('✅ S3Service creado exitosamente');
        
        // Intentar generar una URL presignada de prueba
        console.log('');
        console.log('🧪 Probando generación de URL presignada...');
        
        const testParams = {
            researchId: '43e990f2-c475-4fd2-e66d-b1e3094d5e15',
            folder: 'cognitive-task',
            fileName: 'test-debug.jpg',
            fileType: 'image',
            mimeType: 'image/jpeg',
            fileSize: 1024000,
            expiresIn: 15 * 60
        };
        
        console.log('📝 Parámetros de prueba:', JSON.stringify(testParams, null, 2));
        
        const result = await s3Service.generateUploadUrl(testParams);
        console.log('✅ URL presignada generada exitosamente!');
        console.log('📋 Resultado:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.log('❌ Error al generar URL presignada:');
        console.log(`   Mensaje: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
    }
}

// Simular variables de entorno del servidor
process.env.APP_REGION = 'us-east-1';
process.env.STAGE = 'dev';
process.env.SERVICE_NAME = 'emotioxv2-backend';

debugS3Config().catch(console.error);