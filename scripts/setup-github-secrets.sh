#!/bin/bash

# 🚀 Script para configurar GitHub Secrets para EmotioXV2
# Este script te guía para configurar todos los secrets necesarios en GitHub

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

# Verificar que gh CLI está instalado
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) no está instalado."
        echo "Instala GitHub CLI desde: https://cli.github.com/"
        exit 1
    fi

    if ! gh auth status &> /dev/null; then
        log_error "No estás autenticado con GitHub CLI."
        echo "Ejecuta: gh auth login"
        exit 1
    fi

    log_success "GitHub CLI está instalado y autenticado"
}

# Obtener información del repositorio
get_repo_info() {
    log_info "Obteniendo información del repositorio..."

    # Obtener owner y repo del remote actual
    REMOTE_URL=$(git remote get-url origin)
    if [[ $REMOTE_URL == *"github.com"* ]]; then
        REPO_PATH=$(echo $REMOTE_URL | sed 's/.*github\.com[:/]//' | sed 's/\.git$//')
        OWNER=$(echo $REPO_PATH | cut -d'/' -f1)
        REPO=$(echo $REPO_PATH | cut -d'/' -f2)
    else
        log_error "No se pudo detectar el repositorio de GitHub"
        exit 1
    fi

    log_success "Repositorio: $OWNER/$REPO"
}

# Configurar AWS Secrets
setup_aws_secrets() {
    log_info "Configurando secrets de AWS..."

    echo "🔑 AWS Access Key ID:"
    read -p "Ingresa tu AWS_ACCESS_KEY_ID: " AWS_ACCESS_KEY_ID

    echo "🔑 AWS Secret Access Key:"
    read -s -p "Ingresa tu AWS_SECRET_ACCESS_KEY: " AWS_SECRET_ACCESS_KEY
    echo

    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        gh secret set AWS_ACCESS_KEY_ID --body "$AWS_ACCESS_KEY_ID" --repo "$OWNER/$REPO"
        gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET_ACCESS_KEY" --repo "$OWNER/$REPO"
        log_success "AWS secrets configurados"
    else
        log_warning "AWS secrets no configurados"
    fi
}

# Configurar Vercel Secrets
setup_vercel_secrets() {
    log_info "Configurando secrets de Vercel..."

    echo "🔑 Vercel Token:"
    echo "Obtén tu token desde: https://vercel.com/account/tokens"
    read -s -p "Ingresa tu VERCEL_TOKEN: " VERCEL_TOKEN
    echo

    echo "🔑 Vercel Organization ID:"
    echo "Encuéntralo en: https://vercel.com/account"
    read -p "Ingresa tu VERCEL_ORG_ID: " VERCEL_ORG_ID

    echo "🔑 Vercel Frontend Project ID:"
    echo "Crea un proyecto en Vercel para el frontend y obtén el ID"
    read -p "Ingresa tu VERCEL_PROJECT_ID: " VERCEL_PROJECT_ID

    echo "🔑 Vercel Public Tests Project ID:"
    echo "Crea un proyecto en Vercel para public-tests y obtén el ID"
    read -p "Ingresa tu VERCEL_PUBLIC_TESTS_PROJECT_ID: " VERCEL_PUBLIC_TESTS_PROJECT_ID

    if [ -n "$VERCEL_TOKEN" ] && [ -n "$VERCEL_ORG_ID" ] && [ -n "$VERCEL_PROJECT_ID" ] && [ -n "$VERCEL_PUBLIC_TESTS_PROJECT_ID" ]; then
        gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN" --repo "$OWNER/$REPO"
        gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID" --repo "$OWNER/$REPO"
        gh secret set VERCEL_PROJECT_ID --body "$VERCEL_PROJECT_ID" --repo "$OWNER/$REPO"
        gh secret set VERCEL_PUBLIC_TESTS_PROJECT_ID --body "$VERCEL_PUBLIC_TESTS_PROJECT_ID" --repo "$OWNER/$REPO"
        log_success "Vercel secrets configurados"
    else
        log_warning "Vercel secrets no configurados"
    fi
}

