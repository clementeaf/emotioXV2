/**
 * Filtra datos de investigación por cliente específico
 *
 * @param research - Array de datos de investigación
 * @param clientId - ID del cliente para filtrar (null para mostrar todos)
 * @returns Array filtrado de investigaciones
 */
export const filterResearchByClient = (research: any[], clientId: string | null) => {
  if (!clientId) {
    return research;
  }

  return research.filter((item: any) =>
    item.enterprise === clientId ||
    item.basic?.enterprise === clientId
  );
};

/**
 * Filtra investigaciones por estado
 *
 * @param research - Array de datos de investigación
 * @param status - Estado para filtrar
 * @returns Array filtrado de investigaciones
 */
export const filterResearchByStatus = (research: any[], status: string) => {
  if (!status || status === 'all') {
    return research;
  }

  return research.filter((item: any) => item.status === status);
};

/**
 * Filtra investigaciones por rango de fechas
 *
 * @param research - Array de datos de investigación
 * @param startDate - Fecha de inicio
 * @param endDate - Fecha de fin
 * @returns Array filtrado de investigaciones
 */
export const filterResearchByDateRange = (
  research: any[],
  startDate?: Date,
  endDate?: Date
) => {
  if (!startDate && !endDate) {
    return research;
  }

  return research.filter((item: any) => {
    const itemDate = new Date(item.createdAt);

    if (startDate && itemDate < startDate) {
      return false;
    }

    if (endDate && itemDate > endDate) {
      return false;
    }

    return true;
  });
};
