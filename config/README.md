# 📁 Configuraciones del Proyecto - EmotioXV2

## 🏗️ Estructura de Carpetas

### `/environments/`
Archivos de variables de entorno organizados por ambiente:

#### Archivos existentes:
- `env.production.ec2` - **COPIA** del archivo descargado desde EC2

#### ⚠️ Nota importante sobre `env.production.ec2`:
- El archivo original permanece en la **raíz del proyecto**
- Es **descargado dinámicamente** por `scripts/validate-local-vs-ec2.sh`
- Esta carpeta contiene una **copia de referencia** para organización
- **NO modificar** la ubicación del archivo original

## 🔄 Scripts que interactúan con archivos de entorno:
- `validate-local-vs-ec2.sh` - Descarga y compara `env.production.ec2`
- `update-frontend-env-from-public-tests.sh` - Actualiza variables de entorno

## 📝 Uso recomendado:
1. **Para consulta**: usar archivos en `config/environments/`
2. **Para scripts**: mantener archivos en raíz como están
3. **Para nuevos entornos**: añadir aquí las copias de referencia

## 🚀 Futuras expansiones:
Esta estructura está preparada para:
- `env.development` - Variables de desarrollo
- `env.staging` - Variables de staging
- `env.test` - Variables de testing

## 🔐 Seguridad:
- **NUNCA** commitear archivos `.env` con secrets reales
- Usar `.env.example` para documentar variables necesarias
- Las copias aquí son solo para referencia/organización
