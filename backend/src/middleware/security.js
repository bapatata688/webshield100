const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { RATE_LIMITS } = require('../config/constants');

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

const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.general.windowMs,
  max: RATE_LIMITS.general.max,
  message: {
    error: 'Demasiadas solicitudes desde esta IP. Intenta mas tarde.',
    retry_after: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: RATE_LIMITS.login.windowMs,
  max: RATE_LIMITS.login.max,
  message: {
    error: 'Demasiados intentos de inicio de sesion. Intenta en 15 minutos.',
    security_notice: 'Por tu seguridad, hemos bloqueado temporalmente esta IP.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: RATE_LIMITS.register.windowMs,
  max: RATE_LIMITS.register.max,
  message: {
    error: 'Limite de registros alcanzado. Intenta en 1 hora.',
  },
});

// Helmet MÁS PERMISIVO para APIs
const helmetConfig = helmet({
  contentSecurityPolicy: false, // Deshabilitar CSP para APIs
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

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
