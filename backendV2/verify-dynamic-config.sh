#!/bin/bash

echo "🔍 Verificando configuración dinámica..."

# Verificar que no hay nombres hardcodeados
echo "📋 Verificando nombres hardcodeados..."

# Buscar referencias hardcodeadas al bucket
HARDCODED_BUCKET=$(grep -r "emotioxv2-uploads-dev" serverless.yml environment-variables.yml iam-permissions.yml resources.yml 2>/dev/null)
if [ -n "$HARDCODED_BUCKET" ]; then
    echo "❌ Encontradas referencias hardcodeadas al bucket:"
    echo "$HARDCODED_BUCKET"
    exit 1
else
    echo "✅ No se encontraron referencias hardcodeadas al bucket"
fi

# Buscar referencias hardcodeadas a la tabla
HARDCODED_TABLE=$(grep -r "emotioxv2-backend-table-dev" serverless.yml environment-variables.yml iam-permissions.yml resources.yml 2>/dev/null)
if [ -n "$HARDCODED_TABLE" ]; then
    echo "❌ Encontradas referencias hardcodeadas a la tabla:"
    echo "$HARDCODED_TABLE"
    exit 1
else
    echo "✅ No se encontraron referencias hardcodeadas a la tabla"
fi

# Verificar que el serverless.yml usa referencias dinámicas
echo "📋 Verificando referencias dinámicas en serverless.yml..."
if grep -q "s3BucketName.*\${self:service}" serverless.yml; then
    echo "✅ Bucket S3 usa referencia dinámica"
else
    echo "❌ Bucket S3 no usa referencia dinámica"
    exit 1
fi

# Verificar que environment-variables.yml usa referencias dinámicas  
echo "📋 Verificando referencias dinámicas en environment-variables.yml..."
if grep -q "\${self:custom.tableName}" environment-variables.yml; then
    echo "✅ DYNAMODB_TABLE usa referencia dinámica"
else
    echo "❌ DYNAMODB_TABLE no usa referencia dinámica"
    exit 1
fi

# Verificar sintaxis de serverless
echo "📋 Verificando sintaxis de serverless..."
if command -v serverless &> /dev/null; then
    if serverless print --stage test-validation 2>/dev/null >/dev/null; then
        echo "✅ Sintaxis de serverless válida"
    else
        echo "❌ Error en sintaxis de serverless"
        exit 1
    fi
else
    echo "⚠️  Serverless no instalado, no se puede verificar sintaxis"
fi

echo "🎉 Configuración dinámica verificada correctamente"
echo ""
echo "📝 Resumen de cambios realizados:"
echo "   • Bucket S3: Ahora usa \${self:service}-uploads-\${self:provider.stage}"
echo "   • DynamoDB: Ahora usa \${self:custom.tableName}"
echo "   • IAM: Ahora usa CloudFormation refs (!GetAtt, !Sub)"
echo "   • Variables de entorno: Todas dinámicas"
echo ""
echo "✨ La aplicación ahora se puede desplegar en cualquier cuenta AWS sin conflictos"