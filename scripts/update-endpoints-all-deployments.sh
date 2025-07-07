#!/bin/bash

# 🔄 Script para actualizar endpoints en todos los despliegues activos
# Este script se ejecuta después de cada despliegue del backend para actualizar
# los endpoints en frontend y public-tests, sin importar dónde estén desplegados

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Variables de entorno
STAGE=${STAGE:-"dev"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

# Función para obtener endpoints del backend desplegado
get_backend_endpoints() {
    log_info "Obteniendo endpoints del backend desplegado..."

    # Obtener endpoints desde CloudFormation
    HTTP_ENDPOINT=$(aws cloudformation describe-stacks \
        --stack-name "emotioxv2-backend-${STAGE}" \
        --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" \
        --output text \
        --region "$AWS_REGION" 2>/dev/null || echo "")

    WS_ENDPOINT=$(aws cloudformation describe-stacks \
        --stack-name "emotioxv2-backend-${STAGE}" \
        --query "Stacks[0].Outputs[?OutputKey=='WebsocketApiUrl'].OutputValue" \
        --output text \
        --region "$AWS_REGION" 2>/dev/null || echo "")

    if [ -z "$HTTP_ENDPOINT" ]; then
        log_error "No se pudo obtener el endpoint HTTP del backend"
        return 1
    fi

    log_success "HTTP API: $HTTP_ENDPOINT"
    log_success "WebSocket API: $WS_ENDPOINT"

    # Exportar variables para uso posterior
    export HTTP_ENDPOINT
    export WS_ENDPOINT
}

# Función para actualizar endpoints en AWS Amplify
update_amplify_endpoints() {
    log_info "Actualizando endpoints en AWS Amplify..."

    # Verificar si hay IDs de Amplify configurados
    if [ -z "$AMPLIFY_FRONTEND_APP_ID" ] && [ -z "$AMPLIFY_PUBLIC_TESTS_APP_ID" ]; then
        log_warning "No hay IDs de Amplify configurados, saltando actualización"
        return 0
    fi

    # Actualizar frontend en Amplify
    if [ -n "$AMPLIFY_FRONTEND_APP_ID" ]; then
        log_info "Actualizando frontend en Amplify..."
        aws amplify update-app \
            --app-id "$AMPLIFY_FRONTEND_APP_ID" \
            --environment-variables "NEXT_PUBLIC_API_URL=$HTTP_ENDPOINT" \
            --region "$AWS_REGION" 2>/dev/null || log_warning "No se pudo actualizar frontend Amplify"

        # Trigger redeploy
        aws amplify start-job \
            --app-id "$AMPLIFY_FRONTEND_APP_ID" \
            --branch-name main \
            --job-type RELEASE \
            --region "$AWS_REGION" 2>/dev/null || log_warning "No se pudo redeployar frontend Amplify"
    fi

    # Actualizar public-tests en Amplify
    if [ -n "$AMPLIFY_PUBLIC_TESTS_APP_ID" ]; then
        log_info "Actualizando public-tests en Amplify..."
        aws amplify update-app \
            --app-id "$AMPLIFY_PUBLIC_TESTS_APP_ID" \
            --environment-variables "VITE_API_URL=$HTTP_ENDPOINT" \
            --region "$AWS_REGION" 2>/dev/null || log_warning "No se pudo actualizar public-tests Amplify"

        # Trigger redeploy
        aws amplify start-job \
            --app-id "$AMPLIFY_PUBLIC_TESTS_APP_ID" \
            --branch-name main \
            --job-type RELEASE \
            --region "$AWS_REGION" 2>/dev/null || log_warning "No se pudo redeployar public-tests Amplify"
    fi
}

# Función para actualizar endpoints en CloudFront/S3
update_cloudfront_endpoints() {
    log_info "Actualizando endpoints en CloudFront/S3..."

    # Verificar si hay IDs de CloudFront configurados
    if [ -z "$CLOUDFRONT_FRONTEND_DIST_ID" ] && [ -z "$CLOUDFRONT_PUBLIC_TESTS_DIST_ID" ]; then
        log_warning "No hay IDs de CloudFront configurados, saltando actualización"
        return 0
    fi

    # Crear archivo temporal con nuevos endpoints
    cat > /tmp/new-endpoints.js << EOF
// ARCHIVO GENERADO AUTOMÁTICAMENTE
// NO MODIFICAR MANUALMENTE
// Generado: $(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

// Endpoints de API exportados desde backend
export const API_ENDPOINTS = {
  // Endpoint HTTP API
  http: "$HTTP_ENDPOINT",

  // Endpoint WebSocket
  ws: "$WS_ENDPOINT",

  // Etapa de despliegue (dev, prod, etc.)
  stage: "$STAGE"
};

// URLs de desarrollo local
export const LOCAL_URLS = {
  "frontend": "http://localhost:3000",
  "publicTests": "http://localhost:4700",
  "generatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
};

// Constantes para uso más fácil
export const API_HTTP_ENDPOINT = "$HTTP_ENDPOINT";
export const API_WEBSOCKET_ENDPOINT = "$WS_ENDPOINT";

// Función para obtener URL completa de una ruta
export function getApiUrl(path) {
  // Eliminar slash inicial si existe
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return \`\${API_HTTP_ENDPOINT}/\${cleanPath}\`;
}

// Función para websocket
export function getWebsocketUrl() {
  return API_WEBSOCKET_ENDPOINT;
}

// Función para obtener URL de public-tests
export function getPublicTestsUrl() {
  return LOCAL_URLS.publicTests || 'http://localhost:4700';
}

// Función para navegar a public-tests con researchID
export function navigateToPublicTests(researchID) {
  const url = \`\${getPublicTestsUrl()}/\${researchID}\`;
  window.open(url, '_blank');
}

// Versión default para import default
export default API_ENDPOINTS;
EOF

    # Actualizar frontend en S3/CloudFront
    if [ -n "$CLOUDFRONT_FRONTEND_DIST_ID" ] && [ -n "$FRONTEND_S3_BUCKET" ]; then
        log_info "Actualizando frontend en S3/CloudFront..."
        aws s3 cp /tmp/new-endpoints.js "s3://$FRONTEND_S3_BUCKET/api/endpoints.js" --region "$AWS_REGION"
        aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_FRONTEND_DIST_ID" --paths "/api/endpoints.js" --region "$AWS_REGION"
        log_success "Frontend S3/CloudFront actualizado"
    fi

    # Actualizar public-tests en S3/CloudFront
    if [ -n "$CLOUDFRONT_PUBLIC_TESTS_DIST_ID" ] && [ -n "$PUBLIC_TESTS_S3_BUCKET" ]; then
        log_info "Actualizando public-tests en S3/CloudFront..."
        aws s3 cp /tmp/new-endpoints.js "s3://$PUBLIC_TESTS_S3_BUCKET/config/endpoints.js" --region "$AWS_REGION"
        aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_PUBLIC_TESTS_DIST_ID" --paths "/config/endpoints.js" --region "$AWS_REGION"
        log_success "Public Tests S3/CloudFront actualizado"
    fi

    # Limpiar archivo temporal
    rm -f /tmp/new-endpoints.js
}

# Función para actualizar endpoints en EC2
update_ec2_endpoints() {
    log_info "Actualizando endpoints en EC2..."

    # Verificar si hay configuración de EC2
    if [ -z "$EC2_FRONTEND_URL" ]; then
        log_warning "No hay URL de EC2 configurada, saltando actualización"
        return 0
    fi

    # Crear payload para actualización
    cat > /tmp/ec2-update.json << EOF
{
  "endpoints": {
    "http": "$HTTP_ENDPOINT",
    "ws": "$WS_ENDPOINT",
    "stage": "$STAGE"
  },
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
}
EOF

    # Enviar actualización a EC2 (si hay endpoint de API configurado)
    if [ -n "$EC2_API_ENDPOINT" ]; then
        curl -X POST "$EC2_API_ENDPOINT/update-endpoints" \
            -H "Content-Type: application/json" \
            -d @/tmp/ec2-update.json \
            --max-time 30 2>/dev/null || log_warning "No se pudo actualizar EC2"
    fi

    # Limpiar archivo temporal
    rm -f /tmp/ec2-update.json
}

# Función para generar archivos de endpoints locales
generate_local_endpoints() {
    log_info "Generando archivos de endpoints locales..."

    # Crear directorio temporal
    mkdir -p /tmp/endpoints-update

    # Generar archivo para frontend
    cat > /tmp/endpoints-update/frontend-endpoints.js << EOF
// ARCHIVO GENERADO AUTOMÁTICAMENTE
// NO MODIFICAR MANUALMENTE
// Generado: $(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

// Endpoints de API exportados desde backend
export const API_ENDPOINTS = {
  // Endpoint HTTP API
  http: "$HTTP_ENDPOINT",

  // Endpoint WebSocket
  ws: "$WS_ENDPOINT",

  // Etapa de despliegue (dev, prod, etc.)
  stage: "$STAGE"
};

// URLs de desarrollo local
export const LOCAL_URLS = {
  "frontend": "http://localhost:3000",
  "publicTests": "http://localhost:4700",
  "generatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
};

// Constantes para uso más fácil
export const API_HTTP_ENDPOINT = "$HTTP_ENDPOINT";
export const API_WEBSOCKET_ENDPOINT = "$WS_ENDPOINT";

// Función para obtener URL completa de una ruta
export function getApiUrl(path) {
  // Eliminar slash inicial si existe
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return \`\${API_HTTP_ENDPOINT}/\${cleanPath}\`;
}

// Función para websocket
export function getWebsocketUrl() {
  return API_WEBSOCKET_ENDPOINT;
}

// Función para obtener URL de public-tests
export function getPublicTestsUrl() {
  return LOCAL_URLS.publicTests || 'http://localhost:4700';
}

// Función para navegar a public-tests con researchID
export function navigateToPublicTests(researchID) {
  const url = \`\${getPublicTestsUrl()}/\${researchID}\`;
  window.open(url, '_blank');
}

// Versión default para import default
export default API_ENDPOINTS;
EOF

    # Generar archivo para public-tests
    cp /tmp/endpoints-update/frontend-endpoints.js /tmp/endpoints-update/public-tests-endpoints.js

    log_success "Archivos de endpoints locales generados"
}

# Función para notificar actualización
notify_update() {
    log_info "Notificando actualización de endpoints..."

    # Crear mensaje de notificación
    cat > /tmp/update-notification.json << EOF
{
  "message": "Endpoints actualizados automáticamente",
  "backend": {
    "http": "$HTTP_ENDPOINT",
    "ws": "$WS_ENDPOINT",
    "stage": "$STAGE"
  },
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "deployments_updated": [
    "amplify",
    "cloudfront",
    "ec2"
  ]
}
EOF

    # Enviar notificación si hay webhook configurado
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d @/tmp/update-notification.json \
            --max-time 30 2>/dev/null || log_warning "No se pudo enviar notificación"
    fi

    # Limpiar archivo temporal
    rm -f /tmp/update-notification.json
}

# Función principal
main() {
    echo "🔄 Actualizando endpoints en todos los despliegues activos"
    echo "========================================================"

    # Obtener endpoints del backend
    get_backend_endpoints || {
        log_error "No se pudieron obtener los endpoints del backend"
        exit 1
    }

    # Actualizar en todas las plataformas
    update_amplify_endpoints
    update_cloudfront_endpoints
    update_ec2_endpoints

    # Generar archivos locales
    generate_local_endpoints

    # Notificar actualización
    notify_update

    log_success "¡Actualización de endpoints completada!"
    echo ""
    echo "📊 Resumen de actualización:"
    echo "  HTTP API: $HTTP_ENDPOINT"
    echo "  WebSocket API: $WS_ENDPOINT"
    echo "  Stage: $STAGE"
    echo ""
    echo "📁 Archivos locales generados en: /tmp/endpoints-update/"
}

# Ejecutar función principal
main "$@"
