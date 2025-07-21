#!/bin/bash

# 🔧 Script para arreglar CORS en bucket S3 de storage (V2)
# =========================================================

echo "🔧 Configurando CORS para bucket de storage (V2)..."

# Configuración CORS para el bucket de storage (sin wildcards)
aws s3api put-bucket-cors --bucket emotioxv2-backend-dev-storage --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "http://emotioxv2-frontend.s3-website-us-east-1.amazonaws.com",
        "https://emotioxv2-frontend.s3-website-us-east-1.amazonaws.com",
        "http://localhost:3000",
        "https://localhost:3000"
      ],
      "ExposeHeaders": ["ETag", "x-amz-version-id"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

echo "✅ CORS configurado para bucket de storage"

# Verificar la configuración
echo "🔍 Verificando configuración CORS..."
aws s3api get-bucket-cors --bucket emotioxv2-backend-dev-storage

echo "🎉 Configuración CORS completada"
