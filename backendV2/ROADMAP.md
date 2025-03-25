# ROADMAP - EmotioXV2

Este documento detalla las características, mejoras y tareas planificadas para futuras versiones de EmotioXV2.

## Fase 1: Infraestructura y Base del Proyecto (Completado)

### Configuración de Entorno Local
- [x] Implementar y configurar DynamoDB Local para desarrollo
- [x] Integrar Serverless Framework para desarrollo local
- [x] Configurar cliente DynamoDB para detectar automáticamente entorno local/producción
- [x] Implementar scripts de utilidad para desarrollo (`login.sh`, `export-token.sh`)

### Implementación de Modelos y Servicios
- [x] Desarrollar el modelo `NewResearchModel` con operaciones CRUD completas
- [x] Implementar validaciones robustas con lógica de negocio
- [x] Implementar servicio de autenticación con JWT
- [x] Crear controladores RESTful para endpoints de API

### Documentación
- [x] Documentar la API con endpoints, parámetros y ejemplos
- [x] Crear documentación del modelo de investigación
- [x] Desarrollar guía de configuración para DynamoDB Local
- [x] Actualizar README principal con información sobre la nueva API

## Fase 2: Mejoras y Extensiones (En progreso)

### Modelos y Funcionalidades Adicionales
- [x] Implementar modelo `WelcomeScreenModel` para pantallas de bienvenida
- [x] Desarrollar endpoints para gestión de pantallas de bienvenida
- [x] Integrar pantallas de bienvenida con investigaciones
- [x] Implementar configuración de pantallas de bienvenida personalizables
- [x] Implementar modelo `SmartVOCFormModel` para formularios VOC
- [x] Implementar modelo `ThankYouScreenModel` para pantallas de agradecimiento
- [x] Desarrollar endpoints para gestión de pantallas de agradecimiento
- [x] Integrar pantallas de agradecimiento con investigaciones
- [ ] Implementar modelo de respuestas para formularios VOC
- [ ] Integrar análisis de resultados con módulo de emociones

### Testing
- [ ] Implementar pruebas unitarias para modelos
- [ ] Implementar pruebas unitarias para servicios
- [ ] Crear pruebas de integración para endpoints
- [ ] Configurar entorno de pruebas automatizado

### Frontend e Integración
- [x] Integrar frontend con endpoints de WelcomeScreen
- [x] Actualizar formularios según el nuevo modelo de datos
- [x] Implementar gestión de errores en el cliente
- [x] Crear componentes para nuevas funcionalidades
- [x] Actualizar `WelcomeScreenForm` para usar la nueva API
- [ ] Integrar frontend con endpoints de ThankYouScreen
- [ ] Actualizar `ThankYouScreenForm` para usar la nueva API
- [ ] Implementar visualización de resultados de SmartVOC

### DevOps
- [ ] Configurar pipeline de CI/CD en GitHub Actions
- [ ] Implementar entornos de desarrollo, pruebas y producción
- [ ] Configurar monitoreo y logging centralizado

## Fase 3: Características Avanzadas (Planificado)

### Backend
- [ ] Implementar sistema de notificaciones por email
- [ ] Añadir autenticación social (Google, Facebook, etc.)
- [ ] Implementar exportación de datos en diferentes formatos (CSV, JSON)
- [ ] Añadir soporte para análisis de resultados de eye-tracking
- [ ] Implementar sistema de permisos y roles más avanzado

### Optimización
- [ ] Implementar sistema de caché para consultas frecuentes
- [ ] Optimizar consultas a DynamoDB con índices secundarios
- [ ] Mejorar rendimiento de operaciones de lectura/escritura
- [ ] Implementar paginación para grandes conjuntos de datos

### Frontend
- [ ] Desarrollar interfaz de administración
- [ ] Crear dashboard con visualización de datos
- [ ] Implementar editor visual de pantallas de bienvenida y agradecimiento
- [ ] Añadir soporte para internacionalización (i18n)

## Fase 4: Expansión y Mejora (Futuro)

### Nuevas funcionalidades
- [ ] Implementar cuestionarios personalizables
- [ ] Añadir sistema de gamificación para participantes
- [ ] Desarrollar API pública para integraciones externas
- [ ] Implementar análisis avanzado de emociones con IA
- [ ] Añadir soporte para colaboración en tiempo real

### Arquitectura
- [ ] Migración a arquitectura de microservicios
- [ ] Implementar sistema de caché distribuido
- [ ] Optimizar rendimiento para alta concurrencia
- [ ] Añadir soporte para múltiples bases de datos

## Problemas resueltos

- [x] Implementar correctamente el servicio de Research con conexión a DynamoDB
- [x] Configurar DynamoDB Local para desarrollo
- [x] Resolver problemas de ResourceNotFoundException al acceder a tablas
- [x] Implementar validación de datos con mensajes de error detallados
- [x] Crear scripts para facilitar el desarrollo y testing
- [x] Implementar modelo y endpoints para pantallas de bienvenida
- [x] Implementar modelo y endpoints para formularios SmartVOC
- [x] Implementar modelo y endpoints para pantallas de agradecimiento

## Tareas en curso y prioridades

### Prioridad alta
- Implementar pruebas unitarias y de integración
- Integrar frontend con endpoints de ThankYouScreen
- Implementar modelo de respuestas para formularios VOC
- Optimizar consultas a DynamoDB

### Prioridad media
- Configurar pipeline de CI/CD
- Implementar exportación de datos
- Desarrollar dashboard con visualización
- Crear documentación para nuevos módulos (SmartVOC, ThankYouScreen)

### Prioridad baja
- Sistema de notificaciones por email
- Autenticación social
- Internacionalización

---

Este ROADMAP es un documento vivo y se actualizará periódicamente a medida que avanza el proyecto y cambian las prioridades.

Última actualización: Marzo 2024 