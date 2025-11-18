/**
 * Implicit Association Domain Barrel Export
 * Central export point for implicit association domain
 */

// Export API methods
export { implicitAssociationApi } from './implicit-association.api';

// Export hooks
export {
  implicitAssociationKeys,
  useImplicitAssociationData,
  useImplicitAssociationValidation
} from './implicit-association.hooks';

// Export types
export type {
  ApiResponse,
  ImplicitAssociationModel,
  ImplicitAssociationFormData,
  Target,
  Attribute,
  CreateImplicitAssociationRequest,
  UpdateImplicitAssociationRequest,
  ValidationResponse
} from './implicit-association.types';

