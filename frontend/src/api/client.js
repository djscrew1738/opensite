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

// Response interceptor - handles standardized backend responses
apiClient.interceptors.response.use(
  (response) => {
    // Backend now returns standardized format:
    // { success: true, data: {...}, message: "...", meta: {...} }
    const responseData = response.data;

    // If backend returns standardized format, extract the data field
    if (responseData && typeof responseData === 'object' && 'success' in responseData) {
      return responseData.data;
    }

    // Fallback for legacy responses
    return responseData;
  },
  (error) => {
    // Extract error message from standardized error format
    // { success: false, error: { message: "...", code: "...", details: {...} } }
    let message = 'An error occurred';

    if (error.response?.data?.error?.message) {
      message = error.response.data.error.message;
    } else if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.message) {
      message = error.message;
    }

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
    blueprint: (file, tier, model, async = true) => {
      const formData = new FormData();
      formData.append('file', file);
      if (tier) formData.append('tier', tier);
      if (model) formData.append('model', model);
      formData.append('async', async);

      return axios.post('/api/upload/blueprint', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: async ? 30000 : 300000 // 30s for async, 5min for sync
      }).then(res => {
        // Handle standardized response format
        const data = res.data;
        if (data && typeof data === 'object' && 'success' in data) {
          return data.data;
        }
        return data;
      });
    },
    extract: (file) => {
      const formData = new FormData();
      formData.append('file', file);

      return axios.post('/api/upload/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(res => {
        // Handle standardized response format
        const data = res.data;
        if (data && typeof data === 'object' && 'success' in data) {
          return data.data;
        }
        return data;
      });
    }
  },

  // Jobs (for polling background tasks)
  jobs: {
    getStatus: (jobId) => apiClient.get(`/jobs/${jobId}`),
    getQueueStats: () => apiClient.get('/jobs/queue/stats'),
    cancel: (jobId) => apiClient.delete(`/jobs/${jobId}`)
  }
};

export default apiClient;
