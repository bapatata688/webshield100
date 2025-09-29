const API_BASE_URL = 'https://webshield100-backend.onrender.com/api';
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  // Agregar token 
  const token = localStorage.getItem('webshield_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
    console.log('Token agregado a la request');
  }

  try {
    console.log('Enviando request...');
    const response = await fetch(url, config);
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);

    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    console.error('Error stack:', error.stack);
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

  delete: (id) => apiCall(`/projects/${id}`, { method: 'DELETE' }),

  save: (id, elements) => {
    console.log(' projectsAPI.save llamado');
    console.log('  > iD del proyecto:', id);
    console.log('  > elementos recibidos:', elements);
    console.log('  > tipo de elements:', typeof elements);
    console.log('  > es un array?:', Array.isArray(elements));
    console.log('  > cantidad de elementos:', elements?.length);

    // Validación antes de enviar
    if (!id) {
      console.error(' Error: ID del proyecto no proporcionado');
      throw new Error('ID del proyecto es requerido');
    }

    if (!Array.isArray(elements)) {
      console.error(' Error: elements no es un array:', elements);
      throw new Error('Elements debe ser un array');
    }

    // Validar estructura de cada elemento
    const invalidElements = elements.filter((el, index) => {
      if (!el || typeof el !== 'object') {
        console.error(` Elemento ${index + 1} no es un objeto:`, el);
        return true;
      }
      if (!el.type) {
        console.error(` Elemento ${index + 1} no tiene tipo:`, el);
        return true;
      }
      return false;
    });

    if (invalidElements.length > 0) {
      throw new Error(`${invalidElements.length} elemento(s) tienen estructura inválida`);
    }

    // Limpiar elementos antes de enviar
    const cleanElements = elements.map(el => ({
      type: el.type,
      settings: el.settings || {}
    }));

    console.log('  → Elementos limpiados para enviar:', cleanElements);

    return apiCall(`/projects/${id}/save`, {
      method: 'POST',
      body: JSON.stringify({ elements: cleanElements }),
    });
  },

  export: (id) => apiCall(`/projects/${id}/export`),

  search: (query) => apiCall(`/projects/search?q=${encodeURIComponent(query)}`),

  duplicate: (id) => apiCall(`/projects/${id}/duplicate`, { method: 'POST' }),
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
export const loadUserProfile = async () => {
  try {
    const response = await authAPI.getProfile();
    // Retornar los datos en lugar de setear estado directamente
    return response;
  } catch (error) {
    localStorage.removeItem('webshield_token');
    throw error; // Propagar el error para que el componente lo maneje
  }
};

export const loadProjects = async () => {
  try {
    const response = await projectsAPI.getAll();
    return response;
  } catch (error) {
    console.error('Error loading projects:', error);
    throw error;
  }
};

export const loadStats = async () => {
  try {
    const response = await statsAPI.get();
    return response;
  } catch (error) {
    console.error('Error loading stats:', error);
    throw error;
  }
};

export const loadPaymentHistory = async () => {
  try {
    const response = await paymentsAPI.getHistory();
    return response;
  } catch (error) {
    console.error('Error loading payment history:', error);
    throw error;
  }
};

export const dataLoaders = {
  loadUserProfile,
  loadProjects,
  loadStats,
  loadPaymentHistory
};

export default {
  authAPI,
  projectsAPI,
  elementsAPI,
  paymentsAPI,
  statsAPI,
  dataLoaders,
  storage
}
