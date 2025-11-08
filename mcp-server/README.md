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

## 📝 Requisitos

- Node.js 20+
- GitHub CLI (`gh`) instalado y autenticado
- Git configurado

## 🔐 Autenticación

Asegúrate de tener GitHub CLI autenticado:

```bash
gh auth login
```