# Configurar URLs de las aplicaciones
setup_app_urls() {
  log_info "Configurando URLs de las aplicaciones..."

  echo "🌐 URL del Frontend (ej: https://emotioxv2-frontend.vercel.app):"
  read -p "Ingresa NEXT_PUBLIC_PUBLIC_TESTS_URL: " NEXT_PUBLIC_PUBLIC_TESTS_URL

  echo "🌐 URL de Public Tests (ej: https://emotioxv2-public-tests.vercel.app):"
  read -p "Ingresa VITE_PUBLIC_TESTS_URL: " VITE_PUBLIC_TESTS_URL

  if [ -n "$NEXT_PUBLIC_PUBLIC_TESTS_URL" ]; then
    gh secret set NEXT_PUBLIC_PUBLIC_TESTS_URL --body "$NEXT_PUBLIC_PUBLIC_TESTS_URL" --repo "$OWNER/$REPO"
    log_success "NEXT_PUBLIC_PUBLIC_TESTS_URL configurado"
  fi

  if [ -n "$VITE_PUBLIC_TESTS_URL" ]; then
    gh secret set VITE_PUBLIC_TESTS_URL --body "$VITE_PUBLIC_TESTS_URL" --repo "$OWNER/$REPO"
    log_success "VITE_PUBLIC_TESTS_URL configurado"
  fi
}

