#!/bin/bash

# Obtener la URL del API Gateway (ajusta el nombre del stack y OutputKey según tu infraestructura)
export API_URL=$(aws cloudformation describe-stacks --stack-name emotiox-backend-stack --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)

# Obtener la URL de CloudFront para public-tests (ajusta el nombre del stack y OutputKey)
export PUBLIC_TESTS_CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name emotiox-public-tests-stack --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" --output text)

# Puedes agregar más variables dinámicas aquí si lo necesitas
