#!/bin/bash

# Script para configurar infraestructura EC2 para EmotioX Frontend SSR
set -e

echo "🔧 Configurando infraestructura EC2 para EmotioX Frontend SSR..."

# Variables
REGION="us-east-1"
INSTANCE_TYPE="t3.micro"
AMI_ID="ami-0c02fb55956c7d316" # Amazon Linux 2023
KEY_NAME="emotiox-frontend-key"
SECURITY_GROUP_NAME="emotiox-frontend-sg"
INSTANCE_NAME="emotiox-frontend-ssr"
SSH_KEY_PATH="~/.ssh/tu-llave-ec2.pem"

echo "📍 Región: $REGION"
echo "🖥️  Tipo de instancia: $INSTANCE_TYPE"
echo "🔑 Nombre de clave: $KEY_NAME"

# 1. Verificar key pair existente
echo "🔑 [1/6] Verificando key pair..."
if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region "$REGION" >/dev/null 2>&1; then
    echo "   ❌ Key pair no existe en AWS. Creando..."
    # Usar la clave que ya generamos
    aws ec2 import-key-pair --key-name "$KEY_NAME" --public-key-material file://~/.ssh/tu-llave-ec2.pem.pub --region "$REGION"
    echo "   ✅ Key pair importado: $KEY_NAME"
else
    echo "   ✅ Key pair ya existe: $KEY_NAME"
fi

# 2. Crear o verificar security group
echo "🛡️  [2/6] Configurando security group..."
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" --region "$REGION" --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || echo "")

if [ -z "$SG_ID" ] || [ "$SG_ID" = "None" ]; then
    echo "   Creando security group: $SECURITY_GROUP_NAME"
    SG_ID=$(aws ec2 create-security-group --group-name "$SECURITY_GROUP_NAME" --description "Security group for EmotioX frontend SSR" --region "$REGION" --query "GroupId" --output text)

    # Configurar reglas del security group
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0 --region "$REGION"
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "$REGION"
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "$REGION"
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region "$REGION"

    echo "   ✅ Security group creado: $SG_ID"
else
    echo "   ✅ Security group ya existe: $SG_ID"
fi

# 3. Crear o verificar instancia EC2
echo "🖥️  [3/6] Verificando instancia EC2..."
INSTANCE_ID=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running,stopped" --region "$REGION" --query "Reservations[*].Instances[*].[InstanceId]" --output text 2>/dev/null || echo "")

if [ -z "$INSTANCE_ID" ]; then
    echo "   Creando instancia EC2: $INSTANCE_NAME"
    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id "$AMI_ID" \
        --count 1 \
        --instance-type "$INSTANCE_TYPE" \
        --key-name "$KEY_NAME" \
        --security-group-ids "$SG_ID" \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
        --region "$REGION" \
        --query "Instances[0].InstanceId" \
        --output text)

    echo "   ⏳ Esperando que la instancia esté en estado 'running'..."
    aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"
    echo "   ✅ Instancia creada: $INSTANCE_ID"
else
    echo "   ✅ Instancia ya existe: $INSTANCE_ID"

    # Verificar que esté running
    INSTANCE_STATE=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --region "$REGION" --query "Reservations[0].Instances[0].State.Name" --output text)
    if [ "$INSTANCE_STATE" != "running" ]; then
        echo "   🚀 Iniciando instancia..."
        aws ec2 start-instances --instance-ids "$INSTANCE_ID" --region "$REGION"
        aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"
    fi
fi

# 4. Obtener IP pública
echo "🌐 [4/6] Obteniendo IP pública..."
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --region "$REGION" --query "Reservations[0].Instances[0].PublicIpAddress" --output text)
PUBLIC_DNS=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --region "$REGION" --query "Reservations[0].Instances[0].PublicDnsName" --output text)

echo "   ✅ IP pública: $PUBLIC_IP"
echo "   ✅ DNS público: $PUBLIC_DNS"

# 5. Instalar Docker en la instancia
echo "🐳 [5/6] Instalando Docker en la instancia..."
ssh -i ~/.ssh/tu-llave-ec2.pem -o StrictHostKeyChecking=no -o ConnectTimeout=10 ec2-user@$PUBLIC_IP << 'EOF'
    # Actualizar sistema
    sudo yum update -y

    # Instalar Docker
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker ec2-user

    # Instalar Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    echo "Docker instalado correctamente"
EOF

echo "   ✅ Docker instalado en la instancia"

# 6. Guardar configuración
echo "💾 [6/6] Guardando configuración..."
cat > scripts/ec2-config.env << EOF
# Configuración EC2 para EmotioX Frontend SSR
EC2_INSTANCE_ID=$INSTANCE_ID
EC2_PUBLIC_IP=$PUBLIC_IP
EC2_PUBLIC_DNS=$PUBLIC_DNS
EC2_SSH_KEY=~/.ssh/tu-llave-ec2.pem
EC2_USER=ec2-user
EC2_REGION=$REGION
EOF

echo "   ✅ Configuración guardada en scripts/ec2-config.env"

echo ""
echo "🎉 ¡Infraestructura EC2 configurada exitosamente!"
echo ""
echo "📋 Resumen:"
echo "   🖥️  Instancia ID: $INSTANCE_ID"
echo "   🌐 IP pública: $PUBLIC_IP"
echo "   🔗 DNS público: $PUBLIC_DNS"
echo "   🔑 Clave SSH: ~/.ssh/tu-llave-ec2.pem"
echo "   🛡️  Security Group: $SG_ID"
echo ""
echo "🚀 Ahora puedes ejecutar: bash scripts/deploy-all.sh"
