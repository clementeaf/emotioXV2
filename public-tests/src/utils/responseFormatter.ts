export const formatResponseData = (data: unknown, questionKey: string): string | number | boolean | string[] | Record<string, string | number | boolean | null> | null => {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  
  if (Array.isArray(data)) {
    const limitedArray = data.slice(0, 10).map(item => String(item));
    return limitedArray;
  }
  
  if (typeof data === 'object') {
    const simpleObject: Record<string, string | number | boolean | null> = {};
    const entries = Object.entries(data as Record<string, unknown>);
    
    let maxSelections = 3;
    if (questionKey === 'smartvoc_nev') {
      maxSelections = extractMaxSelections();
    }
    
    for (const [key, value] of entries.slice(0, 5)) {
      if (value === null || value === undefined) {
        simpleObject[key] = null;
      } else if (typeof value === 'string') {
        simpleObject[key] = value.length > 100 ? value.substring(0, 100) + '...' : value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        simpleObject[key] = value;
      } else if (Array.isArray(value)) {
        const arrayLimit = questionKey === 'smartvoc_nev' ? maxSelections : 3;
        simpleObject[key] = value.slice(0, arrayLimit).map(item => String(item)).join(',');
      } else if (typeof value === 'object') {
        const jsonStr = JSON.stringify(value);
        simpleObject[key] = jsonStr.length > 200 ? jsonStr.substring(0, 200) + '...' : jsonStr;
      } else {
        simpleObject[key] = String(value).substring(0, 100);
      }
    }
    return simpleObject;
  }
  
  return String(data).substring(0, 100);
};

const extractMaxSelections = (): number => {
  const patterns = [
    /selecciona\s+maximo\s+(\d+)\s+emociones/i,
    /hasta\s+(\d+)/i,
    /máximo\s+(\d+)/i,
    /máx\s+(\d+)/i,
    /max\s+(\d+)/i,
    /selecciona\s+hasta\s+(\d+)/i,
    /selecciona\s+máximo\s+(\d+)/i,
    /selecciona\s+(\d+)\s+emociones/i,
    /(\d+)\s+emociones/i
  ];
  
  for (const pattern of patterns) {
    const match = 'Selecciona maximo 4 emociones'.match(pattern);
    if (match) {
      const number = parseInt(match[1], 10);
      if (number > 0 && number <= 10) {
        return number;
      }
    }
  }
  return 4;
};

export const optimizeFormData = (data: Record<string, unknown>): Record<string, unknown> => {
  const optimized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      optimized[key] = value.length > 100 ? value.substring(0, 100) + '...' : value;
    } else if (Array.isArray(value)) {
      optimized[key] = value.slice(0, 10);
    } else if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value as Record<string, unknown>);
      optimized[key] = Object.fromEntries(entries.slice(0, 5));
    } else {
      optimized[key] = value;
    }
  }
  return optimized;
};
