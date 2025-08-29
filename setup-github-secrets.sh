#!/bin/bash

# Script para configurar GitHub Secrets via CLI usando credenciales AWS existentes

echo "🔧 Configurando GitHub Secrets para deployment automático..."

# Verifica que estés autenticado en GitHub
gh auth status

echo "📝 Extrayendo credenciales AWS existentes..."

# Extrae credenciales del perfil AWS existente
AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id)
AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)
AWS_REGION=$(aws configure get region)

echo "🔑 Configurando secrets de AWS en GitHub..."
gh secret set AWS_ACCESS_KEY_ID --body "$AWS_ACCESS_KEY_ID"
gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET_ACCESS_KEY"
gh secret set AWS_REGION --body "$AWS_REGION"

echo "🪣 Configurando S3 y CloudFront..."
read -p "S3 Bucket Name: " S3_BUCKET_NAME
gh secret set S3_BUCKET_NAME --body "$S3_BUCKET_NAME"

read -p "CloudFront Distribution ID: " CLOUDFRONT_DISTRIBUTION_ID
gh secret set CLOUDFRONT_DISTRIBUTION_ID --body "$CLOUDFRONT_DISTRIBUTION_ID"

echo "✅ Secrets configurados exitosamente!"

# Verificar que los secrets se crearon
echo "📋 Verificando secrets configurados:"
gh secret list

echo "🚀 El deployment automático está listo!"
echo "Los deployments se activarán automáticamente en push a main que afecten /frontend"