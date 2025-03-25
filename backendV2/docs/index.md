# API EmotioXV2 - Índice de Documentación

<div style="text-align: center;">
  <img src="https://via.placeholder.com/150" alt="Logo EmotioXV2" width="150">
  <h2>Documentación de la API</h2>
  <p>Versión 0.1.0</p>
</div>

## Guías rápidas

<div style="display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0;">
  <a href="./api-reference.md" style="text-decoration: none; color: inherit;">
    <div style="padding: 20px; border-radius: 8px; border: 1px solid #ddd; width: 200px;">
      <h3>Referencia de API</h3>
      <p>Documentación completa de endpoints, métodos y ejemplos de uso.</p>
    </div>
  </a>
  <a href="./research-model.md" style="text-decoration: none; color: inherit;">
    <div style="padding: 20px; border-radius: 8px; border: 1px solid #ddd; width: 200px;">
      <h3>Modelo de Investigación</h3>
      <p>Estructura de datos, validaciones y operaciones del modelo de investigación.</p>
    </div>
  </a>
  <a href="./dynamodb-local.md" style="text-decoration: none; color: inherit;">
    <div style="padding: 20px; border-radius: 8px; border: 1px solid #ddd; width: 200px;">
      <h3>DynamoDB Local</h3>
      <p>Configuración y uso de DynamoDB Local para desarrollo.</p>
    </div>
  </a>
  <a href="./welcome-screen-model.md" style="text-decoration: none; color: inherit;">
    <div style="padding: 20px; border-radius: 8px; border: 1px solid #ddd; width: 200px;">
      <h3>Modelo de Pantallas de Bienvenida</h3>
      <p>Estructura de datos, validaciones y operaciones del modelo de pantallas de bienvenida.</p>
    </div>
  </a>
  <a href="./cicd.md" style="text-decoration: none; color: inherit;">
    <div style="padding: 20px; border-radius: 8px; border: 1px solid #ddd; width: 200px;">
      <h3>CI/CD</h3>
      <p>Documentación del flujo de CI/CD, configuración y resolución de problemas.</p>
    </div>
  </a>
</div>

## Componentes de investigación

<div style="display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0;">
  <a href="./api-reference.md#pantallas-de-bienvenida" style="text-decoration: none; color: inherit;">
    <div style="padding: 20px; border-radius: 8px; border: 1px solid #ddd; width: 200px;">
      <h3>Pantallas de Bienvenida</h3>
      <p>Configuración y gestión de pantallas de bienvenida para las investigaciones.</p>
    </div>
  </a>
  <!-- Más componentes se añadirán aquí -->
</div>

## Recursos adicionales

- [README principal](./README.md) - Guía general de documentación
- [Scripts de utilidad](../scripts/README.md) - Documentación de scripts para desarrollo

## Inicio rápido

Para comenzar a utilizar la API de EmotioXV2:

1. **Configuración**:
   ```bash
   # Instalar dependencias
   npm install
   
   # Instalar DynamoDB Local
   serverless dynamodb install
   ```

2. **Iniciar la API**:
   ```bash
   # Iniciar el servidor en modo desarrollo
   serverless offline start
   ```

3. **Autenticarse**:
   ```bash
   # Usar los scripts de utilidad
   source ../scripts/login.sh
   source ../scripts/export-token.sh
   ```

4. **Realizar una solicitud**:
   ```bash
   # Crear una investigación
   curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "name": "Mi primera investigación",
       "enterprise": "Mi Empresa",
       "type": "eye-tracking",
       "description": "Descripción de mi investigación",
       "targetParticipants": 50
     }' \
     http://localhost:3000/dev/research
   ```

## Estado de la documentación

<table>
  <thead>
    <tr>
      <th>Documento</th>
      <th>Estado</th>
      <th>Última actualización</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Referencia de API</td>
      <td>✅ Completo</td>
      <td>24 de marzo de 2024</td>
    </tr>
    <tr>
      <td>Modelo de Investigación</td>
      <td>✅ Completo</td>
      <td>23 de marzo de 2024</td>
    </tr>
    <tr>
      <td>Pantallas de Bienvenida</td>
      <td>✅ Completo</td>
      <td>24 de marzo de 2024</td>
    </tr>
    <tr>
      <td>DynamoDB Local</td>
      <td>✅ Completo</td>
      <td>23 de marzo de 2024</td>
    </tr>
    <tr>
      <td>CI/CD</td>
      <td>✅ Completo</td>
      <td>24 de marzo de 2024</td>
    </tr>
  </tbody>
</table>

## Contacto

Para consultas relacionadas con la API o esta documentación, por favor contacta al equipo de desarrollo. 