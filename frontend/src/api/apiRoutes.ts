/**
 * Administrador Central de Rutas API - EmotioXV2
 * ÚNICA FUENTE DE VERDAD para todas las rutas del backend
 *
 * Empezando con welcome-screen, expandible a otros módulos
 */

export const apiRoutes = {
  /**
   * Rutas para Welcome Screen
   * Una sola ruta base para GET, POST, PUT, DELETE
   */
  welcomeScreen: {
    /**
     * Ruta base para operaciones CRUD de welcome-screen
     * @param researchId ID de la investigación
     * @returns /research/{researchId}/welcome-screen
     */
    base: (researchId: string) => `/research/${researchId}/welcome-screen`,
  },

  /**
   * Rutas para Thank You Screen
   * Una sola ruta base para GET, POST, PUT, DELETE
   */
  thankYouScreen: {
    /**
     * Ruta base para operaciones CRUD de thank-you-screen
     * @param researchId ID de la investigación
     * @returns /research/{researchId}/thank-you-screen
     */
    base: (researchId: string) => `/research/${researchId}/thank-you-screen`,
  },

  // TODO: Agregar otros módulos cuando se consoliden
  // cognitiveTask: {
  //   base: (researchId: string) => `/research/${researchId}/cognitive-task`,
  // },
  // smartVoc: {
  //   base: (researchId: string) => `/research/${researchId}/smart-voc`,
  // },
} as const;

/**
 * Tipo para autocompletado y validación de rutas
 */
export type ApiRoutes = typeof apiRoutes;
