const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { RATE_LIMITS } = require('../config/constants');

// Middleware personalizado para sanitización XSS
const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/[<>]/g, '');
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      } else {
        obj[key] = sanitizeValue(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.general.windowMs,
  max: RATE_LIMITS.general.max,
  message: {
    error: 'Demasiadas solicitudes desde esta IP. Intenta más tarde.',
    retry_after: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting específico para login (protección brute force)
const loginLimiter = rateLimit({
  windowMs: RATE_LIMITS.login.windowMs,
  max: RATE_LIMITS.login.max,
  message: {
    error: 'Demasiados intentos de inicio de sesión. Intenta en 15 minutos.',
    security_notice: 'Por tu seguridad, hemos bloqueado temporalmente esta IP.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para registro
const registerLimiter = rateLimit({
  windowMs: RATE_LIMITS.register.windowMs,
  max: RATE_LIMITS.register.max,
  message: {
    error: 'Límite de registros alcanzado. Intenta en 1 hora.',
  },
});

// Configuración de Helmet para headers de seguridad
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
});

// Función principal para aplicar middlewares de seguridad
const applySecurityMiddleware = (app) => {
  // Headers de seguridad
  app.use(helmetConfig);
  
  // Rate limiting general
  app.use(generalLimiter);
  
  // Sanitización de inputs
  app.use(sanitizeInput);
};

module.exports = applySecurityMiddleware;
module.exports.loginLimiter = loginLimiter;
module.exports.registerLimiter = registerLimiter;
module.exports.sanitizeInput = sanitizeInput;
