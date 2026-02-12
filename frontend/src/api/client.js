// API client with axios

import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// API methods
export const api = {
  // Health
  health: () => apiClient.get('/health'),

  // Leads
  leads: {
    getAll: (params) => apiClient.get('/leads', { params }),
    getOne: (id) => apiClient.get(`/leads/${id}`),
    create: (data) => apiClient.post('/leads', data),
    update: (id, data) => apiClient.put(`/leads/${id}`, data),
    delete: (id) => apiClient.delete(`/leads/${id}`),
    score: (id) => apiClient.post(`/leads/${id}/score`)
  },

  // Estimates
  estimates: {
    calculate: (data) => apiClient.post('/estimates/calculate', data),
    analyze: (data) => apiClient.post('/estimates/analyze', data),
    getOne: (id) => apiClient.get(`/estimates/${id}`),
    getTiers: () => apiClient.get('/estimates/tiers/all')
  },

  // Projects
  projects: {
    getAll: () => apiClient.get('/projects'),
    getOne: (id) => apiClient.get(`/projects/${id}`),
    create: (data) => apiClient.post('/projects', data),
    update: (id, data) => apiClient.put(`/projects/${id}`, data),
    updatePhase: (id, phase, progress) =>
      apiClient.put(`/projects/${id}/phase`, { phase, progress })
  },

  // Dashboard
  dashboard: {
    getStats: () => apiClient.get('/dashboard/stats'),
    getTiers: () => apiClient.get('/dashboard/tiers')
  },

  // AI
  ai: {
    getModels: () => apiClient.get('/ai/models'),
    chat: (message, conversationId, model) =>
      apiClient.post('/ai/chat', { message, conversationId, model }),
    analyze: (text, context, model) =>
      apiClient.post('/ai/analyze', { text, context, model })
  },

  // Upload
  upload: {
    blueprint: (file, tier, model) => {
      const formData = new FormData();
      formData.append('file', file);
      if (tier) formData.append('tier', tier);
      if (model) formData.append('model', model);

      return axios.post('/api/upload/blueprint', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000 // 5 minutes for comprehensive AI analysis
      }).then(res => res.data);
    },
    extract: (file) => {
      const formData = new FormData();
      formData.append('file', file);

      return axios.post('/api/upload/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(res => res.data);
    }
  }
};

export default apiClient;
