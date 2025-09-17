// Configuración de la API para WebShield Frontend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Crear instancia de fetch con configuración base
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Agregar token si está disponible
  const token = localStorage.getItem('webshield_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Funciones de la API
export const authAPI = {
  register: (userData) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  login: (credentials) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  getProfile: () => apiCall('/auth/profile'),
};

export const projectsAPI = {
  getAll: () => apiCall('/projects'),
  
  create: (projectData) => apiCall('/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  }),

  getById: (id) => apiCall(`/projects/${id}`),

  update: (id, projectData) => apiCall(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(projectData),
  }),

  delete: (id) => apiCall(`/projects/${id}`, {
    method: 'DELETE',
  }),

  save: (id, elements) => apiCall(`/projects/${id}/save`, {
    method: 'POST',
    body: JSON.stringify({ elements }),
  }),

  export: (id) => apiCall(`/projects/${id}/export`),
};

export const elementsAPI = {
  create: (projectId, elementData) => apiCall(`/projects/${projectId}/elements`, {
    method: 'POST',
    body: JSON.stringify(elementData),
  }),

  update: (id, elementData) => apiCall(`/elements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(elementData),
  }),

  delete: (id) => apiCall(`/elements/${id}`, {
    method: 'DELETE',
  }),
};

export const paymentsAPI = {
  createIntent: (paymentData) => apiCall('/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }),

  confirm: (id, confirmationData) => apiCall(`/payments/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify(confirmationData),
  }),

  getHistory: () => apiCall('/payments'),
};

export const statsAPI = {
  get: () => apiCall('/stats'),
};

// Utilidades
export const storage = {
  setToken: (token) => localStorage.setItem('webshield_token', token),
  getToken: () => localStorage.getItem('webshield_token'),
  removeToken: () => localStorage.removeItem('webshield_token'),
  isLoggedIn: () => !!localStorage.getItem('webshield_token'),
};

export default { authAPI, projectsAPI, elementsAPI, paymentsAPI, statsAPI, storage };
