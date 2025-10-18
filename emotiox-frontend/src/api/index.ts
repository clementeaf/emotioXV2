/**
 * Exportación central de todas las APIs
 * Punto único de acceso a todos los dominios
 */

import auth from './domains/auth/auth.api';
import companies from './domains/companies/companies.api';
import research from './domains/research/research.api';
import welcomeScreen from './domains/welcomeScreen/welcomeScreen.api';
import thankYouScreen from './domains/thankYouScreen/thankYouScreen.api';
import smartVoc from './domains/smartVoc/smartVoc.api';
import eyeTracking from './domains/eyeTracking/eyeTracking.api';
import cognitiveTask from './domains/cognitiveTask/cognitiveTask.api';
import s3 from './domains/s3/s3.api';
import eyeTrackingRecruit from './domains/eyeTrackingRecruit/eyeTrackingRecruit.api';
import moduleResponses from './domains/moduleResponses/moduleResponses.api';
import participants from './domains/participants/participants.api';
import researchInProgress from './domains/researchInProgress/researchInProgress.api';
import admin from './domains/admin/admin.api';

// Exportación central de todas las APIs
export const api = {
  auth,
  companies,
  research,
  welcomeScreen,
  thankYouScreen,
  smartVoc,
  eyeTracking,
  cognitiveTask,
  s3,
  eyeTrackingRecruit,
  moduleResponses,
  participants,
  researchInProgress,
  admin,
};

// Exportaciones individuales para uso directo
export {
  auth,
  companies,
  research,
  welcomeScreen,
  thankYouScreen,
  smartVoc,
  eyeTracking,
  cognitiveTask,
  s3,
  eyeTrackingRecruit,
  moduleResponses,
  participants,
  researchInProgress,
  admin,
};

export default api;
