/**
 * 🔄 DATA PROCESSORS - Pure Functions
 * Processes raw API data into structured formats
 * Follows KISS and DRY principles
 */

import type {
  QuestionWithResponses,
  SmartVOCResults,
  CPVData,
  TrustFlowData,
  VOCResponse,
  SmartVOCResponse,
  EmotionType,
  PositiveEmotion,
  NegativeEmotion,
  ImpactLevel,
  TrendDirection,
  QuestionResponse
} from '../types/research';

// Constants for emotion processing
const POSITIVE_EMOTIONS: PositiveEmotion[] = [
  'Feliz', 'Satisfecho', 'Confiado', 'Valorado', 'Cuidado', 'Seguro',
  'Enfocado', 'Indulgente', 'Estimulado', 'Exploratorio', 'Interesado', 'Enérgico'
];

const NEGATIVE_EMOTIONS: NegativeEmotion[] = [
  'Descontento', 'Frustrado', 'Irritado', 'Decepción', 
  'Estresado', 'Infeliz', 'Desatendido', 'Apresurado'
];

/**
 * Process SmartVOC data from grouped responses
 */
export function processSmartVOCData(groupedResponses: QuestionWithResponses[]): SmartVOCResults {
  const processors = {
    smartVOCResponses: [] as SmartVOCResponse[],
    npsScores: [] as number[],
    csatScores: [] as number[],
    cesScores: [] as number[],
    nevScores: [] as number[],
    cvScores: [] as number[],
    vocResponses: [] as VOCResponse[]
  };

  groupedResponses.forEach(questionGroup => {
    if (!isSmartVOCQuestion(questionGroup.questionKey) || !hasValidResponses(questionGroup.responses)) {
      return;
    }

    questionGroup.responses.forEach((response: QuestionResponse) => {
      const smartVOCResponse = createSmartVOCResponse(questionGroup.questionKey, response);
      processors.smartVOCResponses.push(smartVOCResponse);

      processResponseByType(questionGroup.questionKey, response, processors);
    });
  });

  const totalResponses = processors.smartVOCResponses.length;
  const uniqueParticipants = getUniqueParticipantCount(processors.smartVOCResponses);
  const npsScore = calculateNPSScore(processors.npsScores);

  return {
    totalResponses,
    uniqueParticipants,
    npsScore,
    csatScores: processors.csatScores,
    cesScores: processors.cesScores,
    nevScores: processors.nevScores,
    cvScores: processors.cvScores,
    vocResponses: processors.vocResponses,
    smartVOCResponses: processors.smartVOCResponses
  };
}

/**
 * Process CPV data from grouped responses
 */
export function processCPVData(groupedResponses: QuestionWithResponses[]): CPVData {
  const scores = {
    csat: [] as number[],
    ces: [] as number[],
    nps: [] as number[],
    nev: [] as number[],
    cv: [] as number[]
  };

  let totalResponses = 0;

  groupedResponses.forEach(questionGroup => {
    if (!isSmartVOCQuestion(questionGroup.questionKey) || !hasValidResponses(questionGroup.responses)) {
      return;
    }

    totalResponses += questionGroup.responses.length;

    questionGroup.responses.forEach((response: QuestionResponse) => {
      const numericValue = parseResponseValue(response.value);
      if (isValidScore(numericValue)) {
        categorizeScore(questionGroup.questionKey, numericValue, scores);
      }
    });
  });

  return calculateCPVMetrics(scores, totalResponses);
}

/**
 * Process TrustFlow data from grouped responses
 */
