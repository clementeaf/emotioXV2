#!/bin/bash

# Script para crear CloudFront distribution optimizada para EmotioXV2

echo "🚀 Creando CloudFront distribution para EmotioXV2..."

# Crear la distribución
DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution --distribution-config file://cloudfront-config.json)

# Extraer el ID de la distribución
DISTRIBUTION_ID=$(echo $DISTRIBUTION_OUTPUT | jq -r '.Distribution.Id')
DOMAIN_NAME=$(echo $DISTRIBUTION_OUTPUT | jq -r '.Distribution.DomainName')

echo "✅ CloudFront distribution creada:"
echo "   Distribution ID: $DISTRIBUTION_ID"
echo "   Domain Name: https://$DOMAIN_NAME"

# Configurar el secret en GitHub
echo "🔧 Configurando GitHub secret..."
gh secret set CLOUDFRONT_DISTRIBUTION_ID --body "$DISTRIBUTION_ID"

echo "📋 Configuración completa:"
echo "   S3 Bucket: emotioxv2-frontend-dev-041238861016"
echo "   CloudFront ID: $DISTRIBUTION_ID"
echo "   URL: https://$DOMAIN_NAME"

echo "⏱️  Nota: La distribución puede tardar 5-15 minutos en estar completamente activa."

# Verificar secrets configurados
echo "🔍 Verificando secrets:"
gh secret list