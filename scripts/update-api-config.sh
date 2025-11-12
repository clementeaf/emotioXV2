#!/bin/bash

# Script para actualizar configuración de API después de cada deploy
# Se ejecuta automáticamente en el pipeline de CI/CD

set -e

echo "🔄 Actualizando configuración de API..."

# Obtener información del entorno actual
ENVIRONMENT=${1:-development}
# 🎯 Mapear environment a nombre de stack real
if [ "$ENVIRONMENT" = "development" ]; then
  STACK_NAME="emotioxv2-backend-dev"
elif [ "$ENVIRONMENT" = "staging" ]; then
  STACK_NAME="emotioxv2-backend-staging"
elif [ "$ENVIRONMENT" = "production" ]; then
  STACK_NAME="emotioxv2-backend-production"
else
  STACK_NAME="emotioxv2-backend-${ENVIRONMENT}"
fi

echo "📋 Entorno: $ENVIRONMENT"
echo "🏗️ Stack: $STACK_NAME"

# Obtener outputs del stack de CloudFormation
echo "🔍 Obteniendo outputs del stack..."

API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text \
  --region us-east-1)

WEBSOCKET_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`WebSocketUrl`].OutputValue' \
  --output text \
  --region us-east-1)

S3_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`S3Bucket`].OutputValue' \
  --output text \
  --region us-east-1)

CLOUDFRONT_DISTRIBUTION=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistribution`].OutputValue' \
  --output text \
  --region us-east-1)

echo "✅ URLs obtenidas:"
echo "  API: $API_URL"
echo "  WebSocket: $WEBSOCKET_URL"
echo "  S3: $S3_BUCKET"
echo "  CloudFront: $CLOUDFRONT_DISTRIBUTION"

# Actualizar archivo de configuración
echo "📝 Actualizando configuración..."

cat > "config/api-endpoints-${ENVIRONMENT}.yml" << EOF
# Configuración generada automáticamente para $ENVIRONMENT
# Última actualización: $(date)

environment: $ENVIRONMENT
backend:
  base_url: "$API_URL"
  region: "us-east-1"
  stage: "$ENVIRONMENT"
  websocket_url: "$WEBSOCKET_URL"

frontend:
  base_url: "https://admin-${ENVIRONMENT}.emotioxv2.com"

public_tests:
  base_url: "https://tests-${ENVIRONMENT}.emotioxv2.com"

s3:
  bucket: "$S3_BUCKET"
  region: "us-east-1"

cloudfront:
  distribution_id: "$CLOUDFRONT_DISTRIBUTION"
  domain: "d${CLOUDFRONT_DISTRIBUTION}.cloudfront.net"

# Endpoints específicos
endpoints:
  auth: "/auth"
  research: "/research"
  participants: "/participants"
  responses: "/responses"
  forms: "/forms"
  educational_content: "/educational-content"
  eye_tracking: "/eye-tracking"
  smart_voc: "/smart-voc"
  cognitive_tasks: "/cognitive-tasks"
  module_responses: "/module-responses"
  websocket: "/ws"
EOF

echo "✅ Configuración actualizada para $ENVIRONMENT"

# Actualizar archivos de configuración en cada servicio
echo "🔄 Actualizando archivos de configuración..."

# Frontend
if [ -d "frontend" ]; then
  echo "📱 Actualizando frontend..."
  cp "config/api-endpoints-${ENVIRONMENT}.yml" "frontend/config/api-endpoints.yml"
fi

# Public-tests
if [ -d "public-tests" ]; then
  echo "🧪 Actualizando public-tests..."
  cp "config/api-endpoints-${ENVIRONMENT}.yml" "public-tests/config/api-endpoints.yml"
fi

# Backend
if [ -d "backendV2" ]; then
  echo "🚀 Actualizando backend..."
  cp "config/api-endpoints-${ENVIRONMENT}.yml" "backendV2/config/api-endpoints.yml"
fi

echo "✅ Configuración actualizada en todos los servicios"
echo "🎉 Proceso completado exitosamente"
