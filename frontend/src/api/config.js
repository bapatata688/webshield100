// Configuración de la API const API_BASE_URL = 'https://webshield100-backend.onrender.com/api';
// console.log('API URL forzada:', API_BASE_URL);

// Crear instancia de fetch con configuración base
//const apiCall = async (endpoint, options = {}) => {
//const url = `${API_BASE_URL}${endpoint}`;
//console.log('Request URL:', url);
//console.log('Request data:', options.body);
//console.log('Request method:', options.method || 'GET');
//
//const config = {
//  headers: {
//    'Content-Type': 'application/json',
//    ...options.headers,
//  },
//  ...options,
//};

// Agregar token   const token = localStorage.getItem('webshield_token');
// if (token) {
//   config.headers['Authorization'] = `Bearer ${token}`;
//   console.log('Token agregado a la request');
// }

//try {
//  console.log('Enviando request...');
//  const response = await fetch(url, config);
//  console.log('Response status:', response.status);
//  console.log('Response headers:', [...response.headers.entries()]);
//
//  const data = await response.json();
//  console.log('Response data:', data);
//
//  if (!response.ok) {
//    throw new Error(data.error || `HTTP error! status: ${response.status}`);
//  }
//  //  return data;
//} catch (error) {
//  console.error('API Error:', error);
//  console.error('Error stack:', error.stack);
//  throw error;
//}
//};

// Funciones de la API
export const authAPI = {
  register: (userData) => {
    console.log('Calling register with:', userData);
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: (credentials) => {
    console.log('Calling login with:', { email: credentials.email, password: '[HIDDEN]' });
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getProfile: () => {
    console.log('Calling getProfile');
    return apiCall('/auth/profile');
  },
};

export const projectsAPI = {
  getAll: () => {
    console.log('Calling getAll projects');
    return apiCall('/projects');
  },

  create: (projectData) => {
    console.log('Calling create project with:', projectData);
    return apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  getById: (id) => {
    console.log('Calling getById project:', id);
    return apiCall(`/projects/${id}`);
  },

  update: (id, projectData) => {
    console.log('Calling update project:', id, projectData);
    return apiCall(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  delete: (id) => {
    console.log('Calling delete project:', id);
    return apiCall(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  save: (id, elements) => {
    console.log('Calling save project:', id, 'with', elements.length, 'elements');
    return apiCall(`/projects/${id}/save`, {
      method: 'POST',
      body: JSON.stringify({ elements }),
    });
  },

  export: (id) => {
    console.log('Calling export project:', id);
    return apiCall(`/projects/${id}/export`);
  },
};

export const elementsAPI = {
  create: (projectId, elementData) => {
    console.log('Calling create element for project:', projectId, elementData);
    return apiCall(`/projects/${projectId}/elements`, {
      method: 'POST',
      body: JSON.stringify(elementData),
    });
  },

  update: (id, elementData) => {
    console.log('Calling update element:', id, elementData);
    return apiCall(`/elements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(elementData),
    });
  },

  delete: (id) => {
    console.log('Calling delete element:', id);
    return apiCall(`/elements/${id}`, {
      method: 'DELETE',
    });
  },
};

export const paymentsAPI = {
  createIntent: (paymentData) => {
    console.log('Calling create payment intent:', paymentData);
    return apiCall('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  confirm: (id, confirmationData) => {
    console.log('Calling confirm payment:', id);
    return apiCall(`/payments/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify(confirmationData),
    });
  },

  getHistory: () => {
    console.log('Calling get payment history');
    return apiCall('/payments');
  },
};

export const statsAPI = {
  get: () => {
    console.log('Calling get stats');
    return apiCall('/stats');
  },
};

// Utilidades
export const storage = {
  setToken: (token) => {
    console.log('Setting token in localStorage');
    localStorage.setItem('webshield_token', token);
  },

  getToken: () => {
    const token = localStorage.getItem('webshield_token');
    console.log('Getting token from localStorage:', token ? 'Token exists' : 'No token');
    return token;
  },

  removeToken: () => {
    console.log('Removing token from localStorage');
    localStorage.removeItem('webshield_token');
  },

  isLoggedIn: () => {
    const isLoggedIn = !!localStorage.getItem('webshield_token');
    console.log('Checking if logged in:', isLoggedIn);
    return isLoggedIn;
  },
};

export default { authAPI, projectsAPI, elementsAPI, paymentsAPI, statsAPI, storage };
