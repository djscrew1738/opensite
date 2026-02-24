// Vision API client methods

import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

// Request interceptor - Add authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Reuse the same response interceptor pattern
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && typeof data === 'object' && 'success' in data) {
      return data.data;
    }
    return data;
  },
  (error) => {
    let message = 'An error occurred';
    
    // Handle 413 Payload Too Large
    if (error.response?.status === 413) {
      message = error.response?.data?.error || 'File too large. Maximum upload size is 100MB.';
    } else if (error.response?.data?.error?.message) {
      message = error.response.data.error.message;
    } else if (error.message) {
      message = error.message;
    }
    
    return Promise.reject(new Error(message));
  }
);

export const visionApi = {
  // Upload blueprint (supports onUploadProgress)
  upload: (file, name, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);

    return apiClient.post('/vision/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
      onUploadProgress: options.onUploadProgress
    });
  },

  // Projects
  getProjects: (params) => apiClient.get('/vision/projects', { params }),
  getSummary: () => apiClient.get('/vision/summary'),
  searchProjects: (query) => apiClient.get('/vision/projects', { params: { q: query } }),
  getProject: (id) => apiClient.get(`/vision/projects/${id}`),
  updateProjectName: (id, name) => apiClient.patch(`/vision/projects/${id}`, { name }),
  deleteProject: (id) => apiClient.delete(`/vision/projects/${id}`),

  // AI Analysis
  getModels: () => apiClient.get('/vision/models'),
  analyze: (projectId, model, type = 'global') => apiClient.post(`/vision/projects/${projectId}/analyze`, { model, type }),
  convertToTakeoff: (projectId, analysisId) => apiClient.post(`/vision/projects/${projectId}/analyses/${analysisId}/convert`),

  // Scale
  updateScale: (projectId, scale) => apiClient.put(`/vision/projects/${projectId}/scale`, { scale }),

  // Layers
  createLayer: (projectId, data) => apiClient.post(`/vision/projects/${projectId}/layers`, data),
  updateLayer: (projectId, layerId, data) => apiClient.put(`/vision/projects/${projectId}/layers/${layerId}`, data),
  deleteLayer: (projectId, layerId) => apiClient.delete(`/vision/projects/${projectId}/layers/${layerId}`),

  // Job polling
  getJobStatus: (jobId) => apiClient.get(`/jobs/${jobId}`),

  // Tile URL helpers (served as static files from tiles directory)
  getDziUrl: (projectId) => `/api/vision/tiles/${projectId}/${projectId}.dzi`,
  getTileUrl: (projectId) => `/api/vision/tiles/${projectId}/${projectId}_files/`,
  getThumbnailUrl: (projectId) => `/api/vision/tiles/${projectId}/thumbnail.jpeg`,
};

export default visionApi;
