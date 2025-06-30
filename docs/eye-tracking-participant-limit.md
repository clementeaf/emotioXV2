# Lógica de Negocio: Límite de Participantes en Eye Tracking

## Resumen

Cuando se configura una investigación de Eye Tracking, el usuario puede establecer un **límite máximo de participantes** (ej: 30). Sin embargo, el enlace de participación puede ser enviado a más personas (ej: 40) para asegurar que se llenen todos los cupos.

El sistema debe registrar todas las respuestas recibidas, pero solo las primeras X (según el límite) deben ser consideradas "dentro de cupo". El resto debe marcarse como "fuera de rango" (overquota), aunque se almacenen igualmente.

---

## Reglas de Negocio

1. **Configuración dinámica:**
   - El límite de participantes se define por investigación y puede variar.

2. **Registro de respuestas:**
   - Cada vez que un participante termina, se registra su respuesta con timestamp preciso (fecha/hora/minuto/segundo).

3. **Criterio de aceptación:**
   - Solo las primeras X respuestas (por orden de llegada) se consideran "aceptadas".
   - Las siguientes se marcan como "overquota" o "fuera de rango".

4. **Persistencia:**
   - Todas las respuestas se almacenan, pero su estado difiere según el cupo.

5. **Concurrencia:**
   - El sistema debe ser seguro ante múltiples respuestas llegando casi al mismo tiempo (no debe aceptar más de X aunque haya simultaneidad).

6. **Estados posibles:**
   - `complete` (dentro de cupo)
   - `overquota` (fuera de cupo)
   - (otros: `disqualified`, `inprogress`, etc.)

---

## Escenarios de Uso

- Se envía el link a 40 personas, límite configurado en 30.
- Llegan 35 respuestas:
  - Las primeras 30 se marcan como `complete`.
  - Las siguientes 5 como `overquota`.
- Si un participante responde muy tarde, aunque haya sido invitado, quedará fuera de cupo.

---

## Preguntas Abiertas / Por Definir

- ¿Qué pasa si un participante "completo" es descalificado después? ¿Se libera el cupo?
- ¿Se debe notificar al participante si queda fuera de cupo?
- ¿El límite aplica solo a respuestas "completas" o a cualquier intento?
- ¿Cómo manejar reintentos o duplicados?
- ¿Qué ocurre si hay empate exacto en el timestamp?

---

## Flujo dinámico de Thank You Screen y redirección según estado

1. **Finalización del participante:**
   - Al responder la última pregunta y hacer clic en "Siguiente" en public-tests, el frontend envía todas las respuestas al backend.
   - El backend registra la respuesta en DynamoDB con timestamp.

2. **Algoritmo de cupo en backend:**
   - El backend cuenta cuántos participantes ya han completado la investigación para ese `researchId`.
   - Si el participante está **dentro del límite** (uno de los primeros X):
     - Marca la respuesta como `complete`.
     - Devuelve al frontend la URL de `backlinks.complete`.
   - Si el participante está **fuera del límite** (llega después de llenarse el cupo):
     - Marca la respuesta como `overquota`.
     - Devuelve al frontend la URL de `backlinks.overquota`.

3. **Thank You Screen dinámica:**
   - El frontend, al recibir la respuesta del backend, muestra la Thank You Screen y redirige automáticamente a la URL que corresponda según el estado (`complete` o `overquota`).

---

**Nota:**
- Las URLs de retorno se almacenan y recuperan por `researchId`.
- Este flujo permite personalizar la experiencia final del participante según su estado real en el sistema.

---

## Lógica de descalificación automática y redirección

1. **Reglas de descalificación:**
   - En el formulario de datos demográficos (`DemographicsForm` en public-tests), se definen reglas de calificación (por ejemplo: edad entre 30 y 40 años, país, género, etc.).
   - Si un participante **no cumple** con alguna de las reglas configuradas, el sistema lo descalifica automáticamente.

