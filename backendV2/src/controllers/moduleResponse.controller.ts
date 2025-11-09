import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getCorsHeaders } from '../middlewares/cors';
import { CreateModuleResponseDtoSchema, ParticipantResponsesDocument, UpdateModuleResponseDtoSchema } from '../models/moduleResponse.model';
import { moduleResponseService } from '../services/moduleResponse.service';
import { participantService } from '../services/participant.service';

/**
 * Controlador para el manejo de respuestas de módulos
 */
export class ModuleResponseController {
  constructor() { }

  /**
   * Guardar una respuesta de módulo (crea o actualiza)
   */
  async saveResponse(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para guardar la respuesta',
            status: 400
          })
        };
      }

      const data = JSON.parse(event.body);

      // Validar los datos utilizando el esquema
      const validatedData = CreateModuleResponseDtoSchema.parse(data);

      // 🎯 VALIDAR QUE EL PARTICIPANTE EXISTE
      if (validatedData.participantId) {
        const participant = await participantService.findById(validatedData.participantId);
        if (!participant) {
          return {
            statusCode: 404,
            headers: getCorsHeaders(event),
            body: JSON.stringify({
              error: `Participante con ID '${validatedData.participantId}' no encontrado`,
              status: 404
            })
          };
        }
        console.log(`[ModuleResponse] Participante validado: ${participant.name} (${participant.email})`);
      }

      // Guardar la respuesta (el servicio decide si es crear o actualizar)
      const savedResponse = await moduleResponseService.saveModuleResponse(validatedData);

      // 🎯 INCLUIR RESULTADO DE CUOTA EN LA RESPUESTA
      const responseData = {
        ...savedResponse,
        quotaResult: savedResponse.quotaResult
      };

      return {
        statusCode: 201,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: responseData,
          status: 201
        })
      };
    } catch (error: unknown) {
      console.error('Error al guardar respuesta:', error);

      if (error instanceof z.ZodError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: error.errors,
            status: 400
          })
        };
      }

      return {
        statusCode: (error as { statusCode?: number }).statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: ((error as Error)?.message || "Error desconocido") || 'Error al guardar respuesta',
          status: (error as { statusCode?: number }).statusCode || 500
        })
      };
    }
  }

  /**
   * Actualizar una respuesta específica
   */
  async updateResponse(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para actualizar la respuesta',
            status: 400
          })
        };
      }

      const responseId = event.pathParameters?.id;
      const researchId = event.queryStringParameters?.researchId;
      const participantId = event.queryStringParameters?.participantId;

      if (!responseId || !researchId || !participantId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren responseId, researchId y participantId',
            status: 400
          })
        };
      }

      const data = JSON.parse(event.body);

      // Validar los datos utilizando el esquema
      const validatedData = UpdateModuleResponseDtoSchema.parse(data);

      // Actualizar la respuesta
      const updatedResponse = await moduleResponseService.updateModuleResponse(
        researchId,
        participantId,
        responseId,
        validatedData
      );

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: updatedResponse,
          status: 200
        })
      };
    } catch (error: unknown) {
      console.error('Error al actualizar respuesta:', error);

      if (error instanceof z.ZodError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: error.errors,
            status: 400
          })
        };
      }

      return {
        statusCode: (error as { statusCode?: number }).statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: ((error as Error)?.message || "Error desconocido") || 'Error al actualizar respuesta',
          status: (error as { statusCode?: number }).statusCode || 500
        })
      };
    }
  }

  /**
   * Obtener respuestas por research y participante
   */
  async getResponses(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.queryStringParameters?.researchId;
      const participantId = event.queryStringParameters?.participantId;

      if (!researchId || !participantId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren researchId y participantId',
            status: 400
          })
        };
      }

      // 🎯 VALIDAR QUE EL PARTICIPANTE EXISTE
      const participant = await participantService.findById(participantId);
      if (!participant) {
        return {
          statusCode: 404,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: `Participante con ID '${participantId}' no encontrado`,
            status: 404
          })
        };
      }

      // Obtener las respuestas
      const responses = await moduleResponseService.getResponsesForParticipant(
        researchId,
        participantId
      );

      if (!responses) {
        return {
          statusCode: 200,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            data: null,
            message: 'No hay respuestas para este participante en este research',
            status: 200
          })
        };
      }

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: responses,
          status: 200
        })
      };
    } catch (error: unknown) {
      console.error('Error al obtener respuestas:', error);

      return {
        statusCode: (error as { statusCode?: number }).statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: ((error as Error)?.message || "Error desconocido") || 'Error al obtener respuestas',
          status: (error as { statusCode?: number }).statusCode || 500
        })
      };
    }
  }

  /**
   * Marcar como completado
   */
  async markAsCompleted(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren datos para marcar como completado',
            status: 400
          })
        };
      }

      const data = JSON.parse(event.body);
      const { researchId, participantId } = data;

      if (!researchId || !participantId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren researchId y participantId',
            status: 400
          })
        };
      }

      // Marcar como completado
      const result = await moduleResponseService.markAsCompleted(researchId, participantId);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: result,
          status: 200
        })
      };
    } catch (error: unknown) {
      console.error('Error al marcar como completado:', error);

      return {
        statusCode: (error as { statusCode?: number }).statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: ((error as Error)?.message || "Error desconocido") || 'Error al marcar como completado',
          status: (error as { statusCode?: number }).statusCode || 500
        })
      };
    }
  }

  /**
   * Eliminar todas las respuestas
   */
  async deleteAllResponses(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.queryStringParameters?.researchId;
      const participantId = event.queryStringParameters?.participantId;

      if (!researchId || !participantId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requieren researchId y participantId',
            status: 400
          })
        };
      }

      // Eliminar todas las respuestas
      const result = await moduleResponseService.deleteAllResponses(researchId, participantId);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: result,
          status: 200
        })
      };
    } catch (error: unknown) {
      console.error('Error al eliminar respuestas:', error);

      return {
        statusCode: (error as { statusCode?: number }).statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: ((error as Error)?.message || "Error desconocido") || 'Error al eliminar respuestas',
          status: (error as { statusCode?: number }).statusCode || 500
        })
      };
    }
  }

  /**
   * Obtener todas las respuestas para un research (estructura optimizada)
   */
  async getResponsesByResearch(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.id;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requiere researchId',
            status: 400
          })
        };
      }

      // Obtener las respuestas
      const responses = await moduleResponseService.getResponsesByResearch(researchId);

      // Transformar a estructura optimizada agrupada por questionKey
      const groupedResponses = this.transformToOptimizedStructure(responses);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: groupedResponses,
          status: 200
        })
      };
    } catch (error: unknown) {
      console.error('Error al obtener respuestas por research:', error);

      return {
        statusCode: (error as { statusCode?: number }).statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: ((error as Error)?.message || "Error desconocido") || 'Error al obtener respuestas por research',
          status: (error as { statusCode?: number }).statusCode || 500
        })
      };
    }
  }

  /**
   * Obtener resultados procesados de SmartVOC para una investigación
   */
  async getSmartVOCResults(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.researchId;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requiere researchId',
            status: 400
          })
        };
      }

      // Obtener todos los participantes de la investigación
      const participants = await moduleResponseService.getParticipantsByResearch(researchId);

      if (!participants || participants.length === 0) {
        return {
          statusCode: 200,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            data: {
              totalResponses: 0,
              uniqueParticipants: 0,
              npsScore: 0,
              averageScore: 0,
              promoters: 0,
              detractors: 0,
              neutrals: 0,
              timeSeriesData: [],
              smartVOCResponses: [],
              vocResponses: []
            },
            message: 'No hay participantes en esta investigación',
            status: 200
          })
        };
      }
      // Función para parsear valores de respuesta
      const parseResponseValue = (response: unknown): number => {
        if (typeof response === 'number') return response;
        if (typeof response === 'object' && response !== null && 'value' in response) {
          const responseObj = response as { value: unknown };
          return typeof responseObj.value === 'number' ? responseObj.value : parseFloat(String(responseObj.value)) || 0;
        }
        if (typeof response === 'string') {
          const parsed = parseFloat(response);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      // Función para parsear texto de respuesta
      const parseResponseText = (response: unknown): string => {
        if (typeof response === 'string') return response;
        if (typeof response === 'object' && response !== null && 'value' in response) {
          const responseObj = response as { value: unknown };
          return String(responseObj.value);
        }
        if (typeof response === 'object') {
          return JSON.stringify(response);
        }
        return String(response);
      };

      // Procesar respuestas SmartVOC de todos los participantes
      const allSmartVOCResponses: Record<string, unknown>[] = [];
      const npsScores: number[] = [];
      const csatScores: number[] = [];
      const cesScores: number[] = [];
      const nevScores: number[] = [];
      const cvScores: number[] = [];
      const vocResponses: Record<string, unknown>[] = [];

      // Agrupar respuestas por fecha para time series
      const responsesByDate: { [key: string]: Record<string, unknown>[] } = {};

      for (const participant of participants) {
        const participantResponses = await moduleResponseService.getResponsesForParticipant(researchId, participant.id);

        if (participantResponses && participantResponses.responses && Array.isArray(participantResponses.responses)) {
          for (const response of participantResponses.responses) {
            // Filtrar solo respuestas SmartVOC
            if (response.questionKey && response.questionKey.toLowerCase().includes('smartvoc')) {
              const smartVOCResponse = {
                ...response,
                participantId: participant.id,
                participantName: participant.name || 'Participante',
                timestamp: response.timestamp || new Date().toISOString()
              };

              allSmartVOCResponses.push(smartVOCResponse);

              const responseValue = parseResponseValue(response.response);

              // Categorizar por tipo de pregunta
              if (response.questionKey.toLowerCase().includes('nps')) {
                if (responseValue > 0) {
                  npsScores.push(responseValue);
                }
              } else if (response.questionKey.toLowerCase().includes('csat')) {
                if (responseValue > 0) {
                  csatScores.push(responseValue);
                }
              } else if (response.questionKey.toLowerCase().includes('ces')) {
                if (responseValue > 0) {
                  cesScores.push(responseValue);
                }
              } else if (response.questionKey.toLowerCase().includes('nev')) {
                if (responseValue > 0) {
                  nevScores.push(responseValue);
                }
              } else if (response.questionKey.toLowerCase().includes('cv')) {
                if (responseValue > 0) {
                  cvScores.push(responseValue);
                }
              } else if (response.questionKey.toLowerCase().includes('voc')) {
                vocResponses.push({
                  text: parseResponseText(response.response),
                  participantId: participant.id,
                  participantName: participant.name || 'Participante',
                  timestamp: response.timestamp
                });
              }

              // Agrupar por fecha para time series
              const dateKey = new Date(response.timestamp || new Date()).toISOString().split('T')[0];
              if (!responsesByDate[dateKey]) {
                responsesByDate[dateKey] = [];
              }
              responsesByDate[dateKey].push(smartVOCResponse);
            }
          }
        }
      }

      // Calcular métricas agregadas
      const totalResponses = allSmartVOCResponses.length;
      const uniqueParticipants = participants.length;

      // Calcular NPS - Manejar escalas 0-6 y 0-10 dinámicamente
      const maxNpsScore = npsScores.length > 0 ? Math.max(...npsScores) : 10;
      const isScale0to6 = maxNpsScore <= 6;

      let promoters: number, detractors: number, neutrals: number;

      if (isScale0to6) {
        // Escala 0-6: 0-2 detractores, 3 neutral, 4-6 promotores
        promoters = npsScores.filter(score => score >= 4).length;
        detractors = npsScores.filter(score => score <= 2).length;
        neutrals = npsScores.filter(score => score === 3).length;
      } else {
        // Escala 0-10: 0-6 detractores, 7-8 neutral, 9-10 promotores
        promoters = npsScores.filter(score => score >= 9).length;
        detractors = npsScores.filter(score => score <= 6).length;
        neutrals = npsScores.filter(score => score >= 7 && score <= 8).length;
      }
      const npsScore = npsScores.length > 0 ? Math.round(((promoters - detractors) / npsScores.length) * 100) : 0;

      // Calcular CV - Manejar escalas 1-5, 1-7 y 1-10 dinámicamente
      const maxCvScore = cvScores.length > 0 ? Math.max(...cvScores) : 5;
      let cvPositive, cvNegative, cvNeutral;

      if (maxCvScore <= 5) {
        // Escala 1-5: 1-2 negativo, 3 neutral, 4-5 positivo
        cvPositive = cvScores.filter(score => score >= 4).length;
        cvNegative = cvScores.filter(score => score <= 2).length;
        cvNeutral = cvScores.filter(score => score === 3).length;
      } else if (maxCvScore <= 7) {
        // Escala 1-7: 1-3 negativo, 4 neutral, 5-7 positivo
        cvPositive = cvScores.filter(score => score >= 5).length;
        cvNegative = cvScores.filter(score => score <= 3).length;
        cvNeutral = cvScores.filter(score => score === 4).length;
      } else {
        // Escala 1-10: 1-4 negativo, 5-6 neutral, 7-10 positivo
        cvPositive = cvScores.filter(score => score >= 7).length;
        cvNegative = cvScores.filter(score => score <= 4).length;
        cvNeutral = cvScores.filter(score => score >= 5 && score <= 6).length;
      }
      const cvScore = cvScores.length > 0 ? Math.round(((cvPositive - cvNegative) / cvScores.length) * 100) : 0;

      // Calcular promedio de scores
      const allScores = [...csatScores, ...cesScores, ...nevScores, ...cvScores].filter(score => score > 0);
      const averageScore = allScores.length > 0 ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10 : 0;

      // Generar time series data
      const timeSeriesData = Object.keys(responsesByDate).map(date => {
        const dateResponses = responsesByDate[date];
        const dateNpsScores = dateResponses
          .filter(r => (r as Record<string, unknown>).questionKey && String((r as Record<string, unknown>).questionKey).toLowerCase().includes('nps'))
          .map(r => parseResponseValue(r.response))
          .filter(score => typeof score === 'number' && score > 0);

        const dateNevScores = dateResponses
          .filter(r => (r as Record<string, unknown>).questionKey && String((r as Record<string, unknown>).questionKey).toLowerCase().includes('nev'))
          .map(r => parseResponseValue(r.response))
          .filter(score => typeof score === 'number' && score > 0);

        const avgNps = dateNpsScores.length > 0 ? dateNpsScores.reduce((a, b) => a + b, 0) / dateNpsScores.length : 0;
        const avgNev = dateNevScores.length > 0 ? dateNevScores.reduce((a, b) => a + b, 0) / dateNevScores.length : 0;

        return {
          date,
          score: averageScore,
          nps: avgNps,
          nev: avgNev,
          count: dateResponses.length
        };
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Generar datos para CPVCard
      const cpvValue = csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : 0;

      // Generar datos para NPSQuestion
      const monthlyNPSData = timeSeriesData.map(item => ({
        month: new Date(item.date).toLocaleDateString('es-ES', { month: 'short' }),
        promoters: totalResponses > 0 ? Math.round((promoters / totalResponses) * item.count) : 0,
        neutrals: totalResponses > 0 ? Math.round((neutrals / totalResponses) * item.count) : 0,
        detractors: totalResponses > 0 ? Math.round((detractors / totalResponses) * item.count) : 0,
        npsRatio: npsScore
      }));

      const result = {
        // Métricas generales
        totalResponses,
        uniqueParticipants,
        npsScore,
        averageScore,
        promoters,
        detractors,
        neutrals,

        // Datos para componentes específicos
        cpvValue,
        satisfaction: csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : 0,
        retention: totalResponses > 0 ? Math.round(((promoters + neutrals) / totalResponses) * 100) : 0,
        impact: totalResponses > 0 && promoters > detractors ? 'Alto' : totalResponses > 0 ? 'Medio' : 'Bajo',
        trend: totalResponses > 0 && promoters > detractors ? 'Positiva' : totalResponses > 0 ? 'Neutral' : 'Negativa',

        // Time series data
        timeSeriesData,
        monthlyNPSData,

        // Respuestas detalladas
        smartVOCResponses: allSmartVOCResponses,
        vocResponses,

        // Scores individuales para cálculos adicionales
        npsScores,
        csatScores,
        cesScores,
        nevScores,
        cvScores,

        // Métricas CV
        cvScore,
        cvPositive,
        cvNegative,
        cvNeutral
      };

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: result,
          status: 200
        })
      };
    } catch (error: unknown) {
      console.error('Error al obtener resultados SmartVOC:', error);

      return {
        statusCode: (error as { statusCode?: number }).statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: ((error as Error)?.message || "Error desconocido") || 'Error al obtener resultados SmartVOC',
          status: (error as { statusCode?: number }).statusCode || 500
        })
      };
    }
  }

  /**
   * Obtener resultados específicos para CPVCard
   */
  async getCPVResults(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.researchId;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requiere researchId',
            status: 400
          })
        };
      }

      // Obtener todos los participantes de la investigación
      const participants = await moduleResponseService.getParticipantsByResearch(researchId);

      if (!participants || participants.length === 0) {
        return {
          statusCode: 200,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            data: {
              cpvValue: 0,
              satisfaction: 0,
              retention: 0,
              impact: 'Bajo',
              trend: 'Negativa'
            },
            message: 'No hay participantes en esta investigación',
            status: 200
          })
        };
      }

      // Función para parsear valores de respuesta
      const parseResponseValue = (response: unknown): number => {
        if (typeof response === 'number') return response;
        if (typeof response === 'object' && response !== null && 'value' in response) {
          const responseObj = response as { value: unknown };
          return typeof responseObj.value === 'number' ? responseObj.value : parseFloat(String(responseObj.value)) || 0;
        }
        if (typeof response === 'string') {
          const parsed = parseFloat(response);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      // Procesar respuestas SmartVOC de todos los participantes
      const csatScores: number[] = [];
      const npsScores: number[] = [];

      for (const participant of participants) {
        const participantResponses = await moduleResponseService.getResponsesForParticipant(researchId, participant.id);

        if (participantResponses && participantResponses.responses && Array.isArray(participantResponses.responses)) {
          for (const response of participantResponses.responses) {
            // Filtrar solo respuestas SmartVOC
            if (response.questionKey && response.questionKey.toLowerCase().includes('smartvoc')) {
              const responseValue = parseResponseValue(response.response);

              // Categorizar por tipo de pregunta
              if (response.questionKey.toLowerCase().includes('csat')) {
                if (responseValue > 0) {
                  csatScores.push(responseValue);
                }
              } else if (response.questionKey.toLowerCase().includes('nps')) {
                if (responseValue > 0) {
                  npsScores.push(responseValue);
                }
              }
            }
          }
        }
      }

      // Calcular métricas específicas para CPVCard
      const cpvValue = csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : 0;
      const satisfaction = csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : 0;

      // Calcular NPS para retención - Manejar escalas 0-6 y 0-10 dinámicamente
      const maxNpsScore = npsScores.length > 0 ? Math.max(...npsScores) : 10;
      const isScale0to6 = maxNpsScore <= 6;

      let promoters, detractors, neutrals;

      if (isScale0to6) {
        // Escala 0-6: 0-2 detractores, 3 neutral, 4-6 promotores
        promoters = npsScores.filter(score => score >= 4).length;
        detractors = npsScores.filter(score => score <= 2).length;
        neutrals = npsScores.filter(score => score === 3).length;
      } else {
        // Escala 0-10: 0-6 detractores, 7-8 neutral, 9-10 promotores
        promoters = npsScores.filter(score => score >= 9).length;
        detractors = npsScores.filter(score => score <= 6).length;
        neutrals = npsScores.filter(score => score >= 7 && score <= 8).length;
      }
      const totalNPS = npsScores.length;
      const retention = totalNPS > 0 ? Math.round(((promoters + neutrals) / totalNPS) * 100) : 0;

      // Determinar impacto y tendencia
      const impact = totalNPS > 0 && promoters > detractors ? 'Alto' : totalNPS > 0 ? 'Medio' : 'Bajo';
      const trend = totalNPS > 0 && promoters > detractors ? 'Positiva' : totalNPS > 0 ? 'Neutral' : 'Negativa';

      const result = {
        cpvValue,
        satisfaction,
        retention,
        impact,
        trend
      };


      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: result,
          status: 200
        })
      };
    } catch (error: unknown) {
      console.error('Error al obtener resultados CPV:', error);

      return {
        statusCode: (error as { statusCode?: number }).statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: ((error as Error)?.message || "Error desconocido") || 'Error al obtener resultados CPV',
          status: (error as { statusCode?: number }).statusCode || 500
        })
      };
    }
  }

  /**
   * Obtener resultados específicos para TrustRelationshipFlow
   */
  async getTrustFlowResults(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.researchId;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requiere researchId',
            status: 400
          })
        };
      }

      // Obtener todos los participantes de la investigación
      const participants = await moduleResponseService.getParticipantsByResearch(researchId);

      if (!participants || participants.length === 0) {
        return {
          statusCode: 200,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            data: {
              timeSeriesData: [],
              npsScores: [],
              nevScores: []
            },
            message: 'No hay participantes en esta investigación',
            status: 200
          })
        };
      }

      // Función para parsear valores de respuesta
      const parseResponseValue = (response: unknown): number => {
        if (typeof response === 'number') return response;
        if (typeof response === 'object' && response !== null && 'value' in response) {
          const responseObj = response as { value: unknown };
          return typeof responseObj.value === 'number' ? responseObj.value : parseFloat(String(responseObj.value)) || 0;
        }
        if (typeof response === 'string') {
          const parsed = parseFloat(response);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      // Procesar respuestas SmartVOC de todos los participantes
      const allResponses: Record<string, unknown>[] = [];

      for (const participant of participants) {
        const participantResponses = await moduleResponseService.getResponsesForParticipant(researchId, participant.id);

        if (participantResponses && participantResponses.responses && Array.isArray(participantResponses.responses)) {
          for (const response of participantResponses.responses) {
            // Filtrar solo respuestas SmartVOC NPS y NEV
            if (response.questionKey &&
              (response.questionKey.toLowerCase().includes('smartvoc_nps') ||
                response.questionKey.toLowerCase().includes('smartvoc_nev'))) {

              const smartVOCResponse = {
                ...response,
                participantId: participant.id,
                participantName: participant.name || 'Participante',
                timestamp: response.timestamp || new Date().toISOString()
              };

              allResponses.push(smartVOCResponse);
            }
          }
        }
      }

      // Agrupar respuestas por fecha para time series
      const responsesByDate: { [key: string]: Record<string, unknown>[] } = {};

      allResponses.forEach(response => {
        const timestamp = (response as Record<string, unknown>).timestamp as string || new Date().toISOString();
        const dateKey = new Date(timestamp).toISOString().split('T')[0];
        if (!responsesByDate[dateKey]) {
          responsesByDate[dateKey] = [];
        }
        responsesByDate[dateKey].push(response);
      });

      // Generar time series data para TrustRelationshipFlow
      const timeSeriesData = Object.keys(responsesByDate).map(date => {
        const dateResponses = responsesByDate[date];

        const dateNpsScores = dateResponses
          .filter(r => (r as Record<string, unknown>).questionKey && String((r as Record<string, unknown>).questionKey).toLowerCase().includes('nps'))
          .map(r => parseResponseValue(r.response))
          .filter(score => score > 0);

        const dateNevScores = dateResponses
          .filter(r => (r as Record<string, unknown>).questionKey && String((r as Record<string, unknown>).questionKey).toLowerCase().includes('nev'))
          .map(r => parseResponseValue(r.response))
          .filter(score => score > 0);

        const avgNps = dateNpsScores.length > 0 ? dateNpsScores.reduce((a, b) => a + b, 0) / dateNpsScores.length : 0;
        const avgNev = dateNevScores.length > 0 ? dateNevScores.reduce((a, b) => a + b, 0) / dateNevScores.length : 0;

        return {
          date,
          stage: new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
          nps: avgNps,
          nev: avgNev,
          count: dateResponses.length
        };
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Extraer scores individuales para análisis
      const npsScores = allResponses
        .filter(r => typeof r === 'object' && r !== null && 'questionKey' in r && typeof r.questionKey === 'string' && r.questionKey.toLowerCase().includes('nps'))
        .map(r => parseResponseValue((r as Record<string, unknown>).response))
        .filter(score => score > 0);

      const nevScores = allResponses
        .filter(r => typeof r === 'object' && r !== null && 'questionKey' in r && typeof r.questionKey === 'string' && r.questionKey.toLowerCase().includes('nev'))
        .map(r => parseResponseValue((r as Record<string, unknown>).response))
        .filter(score => score > 0);

      const result = {
        timeSeriesData,
        npsScores,
        nevScores,
        totalResponses: allResponses.length,
        uniqueDates: timeSeriesData.length
      };

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: result,
          status: 200
        })
      };
    } catch (error: unknown) {
      console.error('Error al obtener resultados Trust Flow:', error);

      return {
        statusCode: (error as { statusCode?: number }).statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: ((error as Error)?.message || "Error desconocido") || 'Error al obtener resultados Trust Flow',
          status: (error as { statusCode?: number }).statusCode || 500
        })
      };
    }
  }

  /**
   * Obtener respuestas agrupadas por pregunta para análisis estadísticos
   * Esta estructura es más eficiente para análisis de múltiples participantes
   */
  async getResponsesGroupedByQuestion(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const researchId = event.pathParameters?.researchId;

      if (!researchId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Se requiere researchId',
            status: 400
          })
        };
      }

      // Obtener todas las respuestas del research
      let allResponses: Record<string, unknown>[] = [];
      
      try {
        allResponses = await moduleResponseService.getResponsesByResearch(researchId);
        console.log(`[ModuleResponseController] ✅ Obtenidas ${allResponses.length} respuestas para research: ${researchId}`);
      } catch (error: unknown) {
        // Si es una investigación nueva sin datos, devolver estructura vacía en lugar de error
        console.log(`[ModuleResponseController] 📭 Research nuevo sin datos (${researchId}), devolviendo estructura vacía:`, ((error as Error)?.message || "Error desconocido"));
        
        if (((error as Error)?.message || "")?.includes('not found') || ((error as Error)?.message || "")?.includes('Requested resource not found')) {
          allResponses = [];
        } else {
          // Si es un error real (no relacionado con datos faltantes), propagarlo
          throw error;
        }
      }

      // Transformar la estructura: de participantes con respuestas a preguntas con respuestas
      const groupedByQuestion = this.transformToQuestionBasedStructure(allResponses as ParticipantResponsesDocument[]);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: groupedByQuestion,
          status: 200
        })
      };
    } catch (error: unknown) {
      console.error('Error al obtener respuestas agrupadas por pregunta:', error);

      return {
        statusCode: (error as { statusCode?: number }).statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: ((error as Error)?.message || "Error desconocido") || 'Error al obtener respuestas agrupadas por pregunta',
          status: (error as { statusCode?: number }).statusCode || 500
        })
      };
    }
  }

  /**
   * Transforma la estructura de participantes con respuestas a preguntas con respuestas
   * @param participantResponses Array de documentos de respuestas de participantes
   * @returns Array de preguntas con respuestas de todos los participantes
   */
  private transformToQuestionBasedStructure(
    participantResponses: ParticipantResponsesDocument[]
  ): Array<{
    questionKey: string;
    responses: Array<{
      participantId: string;
      value: unknown;
      timestamp: string;
      metadata: unknown;
      createdAt: string;
      updatedAt?: string;
    }>;
  }> {
    // Mapa para agrupar respuestas por questionKey
    const questionMap = new Map<string, Array<{
      participantId: string;
      value: unknown;
      timestamp: string;
      metadata: unknown;
      createdAt: string;
      updatedAt?: string;
    }>>();

    // Iterar sobre cada participante
    participantResponses.forEach(participantDoc => {
      const { participantId, responses } = participantDoc;

      // Iterar sobre cada respuesta del participante
      responses.forEach(response => {
        const { questionKey, response: responseValue, timestamp, metadata, createdAt, updatedAt } = response;

        // Si no existe el questionKey en el mapa, crear un array vacío
        if (!questionMap.has(questionKey)) {
          questionMap.set(questionKey, []);
        }

        // Agregar la respuesta al array correspondiente
        if (responseValue !== null) {
          questionMap.get(questionKey)!.push({
            participantId,
            value: typeof responseValue === 'object' && responseValue !== null && 'value' in responseValue
              ? responseValue.value
              : responseValue,
            timestamp,
            metadata: metadata || {},
            createdAt,
            updatedAt
          });
        }
      });
    });

    // Convertir el mapa a array de objetos
    const result = Array.from(questionMap.entries()).map(([questionKey, responses]) => ({
      questionKey,
      responses
    }));

    // Ordenar por questionKey para consistencia
    result.sort((a, b) => a.questionKey.localeCompare(b.questionKey));

    return result;
  }

  /**
   * Transforma las respuestas a estructura optimizada agrupada por questionKey
   */
  private transformToOptimizedStructure(
    participantResponses: ParticipantResponsesDocument[]
  ): Record<string, Array<{
    participantId: string;
    value: unknown;
    responseTime?: string;
    timestamp: string;
    metadata?: unknown;
  }>> {
    const groupedResponses: Record<string, Array<{
      participantId: string;
      value: unknown;
      responseTime?: string;
      timestamp: string;
      metadata?: unknown;
    }>> = {};

    participantResponses.forEach((participant) => {
      participant.responses?.forEach((response) => {
        const questionKey = response.questionKey;
        
        if (!groupedResponses[questionKey]) {
          groupedResponses[questionKey] = [];
        }

        // Extraer el valor de la respuesta con type guards
        let responseValue: unknown;
        console.log(`[transformToOptimizedStructure] questionKey: ${questionKey}, response.response type: ${typeof response.response}, isObject: ${typeof response.response === 'object'}`);
        if (response.response && typeof response.response === 'object') {
          const responseObj = response.response as Record<string, unknown>;
          console.log(`[transformToOptimizedStructure] questionKey: ${questionKey}, responseObj keys: ${Object.keys(responseObj).join(', ')}`);
          // Para respuestas complejas como ranking
          if ('selectedValue' in responseObj && responseObj.selectedValue) {
            // Intentar parsear JSON si es un string
            if (typeof responseObj.selectedValue === 'string') {
              try {
                responseValue = JSON.parse(responseObj.selectedValue);
              } catch {
                responseValue = responseObj.selectedValue;
              }
            } else {
              responseValue = responseObj.selectedValue;
            }
          } else if ('value' in responseObj && responseObj.value !== undefined) {
            // Si value es un objeto, devolverlo tal cual
            // Si value es un string, intentar parsearlo como JSON (puede ser un objeto serializado)
            if (typeof responseObj.value === 'string') {
              try {
                // Intentar parsear como JSON
                const parsed = JSON.parse(responseObj.value);
                responseValue = parsed;
              } catch {
                // Si no es JSON válido, devolver el string tal cual
                responseValue = responseObj.value;
              }
            } else if (typeof responseObj.value === 'object' && responseObj.value !== null) {
              // Si value es un objeto, asegurarse de que campos críticos estén parseados
              const valueObj = responseObj.value as Record<string, unknown>;
              console.log(`[transformToOptimizedStructure] valueObj keys: ${Object.keys(valueObj).join(', ')}, questionKey: ${questionKey}`);
              // Para navigation flow, parsear campos críticos que pueden venir como strings JSON
              if (questionKey === 'cognitive_navigation_flow') {
                console.log('[transformToOptimizedStructure] Procesando cognitive_navigation_flow');
                const criticalFields = ['imageSelections', 'clickPosition', 'allClicksTracking', 'visualClickPoints'];
                criticalFields.forEach(field => {
                  if (valueObj[field] && typeof valueObj[field] === 'string') {
                    console.log(`[transformToOptimizedStructure] Parseando campo ${field}, tipo: ${typeof valueObj[field]}, valor: ${String(valueObj[field]).substring(0, 100)}`);
                    // Si es un string JSON, intentar parsearlo
                    try {
                      const fieldValue = valueObj[field] as string;
                      // Intentar parsear el string JSON
                      const parsed = JSON.parse(fieldValue);
                      valueObj[field] = parsed;
                      console.log(`[transformToOptimizedStructure] ✅ Campo ${field} parseado correctamente, nuevo tipo: ${typeof valueObj[field]}`);
                    } catch (parseError) {
                      console.log(`[transformToOptimizedStructure] ⚠️ Error al parsear ${field}: ${parseError}`);
                      // Si falla el parseo, puede estar truncado
                      // Intentar extraer objetos completos del JSON truncado
                      try {
                        const truncatedStr = valueObj[field] as string;
                        // Buscar el último objeto completo antes del truncado
                        let lastCompleteIndex = -1;
                        let braceCount = 0;
                        let inString = false;
                        let escapeNext = false;
                        
                        for (let i = truncatedStr.length - 1; i >= 0; i--) {
                          const char = truncatedStr[i];
                          
                          if (escapeNext) {
                            escapeNext = false;
                            continue;
                          }
                          
                          if (char === '\\') {
                            escapeNext = true;
                            continue;
                          }
                          
                          if (char === '"' && !escapeNext) {
                            inString = !inString;
                            continue;
                          }
                          
                          if (inString) continue;
                          
                          if (char === '}') {
                            braceCount++;
                          } else if (char === '{') {
                            braceCount--;
                            if (braceCount === 0) {
                              // Encontramos el inicio de un objeto completo
                              // Buscar hacia adelante para encontrar el cierre completo
                              let forwardBraceCount = 0;
                              let foundComplete = false;
                              for (let j = i; j < truncatedStr.length; j++) {
                                const forwardChar = truncatedStr[j];
                                if (forwardChar === '{') forwardBraceCount++;
                                if (forwardChar === '}') {
                                  forwardBraceCount--;
                                  if (forwardBraceCount === 0) {
                                    lastCompleteIndex = j;
                                    foundComplete = true;
                                    break;
                                  }
                                }
                              }
                              if (foundComplete) break;
                            }
                          }
                        }
                        
                        if (lastCompleteIndex > 0) {
                          // Extraer hasta el último objeto completo
                          const partialStr = truncatedStr.substring(0, lastCompleteIndex + 1);
                          // Cerrar el objeto principal si es necesario
                          let openBraces = 0;
                          for (let i = 0; i < partialStr.length; i++) {
                            if (partialStr[i] === '{') openBraces++;
                            if (partialStr[i] === '}') openBraces--;
                          }
                          
                          let closedStr = partialStr;
                          // Cerrar las llaves faltantes
                          while (openBraces > 0) {
                            closedStr += '}';
                            openBraces--;
                          }
                          
                          valueObj[field] = JSON.parse(closedStr);
                        }
                        // Si no se puede parsear ni parcialmente, mantener el string tal cual
                      } catch (truncatedError) {
                        console.log(`[transformToOptimizedStructure] ⚠️ Error al parsear JSON truncado para ${field}: ${truncatedError}`);
                        // Si falla completamente, mantener el string tal cual
                      }
                    }
                  }
                });
                console.log(`[transformToOptimizedStructure] ✅ valueObj después del parseo:`, JSON.stringify(valueObj, null, 2).substring(0, 500));
              }
              responseValue = valueObj;
            } else {
              responseValue = responseObj.value;
            }
          } else {
            // Si no hay selectedValue ni value, pero es cognitive_navigation_flow, parsear campos directamente
            if (questionKey === 'cognitive_navigation_flow') {
              console.log('[transformToOptimizedStructure] Procesando cognitive_navigation_flow directamente en responseObj');
              const criticalFields = ['imageSelections', 'clickPosition', 'allClicksTracking', 'visualClickPoints'];
              criticalFields.forEach(field => {
                if (responseObj[field] && typeof responseObj[field] === 'string') {
                  console.log(`[transformToOptimizedStructure] Parseando campo ${field} directamente, tipo: ${typeof responseObj[field]}, valor: ${String(responseObj[field]).substring(0, 100)}`);
                  try {
                    const fieldValue = responseObj[field] as string;
                    const parsed = JSON.parse(fieldValue);
                    responseObj[field] = parsed;
                    console.log(`[transformToOptimizedStructure] ✅ Campo ${field} parseado correctamente, nuevo tipo: ${typeof responseObj[field]}`);
                  } catch (parseError) {
                    console.log(`[transformToOptimizedStructure] ⚠️ Error al parsear ${field}: ${parseError}`);
                    // Si falla el parseo, puede estar truncado - intentar extraer objetos completos
                    try {
                      const truncatedStr = responseObj[field] as string;
                      // Buscar el último objeto completo antes del truncado
                      let lastCompleteIndex = -1;
                      let braceCount = 0;
                      let inString = false;
                      let escapeNext = false;
                      
                      for (let i = truncatedStr.length - 1; i >= 0; i--) {
                        const char = truncatedStr[i];
                        
                        if (escapeNext) {
                          escapeNext = false;
                          continue;
                        }
                        
                        if (char === '\\') {
                          escapeNext = true;
                          continue;
                        }
                        
                        if (char === '"' && !escapeNext) {
                          inString = !inString;
                          continue;
                        }
                        
                        if (inString) continue;
                        
                        if (char === '}') {
                          braceCount++;
                        } else if (char === '{') {
                          braceCount--;
                          if (braceCount === 0) {
                            // Encontramos el inicio de un objeto completo
                            // Buscar hacia adelante para encontrar el cierre completo
                            let forwardBraceCount = 0;
                            let foundComplete = false;
                            for (let j = i; j < truncatedStr.length; j++) {
                              const forwardChar = truncatedStr[j];
                              if (forwardChar === '{') forwardBraceCount++;
                              if (forwardChar === '}') {
                                forwardBraceCount--;
                                if (forwardBraceCount === 0) {
                                  lastCompleteIndex = j;
                                  foundComplete = true;
                                  break;
                                }
                              }
                            }
                            if (foundComplete) break;
                          }
                        }
                      }
                      
                      if (lastCompleteIndex > 0) {
                        // Extraer hasta el último objeto completo
                        const partialStr = truncatedStr.substring(0, lastCompleteIndex + 1);
                        // Cerrar el objeto principal si es necesario
                        let openBraces = 0;
                        for (let i = 0; i < partialStr.length; i++) {
                          if (partialStr[i] === '{') openBraces++;
                          if (partialStr[i] === '}') openBraces--;
                        }
                        
                        let closedStr = partialStr;
                        // Cerrar las llaves faltantes
                        while (openBraces > 0) {
                          closedStr += '}';
                          openBraces--;
                        }
                        
                        responseObj[field] = JSON.parse(closedStr);
                        console.log(`[transformToOptimizedStructure] ✅ Campo ${field} parseado parcialmente (truncado), nuevo tipo: ${typeof responseObj[field]}`);
                      }
                    } catch (truncatedError) {
                      console.log(`[transformToOptimizedStructure] ⚠️ Error al parsear JSON truncado para ${field}: ${truncatedError}`);
                    }
                  }
                }
              });
              responseValue = responseObj;
            } else {
              responseValue = response.response;
            }
          }
        } else {
          responseValue = response.response;
        }

        // Calcular tiempo de respuesta (si es posible)
        let responseTime: string | undefined;
        if (response.createdAt && response.timestamp) {
          const createdAt = new Date(response.createdAt).getTime();
          const timestamp = new Date(response.timestamp).getTime();
          const timeDiff = Math.abs(timestamp - createdAt);
          responseTime = `${(timeDiff / 1000).toFixed(1)}s`;
        }

        groupedResponses[questionKey].push({
          participantId: participant.participantId,
          value: responseValue,
          responseTime,
          timestamp: response.timestamp,
          metadata: response.metadata
        });
      });
    });

    return groupedResponses;
  }
}

