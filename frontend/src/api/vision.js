// Vision API client methods

import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

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
  // Upload blueprint
  upload: (file, name) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);

    return axios.post('/api/vision/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    }).then(res => {
      const data = res.data;
      if (data && typeof data === 'object' && 'success' in data) return data.data;
      return data;
    }).catch(err => {
      // Handle 413 Payload Too Large
      if (err.response?.status === 413) {
        throw new Error(err.response?.data?.error || 'File too large. Maximum upload size is 100MB.');
      }
      throw err;
    });
  },

  // Projects
  getProjects: () => apiClient.get('/vision/projects'),
  getProject: (id) => apiClient.get(`/vision/projects/${id}`),
  deleteProject: (id) => apiClient.delete(`/vision/projects/${id}`),

  // AI Analysis
  getModels: () => apiClient.get('/vision/models'),
  analyze: (projectId, model) => apiClient.post(`/vision/projects/${projectId}/analyze`, { model }),

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
