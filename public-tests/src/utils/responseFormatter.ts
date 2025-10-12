export const formatResponseData = (data: unknown, questionKey: string, instructions?: string): string | number | boolean | string[] | Record<string, string | number | boolean | null> | null => {
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
    
    for (const [key, value] of entries.slice(0, 5)) {
      if (value === null || value === undefined) {
        simpleObject[key] = null;
      } else if (typeof value === 'string') {
        simpleObject[key] = value.length > 100 ? value.substring(0, 100) + '...' : value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        simpleObject[key] = value;
      } else if (Array.isArray(value)) {
        // Para smartvoc_nev, convertir a string SIN limitar la cantidad
        if (questionKey === 'smartvoc_nev') {
          simpleObject[key] = value.map(item => String(item)).join(',');
        } else {
          // Para otros tipos, convertir a string con límite de 3
          simpleObject[key] = value.slice(0, 3).map(item => String(item)).join(',');
        }
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