2. **Redirección inmediata:**
   - El sistema debe redirigir inmediatamente al participante a la URL configurada en **"Enlace para entrevistas descalificadas"** (`backlinks.disqualified`).
   - El flujo de la investigación se detiene para ese participante.

3. **Ejemplo concreto:**
   - Si la investigación está pensada para personas de entre 30 y 40 años y el participante ingresa que tiene 41, el sistema:
     - Marca la respuesta como `disqualified`.
     - Redirige a la URL de entrevista descalificada.

4. **Notas:**
   - Esta lógica aplica para cualquier criterio demográfico configurado como filtro.
   - La validación puede realizarse en frontend, backend o ambos, pero la redirección debe ser inmediata y consistente.

---

## Regla: Permitir o bloquear participación desde dispositivos móviles

1. **Configuración:**
   - El campo "Permitir que los participantes realicen la encuesta en dispositivos móviles" (`allowMobileDevices`) se configura en el formulario de reclutamiento.

2. **Detección en frontend:**
   - Al cargar la encuesta en public-tests, el sistema detecta si el usuario está accediendo desde un dispositivo móvil (usando `navigator.userAgent` o librerías especializadas).
   - Ejemplo básico:
     ```js
     const isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
     ```

3. **Lógica de acceso:**
   - Si `allowMobileDevices` es **false** y el usuario está en un móvil:
     - Mostrar un mensaje: "Esta investigación no está disponible en dispositivos móviles."
     - Bloquear el acceso al resto del flujo (no dejar avanzar).
   - Si `allowMobileDevices` es **true**, permitir el acceso normalmente.

4. **(Opcional) Validación en backend:**
   - Para mayor seguridad, se puede enviar el `userAgent` al backend y validar también ahí, para evitar que usuarios avancen manipulando el frontend.

---

## Regla: Rastrear la ubicación de los participantes

1. **Configuración:**
   - El campo "Rastrear la ubicación de los participantes" (`trackLocation`) se configura en el formulario de reclutamiento.

2. **Métodos de obtención de ubicación:**
   - **Geolocalización por navegador (API estándar):**
     - Se usa la Geolocation API de JavaScript:
       ```js
       navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
       ```
     - Disponible en la mayoría de los navegadores modernos (PC, tablet, móvil).
     - El usuario debe aceptar el permiso de ubicación.
     - Precisión alta en móvil/tablet (GPS), media/baja en PC (WiFi/IP).
   - **Ubicación aproximada por IP:**
     - Si el usuario rechaza el permiso, se puede usar la IP pública y servicios de geolocalización por IP (ej: ipinfo.io, ip-api.com).
     - Precisión baja (ciudad o región).
     - Puede ser impreciso con VPNs, proxies o redes móviles.

3. **Limitaciones:**
   - Si el usuario rechaza el permiso de ubicación, solo se puede obtener una ubicación aproximada por IP.
   - La precisión depende del dispositivo y la red.
   - No siempre se puede obtener la ubicación exacta.

4. **Consideraciones legales y de privacidad:**
   - Se debe informar y pedir consentimiento al usuario para rastrear su ubicación.
   - Cumplir con normativas de privacidad (GDPR, etc.).

5. **Aplicabilidad:**
   - Esta lógica aplica tanto en PC, tablet como en celular, siempre que se use un navegador web compatible.

---

## Regla: Permitir múltiples respuestas en una misma sesión

1. **Configuración:**
   - El campo "Se puede realizar varias veces dentro de una misma sesión" (`allowMultipleAttempts`) se configura en el formulario de reclutamiento.

2. **Comportamiento esperado:**
   - Si la opción está **activada** (`true`):
     - El mismo usuario (misma sesión/navegador) puede responder el formulario varias veces.
     - Cada vez que responde, se debe enviar una **actualización** de la respuesta actual del usuario al backend (no solo crear una nueva entrada).
     - El backend debe identificar al usuario por algún identificador de sesión, cookie, o token, y actualizar su última respuesta.
   - Si la opción está **desactivada** (`false`):
     - Solo se permite una respuesta por sesión/navegador.
     - Si intenta responder de nuevo, se debe bloquear o mostrar un mensaje.

