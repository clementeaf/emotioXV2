# ROADMAP

## 1. Revisión y refactorización de código

Revisar los modelos, servicios y controladores, asegurando una estructura eficiente, coherente, limpia, responsable, declarativa teniendo por sobre todas las cosas, claro y evidente manejo de principios SOLID Y DRY, de ser necesario, separar refactorizar y optimizar código existente.

## 2. Configuración de TypeScript

Una vez listo eso, revisar las configuraciones de typescript en tsconfig para asegurar una correcta compilación del backend en dist.

## 3. Configuración de Serverless

Generar un serverless.yml orientado a lo realizado anteriormente, únicamente cuando todo lo anterior esté completo y revisado, dicho serverless, al igual que lo construido en src, debe ser considerando y apuntando el uso de:
- Lambda
- DynamoDB
- S3
- WebSocket 