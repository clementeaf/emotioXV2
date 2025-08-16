#!/bin/bash

# Script de deploy inteligente que detecta recursos existentes y configura el despliegue apropiado
# Uso: ./deploy-smart.sh [stage] [region]

set -e

STAGE=${1:-dev}
REGION=${2:-${AWS_REGION:-us-east-1}}
SERVICE_NAME="emotioxv2-backend"

echo "🚀 Deploy inteligente de EmotioX V2 Backend"
echo "🎯 Stage: $STAGE"
echo "📍 Región: $REGION"
echo "🏷️  Servicio: $SERVICE_NAME"
echo ""

# Verificar dependencias
echo "🔍 Verificando dependencias..."
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI no está instalado"
    exit 1
fi

if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless Framework no está instalado"
    echo "   Instala con: npm install -g serverless"
    exit 1
fi

if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI no está configurado correctamente"
    echo "   Configura tus credenciales AWS antes de continuar"
    exit 1
fi

echo "✅ Dependencias verificadas"
echo ""

# Ejecutar verificación de recursos existentes
echo "🔎 Detectando recursos existentes..."
source ./scripts/check-existing-resources.sh $STAGE

echo ""
echo "⚙️  Configurando variables de entorno para deploy..."

# Exportar variables para serverless
export AWS_REGION=$REGION

echo "✅ Variables configuradas"
echo ""

# Mostrar configuración final
echo "📋 Configuración final del deploy:"
echo "   • CREATE_NEW_BUCKET: ${CREATE_NEW_BUCKET:-true}"
echo "   • CREATE_NEW_TABLES: ${CREATE_NEW_TABLES:-true}"
echo "   • Bucket S3: ${EXISTING_BUCKET:-[nuevo] ${SERVICE_NAME}-uploads-${STAGE}}"
echo "   • Tabla principal: ${EXISTING_MAIN_TABLE:-[nueva] ${SERVICE_NAME}-researches-${STAGE}}"
echo "   • Tabla usuarios: ${EXISTING_USERS_TABLE:-[nueva] ${SERVICE_NAME}-users-${STAGE}}"
echo ""

# Confirmar deploy
read -p "¿Continuar con el deploy? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deploy cancelado por el usuario"
    exit 0
fi

echo ""
echo "🚀 Iniciando deploy con Serverless Framework..."

# Construir argumentos para serverless deploy
DEPLOY_ARGS="--stage $STAGE --region $REGION"

if [ -n "$EXISTING_BUCKET" ]; then
    DEPLOY_ARGS="$DEPLOY_ARGS --param existing-bucket=$EXISTING_BUCKET"
fi

if [ -n "$EXISTING_MAIN_TABLE" ]; then
    DEPLOY_ARGS="$DEPLOY_ARGS --param existing-table=$EXISTING_MAIN_TABLE"
fi

if [ -n "$EXISTING_USERS_TABLE" ]; then
    DEPLOY_ARGS="$DEPLOY_ARGS --param existing-users-table=$EXISTING_USERS_TABLE"
fi

echo "📝 Comando a ejecutar:"
echo "   serverless deploy $DEPLOY_ARGS"
echo ""

# Ejecutar deploy
if serverless deploy $DEPLOY_ARGS; then
    echo ""
    echo "🎉 Deploy completado exitosamente!"
    echo ""
    echo "📊 Resumen del deploy:"
    echo "   • Stage: $STAGE"
    echo "   • Región: $REGION"
    
    if [ "$CREATE_NEW_BUCKET" = "true" ]; then
        echo "   • ✨ Bucket S3 creado: ${SERVICE_NAME}-uploads-${STAGE}"
    else
        echo "   • ♻️  Bucket S3 existente usado: $EXISTING_BUCKET"
    fi
    
    if [ "$CREATE_NEW_TABLES" = "true" ]; then
        echo "   • ✨ Tablas DynamoDB creadas"
    else
        echo "   • ♻️  Tablas DynamoDB existentes usadas"
    fi
    
    echo ""
    echo "🔗 Para obtener los endpoints desplegados:"
    echo "   serverless info --stage $STAGE"
    
else
    echo ""
    echo "❌ Error durante el deploy"
    echo "💡 Verifica los logs arriba para más detalles"
    exit 1
fi