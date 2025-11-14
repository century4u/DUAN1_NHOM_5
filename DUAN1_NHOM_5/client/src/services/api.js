import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth services
export const authService = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  register: (userData) =>
    apiClient.post('/auth/register', userData),
  logout: () =>
    apiClient.post('/auth/logout'),
};

// User services
export const userService = {
  getAll: () =>
    apiClient.get('/users'),
  getById: (id) =>
    apiClient.get(`/users/${id}`),
  create: (userData) =>
    apiClient.post('/users', userData),
  update: (id, userData) =>
    apiClient.put(`/users/${id}`, userData),
  delete: (id) =>
    apiClient.delete(`/users/${id}`),
};

// Tour services
export const tourService = {
  getAll: (params) =>
    apiClient.get('/tours', { params }),
  getById: (id) =>
    apiClient.get(`/tours/${id}`),
  getByCategory: (category) =>
    apiClient.get(`/tours/category/${category}`),
  create: (tourData) =>
    apiClient.post('/tours', tourData),
  update: (id, tourData) =>
    apiClient.put(`/tours/${id}`, tourData),
  delete: (id) =>
    apiClient.delete(`/tours/${id}`),
};

// Tour Version services
export const tourVersionService = {
  getAll: (params) =>
    apiClient.get('/tour-versions', { params }),
  getById: (id) =>
    apiClient.get(`/tour-versions/${id}`),
  getByTour: (tourId) =>
    apiClient.get(`/tour-versions/tour/${tourId}`),
  create: (versionData) =>
    apiClient.post('/tour-versions', versionData),
  update: (id, versionData) =>
    apiClient.put(`/tour-versions/${id}`, versionData),
  delete: (id) =>
    apiClient.delete(`/tour-versions/${id}`),
  calculatePrice: (data) =>
    apiClient.post('/tour-versions/calculate-price', data),
};

// Quote services
export const quoteService = {
  getAll: (params) =>
    apiClient.get('/quotes', { params }),
  getById: (id) =>
    apiClient.get(`/quotes/${id}`),
  create: (quoteData) =>
    apiClient.post('/quotes', quoteData),
  update: (id, quoteData) =>
    apiClient.put(`/quotes/${id}`, quoteData),
  delete: (id) =>
    apiClient.delete(`/quotes/${id}`),
  quickCalculate: (data) =>
    apiClient.post('/quotes/calculate', data),
  sendEmail: (id) =>
    apiClient.post(`/quotes/${id}/send-email`),
  sendZalo: (id) =>
    apiClient.post(`/quotes/${id}/send-zalo`),
};

// Health check
export const healthCheck = () =>
  apiClient.get('/health');

export default apiClient;
