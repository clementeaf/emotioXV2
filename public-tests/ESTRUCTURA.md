# ESTRUCTURA DE COMPONENTES PRINCIPALES DE FORMULARIOS

Este archivo documenta los componentes y hooks encargados de la lógica de formularios y POST de respuestas en el flujo principal de participante.

## Componentes principales:

- ParticipantFlow
- ParticipantLogin
- ResearchSidebar
- ProgressBar
- DemographicsForm
- CSATView
- AgreementScaleView
- DifficultyScaleView
- EmotionSelectionView
- NPSView
- SmartVocFeedbackQuestion
- ShortTextView
- LongTextView
- SingleChoiceView
- MultiChoiceView
- LinearScaleView
- RankingQuestion
- NavigationFlowTask
- PreferenceTestTask
- WelcomeScreenHanudler (o WelcomeScreen)
- ThankYouView (o ThankYouScreen)

## Hooks
- useParticipantSession
  - Encargado del login con credenciales del usuario y researchId. Gestiona la sesión del participante y sincroniza el token y datos con el store global.

- useLoadResearchFormsConfig
  - Procesa y transforma los datos de la API
  devuelve la configuración de formularios para el flujo del participante
  se usa en el flujo principal para determinar qué formularios mostrar

- useResponseAPI
  - Maneja envio, obtencion, modificación y eliminación de respuestas


- collectResponseMetadata()
¿Qué recolecta?
✅ Geolocalización: GPS + IP (ciudad, país, lat/lng)
✅ Tiempo de respuesta: Por sección y global
✅ Reingresos: Cuántas veces volvió, cuándo fue la última vez
✅ Estado actual: En qué step está, cuál fue el último
✅ Información técnica: Browser, OS, timezone, dispositivo
✅ Sesión: Cuándo inició, cuándo terminó, tiempo total
Resumen:
✅ collectResponseMetadata() es la función central que recolecta TODA la metadata