export function processTrustFlowData(groupedResponses: QuestionWithResponses[]): TrustFlowData[] {
  const responsesByDate: Record<string, Array<QuestionResponse & { questionKey: string }>> = {};

  groupedResponses.forEach(questionGroup => {
    if (!hasValidResponses(questionGroup.responses)) return;

    questionGroup.responses.forEach((response: QuestionResponse) => {
      if (!response.timestamp) return;

      const dateKey = extractDateKey(response.timestamp);
      if (!responsesByDate[dateKey]) {
        responsesByDate[dateKey] = [];
      }
      responsesByDate[dateKey].push({ ...response, questionKey: questionGroup.questionKey });
    });
  });

  return Object.keys(responsesByDate)
    .map(date => processDateResponses(date, responsesByDate[date]))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// Helper functions
function isSmartVOCQuestion(questionKey: string): boolean {
  return questionKey?.toLowerCase().includes('smartvoc') ?? false;
}

function hasValidResponses(responses: QuestionResponse[]): boolean {
  return Array.isArray(responses) && responses.length > 0;
}

function createSmartVOCResponse(questionKey: string, response: QuestionResponse): SmartVOCResponse {
  return {
    questionKey,
    response: typeof response.value === 'object' && !Array.isArray(response.value) 
      ? JSON.stringify(response.value) 
      : response.value as string | number | string[],
    participantId: response.participantId,
    participantName: 'Participante',
    timestamp: response.timestamp || new Date().toISOString()
  };
}

function processResponseByType(
  questionKey: string, 
  response: QuestionResponse, 
  processors: {
    npsScores: number[];
    csatScores: number[];
    cesScores: number[];
    nevScores: number[];
    cvScores: number[];
    vocResponses: VOCResponse[];
  }
): void {
  const lowerKey = questionKey.toLowerCase();
  
  if (lowerKey.includes('nps')) {
    const score = parseResponseValue(response.value);
    if (score > 0) processors.npsScores.push(score);
  } else if (lowerKey.includes('csat')) {
    const score = parseResponseValue(response.value);
    if (score > 0) processors.csatScores.push(score);
  } else if (lowerKey.includes('ces')) {
    const score = parseResponseValue(response.value);
    if (score > 0) processors.cesScores.push(score);
  } else if (lowerKey.includes('nev')) {
    const nevScore = calculateNEVScore(response.value);
    if (nevScore !== null) processors.nevScores.push(nevScore);
  } else if (lowerKey.includes('cv')) {
    const score = parseResponseValue(response.value);
    if (score > 0) processors.cvScores.push(score);
  } else if (lowerKey.includes('voc')) {
    processors.vocResponses.push({
      text: parseResponseText(response.value),
      participantId: response.participantId,
      participantName: 'Participante',
      timestamp: response.timestamp
    });
  }
}

function calculateNEVScore(value: string | number | string[] | Record<string, unknown>): number | null {
  if (!Array.isArray(value)) return null;

  const emotions = value as EmotionType[];
  const positiveCount = emotions.filter(emotion => 
    POSITIVE_EMOTIONS.includes(emotion as PositiveEmotion)
  ).length;
  
  const negativeCount = emotions.filter(emotion => 
    NEGATIVE_EMOTIONS.includes(emotion as NegativeEmotion)  
  ).length;

  const totalEmotions = emotions.length;
  if (totalEmotions === 0) return null;

  return Math.round(((positiveCount - negativeCount) / totalEmotions) * 100);
}

function getUniqueParticipantCount(responses: SmartVOCResponse[]): number {
  return new Set(responses.map(r => r.participantId)).size;
}

function calculateNPSScore(npsScores: number[]): number {
  if (npsScores.length === 0) return 0;
  
  const promoters = npsScores.filter(score => score >= 9).length;
  const detractors = npsScores.filter(score => score <= 6).length;
  
  return Math.round(((promoters - detractors) / npsScores.length) * 100);
}

function isValidScore(score: number): boolean {
  return !isNaN(score) && score > 0;
}

function categorizeScore(
  questionKey: string, 
  score: number, 
  scores: Record<string, number[]>
): void {
  const lowerKey = questionKey.toLowerCase();
  
  if (lowerKey.includes('csat')) {
    scores.csat.push(score);
  } else if (lowerKey.includes('ces')) {
    scores.ces.push(score);
  } else if (lowerKey.includes('nps')) {
    scores.nps.push(score);
  } else if (lowerKey.includes('cv')) {
    scores.cv.push(score);
  }
}

function calculateCPVMetrics(
  scores: Record<string, number[]>, 
  totalResponses: number
): CPVData {
  const csatAvg = calculateAverage(scores.csat);
  const cesAvg = calculateAverage(scores.ces);
  const npsAvg = calculateAverage(scores.nps);
  const cvAvg = calculateAverage(scores.cv);
  const nevAvg = calculateAverage(scores.nev);

  const cpvValue = roundToOne(csatAvg);
  const satisfaction = roundToOne(csatAvg);
  
  const csatPercentage = calculatePercentage(scores.csat, score => score >= 4);
  const cesPercentage = calculatePercentage(scores.ces, score => score <= 2);
  
  const promoters = scores.nps.filter(score => score >= 9).length;
  const neutrals = scores.nps.filter(score => score >= 7 && score <= 8).length;
  const retention = totalResponses > 0 ? Math.round(((promoters + neutrals) / totalResponses) * 100) : 0;
  
  const detractors = scores.nps.length - promoters - neutrals;
  const impact: ImpactLevel = promoters > detractors ? 'Alto' : totalResponses > 0 ? 'Medio' : 'Bajo';
  const trend: TrendDirection = promoters > detractors ? 'Positiva' : totalResponses > 0 ? 'Neutral' : 'Negativa';
  
  const npsValue = scores.nps.length > 0 ? Math.round(((promoters - detractors) / scores.nps.length) * 100) : 0;
  const peakValue = Math.max(cpvValue, satisfaction, retention);

  return {
    cpvValue,
    satisfaction,
    retention,
    impact,
    trend,
    csatPercentage,
    cesPercentage,
    cvValue: roundToOne(cvAvg),
    nevValue: roundToOne(nevAvg),
    npsValue,
    peakValue
  };
}

function extractDateKey(timestamp: string): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

function processDateResponses(
  date: string, 
  responses: Array<QuestionResponse & { questionKey: string }>
): TrustFlowData {
  const npsScores = responses
    .filter(r => r.questionKey?.toLowerCase().includes('nps'))
    .map(r => parseResponseValue(r.value))
    .filter(score => isValidScore(score));

  const nevScores = responses
    .filter(r => r.questionKey?.toLowerCase().includes('nev'))
    .map(r => calculateNEVScore(r.value))
    .filter((score): score is number => score !== null);

  const avgNps = calculateAverage(npsScores);
  const avgNev = calculateAverage(nevScores);

  return {
    stage: new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    nps: roundToOne(avgNps),
    nev: roundToOne(avgNev),
    timestamp: date
  };
}

// Utility functions
export function parseResponseValue(response: string | number | string[] | Record<string, unknown>): number {
  if (typeof response === 'number') return response;
  if (typeof response === 'string') {
    const parsed = parseFloat(response);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (response && typeof response === 'object' && 'value' in response) {
    return parseResponseValue(response.value as string | number | string[] | Record<string, unknown>);
  }
  return 0;
}

export function parseResponseText(response: string | number | string[] | Record<string, unknown>): string {
  if (typeof response === 'string') return response;
  if (response && typeof response === 'object' && 'value' in response) {
    return parseResponseText(response.value as string | number | string[] | Record<string, unknown>);
  }
  return JSON.stringify(response);
}

function calculateAverage(scores: number[]): number {
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

function calculatePercentage(scores: number[], predicate: (score: number) => boolean): number {
  return scores.length > 0 ? Math.round((scores.filter(predicate).length / scores.length) * 100) : 0;
}

function roundToOne(value: number): number {
  return Math.round(value * 10) / 10;
}