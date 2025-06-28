#!/bin/bash
set -e

BUCKET_NAME="emotioxv2-public-tests-bucket"
CLOUDFRONT_COMMENT="EmotioXV2 Public Tests Distribution"

# 1. Crear bucket S3
aws s3 mb s3://$BUCKET_NAME || echo "Bucket ya existe"

# 2. Configurar como sitio estático
aws s3 website s3://$BUCKET_NAME/ --index-document index.html --error-document index.html

# 3. Hacer el bucket público
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
    }
  ]
}'

# 4. Crear distribución CloudFront
ORIGIN_DOMAIN="$BUCKET_NAME.s3.amazonaws.com"
DIST_ID=$(aws cloudfront create-distribution \
  --origin-domain-name $ORIGIN_DOMAIN \
  --default-root-object index.html \
  --comment "$CLOUDFRONT_COMMENT" \
  --query 'Distribution.Id' \
  --output text)

echo "\n✅ Bucket S3 y distribución CloudFront creados."
echo "Bucket: $BUCKET_NAME"
echo "CloudFront Distribution ID: $DIST_ID"
echo "\nCopia el ID en el script de deploy para usarlo en las invalidaciones."
