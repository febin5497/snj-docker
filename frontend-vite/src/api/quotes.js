import api from './api';

const quotesAPI = {
  // Quote endpoints
  getQuotes: (page = 1, perPage = 20, filters = {}) => {
    const params = new URLSearchParams({
      page,
      per_page: perPage,
      ...filters
    });
    return api.get(`/quotes?${params}`);
  },

  getQuote: (id) => api.get(`/quotes/${id}`),

  createQuote: (data) => api.post('/quotes', data),

  updateQuote: (id, data) => api.put(`/quotes/${id}`, data),

  deleteQuote: (id) => api.delete(`/quotes/${id}`),

  convertToProject: (id, projectData) => api.post(`/quotes/${id}/convert-to-project`, projectData),

  // Quote items
  addQuoteItem: (quoteId, itemData) => api.post(`/quotes/${quoteId}/items`, itemData),

  updateQuoteItem: (itemId, itemData) => api.put(`/quotes/items/${itemId}`, itemData),

  deleteQuoteItem: (itemId) => api.delete(`/quotes/items/${itemId}`),

  // Quote templates
  getTemplates: () => api.get('/quotes/templates'),

  createTemplate: (data) => api.post('/quotes/templates', data),

  updateTemplate: (id, data) => api.put(`/quotes/templates/${id}`, data),

  deleteTemplate: (id) => api.delete(`/quotes/templates/${id}`),

  useTemplate: (id) => api.post(`/quotes/templates/${id}/use`, {}),

  // Quote PDF
  generatePDF: (id) => api.get(`/quotes/${id}/pdf`),

  // Quote export
  exportCSV: (filterData) => api.post('/quotes/export/csv', filterData),

  // Quote status
  updateStatus: (id, status) => api.put(`/quotes/${id}/status`, { status })
};

export default quotesAPI;
