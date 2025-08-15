# EmotioXV2 Backend Setup Guide

Este documento te guía paso a paso para configurar completamente el backend de EmotioXV2 con auto-creación de recursos AWS.

## 🚀 Setup Automático Completo

### Opción 1: Setup Completo (Recomendado)

```bash
# 1. Configurar credenciales AWS
aws configure

# 2. Ejecutar setup automático completo
npm run setup:aws

# 3. Compilar el proyecto
npm run build

# 4. Inicializar DynamoDB (opcional, se hace automáticamente)
npm run setup:db
```

### Opción 2: Setup Manual por Pasos

#### Paso 1: Configurar AWS CLI

```bash
# Instalar AWS CLI si no lo tienes
# macOS: brew install awscli
# Ubuntu: sudo apt install awscli
# Windows: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

# Configurar credenciales
aws configure
```

#### Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores específicos
nano .env
```

Variables principales a configurar:
- `AWS_REGION`: Región de AWS (ej: us-east-1)
- `DYNAMODB_TABLE`: Nombre de la tabla principal
- `S3_BUCKET_NAME`: Nombre del bucket para uploads
- `JWT_SECRET`: Clave secreta para JWT (CAMBIAR EN PRODUCCIÓN)

#### Paso 3: Crear Recursos AWS

```bash
# Ejecutar script de configuración
./scripts/setup-aws.sh
```

Este script creará:
- ✅ Rol IAM: `EmotioXV2-Lambda-Role`
- ✅ Política IAM: `EmotioXV2-Lambda-Policy`
- ✅ Bucket S3: `emotioxv2-uploads-dev`
- ✅ Configuración CORS para S3

#### Paso 4: Compilar e Inicializar

```bash
# Compilar TypeScript
npm run build

# Inicializar DynamoDB (opcional)
npm run setup:db
```

## 📋 Recursos Creados Automáticamente

### DynamoDB

**Tabla Principal:** `emotioXV2-table-dev`
- **PK:** `id` (String)
- **SK:** `sk` (String)

**Global Secondary Indexes (GSI):**
1. **userId-index**: Para buscar researches por usuario
   - PK: `userId`, SK: `sk`
2. **EntityTypeSkIndex**: Para buscar por tipo de entidad
   - PK: `EntityType`, SK: `sk`
3. **researchId-index**: Para buscar por research ID
   - PK: `researchId`, SK: `sk`
4. **ResearchIndex**: Para module responses
   - PK: `researchId`, SK: `participantId`
5. **ResearchParticipantIndex**: Para buscar participante específico
   - PK: `researchId`, SK: `participantId`

### IAM Permisos

El rol `EmotioXV2-Lambda-Role` incluye permisos para:
- ✅ **DynamoDB**: Crear tablas, índices y operaciones CRUD
- ✅ **S3**: Upload, download y gestión de archivos
- ✅ **CloudWatch**: Logs y métricas
- ✅ **Lambda**: Ejecución básica

## 🔧 Comandos Útiles

```bash
# Setup completo
npm run setup:aws              # Configurar todos los recursos AWS

# Development
npm run dev                    # Ejecutar en modo desarrollo
npm run build                  # Compilar TypeScript
npm run start                  # Ejecutar servidor local

# DynamoDB
npm run setup:db               # Inicializar/verificar tablas DynamoDB
npm run build:setup            # Compilar script de setup

# Deployment
npm run deploy:dev             # Deploy a desarrollo
npm run deploy:prod            # Deploy a producción

# Utilities
npm run export-endpoints       # Exportar endpoints al frontend
npm run info                   # Ver información del deployment
npm run logs                   # Ver logs en tiempo real
```

## 🌍 Variables de Entorno

### Desarrollo (.env)
```bash
AWS_REGION=us-east-1
DYNAMODB_TABLE=emotioXV2-table-dev
S3_BUCKET_NAME=emotioxv2-uploads-dev
JWT_SECRET=development-secret-key
NODE_ENV=development
AUTO_INIT_RESOURCES=true
```

### Producción
```bash
AWS_REGION=us-east-1
DYNAMODB_TABLE=emotioXV2-table-prod
S3_BUCKET_NAME=emotioxv2-uploads-prod
JWT_SECRET=super-secure-production-key
NODE_ENV=production
AUTO_INIT_RESOURCES=false
```

## 🚨 Troubleshooting

### Error: "Requested resource not found"
```bash
# Verificar que DynamoDB está configurado
npm run setup:db

# Verificar permisos IAM
aws iam get-role --role-name EmotioXV2-Lambda-Role
```

### Error: "Access Denied"
```bash
# Verificar credenciales AWS
aws sts get-caller-identity

# Verificar permisos del usuario
aws iam get-user
```

### Error: "Table already exists"
```bash
# Verificar estado de la tabla
aws dynamodb describe-table --table-name emotioXV2-table-dev

# Listar tablas existentes
aws dynamodb list-tables
```

### Error en Frontend: CORS
```bash
# Verificar configuración CORS del bucket
aws s3api get-bucket-cors --bucket emotioxv2-uploads-dev

# Reconfigurar CORS
./scripts/setup-aws.sh
```

## 📚 Estructura de Archivos

```
backendV2/
├── aws-config/
│   ├── iam-policy.json         # Política IAM personalizada
│   └── trust-policy.json       # Política de confianza
├── scripts/
│   └── setup-aws.sh           # Script de configuración automática
├── src/
│   ├── utils/
│   │   └── dynamodb-setup.ts   # Inicialización de DynamoDB
│   ├── services/
│   │   └── initialization.service.ts  # Servicio de auto-init
│   └── index.ts               # Handler principal con auto-init
├── .env                       # Variables de entorno
├── .env.example              # Ejemplo de configuración
└── SETUP.md                  # Esta documentación
```

## 🔐 Seguridad

### Producción
- ✅ Cambiar `JWT_SECRET` por una clave segura
- ✅ Configurar `AUTO_INIT_RESOURCES=false`
- ✅ Usar IAM roles específicos por ambiente
- ✅ Habilitar encryption en DynamoDB
- ✅ Configurar VPC para Lambda si es necesario

### Desarrollo
- ✅ Usar credenciales de desarrollo separadas
- ✅ Configurar CORS apropiados
- ✅ Logs detallados habilitados

## 📞 Soporte

Si encuentras problemas:

1. **Verificar logs**: `npm run logs`
2. **Verificar recursos**: `aws dynamodb list-tables`
3. **Reejecutar setup**: `npm run setup:aws`
4. **Verificar permisos**: Revisar `aws-config/iam-policy.json`

---

🎉 **¡Listo!** Tu backend EmotioXV2 debe estar completamente configurado y funcionando.