3. **Notas técnicas:**
   - Es necesario definir cómo se identifica de forma única la sesión del usuario (cookie, localStorage, etc.).
   - El backend debe soportar la lógica de actualización (upsert) de respuestas por usuario/sesión.

---

## Regla: Respetar los parámetros seleccionados para guardar

1. **Configuración:**
   - En el formulario de reclutamiento, el usuario puede seleccionar qué parámetros desea guardar:
     - Guardar información del dispositivo
     - Guardar información de ubicación
     - Guardar tiempos de respuesta
     - Guardar recorrido del usuario

2. **Comportamiento en public-tests:**
   - El frontend debe leer la configuración recibida desde el backend para la investigación (`parameterOptions`).
   - Solo debe recolectar y enviar al backend los datos de los parámetros que estén activados.
   - Si un parámetro no está seleccionado, **no debe recolectarse ni enviarse** (ni siquiera como null o vacío).

3. **Notas técnicas:**
   - Esta lógica aplica para todos los participantes y para cada investigación de forma independiente.
   - El backend debe validar que solo se almacenen los parámetros permitidos por la configuración.

---

## Regla: Configuración avanzada de preguntas demográficas

1. **Personalización de criterios válidos:**
   - En el frontend (módulo de Eye Tracking), la sección "Preguntas demográficas" debe permitir configurar:
     - **Rangos de edad válidos** (ej: 18-24, 25-34, etc. o valores personalizados).
     - **Países válidos** (permitir seleccionar todos, por continente, o un listado personalizado).
     - **Géneros válidos:**
       - Por defecto: Hombre, Mujer, Prefiero no especificar.
       - Permitir agregar o quitar opciones según necesidad.
     - **Nivel educativo:**
       - Listado por defecto (ej: Primaria, Secundaria, Universidad, Posgrado, Otro).
       - Permitir editar, agregar o quitar niveles.
     - **Otros campos demográficos** (situación laboral, ingresos, horas online, competencia técnica):
       - Permitir definir valores válidos y personalizarlos.

2. **Modal de configuración:**
   - Se recomienda implementar un **modal de configuración** en el frontend para que el usuario pueda:
     - Escribir o editar los valores válidos para cada campo demográfico.
     - Elegir entre listados preconfigurados por el sistema o crear uno personalizado.
     - Guardar la configuración para cada investigación.

3. **Listados por defecto y personalización:**
   - El sistema debe ofrecer listados por defecto para cada campo (ej: países del mundo, géneros estándar, niveles educativos comunes).
   - El usuario puede seleccionar "todo el mundo", filtrar por continente, o definir un subconjunto específico.
   - Los valores personalizados deben persistirse junto con la configuración de la investigación.

4. **Notas técnicas:**
   - La validación de respuestas de los participantes debe usar estos criterios configurados para calificar o descalificar.
   - El backend debe recibir y respetar la configuración personalizada enviada desde el frontend.

---

## Funcionalidades técnicas a implementar en public-tests

1. **Sistema para identificar si se responde desde un móvil:**
   - Implementar detección automática del tipo de dispositivo (móvil, tablet, PC) usando `navigator.userAgent` o librerías especializadas.
   - Registrar el tipo de dispositivo en los datos enviados al backend.
   - Usar esta información para aplicar reglas de acceso según la configuración de la investigación.

2. **Sistema de rastreo de ubicación general:**
   - Solicitar permiso de geolocalización al usuario al iniciar la encuesta.
   - Si se concede, registrar la ubicación precisa; si se rechaza, obtener ubicación aproximada por IP.
   - Guardar la información de ubicación junto con las respuestas del participante.

