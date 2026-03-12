// DocVault API client — Text Intelligence endpoints
import apiClient from './client';

export const docvaultApi = {
  // Upload a text document (multipart)
  upload: (file) => {
    // File validation
    if (!file) throw new Error('No file provided');
    if (file.size > 100 * 1024 * 1024) throw new Error('File size exceeds 100MB limit');
    
    // Get file extension for validation (more reliable than mime type)
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['pdf', 'docx', 'txt', 'csv', 'md', 'html', 'htm', 'json', 'xml'];
    if (!allowedExts.includes(ext)) {
      throw new Error(`Invalid file type .${ext}. Allowed: PDF, DOCX, TXT, CSV, MD, HTML, JSON, XML`);
    }

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
  summarize: (id, model = null) => apiClient.post(`/docvault/${id}/summarize`, { model }),

  // Extract entities
  extract: (id, model = null) => apiClient.post(`/docvault/${id}/extract`, { model }),

  // Send chat message
  chat: (id, message, model = null) => apiClient.post(`/docvault/${id}/chat`, { question: message, model }),

  // Get chat history
  getChatHistory: (id) => apiClient.get(`/docvault/${id}/chat`),

  // Clear chat history
  clearChat: (id) => apiClient.delete(`/docvault/${id}/chat`),

  // Health check
  health: () => apiClient.get('/docvault/system/health'),
};
