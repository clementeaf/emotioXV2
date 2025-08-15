#!/bin/bash

# Script para configurar recursos AWS para EmotioXV2
# Asegúrate de tener AWS CLI configurado con las credenciales apropiadas

set -e  # Salir si algún comando falla

# Variables de configuración
ROLE_NAME="EmotioXV2-Lambda-Role"
POLICY_NAME="EmotioXV2-Lambda-Policy"
TABLE_NAME="emotioXV2-table-dev"
BUCKET_NAME="emotioxv2-uploads-dev"
REGION="us-east-1"

echo "🚀 Configurando recursos AWS para EmotioXV2..."

# Función para verificar si AWS CLI está instalado
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI no está instalado. Por favor instálalo primero."
        echo "   Instrucciones: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    echo "✅ AWS CLI encontrado"
}

# Función para verificar credenciales AWS
check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        echo "❌ No hay credenciales AWS configuradas o son inválidas."
        echo "   Ejecuta: aws configure"
        exit 1
    fi
    echo "✅ Credenciales AWS válidas"
}

# Función para crear el rol IAM
create_iam_role() {
    echo "📋 Creando rol IAM: $ROLE_NAME..."
    
    # Crear el rol si no existe
    if aws iam get-role --role-name "$ROLE_NAME" &> /dev/null; then
        echo "   Rol $ROLE_NAME ya existe"
    else
        aws iam create-role \
            --role-name "$ROLE_NAME" \
            --assume-role-policy-document file://aws-config/trust-policy.json \
            --description "Rol para Lambda functions de EmotioXV2"
        echo "   ✅ Rol $ROLE_NAME creado"
    fi
    
    # Crear/actualizar la política personalizada
    echo "📋 Creando política: $POLICY_NAME..."
    
    # Intentar crear la política
    if aws iam create-policy \
        --policy-name "$POLICY_NAME" \
        --policy-document file://aws-config/iam-policy.json \
        --description "Política personalizada para EmotioXV2" &> /dev/null; then
        echo "   ✅ Política $POLICY_NAME creada"
    else
        echo "   📝 Política $POLICY_NAME ya existe, actualizando..."
        # Obtener el ARN de la política existente
        POLICY_ARN=$(aws iam list-policies --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text)
        
        # Crear nueva versión de la política
        aws iam create-policy-version \
            --policy-arn "$POLICY_ARN" \
            --policy-document file://aws-config/iam-policy.json \
            --set-as-default
        echo "   ✅ Política $POLICY_NAME actualizada"
    fi
    
    # Adjuntar la política al rol
    POLICY_ARN=$(aws iam list-policies --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text)
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "$POLICY_ARN"
    
    # Adjuntar políticas básicas de Lambda
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    
    echo "   ✅ Políticas adjuntadas al rol"
}

# Función para crear bucket S3
create_s3_bucket() {
    echo "📋 Creando bucket S3: $BUCKET_NAME..."
    
    if aws s3api head-bucket --bucket "$BUCKET_NAME" &> /dev/null; then
        echo "   Bucket $BUCKET_NAME ya existe"
    else
        if [ "$REGION" = "us-east-1" ]; then
            aws s3api create-bucket --bucket "$BUCKET_NAME"
        else
            aws s3api create-bucket \
                --bucket "$BUCKET_NAME" \
                --region "$REGION" \
                --create-bucket-configuration LocationConstraint="$REGION"
        fi
        echo "   ✅ Bucket $BUCKET_NAME creado"
    fi
    
    # Configurar CORS para el bucket
    cat > /tmp/cors-config.json << EOF
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF
    
    aws s3api put-bucket-cors \
        --bucket "$BUCKET_NAME" \
        --cors-configuration file:///tmp/cors-config.json
    
    echo "   ✅ CORS configurado para $BUCKET_NAME"
}

# Función para inicializar DynamoDB (usando el script TypeScript)
init_dynamodb() {
    echo "📋 Inicializando DynamoDB..."
    
    # Verificar si Node.js está instalado
    if ! command -v node &> /dev/null; then
        echo "   ⚠️  Node.js no encontrado. DynamoDB se inicializará automáticamente en el primer request."
        return
    fi
    
    # Intentar ejecutar el script de inicialización
    if [ -f "dist/utils/dynamodb-setup.js" ]; then
        node dist/utils/dynamodb-setup.js
    else
        echo "   ⚠️  Script compilado no encontrado. Compila el proyecto primero con 'npm run build'"
        echo "   📝 DynamoDB se inicializará automáticamente en el primer request."
    fi
}

# Función para mostrar información de configuración
show_config_info() {
    echo ""
    echo "🎉 Configuración completada!"
    echo ""
    echo "📋 Información de recursos creados:"
    echo "   • Rol IAM: $ROLE_NAME"
    echo "   • Política: $POLICY_NAME"
    echo "   • Bucket S3: $BUCKET_NAME"
    echo "   • Tabla DynamoDB: $TABLE_NAME (se creará automáticamente)"
    echo ""
    echo "📝 Próximos pasos:"
    echo "   1. Actualiza tu .env con las credenciales AWS apropiadas"
    echo "   2. Compila el proyecto: npm run build"
    echo "   3. Despliega tu Lambda function usando el rol creado"
    echo ""
    echo "🔗 ARN del rol para Lambda:"
    aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text
    echo ""
}

# Función principal
main() {
    echo "Región AWS: $REGION"
    echo "Directorio actual: $(pwd)"
    echo ""
    
    check_aws_cli
    check_aws_credentials
    create_iam_role
    create_s3_bucket
    init_dynamodb
    show_config_info
}

# Ejecutar función principal
main