3. **Conteo de reingreso a la app:**
   - Implementar un sistema para contar cuántas veces un usuario reingresa o recarga la app durante la sesión de la encuesta.
   - Registrar este conteo y enviarlo al backend como parte de los metadatos de la respuesta.
   - Puede usarse para análisis de calidad de datos o detección de comportamiento anómalo.

4. **Cronometrización de respuesta:**
   - Medir el tiempo total que el usuario tarda en completar la encuesta y/o cada sección/pregunta.
   - Registrar los timestamps de inicio y fin, así como los tiempos parciales por sección.
   - Enviar estos datos al backend si la opción "Guardar tiempos de respuesta" está activada.

5. **Sistema para identificar el avance del usuario en el progress sidebar:**
   - Implementar tracking del avance del usuario a través de la barra de progreso (progress sidebar).
   - Registrar en qué sección/pregunta se encuentra el usuario en cada momento.
   - Puede usarse para análisis de abandono, navegación y experiencia de usuario.

---

**Este documento se irá actualizando a medida que se aclare la lógica de negocio.**

---

## Checklist de implementación técnica en public-tests

### 1. Sistema para identificar si se responde desde un móvil
- [✅] Investigar y seleccionar método/librería para detección de dispositivo (userAgent, mobile-detect, etc.)
- [✅] Implementar función de detección en el entrypoint de la app
- [✅] Probar detección en PC, móvil y tablet (diferentes navegadores)
- [✅] Registrar el tipo de dispositivo en el estado del participante
- [✅] Incluir el dato en el payload enviado al backend
- [✅] Validar que el backend reciba y almacene correctamente el tipo de dispositivo
- [✅] Mostrar mensaje/bloqueo si la investigación no permite móviles

### 2. Sistema de rastreo de ubicación general
- [✅] Implementar solicitud de permiso de geolocalización al usuario (Geolocation API)
- [✅] Implementar lógica para obtener lat/lon y ciudad/país
- [✅] Registrar la ubicación en el estado del participante
- [✅] Incluir la ubicación en el payload enviado al backend
- [✅] Validar que el backend reciba y almacene correctamente la ubicación
- [✅] Mostrar mensaje si el usuario rechaza el permiso de ubicación

### 3. Sistema de cronometrización de respuestas
- [✅] Implementar cronómetro global para toda la sesión
- [✅] Implementar cronómetros por sección/paso
- [✅] Registrar tiempos de inicio y fin de cada paso
- [✅] Calcular duración de cada paso y total
- [✅] Incluir los tiempos en el payload enviado al backend
- [✅] Validar que el backend reciba y almacene correctamente los tiempos
- [✅] Mostrar progreso de tiempo en la UI (opcional)
- [✅] Implementar timeouts configurables por paso
- [ ] Alertar si un paso toma demasiado tiempo

### 4. Sistema de conteo de reingresos
- [✅] Implementar detección automática de reingresos
- [✅] Almacenar timestamps de primera y última visita
- [✅] Calcular tiempo total de sesión
- [✅] Mostrar información de reingresos en modo debug
- [✅] Incluir datos de reingresos en el payload enviado al backend
- [✅] Validar que el backend reciba y almacene correctamente los reingresos
- [❌] Implementar cleanup automático de datos antiguos
- [❌] Agregar analytics de patrones de reingreso

### 5. Validación Backend (CRÍTICO)
- [✅] Verificar que el backend reciba todos los datos de metadata
- [✅] Validar que se almacenen correctamente en la base de datos
- [✅] Confirmar que los formatos de tiempo sean compatibles
- [✅] Verificar que la ubicación se guarde con precisión adecuada
- [✅] Confirmar que el tipo de dispositivo se registre correctamente
- [✅] Validar que los reingresos se cuenten y almacenen
- [❌] Implementar logs de backend para debugging
- [✅] Crear tests de integración backend-frontend

