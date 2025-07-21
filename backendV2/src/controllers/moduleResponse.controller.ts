import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getCorsHeaders } from '../middlewares/cors';
import { CreateModuleResponseDtoSchema, UpdateModuleResponseDtoSchema } from '../models/moduleResponse.model';
import { moduleResponseService } from '../services/moduleResponse.service';

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

      // NUEVO: Logs detallados para debugging
      console.log(`[ModuleResponseController.saveResponse] 📝 Recibiendo respuesta:`, {
        researchId: data.researchId,
        participantId: data.participantId,
        questionKey: data.questionKey,
        responsesCount: data.responses?.length || 0
      });

      // Validar los datos utilizando el esquema
      const validatedData = CreateModuleResponseDtoSchema.parse(data);

      console.log(`[ModuleResponseController.saveResponse] ✅ Guardando con questionKey: ${validatedData.questionKey} y ${validatedData.responses.length} respuestas`);

      // Guardar la respuesta (el servicio decide si es crear o actualizar)
      const savedResponse = await moduleResponseService.saveModuleResponse(validatedData);

      console.log(`[ModuleResponseController.saveResponse] ✅ Respuesta guardada exitosamente:`, {
        responseId: savedResponse.id,
        questionKey: savedResponse.questionKey,
        responsesCount: Array.isArray(savedResponse.responses) ? savedResponse.responses.length : 0,
        quotaResult: savedResponse.quotaResult
      });

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
    } catch (error: any) {
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
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al guardar respuesta',
          status: error.statusCode || 500
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
    } catch (error: any) {
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
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al actualizar respuesta',
          status: error.statusCode || 500
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
    } catch (error: any) {
      console.error('Error al obtener respuestas:', error);

      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al obtener respuestas',
          status: error.statusCode || 500
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
    } catch (error: any) {
      console.error('Error al marcar como completado:', error);

      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al marcar como completado',
          status: error.statusCode || 500
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
    } catch (error: any) {
      console.error('Error al eliminar respuestas:', error);

      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al eliminar respuestas',
          status: error.statusCode || 500
        })
      };
    }
  }

  /**
   * Obtener todas las respuestas para un research
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

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: responses,
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error al obtener respuestas por research:', error);

      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al obtener respuestas por research',
          status: error.statusCode || 500
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

      console.log(`[ModuleResponseController.getSmartVOCResults] 🔍 Obteniendo resultados SmartVOC para research: ${researchId}`);

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
              vocResponses: [],
              ncResponses: []
            },
            message: 'No hay participantes en esta investigación',
            status: 200
          })
        };
      }

      console.log(`[ModuleResponseController.getSmartVOCResults] 📊 Encontrados ${participants.length} participantes`);

      // Función para parsear valores de respuesta
      const parseResponseValue = (response: any): number => {
        if (typeof response === 'number') return response;
        if (typeof response === 'object' && response.value !== undefined) {
          return typeof response.value === 'number' ? response.value : parseFloat(response.value) || 0;
        }
        if (typeof response === 'string') {
          const parsed = parseFloat(response);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      // Función para parsear texto de respuesta
      const parseResponseText = (response: any): string => {
        if (typeof response === 'string') return response;
        if (typeof response === 'object' && response.value !== undefined) {
          return String(response.value);
        }
        if (typeof response === 'object') {
          return JSON.stringify(response);
        }
        return String(response);
      };

      // Procesar respuestas SmartVOC de todos los participantes
      const allSmartVOCResponses: any[] = [];
      const npsScores: number[] = [];
      const csatScores: number[] = [];
      const cesScores: number[] = [];
      const nevScores: number[] = [];
      const cvScores: number[] = [];
      const vocResponses: any[] = [];
      const ncResponses: any[] = [];

      // Agrupar respuestas por fecha para time series
      const responsesByDate: { [key: string]: any[] } = {};

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
              } else if (response.questionKey.toLowerCase().includes('nc')) {
                ncResponses.push({
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

      console.log(`[ModuleResponseController.getSmartVOCResults] 📈 Procesando ${allSmartVOCResponses.length} respuestas SmartVOC`);

      // Calcular métricas agregadas
      const totalResponses = allSmartVOCResponses.length;
      const uniqueParticipants = participants.length;

      // Calcular NPS
      const promoters = npsScores.filter(score => score >= 9).length;
      const detractors = npsScores.filter(score => score <= 6).length;
      const neutrals = npsScores.filter(score => score > 6 && score < 9).length;
      const npsScore = npsScores.length > 0 ? Math.round(((promoters - detractors) / npsScores.length) * 100) : 0;

      // Calcular promedio de scores
      const allScores = [...csatScores, ...cesScores, ...nevScores, ...cvScores].filter(score => score > 0);
      const averageScore = allScores.length > 0 ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10 : 0;

      // Generar time series data
      const timeSeriesData = Object.keys(responsesByDate).map(date => {
        const dateResponses = responsesByDate[date];
        const dateNpsScores = dateResponses
          .filter(r => r.questionKey.toLowerCase().includes('nps'))
          .map(r => parseResponseValue(r.response))
          .filter(score => typeof score === 'number' && score > 0);

        const dateNevScores = dateResponses
          .filter(r => r.questionKey.toLowerCase().includes('nev'))
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
        ncResponses,

        // Scores individuales para cálculos adicionales
        npsScores,
        csatScores,
        cesScores,
        nevScores,
        cvScores
      };

      console.log(`[ModuleResponseController.getSmartVOCResults] ✅ Resultados procesados:`, {
        totalResponses,
        uniqueParticipants,
        npsScore,
        averageScore,
        promoters,
        detractors,
        neutrals,
        cpvValue
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: result,
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error al obtener resultados SmartVOC:', error);

      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al obtener resultados SmartVOC',
          status: error.statusCode || 500
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

      console.log(`[ModuleResponseController.getCPVResults] 🔍 Obteniendo resultados CPV para research: ${researchId}`);

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

      console.log(`[ModuleResponseController.getCPVResults] 📊 Encontrados ${participants.length} participantes`);

      // Función para parsear valores de respuesta
      const parseResponseValue = (response: any): number => {
        if (typeof response === 'number') return response;
        if (typeof response === 'object' && response.value !== undefined) {
          return typeof response.value === 'number' ? response.value : parseFloat(response.value) || 0;
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

      console.log(`[ModuleResponseController.getCPVResults] 📈 Procesando ${csatScores.length} scores CSAT y ${npsScores.length} scores NPS`);

      // Calcular métricas específicas para CPVCard
      const cpvValue = csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : 0;
      const satisfaction = csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : 0;

      // Calcular NPS para retención
      const promoters = npsScores.filter(score => score >= 9).length;
      const detractors = npsScores.filter(score => score <= 6).length;
      const neutrals = npsScores.filter(score => score > 6 && score < 9).length;
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

      console.log(`[ModuleResponseController.getCPVResults] ✅ Resultados CPV procesados:`, result);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: result,
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error al obtener resultados CPV:', error);

      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al obtener resultados CPV',
          status: error.statusCode || 500
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

      console.log(`[ModuleResponseController.getTrustFlowResults] 🔍 Obteniendo resultados Trust Flow para research: ${researchId}`);

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

      console.log(`[ModuleResponseController.getTrustFlowResults] 📊 Encontrados ${participants.length} participantes`);

      // Función para parsear valores de respuesta
      const parseResponseValue = (response: any): number => {
        if (typeof response === 'number') return response;
        if (typeof response === 'object' && response.value !== undefined) {
          return typeof response.value === 'number' ? response.value : parseFloat(response.value) || 0;
        }
        if (typeof response === 'string') {
          const parsed = parseFloat(response);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      // Procesar respuestas SmartVOC de todos los participantes
      const allResponses: any[] = [];

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

      console.log(`[ModuleResponseController.getTrustFlowResults] 📈 Procesando ${allResponses.length} respuestas NPS y NEV`);

      // Agrupar respuestas por fecha para time series
      const responsesByDate: { [key: string]: any[] } = {};

      allResponses.forEach(response => {
        const dateKey = new Date(response.timestamp || new Date()).toISOString().split('T')[0];
        if (!responsesByDate[dateKey]) {
          responsesByDate[dateKey] = [];
        }
        responsesByDate[dateKey].push(response);
      });

      // Generar time series data para TrustRelationshipFlow
      const timeSeriesData = Object.keys(responsesByDate).map(date => {
        const dateResponses = responsesByDate[date];

        const dateNpsScores = dateResponses
          .filter(r => r.questionKey.toLowerCase().includes('nps'))
          .map(r => parseResponseValue(r.response))
          .filter(score => score > 0);

        const dateNevScores = dateResponses
          .filter(r => r.questionKey.toLowerCase().includes('nev'))
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
        .filter(r => r.questionKey.toLowerCase().includes('nps'))
        .map(r => parseResponseValue(r.response))
        .filter(score => score > 0);

      const nevScores = allResponses
        .filter(r => r.questionKey.toLowerCase().includes('nev'))
        .map(r => parseResponseValue(r.response))
        .filter(score => score > 0);

      const result = {
        timeSeriesData,
        npsScores,
        nevScores,
        totalResponses: allResponses.length,
        uniqueDates: timeSeriesData.length
      };

      console.log(`[ModuleResponseController.getTrustFlowResults] ✅ Resultados Trust Flow procesados:`, {
        totalResponses: result.totalResponses,
        uniqueDates: result.uniqueDates,
        timeSeriesDataPoints: result.timeSeriesData.length
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          data: result,
          status: 200
        })
      };
    } catch (error: any) {
      console.error('Error al obtener resultados Trust Flow:', error);

      return {
        statusCode: error.statusCode || 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          error: error.message || 'Error al obtener resultados Trust Flow',
          status: error.statusCode || 500
        })
      };
    }
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
  const pathParameters = event.pathParameters;

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
  } catch (error: any) {
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
