#!/bin/bash

# 🎯 DEPLOY SCRIPT PARA public-tests EN AWS S3/CLOUDFRONT
# Uso: ./deploy-aws.sh

set -e

# 🎯 CONFIGURACIÓN
BUCKET_NAME="emotioxv2-public-tests"
DISTRIBUTION_ID="E1234567890ABC" # Reemplazar con ID real
REGION="us-east-1"

echo "🚀 Iniciando deploy de public-tests a AWS..."

# 🎯 VERIFICAR DEPENDENCIAS
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI no está instalado"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

# 🎯 INSTALAR DEPENDENCIAS
echo "📦 Instalando dependencias..."
npm ci

# 🎯 BUILD DE LA APLICACIÓN
echo "🔨 Construyendo aplicación..."
export VITE_BUILD_HASH=$(date +%s)
npm run build

# 🎯 VERIFICAR QUE EL BUILD EXISTE
if [ ! -d "dist" ]; then
    echo "❌ Error: No se encontró el directorio dist/"
    exit 1
fi

# 🎯 CREAR BUCKET SI NO EXISTE
echo "🪣 Verificando bucket S3..."
if ! aws s3 ls "s3://$BUCKET_NAME" 2>&1 > /dev/null; then
    echo "📦 Creando bucket S3..."
    aws s3 mb "s3://$BUCKET_NAME" --region $REGION

    # 🎯 CONFIGURAR BUCKET PARA WEBSITE STATIC
    aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document index.html

    # 🎯 APLICAR POLICY PÚBLICA
    cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

    aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json
    rm bucket-policy.json
fi

# 🎯 SYNC CON S3
echo "📤 Subiendo archivos a S3..."
aws s3 sync dist/ "s3://$BUCKET_NAME" --delete

# 🎯 INVALIDAR CACHE DE CLOUDFRONT
echo "🔄 Invalidando cache de CloudFront..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

echo "✅ Deploy completado exitosamente!"
echo "🌐 URL: https://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo "📊 CloudFront: https://d1234567890abc.cloudfront.net"
