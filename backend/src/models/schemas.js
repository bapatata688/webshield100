const Joi = require('joi');

// Esquemas de validación para diferentes entidades
const schemas = {
  // Autenticación
  register: Joi.object({
    email: Joi.string().email().max(255).required(),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.pattern.base': 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos'
      }),
    plan: Joi.string().valid('free', 'pro', 'premium').default('free')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Actualización de perfil
  profileUpdate: Joi.object({
    email: Joi.string().email().max(255).optional()
  }),

  // Cambio de contraseña
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.pattern.base': 'La nueva contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos'
      })
  }),

  // Proyectos
  project: Joi.object({
    name: Joi.string().min(1).max(100).trim().required()
  }),

  projectUpdate: Joi.object({
    name: Joi.string().min(1).max(100).trim().required()
  }),

  // Elementos
  element: Joi.object({
    type: Joi.string().valid('text', 'image', 'button', 'form', 'gallery', 'menu').required(),
    settings: Joi.object().default({}),
    order_position: Joi.number().integer().min(0).optional()
  }),

  elementUpdate: Joi.object({
    type: Joi.string().valid('text', 'image', 'button', 'form', 'gallery', 'menu').optional(),
    settings: Joi.object().optional(),
    order_position: Joi.number().integer().min(0).optional()
  }),

  // Reordenamiento de elementos
  reorderElements: Joi.object({
    element_orders: Joi.array().items(
      Joi.object({
        element_id: Joi.number().integer().positive().required(),
        new_position: Joi.number().integer().min(0).required()
      })
    ).min(1).required()
  }),

  // Pagos
  payment: Joi.object({
    plan: Joi.string().valid('pro', 'premium').required(),
    amount: Joi.number().positive().precision(2).required()
  }),

  paymentConfirm: Joi.object({
    stripe_payment_id: Joi.string().optional()
  }),

  // Plantillas
  template: Joi.object({
    project_name: Joi.string().min(1).max(100).trim().optional()
  }),

  // Guardado de proyecto completo
  projectSave: Joi.object({
    elements: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('text', 'image', 'button', 'form', 'gallery', 'menu').required(),
        settings: Joi.object().default({})
      })
    ).required()
  }),

  // Configuraciones de exportación
  exportData: Joi.object({
    format: Joi.string().valid('html', 'json').default('html'),
    includeStyles: Joi.boolean().default(true),
    minify: Joi.boolean().default(false)
  }),

  // Configuración de notificaciones
  notificationSettings: Joi.object({
    emailNotifications: Joi.boolean().default(true),
    projectLimitWarnings: Joi.boolean().default(true),
    paymentReminders: Joi.boolean().default(true),
    securityAlerts: Joi.boolean().default(true)
  })
};

// Configuraciones específicas por tipo de elemento
const elementSettingsSchemas = {
  text: Joi.object({
    title: Joi.string().max(200).optional(),
    content: Joi.string().max(5000).optional(),
    alignment: Joi.string().valid('left', 'center', 'right').default('left'),
    fontSize: Joi.string().pattern(/^\d+px$/).default('16px'),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#333333')
  }),

  image: Joi.object({
    src: Joi.string().uri().optional(),
    imageUrl: Joi.string().uri().optional(),
    alt: Joi.string().max(200).default('Imagen'),
    width: Joi.string().default('100%'),
    height: Joi.string().default('auto'),
    borderRadius: Joi.string().pattern(/^\d+px$/).default('8px')
  }),

  button: Joi.object({
    text: Joi.string().max(50).default('Botón'),
    link: Joi.string().uri().default('#'),
    backgroundColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#3b82f6'),
    textColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#ffffff'),
    size: Joi.string().valid('small', 'medium', 'large').default('medium'),
    borderRadius: Joi.string().pattern(/^\d+px$/).default('8px')
  }),

  form: Joi.object({
    title: Joi.string().max(100).default('Formulario de Contacto'),
    fields: Joi.array().items(
      Joi.string().valid('name', 'email', 'phone', 'message', 'company', 'subject')
    ).default(['name', 'email', 'message']),
    buttonText: Joi.string().max(30).default('Enviar'),
    backgroundColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#f9fafb')
  }),

  menu: Joi.object({
    links: Joi.array().items(Joi.string().max(30)).max(8).default(['Inicio', 'Servicios', 'Contacto']),
    backgroundColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#1f2937'),
    textColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#ffffff'),
    alignment: Joi.string().valid('left', 'center', 'right').default('left')
  }),

  gallery: Joi.object({
    title: Joi.string().max(100).default('Galería'),
    columns: Joi.number().integer().min(1).max(6).default(3),
    images: Joi.array().items(
      Joi.object({
        src: Joi.string().uri().required(),
        url: Joi.string().uri().optional(),
        alt: Joi.string().max(100).optional()
      })
    ).max(50).default([])
  })
};

// Función helper para validar esquemas
const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    req.body = value;
    next();
  };
};

// Validaciones para parámetros de URL
const validateParams = {
  id: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  projectId: Joi.object({
    projectId: Joi.number().integer().positive().required()
  }),

  templateId: Joi.object({
    templateId: Joi.string().required()
  })
};

const validateParamsSchema = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Parámetros de URL inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    req.params = value;
    next();
  };
};

// Validaciones para query parameters
const validateQuery = {
  search: Joi.object({
    q: Joi.string().min(2).max(100).required(),
    type: Joi.string().valid('text', 'image', 'button', 'form', 'gallery', 'menu').optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
    orderBy: Joi.string().valid('created_at', 'updated_at', 'name').default('updated_at'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};

const validateQuerySchema = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Parámetros de consulta inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    req.query = value;
    next();
  };
};

// Validación dinámica de configuraciones por tipo de elemento
const validateElementSettingsByType = (type) => {
  return (req, res, next) => {
    if (!req.body.settings) {
      return next();
    }

    const settingsSchema = elementSettingsSchemas[type];
    if (!settingsSchema) {
      return next();
    }

    const { error, value } = settingsSchema.validate(req.body.settings, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: `Configuración inválida para elemento tipo ${type}`,
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.body.settings = value;
    next();
  };
};

module.exports = {
  schemas,
  elementSettingsSchemas,
  validateSchema,
  validateParams,
  validateParamsSchema,
  validateQuery,
  validateQuerySchema,
  validateElementSettingsByType
};
