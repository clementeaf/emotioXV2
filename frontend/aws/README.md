# Infraestructura AWS para EmotioXV2 Frontend

Este directorio contiene los archivos de configuración y scripts para desplegar el frontend de EmotioXV2 en AWS.

## Componentes de la Infraestructura

La infraestructura de AWS para el frontend de EmotioXV2 consiste en:

- **Amazon S3**: Almacenamiento para los archivos estáticos del frontend.
- **Amazon CloudFront**: CDN (Red de Distribución de Contenido) para servir el frontend.
- **Amazon Route 53** (opcional): Gestión de DNS para dominios personalizados.
- **AWS Certificate Manager** (opcional): Certificados SSL para HTTPS.

## Arquitectura

```
                                   ┌───────────────────┐
                                   │                   │
                     ┌────────────▶│  CloudFront CDN   │
                     │             │                   │
                     │             └───────────────────┘
                     │                      │
┌─────────────────┐  │                      │    ┌───────────────────┐
│                 │  │                      │    │                   │
│    Usuario      │──┘                      └───▶│   S3 Bucket       │
│                 │                              │                   │
└─────────────────┘                             └───────────────────┘
        ▲
        │
        │
┌─────────────────┐
│                 │
│   Route 53      │
│   (opcional)    │
└─────────────────┘
```

## Archivos en este Directorio

- **cloudformation-template.yml**: Template de CloudFormation que define toda la infraestructura.
- **README.md**: Este archivo, que proporciona documentación sobre la infraestructura.

## Scripts de Despliegue

En el directorio `frontend/scripts/` encontrarás dos scripts importantes:

- **create-aws-infrastructure.sh**: Crea o actualiza la infraestructura AWS utilizando CloudFormation.
- **deploy-frontend.sh**: Despliega los archivos del frontend compilado al bucket S3 e invalida la caché de CloudFront.

## Pasos para el Despliegue

1. **Configurar las credenciales de AWS**:
   ```bash
   aws configure
   ```

2. **Crear la infraestructura**:
   ```bash
   ./scripts/create-aws-infrastructure.sh
   ```
   
   Este script te guiará a través del proceso de creación de la infraestructura, permitiéndote seleccionar el entorno (dev, test, prod) y configurar parámetros adicionales para entornos de producción.

3. **Desplegar el frontend**:
   ```bash
   ./scripts/deploy-frontend.sh
   ```
   
   Este script construirá la aplicación frontend y la desplegará al bucket S3 configurado.

## Entornos Soportados

- **Desarrollo (dev)**: Para pruebas locales y desarrollo.
- **Pruebas (test)**: Para entornos de integración y QA.
- **Producción (prod)**: Para el entorno de producción.

## Configuración de Dominios Personalizados

Para configurar un dominio personalizado:

1. Obtén un certificado SSL en AWS Certificate Manager (ACM) para tu dominio.
2. Crea una zona hospedada en Route 53 para tu dominio (o utiliza otro proveedor de DNS).
3. Al ejecutar `create-aws-infrastructure.sh`, selecciona el entorno "prod" y proporciona la información solicitada sobre el dominio.

## Solución de Problemas

Si encuentras problemas con el despliegue:

1. Verifica que las credenciales de AWS estén configuradas correctamente.
2. Asegúrate de que los buckets S3 y distribuciones CloudFront se hayan creado con éxito.
3. Consulta los logs en la consola de AWS para ver mensajes de error detallados.
4. Para problemas de caché, puedes forzar una invalidación en CloudFront desde la consola de AWS.

## Recursos Adicionales

- [Documentación completa](../docs/aws-deployment.md)
- [AWS S3](https://aws.amazon.com/s3/)
- [AWS CloudFront](https://aws.amazon.com/cloudfront/)
- [AWS CloudFormation](https://aws.amazon.com/cloudformation/) 