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

// Health check
export const healthCheck = () =>
  apiClient.get('/health');

export default apiClient;
