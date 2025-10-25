/**
 * Screen Forms Domain Barrel Export
 * Central export point for welcome screen and thank you screen domain
 */

// Export API methods
export { screenFormsApi } from './screen-forms.api';

// Export hooks
export {
  screenFormsKeys,
  useScreenFormsData,
  useScreenFormsValidation,
  useCreateScreenForm,
  useUpdateScreenForm,
  useDeleteScreenForm
} from './screen-forms.hooks';

// Export types
export type {
  ApiResponse,
  CreateScreenFormRequest,
  UpdateScreenFormRequest,
  ValidationResponse
} from './screen-forms.types';