# Configurar secrets para actualización automática de endpoints
setup_endpoint_update_secrets() {
  log_info "Configurando secrets para actualización automática de endpoints..."

  echo "🔧 ¿Quieres configurar actualización automática de endpoints en otros despliegues?"
  read -p "Esto incluye Amplify, CloudFront, EC2, etc. (y/n): " setup_endpoints

  if [[ $setup_endpoints =~ ^[Yy]$ ]]; then
    echo ""
    echo "📋 Configurando Amplify (opcional):"
    read -p "AMPLIFY_FRONTEND_APP_ID (dejar vacío si no usas Amplify): " AMPLIFY_FRONTEND_APP_ID
    read -p "AMPLIFY_PUBLIC_TESTS_APP_ID (dejar vacío si no usas Amplify): " AMPLIFY_PUBLIC_TESTS_APP_ID

    echo ""
    echo "📋 Configurando CloudFront/S3 (opcional):"
    read -p "CLOUDFRONT_FRONTEND_DIST_ID (dejar vacío si no usas CloudFront): " CLOUDFRONT_FRONTEND_DIST_ID
    read -p "CLOUDFRONT_PUBLIC_TESTS_DIST_ID (dejar vacío si no usas CloudFront): " CLOUDFRONT_PUBLIC_TESTS_DIST_ID
    read -p "FRONTEND_S3_BUCKET (dejar vacío si no usas S3): " FRONTEND_S3_BUCKET
    read -p "PUBLIC_TESTS_S3_BUCKET (dejar vacío si no usas S3): " PUBLIC_TESTS_S3_BUCKET

    echo ""
    echo "📋 Configurando EC2 (opcional):"
    read -p "EC2_FRONTEND_URL (dejar vacío si no usas EC2): " EC2_FRONTEND_URL
    read -p "EC2_API_ENDPOINT (dejar vacío si no usas EC2): " EC2_API_ENDPOINT

    echo ""
    echo "📋 Configurando Webhook (opcional):"
    read -p "WEBHOOK_URL para notificaciones (dejar vacío si no quieres webhook): " WEBHOOK_URL

    # Guardar secrets no vacíos
    if [ -n "$AMPLIFY_FRONTEND_APP_ID" ]; then
      gh secret set AMPLIFY_FRONTEND_APP_ID --body "$AMPLIFY_FRONTEND_APP_ID" --repo "$OWNER/$REPO"
      log_success "AMPLIFY_FRONTEND_APP_ID configurado"
    fi

    if [ -n "$AMPLIFY_PUBLIC_TESTS_APP_ID" ]; then
      gh secret set AMPLIFY_PUBLIC_TESTS_APP_ID --body "$AMPLIFY_PUBLIC_TESTS_APP_ID" --repo "$OWNER/$REPO"
      log_success "AMPLIFY_PUBLIC_TESTS_APP_ID configurado"
    fi

    if [ -n "$CLOUDFRONT_FRONTEND_DIST_ID" ]; then
      gh secret set CLOUDFRONT_FRONTEND_DIST_ID --body "$CLOUDFRONT_FRONTEND_DIST_ID" --repo "$OWNER/$REPO"
      log_success "CLOUDFRONT_FRONTEND_DIST_ID configurado"
    fi

    if [ -n "$CLOUDFRONT_PUBLIC_TESTS_DIST_ID" ]; then
      gh secret set CLOUDFRONT_PUBLIC_TESTS_DIST_ID --body "$CLOUDFRONT_PUBLIC_TESTS_DIST_ID" --repo "$OWNER/$REPO"
      log_success "CLOUDFRONT_PUBLIC_TESTS_DIST_ID configurado"
    fi

    if [ -n "$FRONTEND_S3_BUCKET" ]; then
      gh secret set FRONTEND_S3_BUCKET --body "$FRONTEND_S3_BUCKET" --repo "$OWNER/$REPO"
      log_success "FRONTEND_S3_BUCKET configurado"
    fi

    if [ -n "$PUBLIC_TESTS_S3_BUCKET" ]; then
      gh secret set PUBLIC_TESTS_S3_BUCKET --body "$PUBLIC_TESTS_S3_BUCKET" --repo "$OWNER/$REPO"
      log_success "PUBLIC_TESTS_S3_BUCKET configurado"
    fi

    if [ -n "$EC2_FRONTEND_URL" ]; then
      gh secret set EC2_FRONTEND_URL --body "$EC2_FRONTEND_URL" --repo "$OWNER/$REPO"
      log_success "EC2_FRONTEND_URL configurado"
    fi

    if [ -n "$EC2_API_ENDPOINT" ]; then
      gh secret set EC2_API_ENDPOINT --body "$EC2_API_ENDPOINT" --repo "$OWNER/$REPO"
      log_success "EC2_API_ENDPOINT configurado"
    fi

    if [ -n "$WEBHOOK_URL" ]; then
      gh secret set WEBHOOK_URL --body "$WEBHOOK_URL" --repo "$OWNER/$REPO"
      log_success "WEBHOOK_URL configurado"
    fi

    log_success "Secrets para actualización automática configurados"
  else
    log_info "Saltando configuración de actualización automática de endpoints"
  fi
}

# Mostrar resumen de configuración
show_summary() {
    log_info "Resumen de configuración:"
    echo "=================================="

    echo "🔑 Secrets configurados:"
    gh secret list --repo "$OWNER/$REPO" | while read line; do
        if [[ $line == *"AWS_"* ]] || [[ $line == *"VERCEL_"* ]] || [[ $line == *"URL"* ]]; then
            echo "  ✅ $line"
        fi
    done

    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Crea proyectos en Vercel para frontend y public-tests"
    echo "2. Configura las variables de entorno en Vercel"
    echo "3. Haz push a main para activar los workflows"
    echo "4. Monitorea los despliegues en GitHub Actions"
}

# Función principal
main() {
    echo "🚀 Configuración de GitHub Secrets para EmotioXV2"
    echo "=================================================="

    check_gh_cli
    get_repo_info

    echo ""
    log_info "Este script te ayudará a configurar todos los secrets necesarios para los workflows de GitHub Actions."
    echo ""

    setup_aws_secrets
    echo ""

    setup_vercel_secrets
    echo ""

    setup_app_urls
    echo ""

    setup_endpoint_update_secrets
    echo ""

    show_summary

    log_success "¡Configuración completada!"
}

# Ejecutar función principal
main "$@"
