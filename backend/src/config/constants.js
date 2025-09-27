// Configuración del servidor
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'HKYG!@@#*UIHGV@!#HGGHQHNBXBZJHKJH_9712381209JHJKh1802308huY*';

// Límites por plan
const PLAN_LIMITS = {
  free: {
    projects: 3,
    elements_per_project: 10,
    registrations_per_hour: 3,
    features: ['basic_elements']
  },
  pro: {
    projects: 50,
    elements_per_project: 100,
    registrations_per_hour: 10,
    features: ['basic_elements', 'advanced_elements', 'export', 'templates']
  },
  premium: {
    projects: 999,
    elements_per_project: 999,
    registrations_per_hour: 20,
    features: ['basic_elements', 'advanced_elements', 'export', 'templates', 'analytics', 'priority_support']
  }
};

// Precios de planes
const PLAN_PRICES = {
  pro: 9.99,
  premium: 19.99
};

// Rate limiting
const RATE_LIMITS = {
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 190 // requests por IP
  },
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20 // intentos de login por IP
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 30 // registros por IP por hora
  }
};

// Tipos de elementos válidos
const ELEMENT_TYPES = {
  basic: ['text', 'image', 'button'],
  advanced: ['form', 'gallery', 'menu']
};

// Estados de pago
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Mensajes de error comunes
const ERROR_MESSAGES = {
  TOKEN_MISSING: 'Token requerido',
  TOKEN_INVALID: 'Token inválido',
  TOKEN_EXPIRED: 'Token expirado',
  USER_INVALID: 'Usuario no válido o inactivo',
  EMAIL_EXISTS: 'El email ya está registrado',
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  INTERNAL_ERROR: 'Error interno del servidor',
  PROJECT_NOT_FOUND: 'Proyecto no encontrado',
  ELEMENT_NOT_FOUND: 'Elemento no encontrado',
  INSUFFICIENT_PLAN: 'Plan insuficiente',
  LIMIT_REACHED: 'Límite alcanzado'
};

// Configuración de seguridad
const SECURITY_CONFIG = {
  saltRounds: 12,
  jwtExpiration: '7d',
  allowedDomains: [
    'https://webshield100.onrender.com',
    'http://localhost:3000',
    'https://webshield100-fronted.onrender.com'
  ]
};

module.exports = {
  PORT,
  JWT_SECRET,
  PLAN_LIMITS,
  PLAN_PRICES,
  RATE_LIMITS,
  ELEMENT_TYPES,
  PAYMENT_STATUS,
  ERROR_MESSAGES,
  SECURITY_CONFIG
};
