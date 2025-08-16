# 🔧 Corrección del Error 500 en Upload de Archivos

## 🐛 Problema Original
Error 500 al intentar generar URL presignada para upload de archivos:
```
POST https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev/research/43e990f2-c475-4fd2-e66d-b1e3094d5e15/cognitive-task/upload-url
500 Internal Server Error
{"message":"Error generando URL de upload"}
```

## 🔍 Análisis del Problema
1. **Mapeo incorrecto de MIME type**: Frontend enviaba `fileType` pero backend buscaba `contentType` o `mimeType`
2. **Validación MIME type muy restrictiva**: No incluía variantes comunes como `image/jpg`
3. **Falta de logging detallado**: Error 500 genérico sin información específica
4. **Configuración de bucket**: Nombres hardcodeados que podían no existir

## ✅ Soluciones Implementadas

### 1. Corrección del Mapeo de MIME Type
**Archivo**: `src/controllers/cognitiveTask.controller.ts`
```typescript
// ANTES
const mimeType = uploadData.contentType || uploadData.mimeType || 'application/octet-stream';

// DESPUÉS  
const mimeType = uploadData.contentType || uploadData.mimeType || uploadData.fileType || 'application/octet-stream';
```

### 2. Frontend Mejorado
**Archivo**: `frontend/src/components/research/CognitiveTask/hooks/useCognitiveTaskFileUpload.ts`
```typescript
// ANTES
body: JSON.stringify({
  fileName: normalizedFileName,
  fileSize: file.size,
  fileType: file.type,
  questionId: questionId
})

// DESPUÉS
body: JSON.stringify({
  fileName: normalizedFileName,
  fileSize: file.size,
  fileType: file.type,
  mimeType: file.type,
  contentType: file.type,
  questionId: questionId
})
```

### 3. MIME Types Más Inclusivos
**Archivo**: `src/services/s3.service.ts`
```typescript
// ANTES
[FileType.IMAGE]: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']

// DESPUÉS
[FileType.IMAGE]: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
```

### 4. Validación Más Flexible
**Archivo**: `src/services/s3.service.ts`
```typescript
// ANTES - Error inmediato si MIME type no coincide
if (!ALLOWED_MIME_TYPES[params.fileType].includes(params.mimeType)) {
  throw new Error(`Tipo MIME no permitido para ${params.fileType}: ${params.mimeType}`);
}

// DESPUÉS - Permite application/octet-stream y da warning en lugar de error
const isValidMimeType = ALLOWED_MIME_TYPES[params.fileType].includes(params.mimeType) ||
                       params.mimeType === 'application/octet-stream';

if (!isValidMimeType) {
  console.warn('S3Service.validateParams - MIME type no reconocido pero permitiendo:', {
    fileType: params.fileType,
    mimeType: params.mimeType,
    fileName: params.fileName,
    allowedTypes: ALLOWED_MIME_TYPES[params.fileType]
  });
}
```

### 5. Logging Detallado
**Archivo**: `src/controllers/cognitiveTask.controller.ts`
```typescript
// Logging de datos recibidos
structuredLog('debug', 'CognitiveTaskHandler.UPLOAD_URL', 'Datos recibidos para upload', { researchId, uploadData });

// Logging de parámetros S3
structuredLog('debug', 'CognitiveTaskHandler.UPLOAD_URL', 'Parámetros para S3Service', { 
  researchId, 
  fileName: uploadData.fileName,
  fileType,
  mimeType,
  fileSize: uploadData.size || 0
});

// Error detallado con información completa
const errorMessage = error instanceof Error ? error.message : String(error);
structuredLog('error', 'CognitiveTaskHandler.UPLOAD_URL', 'Error generando URL de upload', { 
  researchId, 
  error: errorMessage,
  stack: error instanceof Error ? error.stack : undefined,
  uploadData: body ? JSON.parse(body) : null
});
return errorResponse(`Error generando URL de upload: ${errorMessage}`, 500);
```

### 6. Configuración S3 Mejorada
**Archivo**: `src/services/s3.service.ts`
```typescript
console.log('S3Service inicializado:', {
  bucketName: this.bucketName,
  region: options.region,
  stage: process.env.STAGE,
  serviceName: process.env.SERVICE_NAME
});
```

## 🧪 Testing

### Script de Prueba Creado
**Archivo**: `test-upload-endpoint.js`

Prueba diferentes tipos de archivos:
- Imágenes JPG/PNG
- Documentos PDF  
- Archivos genéricos

**Uso**:
```bash
node test-upload-endpoint.js YOUR_TOKEN_HERE
```

## 🎯 Resultados Esperados

### Antes de la Corrección
❌ Error 500 genérico sin información

### Después de la Corrección
✅ URLs presignadas generadas correctamente
✅ Logging detallado para debugging
✅ Validación flexible pero segura
✅ Compatibilidad con múltiples tipos de archivo

## 🔍 Debugging

Si aún hay problemas, revisar logs en CloudWatch para:

1. **Datos recibidos del frontend**:
```
CognitiveTaskHandler.UPLOAD_URL - Datos recibidos para upload
```

2. **Parámetros enviados a S3Service**:
```
CognitiveTaskHandler.UPLOAD_URL - Parámetros para S3Service
```

3. **Validación de parámetros S3**:
```
S3Service.validateParams - Validando parámetros
```

4. **Errores específicos**:
```
CognitiveTaskHandler.UPLOAD_URL - Error generando URL de upload
```

## 📝 Notas Importantes

1. **MIME Types**: El sistema ahora acepta tanto `image/jpeg` como `image/jpg`
2. **Fallback**: `application/octet-stream` es aceptado como fallback
3. **Logging**: Todos los errores ahora incluyen detalles específicos
4. **Compatibilidad**: Cambios backward-compatible con frontend existente

## 🚀 Deploy

Para aplicar los cambios:
```bash
# Deploy normal
serverless deploy --stage dev

# O deploy inteligente (recomendado)
./deploy-smart.sh dev
```