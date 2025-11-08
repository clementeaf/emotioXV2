# EmotioXV2 MCP Server

Servidor MCP (Model Context Protocol) para gestión ágil de Git, GitHub Actions y Deployments.

## 🚀 Características

- **Git Operations**: Status, commit, push, commit y push en una sola operación
- **GitHub Actions**: Listar runs, ver detalles, ver logs, listar workflows
- **Deployment Status**: Verificar estado de deployments (frontend, public-tests, research-links)
- **Deployment Summary**: Resumen completo del estado del proyecto

## 📦 Instalación

```bash
cd mcp-server
npm install
npm run build
```

## 🔧 Configuración en Cursor

Agrega la siguiente configuración a tu archivo de configuración de Cursor (`.cursor/mcp.json` o similar):

```json
{
  "mcpServers": {
    "emotioxv2": {
      "command": "node",
      "args": ["/ruta/completa/a/emotioXV2/mcp-server/dist/index.js"]
    }
  }
}
```

O si instalaste globalmente:

```json
{
  "mcpServers": {
    "emotioxv2": {
      "command": "emotioxv2-mcp"
    }
  }
}
```

## 🛠️ Herramientas Disponibles

### Git Operations

- `git_status`: Obtener estado actual de git
- `git_commit`: Hacer commit de cambios
- `git_push`: Subir cambios al remoto
- `git_commit_and_push`: Commit y push en una sola operación

### GitHub Actions

- `github_actions_list_runs`: Listar últimos runs
- `github_actions_view_run`: Ver detalles de un run
- `github_actions_view_logs`: Ver logs de un run
- `github_actions_list_workflows`: Listar workflows disponibles

### Deployments

- `deployment_status`: Verificar estado de deployments
- `deployment_summary`: Resumen completo del estado
- `check_deployment_sync`: Verificar si los deployments están sincronizados con los últimos commits
- `verify_s3_cloudfront_status`: Verificar el estado de S3/CloudFront y comparar con los últimos commits
- `compare_commits_with_deployments`: Comparar los últimos commits con los últimos deployments para identificar commits pendientes

### DynamoDB

- `dynamodb_list_tables`: Listar todas las tablas de DynamoDB disponibles
- `dynamodb_get_item`: Obtener un item específico de una tabla
- `dynamodb_put_item`: Crear o actualizar un item en una tabla
- `dynamodb_query`: Consultar una tabla usando una clave o índice
- `dynamodb_scan`: Escanear una tabla (obtener todos los items)
- `dynamodb_delete_item`: Eliminar un item de una tabla

### S3

- `s3_list_buckets`: Listar todos los buckets de S3 disponibles
- `s3_list_objects`: Listar objetos en un bucket
- `s3_get_object`: Obtener un objeto de S3
- `s3_put_object`: Subir un objeto a S3
- `s3_delete_object`: Eliminar un objeto de S3
- `s3_get_bucket_policy`: Obtener la política de un bucket
- `s3_put_bucket_policy`: Actualizar la política de un bucket
- `s3_get_bucket_cors`: Obtener la configuración CORS de un bucket
- `s3_put_bucket_cors`: Actualizar la configuración CORS de un bucket

## 📝 Requisitos

- Node.js 20+
- GitHub CLI (`gh`) instalado y autenticado
- Git configurado
- AWS CLI (`aws`) instalado y configurado (para DynamoDB y S3)

## 🔐 Autenticación

Asegúrate de tener GitHub CLI autenticado:

```bash
gh auth login
```