/**
 * Handler principal para procesar las peticiones de API Gateway
 */
export const mainHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const controller = new ModuleResponseController();
  const resource = event.resource;
  const method = event.httpMethod;
  const actualPath = event.path;

  // Agregar encabezados CORS a las respuestas OPTIONS
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: ''
    };
  }

  try {
    // Rutas para respuestas de módulos
    if (resource === '/module-responses' && method === 'POST') {
      return await controller.saveResponse(event);
    }

    if (resource === '/module-responses/{id}' && method === 'PUT') {
      return await controller.updateResponse(event);
    }

    if (resource === '/module-responses' && method === 'GET') {
      return await controller.getResponses(event);
    }

    if (resource === '/module-responses/complete' && method === 'POST') {
      return await controller.markAsCompleted(event);
    }

    if (resource === '/module-responses/research/{id}' && method === 'GET') {
      return await controller.getResponsesByResearch(event);
    }

    if (resource === '/module-responses/smartvoc/{researchId}' && method === 'GET') {
      return await controller.getSmartVOCResults(event);
    }

    if (resource === '/module-responses/cpv/{researchId}' && method === 'GET') {
      return await controller.getCPVResults(event);
    }

    if (resource === '/module-responses/trustflow/{researchId}' && method === 'GET') {
      return await controller.getTrustFlowResults(event);
    }

    if (resource === '/module-responses/grouped-by-question/{researchId}' && method === 'GET') {
      return await controller.getResponsesGroupedByQuestion(event);
    }

    if (resource === '/module-responses' && method === 'DELETE') {
      return await controller.deleteAllResponses(event);
    }

    // Fallback: intentar con actualPath si resource no coincide
    if (actualPath.startsWith('/module-responses/') && method === 'PUT') {
      return await controller.updateResponse(event);
    }

    // Si no se encuentra la ruta
    return {
      statusCode: 404,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        error: 'Ruta no encontrada',
        status: 404,
        debug: {
          resource,
          method,
          actualPath,
          pathParameters: event.pathParameters
        }
      })
    };
  } catch (error: unknown) {
    console.error('Error en mainHandler:', error);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        error: 'Error interno del servidor',
        status: 500
      })
    };
  }
};

// Export handler for index.ts compatibility
export const handler = mainHandler;