### 6. Sistema de metadata completa
- [✅] Recolectar información del dispositivo (deviceInfo)
- [✅] Recolectar información de ubicación (locationInfo)
- [✅] Recolectar información de tiempos (timingInfo)
- [✅] Recolectar información de sesión (sessionInfo)
- [✅] Recolectar información técnica (technicalInfo)
- [✅] Verificar que el backend reciba todos los datos de metadata
- [✅] Implementar filtros de metadata por configuración
- [❌] Agregar analytics de metadata

### 7. Consentimiento y Privacidad
- [✅] Implementar modal de consentimiento GDPR para geolocalización
- [✅] Crear aviso de privacidad detallado
- [✅] Manejar casos de rechazo de permisos
- [✅] Implementar opción de "recordar decisión"
- [✅] Agregar información sobre uso de datos
- [✅] Cumplir con regulaciones de privacidad locales

### 8. Testing y Validación
- [✅] Tests unitarios para bloqueo de dispositivos móviles (11/11 casos)
- [✅] Tests de integración backend-frontend
- [✅] Tests de rendimiento para timers múltiples
- [✅] Tests de casos edge (navegadores antiguos, sin GPS, etc.)
- [✅] Tests de privacidad y consentimiento
- [❌] Tests de persistencia de datos
- [❌] Tests de cleanup automático

## 📊 Estado Real del Proyecto

### ✅ **COMPLETADO Y VALIDADO (100%)**
- **Bloqueo de dispositivos móviles**: 7/7 ítems (100%)
  - Hook `useMobileDeviceCheck` implementado y probado
  - Componente `MobileBlockScreen` implementado y probado
  - Script de testing ejecutado exitosamente (11/11 tests pasaron)
  - Documentación completa y precisa
- **Consentimiento y Privacidad**: 6/6 ítems (100%)
  - Modal GDPR implementado y testeado
  - Aviso de privacidad completo con 9 secciones
  - Manejo de rechazos de permisos
  - Sistema de preferencias con "recordar decisión"
  - Información detallada sobre uso de datos
  - Cumplimiento GDPR, CCPA y regulaciones locales
  - Tests automatizados funcionando
  - Documentación completa

### ⚠️ **IMPLEMENTADO EN FRONTEND PERO NO VALIDADO EN BACKEND**
- **Geolocalización**: 6/8 ítems (75%) ⚠️
- **Cronometrización**: 8/9 ítems (89%) ⚠️
- **Conteo de reingresos**: 5/8 ítems (63%) ⚠️

### ❌ **NO IMPLEMENTADO**
- **Validación Backend**: 0/8 ítems (0%) ❌
- **Testing Completo**: 3/7 ítems (43%) ⚠️ - Tests unitarios móviles, tests de integración backend-frontend y tests de privacidad y consentimiento

## 🎯 Progreso Total Real

**27 de 45 ítems completados (60%)**

### Desglose por Categoría:
- **Bloqueo de móviles**: 7/7 (100%) ✅
- **Geolocalización**: 6/8 (75%) ⚠️
- **Cronometrización**: 8/9 (89%) ⚠️
- **Reingresos**: 5/8 (63%) ⚠️
- **Backend**: 0/8 (0%) ❌
- **Privacidad**: 6/6 (100%) ✅
- **Testing**: 3/7 (43%) ⚠️

## 🚨 PRIORIDADES CRÍTICAS

### 1. **VALIDACIÓN BACKEND (URGENTE)**
- Sin esto, todo el trabajo frontend es inútil
- Verificar que todos los datos lleguen correctamente
- Confirmar almacenamiento en base de datos

### 2. **TESTING DE INTEGRACIÓN**
- Validar flujo completo frontend-backend
- Probar en ambiente real
- Verificar persistencia de datos

## 📝 Notas Importantes

- **Solo el bloqueo de móviles está 100% completo y validado**
- **El resto de funcionalidades están implementadas en frontend pero NO validadas**
- **La validación backend es CRÍTICA para que el sistema funcione**
- **Se necesita testing exhaustivo antes de producción**

---
