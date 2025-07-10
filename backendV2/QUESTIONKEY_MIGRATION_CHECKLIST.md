# ✅ CHECKLIST: Migración QuestionKeys - EmotioXV2

## 🎯 OBJETIVO
Preparar la tabla DynamoDB para recibir configuraciones con questionKey y evitar mezcla de respuestas.

## 📋 ESTADO ACTUAL

### ✅ COMPLETADO:

#### 1. **Modelos DynamoDB Actualizados**
- [x] `smartVocForm.model.ts` - Añadido `questionKey?: string`
- [x] `cognitiveTask.model.ts` - Añadido `questionKey?: string`
- [x] `eyeTracking.model.ts` - Añadido `questionKey?: string`
- [x] `welcomeScreen.model.ts` - Añadido `questionKey?: string`
- [x] `thankYouScreen.model.ts` - Añadido `questionKey?: string`

#### 2. **Servicios Backend Actualizados**
- [x] `smartVocForm.service.ts` - Genera questionKey al crear formularios
- [x] `cognitiveTask.service.ts` - Genera questionKey al crear formularios
- [x] `buildQuestionDictionary.ts` - Función para generar questionKeys únicos

#### 3. **Scripts de Migración**
- [x] `migrate-question-keys.js` - Script de migración para datos existentes
- [x] `verify-question-keys.js` - Script de verificación
- [x] Scripts añadidos a `package.json`

#### 4. **Documentación**
- [x] README.md actualizado con instrucciones de migración
- [x] Checklist de verificación creado

## 🔧 PASOS PARA EJECUTAR:

### Paso 1: Verificar Estado Actual
```bash
cd backendV2
npm run verify-question-keys
```

### Paso 2: Ejecutar Migración
```bash
npm run migrate-question-keys
```

### Paso 3: Verificar Migración
```bash
npm run verify-question-keys
```

### Paso 4: Verificar con AWS CLI
```bash
# Contar formularios con questionKey
aws dynamodb scan --table-name emotioxv2-backend-table-dev \
  --filter-expression "attribute_exists(questionKey)" \
  --select COUNT

# Ver ejemplos
aws dynamodb scan --table-name emotioxv2-backend-table-dev \
  --filter-expression "attribute_exists(questionKey)" \
  --projection-expression "id, sk, questionKey" \
  --limit 5
```

## 📊 RESULTADOS ESPERADOS:

### ✅ Después de la migración exitosa:
- [ ] 100% de formularios tienen questionKey
- [ ] 0% de formularios sin questionKey
- [ ] 0 questionKeys duplicados
- [ ] Todos los questionKeys siguen el formato: `{módulo}:{tipo}:{id}`

### 📝 Ejemplos de QuestionKeys válidos:
- `smartvoc:VOC:abc123-def456`
- `cognitive_task:COGNITIVE_TASK:ghi789-jkl012`
- `welcome_screen:WELCOME_SCREEN:mno345-pqr678`
- `thank_you_screen:THANK_YOU_SCREEN:stu901-vwx234`
- `eye_tracking:EYE_TRACKING:yza567-bcd890`

## 🚨 POSIBLES PROBLEMAS:

### ❌ Si hay errores en la migración:
1. **Verificar permisos AWS**: Asegurar que el usuario tiene permisos para DynamoDB
2. **Verificar tabla**: Confirmar que `emotioxv2-backend-table-dev` existe
3. **Verificar región**: Confirmar que está en `us-east-1`
4. **Revisar logs**: Los errores se muestran en la consola

### ⚠️ Si hay formularios sin questionKey después de la migración:
1. **Ejecutar migración nuevamente**: `npm run migrate-question-keys`
2. **Verificar errores específicos**: Revisar logs de errores
3. **Migración manual**: Si es necesario, migrar formularios específicos manualmente

## 🎯 BENEFICIOS DESPUÉS DE LA MIGRACIÓN:

### ✅ Para public-tests:
- [ ] Identificación única de preguntas con questionKey
- [ ] No más mezcla de respuestas entre preguntas diferentes
- [ ] Sistema robusto de búsqueda y guardado de respuestas
- [ ] Compatibilidad con sistema anterior (fallback a stepType)

### ✅ Para backend:
- [ ] Formularios nuevos se crean con questionKey automáticamente
- [ ] Búsqueda de respuestas prioriza questionKey
- [ ] Logs detallados para debugging
- [ ] Sistema preparado para futuras expansiones

## 📞 SOPORTE:

Si hay problemas durante la migración:
1. Revisar logs detallados en la consola
2. Verificar permisos AWS y configuración
3. Ejecutar verificación para identificar problemas específicos
4. Contactar al equipo de desarrollo si persisten los problemas

---

**Última actualización**: $(date)
**Estado**: ✅ LISTO PARA EJECUTAR
