/**
 * API de S3
 * Objeto ordenado y estricto para endpoints de S3
 */

import { API_BASE_URL } from '../../config/base';

const s3 = {
  upload: () => `${API_BASE_URL}/s3/upload`,
  download: () => `${API_BASE_URL}/s3/download`,
  deleteObject: () => `${API_BASE_URL}/s3/delete-object`,
};

export default s3;
