# 🚀 Configuración del Servidor MCP EmotioXV2

## 📋 Requisitos Previos

1. **Node.js 20+** instalado
2. **GitHub CLI (`gh`)** instalado y autenticado
3. **Git** configurado

## 🔧 Instalación

### 1. Instalar dependencias

```bash
cd mcp-server
npm install
```

### 2. Compilar el servidor

```bash
npm run build
```

### 3. Verificar que funciona

```bash
node dist/index.js
```

Deberías ver: `EmotioXV2 MCP Server running on stdio`

## ⚙️ Configuración en Cursor

### Opción 1: Usar ruta relativa (Recomendado)

El archivo `.cursor/mcp.json` ya está configurado con la ruta relativa `${workspaceFolder}/mcp-server/dist/index.js`.

### Opción 2: Usar ruta absoluta

Si prefieres usar una ruta absoluta, edita `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "emotioxv2": {
      "command": "node",
      "args": [
        "/ruta/completa/a/emotioXV2/mcp-server/dist/index.js"
      ],
      "env": {}
    }
  }
}
```

### Opción 3: Instalación global (Opcional)

Si quieres instalar el servidor globalmente:

```bash
npm link
```

Luego actualiza `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "emotioxv2": {
      "command": "emotioxv2-mcp"
    }
  }
}
```

## 🔐 Autenticación de GitHub CLI

Asegúrate de tener GitHub CLI autenticado:

```bash
gh auth login
```

Verifica que funciona:

```bash
gh run list --limit 1
```

## ✅ Verificación

1. Reinicia Cursor
2. Abre la paleta de comandos (Cmd/Ctrl + Shift + P)
3. Busca "MCP" o "EmotioXV2"
4. Deberías ver las herramientas disponibles

## 🛠️ Herramientas Disponibles

### Git Operations
- `git_status` - Ver estado actual de git
- `git_commit` - Hacer commit de cambios
- `git_push` - Subir cambios al remoto
- `git_commit_and_push` - Commit y push en una sola operación

### GitHub Actions
- `github_actions_list_runs` - Listar últimos runs
- `github_actions_view_run` - Ver detalles de un run
- `github_actions_view_logs` - Ver logs de un run
- `github_actions_list_workflows` - Listar workflows disponibles

### Deployments
- `deployment_status` - Verificar estado de deployments
- `deployment_summary` - Resumen completo del estado

## 🐛 Solución de Problemas

### Error: "command not found: gh"
- Instala GitHub CLI: `brew install gh` (macOS) o `sudo apt install gh` (Linux)
- Autentica: `gh auth login`

### Error: "command not found: git"
- Instala Git según tu sistema operativo

### El servidor no se conecta
- Verifica que el archivo `.cursor/mcp.json` existe
- Verifica que la ruta al archivo `dist/index.js` es correcta
- Reinicia Cursor después de cambiar la configuración

### Error de permisos
- Asegúrate de que el archivo `dist/index.js` tiene permisos de ejecución:
  ```bash
  chmod +x mcp-server/dist/index.js
  ```

## 📝 Notas

- El servidor MCP se ejecuta en modo stdio (entrada/salida estándar)
- Todas las operaciones se ejecutan desde el directorio raíz del proyecto
- Los comandos de git y GitHub CLI deben estar disponibles en el PATH

