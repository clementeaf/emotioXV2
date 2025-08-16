#!/bin/bash

# Script para detectar recursos AWS existentes antes del deploy
# Configura variables de entorno para indicar si crear recursos nuevos o usar existentes

set -e

STAGE=${1:-dev}
REGION=${AWS_REGION:-us-east-1}
SERVICE_NAME="emotioxv2-backend"

echo "🔍 Verificando recursos existentes en AWS..."
echo "📍 Región: $REGION"
echo "🎯 Stage: $STAGE"
echo ""

# Verificar si AWS CLI está configurado
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI no está configurado correctamente"
    echo "   Por favor configura tus credenciales AWS antes de continuar"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "👤 Cuenta AWS: $ACCOUNT_ID"
echo ""

# Función para verificar si un bucket S3 existe
check_s3_bucket() {
    local bucket_name="$1"
    echo "🪣 Verificando bucket S3: $bucket_name"
    
    if aws s3api head-bucket --bucket "$bucket_name" 2>/dev/null; then
        echo "✅ Bucket '$bucket_name' existe"
        export EXISTING_BUCKET="$bucket_name"
        export CREATE_NEW_BUCKET="false"
        return 0
    else
        echo "❌ Bucket '$bucket_name' no existe"
        export CREATE_NEW_BUCKET="true"
        return 1
    fi
}

# Función para verificar si una tabla DynamoDB existe
check_dynamodb_table() {
    local table_name="$1"
    local var_name="$2"
    echo "🗃️  Verificando tabla DynamoDB: $table_name"
    
    if aws dynamodb describe-table --table-name "$table_name" --region "$REGION" 2>/dev/null >/dev/null; then
        echo "✅ Tabla '$table_name' existe"
        export "EXISTING_${var_name}_TABLE"="$table_name"
        export CREATE_NEW_TABLES="false"
        return 0
    else
        echo "❌ Tabla '$table_name' no existe"
        return 1
    fi
}

# Nombres esperados de recursos
EXPECTED_BUCKET="${SERVICE_NAME}-uploads-${STAGE}"
EXPECTED_MAIN_TABLE="${SERVICE_NAME}-researches-${STAGE}"
EXPECTED_USERS_TABLE="${SERVICE_NAME}-users-${STAGE}"

echo "📋 Recursos esperados:"
echo "   • Bucket S3: $EXPECTED_BUCKET"
echo "   • Tabla principal: $EXPECTED_MAIN_TABLE"
echo "   • Tabla usuarios: $EXPECTED_USERS_TABLE"
echo ""

# Verificar recursos
echo "🔎 Verificando existencia de recursos..."
echo ""

# Verificar bucket S3
check_s3_bucket "$EXPECTED_BUCKET"
bucket_exists=$?

# Verificar tabla principal
check_dynamodb_table "$EXPECTED_MAIN_TABLE" "MAIN"
main_table_exists=$?

# Verificar tabla de usuarios
check_dynamodb_table "$EXPECTED_USERS_TABLE" "USERS"
users_table_exists=$?

echo ""
echo "📊 Resumen de verificación:"

if [ $bucket_exists -eq 0 ]; then
    echo "   ✅ Bucket S3: Existe (se usará el existente)"
else
    echo "   🆕 Bucket S3: Se creará nuevo"
fi

if [ $main_table_exists -eq 0 ]; then
    echo "   ✅ Tabla principal: Existe (se usará la existente)"
else
    echo "   🆕 Tabla principal: Se creará nueva"
fi

if [ $users_table_exists -eq 0 ]; then
    echo "   ✅ Tabla usuarios: Existe (se usará la existente)"
else
    echo "   🆕 Tabla usuarios: Se creará nueva"
fi

echo ""
echo "🎯 Variables de entorno configuradas:"
echo "   CREATE_NEW_BUCKET=${CREATE_NEW_BUCKET:-true}"
echo "   CREATE_NEW_TABLES=${CREATE_NEW_TABLES:-true}"

if [ -n "$EXISTING_BUCKET" ]; then
    echo "   EXISTING_BUCKET=$EXISTING_BUCKET"
fi

if [ -n "$EXISTING_MAIN_TABLE" ]; then
    echo "   EXISTING_MAIN_TABLE=$EXISTING_MAIN_TABLE"
fi

if [ -n "$EXISTING_USERS_TABLE" ]; then
    echo "   EXISTING_USERS_TABLE=$EXISTING_USERS_TABLE"
fi

echo ""
echo "💡 Para usar este script antes del deploy:"
echo "   source ./scripts/check-existing-resources.sh $STAGE"
echo "   serverless deploy --stage $STAGE"
echo ""
echo "✨ Verificación completada"