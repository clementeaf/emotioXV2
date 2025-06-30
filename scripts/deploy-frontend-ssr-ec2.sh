#!/bin/bash
set -e

# === CONFIGURACIÓN ===
# Cambia estos valores según tu entorno
IMAGE_NAME=emotiox-frontend-ssr
REGISTRY= # Ejemplo: 123456789.dkr.ecr.us-east-1.amazonaws.com
EC2_USER=ec2-user
EC2_HOST=54.90.132.233
EC2_KEY=~/.ssh/tu-llave-ec2.pem
REMOTE_ENV=.env.production

# === VARIABLES DE ENTORNO (plantilla) ===
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://tu-api-lambda.amazonaws.com/dev
NEXT_PUBLIC_PUBLIC_TESTS_URL=https://tu-public-tests-url
# Agrega aquí más variables si es necesario
EOF

echo "[1/5] Build de la imagen Docker..."
docker build -t $IMAGE_NAME -f frontend/Dockerfile .

if [ -n "$REGISTRY" ]; then
  echo "[2/5] Tag y push a registry..."
  docker tag $IMAGE_NAME $REGISTRY/$IMAGE_NAME:latest
  docker push $REGISTRY/$IMAGE_NAME:latest
fi

echo "[3/5] Copiando imagen y archivos a EC2..."
# Copia la imagen (si no usas registry) y el .env
if [ -z "$REGISTRY" ]; then
  docker save $IMAGE_NAME | bzip2 | ssh -i $EC2_KEY $EC2_USER@$EC2_HOST 'bunzip2 | docker load'
fi
scp -i $EC2_KEY .env.production $EC2_USER@$EC2_HOST:~/$REMOTE_ENV

echo "[4/5] Ejecutando contenedor en EC2..."
ssh -i $EC2_KEY $EC2_USER@$EC2_HOST "docker stop $IMAGE_NAME || true && docker rm $IMAGE_NAME || true && \
  docker run -d --name $IMAGE_NAME -p 3000:3000 --env-file ~/$REMOTE_ENV $IMAGE_NAME"

echo "[5/5] Deploy SSR completado. Accede a http://$EC2_HOST:3000"
