#!/bin/bash

# Script para hacer públicos los archivos existentes en S3

BUCKET="emotioxv2-uploads-dev"
RESEARCH_ID="caa5cfb8-089a-9834-d2ae-1e94bda1df8f"

echo "🔧 Haciendo públicos los archivos en $BUCKET/$RESEARCH_ID..."

aws s3api list-objects-v2 \
  --bucket "$BUCKET" \
  --prefix "$RESEARCH_ID/" \
  --query 'Contents[].Key' \
  --output text | tr '\t' '\n' | while read -r key; do
    if [ -n "$key" ]; then
      echo "  ✅ $key"
      aws s3api put-object-acl \
        --bucket "$BUCKET" \
        --key "$key" \
        --acl public-read
    fi
done

echo "✅ Listo!"
