// DocVault API client — Text Intelligence endpoints
import apiClient from './client';

export const docvaultApi = {
  // Upload a text document (multipart)
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/docvault/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  },

  // List all text documents
  getAll: () => apiClient.get('/docvault'),

  // Get single document with content
  getOne: (id) => apiClient.get(`/docvault/${id}`),

  // Delete document
  delete: (id) => apiClient.delete(`/docvault/${id}`),

  // Generate AI summary
  summarize: (id) => apiClient.post(`/docvault/${id}/summarize`),

  // Extract entities
  extract: (id) => apiClient.post(`/docvault/${id}/extract`),

  // Send chat message
  chat: (id, message) => apiClient.post(`/docvault/${id}/chat`, { question: message }),

  // Get chat history
  getChatHistory: (id) => apiClient.get(`/docvault/${id}/chat`),

  // Clear chat history
  clearChat: (id) => apiClient.delete(`/docvault/${id}/chat`),

  // Health check
  health: () => apiClient.get('/docvault/system/health'),
};
