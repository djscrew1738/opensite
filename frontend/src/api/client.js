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
    getProviders: () => apiClient.get('/ai/providers'),
    switchProvider: (provider) => apiClient.post('/ai/providers/switch', { provider }),
    chat: (message, conversationId, model) =>
      apiClient.post('/ai/chat', { message, conversationId, model }),
    analyze: (text, context, model) =>
      apiClient.post('/ai/analyze', { text, context, model }),
    deleteModel: (name) => apiClient.delete(`/ai/models/${encodeURIComponent(name)}`),
  },

  // Settings
  settings: {
    get: () => apiClient.get('/settings'),
    update: (data) => apiClient.put('/settings', data),
    testOllama: (url) => apiClient.post('/settings/test-ollama', { url }),
    testGroq: (key) => apiClient.post('/settings/test-groq', { key }),
    testSerper: (key) => apiClient.post('/settings/test-serper', { key }),
    getMetrics: () => apiClient.get('/settings/metrics'),
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

  // Takeoff
  takeoff: {
    // Takeoffs
    getAll: (params) => apiClient.get('/takeoff', { params }),
    getOne: (id) => apiClient.get(`/takeoff/${id}`),
    create: (data) => apiClient.post('/takeoff', data),
    update: (id, data) => apiClient.put(`/takeoff/${id}`, data),
    delete: (id) => apiClient.delete(`/takeoff/${id}`),
    getSummary: (id) => apiClient.get(`/takeoff/${id}/summary`),

    // Takeoff Items
    getItems: (takeoffId) => apiClient.get(`/takeoff/${takeoffId}/items`),
    addItem: (takeoffId, data) => apiClient.post(`/takeoff/${takeoffId}/items`, data),
    updateItem: (takeoffId, itemId, data) => apiClient.put(`/takeoff/${takeoffId}/items/${itemId}`, data),
    deleteItem: (takeoffId, itemId) => apiClient.delete(`/takeoff/${takeoffId}/items/${itemId}`),

    // Materials
    getMaterials: (params) => apiClient.get('/takeoff/materials', { params }),
    getCategories: () => apiClient.get('/takeoff/materials/categories'),
    getSuppliers: () => apiClient.get('/takeoff/materials/suppliers'),
    getStats: () => apiClient.get('/takeoff/materials/stats'),
    getFavorites: () => apiClient.get('/takeoff/materials/favorites'),
    getRecentlyUsed: (limit) => apiClient.get('/takeoff/materials/recent', { params: { limit } }),
    getMostUsed: (limit) => apiClient.get('/takeoff/materials/most-used', { params: { limit } }),
    getMaterial: (id) => apiClient.get(`/takeoff/materials/${id}`),
    getPriceHistory: (id, limit) => apiClient.get(`/takeoff/materials/${id}/price-history`, { params: { limit } }),
    createMaterial: (data) => apiClient.post('/takeoff/materials', data),
    updateMaterial: (id, data) => apiClient.put(`/takeoff/materials/${id}`, data),
    deleteMaterial: (id) => apiClient.delete(`/takeoff/materials/${id}`),
    duplicateMaterial: (id) => apiClient.post(`/takeoff/materials/${id}/duplicate`),
    toggleFavorite: (id) => apiClient.post(`/takeoff/materials/${id}/favorite`),
    bulkImport: (materials) => apiClient.post('/takeoff/materials/import', { materials }),
    bulkDelete: (ids) => apiClient.post('/takeoff/materials/bulk-delete', { ids }),
    bulkPriceUpdate: (ids, percentageChange) => apiClient.post('/takeoff/materials/bulk-price-update', { ids, percentageChange }),
    exportCsv: (category) => apiClient.get('/takeoff/materials/export/csv', {
      params: { category },
      responseType: 'blob',
      // Override the interceptor for blob responses
      transformResponse: [(data) => data]
    })
  },

  // Jobs (for polling background tasks)
  jobs: {
    getStatus: (jobId) => apiClient.get(`/jobs/${jobId}`),
    getQueueStats: () => apiClient.get('/jobs/queue/stats'),
    cancel: (jobId) => apiClient.delete(`/jobs/${jobId}`)
  },

  // Discovery pipeline
  discovery: {
    startRun: (keyword, city, options = {}) => apiClient.post('/discovery/run', { keyword, city, ...options }),
    getRuns: () => apiClient.get('/discovery/runs'),
    getRun: (runId) => apiClient.get(`/discovery/runs/${runId}`),
    getRunLeads: (runId, params) => apiClient.get(`/discovery/runs/${runId}/leads`, { params }),
    getLead: (id) => apiClient.get(`/discovery/leads/${id}`),
    updateLeadStatus: (id, status) => apiClient.patch(`/discovery/leads/${id}/status`, { status }),
    deleteRun: (runId) => apiClient.delete(`/discovery/runs/${runId}`)
  },

  // Permits (lead finder)
  permits: {
    getAll: (params) => apiClient.get('/permits', { params }),
    getSummary: () => apiClient.get('/permits/summary'),
    getOne: (id) => apiClient.get(`/permits/${id}`),
    updateStatus: (id, data) => apiClient.patch(`/permits/${id}/status`, data),
    getNear: (lat, lng, radius) => apiClient.get('/permits/near', { params: { lat, lng, radius } }),

    // Builders
    getBuilders: (params) => apiClient.get('/permits/builders', { params }),
    getProspects: (limit) => apiClient.get('/permits/builders/prospects', { params: { limit } }),
    getBuilder: (id) => apiClient.get(`/permits/builders/${id}`),

    // City & Search
    getCities: () => apiClient.get('/permits/cities'),
    getCityStats: (city) => apiClient.get(`/permits/stats/city/${encodeURIComponent(city)}`),
    search: (params) => apiClient.get('/permits/search', { params })
  }
};

export default apiClient;
