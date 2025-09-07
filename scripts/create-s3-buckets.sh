#!/bin/bash

# 🚀 Script para crear buckets S3 nuevos con website hosting
# Crea buckets únicos en tu cuenta AWS actual

set -e

# Configuración - nombres únicos
ACCOUNT_ID="041238861016"
FRONTEND_BUCKET="emotioxv2-frontend-${ACCOUNT_ID}"
PUBLIC_TESTS_BUCKET="emotioxv2-public-tests-${ACCOUNT_ID}" 
REGION="us-east-1"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Función para crear y configurar bucket
create_and_configure_bucket() {
    local bucket_name=$1
    local bucket_type=$2
    
    log_info "🪣 Creando bucket: $bucket_name..."
    
    # 1. Crear bucket
    if aws s3api head-bucket --bucket $bucket_name 2>/dev/null; then
        log_warning "Bucket $bucket_name ya existe, configurando..."
    else
        if [ "$REGION" = "us-east-1" ]; then
            aws s3api create-bucket --bucket $bucket_name --region $REGION
        else
            aws s3api create-bucket \
                --bucket $bucket_name \
                --region $REGION \
                --create-bucket-configuration LocationConstraint=$REGION
        fi
        log_success "Bucket $bucket_name creado"
    fi
    
    # 2. Deshabilitar Block Public Access
    log_info "🔓 Configurando acceso público..."
    aws s3api put-public-access-block \
        --bucket $bucket_name \
        --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
    
    # 3. Habilitar website hosting
    log_info "🌐 Habilitando website hosting..."
    aws s3 website s3://$bucket_name \
        --index-document index.html \
        --error-document error.html
    
    # 4. Crear bucket policy para acceso público
    cat > /tmp/policy-$bucket_name.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$bucket_name/*"
        }
    ]
}
EOF
    
    # 5. Aplicar bucket policy
    log_info "📋 Aplicando bucket policy..."
    aws s3api put-bucket-policy \
        --bucket $bucket_name \
        --policy file:///tmp/policy-$bucket_name.json
    
    # 6. Crear archivo index.html temporal
    log_info "📄 Creando index.html temporal..."
    cat > /tmp/index-$bucket_type.html << EOF
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EmotioXV2 - $bucket_type</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        p { font-size: 1.2em; margin-bottom: 30px; }
        .status { 
            background: #4CAF50; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0;
            font-weight: bold;
        }
        .info {
            background: rgba(255,255,255,0.2);
            padding: 20px;
            border-radius: 5px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 EmotioXV2</h1>
        <p><strong>$bucket_type</strong> - S3 Website Hosting</p>
        
        <div class="status">
            ✅ Bucket S3 configurado correctamente
        </div>
        
        <p>Este sitio está funcionando y listo para recibir deployments.</p>
        
        <div class="info">
            <strong>Información técnica:</strong><br>
            Bucket: $bucket_name<br>
            Región: $REGION<br>
            Cuenta: $ACCOUNT_ID<br>
            Configurado: $(date)
        </div>
    </div>
</body>
</html>
EOF
    
    # 7. Subir archivo temporal
    aws s3 cp /tmp/index-$bucket_type.html s3://$bucket_name/index.html
    
    # Limpiar archivos temporales
    rm -f /tmp/policy-$bucket_name.json /tmp/index-$bucket_type.html
    
    log_success "✅ Bucket $bucket_name configurado completamente"
    log_info "🌐 URL: http://$bucket_name.s3-website-$REGION.amazonaws.com"
    echo ""
}

# Verificar credenciales AWS
log_info "🔐 Verificando credenciales AWS..."
CURRENT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
log_success "Conectado a cuenta AWS: $CURRENT_ACCOUNT"

echo ""
log_info "🚀 Creando buckets S3 para EmotioXV2..."
echo ""

# Crear buckets
create_and_configure_bucket $FRONTEND_BUCKET "Frontend"
create_and_configure_bucket $PUBLIC_TESTS_BUCKET "Public-Tests"

echo ""
log_success "🎉 ¡Buckets creados exitosamente!"
echo ""
log_info "📋 URLs de acceso:"
log_info "Frontend: http://$FRONTEND_BUCKET.s3-website-$REGION.amazonaws.com"
log_info "Public Tests: http://$PUBLIC_TESTS_BUCKET.s3-website-$REGION.amazonaws.com"
echo ""
log_info "📝 Actualiza tus scripts de deployment con estos nombres:"
log_info "FRONTEND_BUCKET=\"$FRONTEND_BUCKET\""
log_info "PUBLIC_TESTS_BUCKET=\"$PUBLIC_TESTS_BUCKET\""