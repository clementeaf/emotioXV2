// Schema dinámico para el sistema genérico de formularios
export const questionSchema = {
  modules: {
    "smart-voc": {
      name: "Smart VOC",
      description: "Voice of Customer - Voz del cliente",
      questionTypes: {
        "CSAT": {
          id: "CSAT",
          name: "CSAT",
          description: "Customer Satisfaction - Satisfacción del cliente",
          fields: [
            {
              name: "title",
              label: "Título de la pregunta",
              component: "FormInput",
              placeholder: "¿Qué tan satisfecho está con nuestro servicio?",
              required: true
            },
            {
              name: "description",
              label: "Descripción (opcional)",
              component: "FormTextarea",
              placeholder: "Introduzca una descripción opcional para la pregunta"
            },
            {
              name: "instructions",
              label: "Instrucciones (opcional)",
              component: "FormTextarea",
              placeholder: "Añada instrucciones o información adicional para los participantes"
            },
            {
              name: "config.type",
              label: "Tipo de visualización",
              component: "FormSelect",
              placeholder: "Seleccionar tipo",
              options: [
                { value: "stars", label: "Estrellas" },
                { value: "numbers", label: "Números" },
                { value: "emojis", label: "Emojis" }
              ]
            },
            {
              name: "config.companyName",
              label: "Nombre de la empresa",
              component: "FormInput",
              placeholder: "Nombre de la empresa (opcional)"
            }
          ],
          previewType: "CSAT",
          info: "Mide satisfacción general del cliente"
        },
        "CES": {
          id: "CES",
          name: "CES",
          description: "Customer Effort Score - Esfuerzo del cliente",
          fields: [
            {
              name: "title",
              label: "Título de la pregunta",
              component: "FormInput",
              placeholder: "¿Qué tan fácil fue completar esta tarea?",
              required: true
            },
            {
              name: "description",
              label: "Descripción (opcional)",
              component: "FormTextarea",
              placeholder: "Introduzca una descripción opcional para la pregunta"
            },
            {
              name: "instructions",
              label: "Instrucciones (opcional)",
              component: "FormTextarea",
              placeholder: "Añada instrucciones o información adicional para los participantes"
            },
            {
              name: "config.scaleRange",
              label: "Rango de escala",
              component: "FormSelect",
              placeholder: "Seleccionar rango",
              options: [
                { value: "1-5", label: "1-5 (Estándar)" },
                { value: "1-7", label: "1-7" },
                { value: "1-10", label: "1-10" }
              ]
            }
          ],
          previewType: "CES",
          info: "Mide la facilidad de uso - Escala fija 1-5"
        },
        "CV": {
          id: "CV",
          name: "CV",
          description: "Customer Value - Valor del cliente",
          fields: [
            {
              name: "title",
              label: "Título de la pregunta",
              component: "FormInput",
              placeholder: "¿Qué valor le aporta nuestro producto?",
              required: true
            },
            {
              name: "description",
              label: "Descripción (opcional)",
              component: "FormTextarea",
              placeholder: "Introduzca una descripción opcional para la pregunta"
            },
            {
              name: "instructions",
              label: "Instrucciones (opcional)",
              component: "FormTextarea",
              placeholder: "Añada instrucciones o información adicional para los participantes"
            },
            {
              name: "config.scaleRange",
              label: "Rango de escala",
              component: "FormSelect",
              placeholder: "Seleccionar rango",
              options: [
                { value: "1-5", label: "1-5" },
                { value: "1-7", label: "1-7" },
                { value: "1-10", label: "1-10" }
              ]
            },
            {
              name: "config.startLabel",
              label: "Etiqueta inicial de escala",
              component: "FormInput",
              placeholder: "Poco valor"
            },
            {
              name: "config.endLabel",
              label: "Etiqueta final de escala",
              component: "FormInput",
              placeholder: "Mucho valor"
            }
          ],
          previewType: "CV",
          info: "3 escalas principales de valoración en la región"
        },
        "NEV": {
          id: "NEV",
          name: "NEV",
          description: "Net Emotional Value - Valor emocional neto",
          fields: [
            {
              name: "title",
              label: "Título de la pregunta",
              component: "FormInput",
              placeholder: "¿Cómo se siente al usar nuestro producto?",
              required: true
            },
            {
              name: "description",
              label: "Descripción (opcional)",
              component: "FormTextarea",
              placeholder: "Introduzca una descripción opcional para la pregunta"
            },
            {
              name: "instructions",
              label: "Instrucciones (opcional)",
              component: "FormTextarea",
              placeholder: "Añada instrucciones o información adicional para los participantes"
            },
            {
              name: "config.emotions",
              label: "Emociones (separadas por coma)",
              component: "FormInput",
              placeholder: "Feliz, Triste, Enojado",
              type: "text"
            }
          ],
          previewType: "NEV",
          info: "Jerarquía de Valor Emocional"
        },
        "NPS": {
          id: "NPS",
          name: "NPS",
          description: "Net Promoter Score - Puntuación de promotor neto",
          fields: [
            {
              name: "title",
              label: "Título de la pregunta",
              component: "FormInput",
              placeholder: "¿Qué tan probable es que recomiende nuestro producto?",
              required: true
            },
            {
              name: "description",
              label: "Descripción (opcional)",
              component: "FormTextarea",
              placeholder: "Introduzca una descripción opcional para la pregunta"
            },
            {
              name: "instructions",
              label: "Instrucciones (opcional)",
              component: "FormTextarea",
              placeholder: "Añada instrucciones o información adicional para los participantes"
            },
            {
              name: "config.companyName",
              label: "Nombre de la empresa",
              component: "FormInput",
              placeholder: "Nombre de la empresa (opcional)"
            }
          ],
          previewType: "NPS",
          info: "Escala 0-10 para medir lealtad del cliente"
        },
        "VOC": {
          id: "VOC",
          name: "VOC",
          description: "Voice of Customer - Voz del cliente",
          fields: [
            {
              name: "title",
              label: "Título de la pregunta",
              component: "FormInput",
              placeholder: "¿Qué opinión tiene sobre nuestro producto?",
              required: true
            },
            {
              name: "description",
              label: "Descripción (opcional)",
              component: "FormTextarea",
              placeholder: "Introduzca una descripción opcional para la pregunta"
            },
            {
              name: "instructions",
              label: "Instrucciones (opcional)",
              component: "FormTextarea",
              placeholder: "Añada instrucciones o información adicional para los participantes"
            },
            {
              name: "config.maxLength",
              label: "Límite de caracteres",
              component: "FormInput",
              placeholder: "500",
              type: "number"
            }
          ],
          previewType: "VOC",
          info: "Recolecta comentarios abiertos del cliente"
        }
      }
    },
    "cognitive-task": {
      name: "Cognitive Task",
      description: "Tareas Cognitivas",
      questionTypes: {}
    },
    "eye-tracking": {
      name: "Eye Tracking",
      description: "Seguimiento Ocular",
      questionTypes: {}
    }
  }
};
