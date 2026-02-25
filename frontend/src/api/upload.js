// Universal Upload API client
// Reuses the shared apiClient (auth interceptors + response unwrapping already included)
import apiClient from './client';

export const uploadApi = {
  /**
   * Upload files to the universal endpoint
   * @param {File[]} files - Array of File objects
   * @param {Object} options
   * @param {string} [options.jobId] - Link uploads to a job
   * @param {string} [options.category] - Override auto-detection
   * @param {string} [options.notes] - Notes for the upload
   * @param {Function} [options.onProgress] - Progress callback (percent 0-100)
   */
  upload: (files, options = {}) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (options.jobId) formData.append('jobId', options.jobId);
    if (options.category) formData.append('category', options.category);
    if (options.notes) formData.append('notes', options.notes);

    return apiClient.post('/upload/universal', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5 min for bulk uploads
      onUploadProgress: options.onProgress
        ? (evt) => {
            if (evt.total) {
              const percent = Math.round((evt.loaded / evt.total) * 100);
              options.onProgress(percent);
            }
          }
        : undefined,
    });
  },

  /** Get files, optionally filtered by job */
  getFiles: (params = {}) => apiClient.get('/upload/universal/files', { params }),

  /** Get single file status */
  getFile: (id) => apiClient.get(`/upload/universal/files/${id}`),

  /** Delete a file */
  deleteFile: (id) => apiClient.delete(`/upload/universal/files/${id}`),

  /** Link a file to a job */
  linkToJob: (fileId, jobId, notes) =>
    apiClient.post('/upload/universal/link', { fileId, jobId, notes }),
};
