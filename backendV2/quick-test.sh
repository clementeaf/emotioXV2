#!/bin/bash

# Test rápido del endpoint sin token (para ver si el error cambió)

echo "🧪 Test rápido del endpoint de upload..."

curl -X POST "https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev/research/43e990f2-c475-4fd2-e66d-b1e3094d5e15/cognitive-task/upload-url" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{
    "fileName": "test.jpg",
    "fileSize": 1024000,
    "fileType": "image/jpeg",
    "mimeType": "image/jpeg",
    "contentType": "image/jpeg",
    "questionId": "test-question"
  }' \
  -w "\nStatus: %{http_code}\n"