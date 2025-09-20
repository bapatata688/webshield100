const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const sanitizeinput = (req, res, next) => {
  const sanitizevalue = (value) => {
    if (typeof value === 'string') {
      return value
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/[<>]/g, '');
    }
    return value;
  };

  const sanitizeobject = (obj) => {
    for (let key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        sanitizeobject(obj[key]);
      } else {
        obj[key] = sanitizevalue(obj[key]);
      }
    }
  };

  if (req.body) sanitizeobject(req.body);
  if (req.query) sanitizeobject(req.query);
  if (req.params) sanitizeobject(req.params);

  next();
};

app.use(sanitizeinput); const { pool } = require('pg');
const joi = require('joi');
require('dotenv').config();

const app = express();
const port = process.env.port || 5000;

// ==================== middlewares de seguridad ====================
// helmet para headers de seguridad
app.use(helmet({
  contentsecuritypolicy: {
    directives: {
      defaultsrc: ["'self'"],
      stylesrc: ["'self'", "'unsafe-inline'"],
      scriptsrc: ["'self'"],
      imgsrc: ["'self'", "data:", "https:"],
    },
  },
}));

// rate limiting general
const generallimiter = ratelimit({
  windowms: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ip
  message: {
    error: 'demasiadas solicitudes desde esta ip. intenta más tarde.',
    retry_after: '15 minutes'
  },
  standardheaders: true,
  legacyheaders: false,
});

// rate limiting específico para login (protección brute force)
const loginlimiter = ratelimit({
  windowms: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por ip
  message: {
    error: 'demasiados intentos de inicio de sesión. intenta en 15 minutos.',
    security_notice: 'por tu seguridad, hemos bloqueado temporalmente esta ip.'
  },
  standardheaders: true,
  legacyheaders: false,
});

// Rate limiting para registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 registros por IP por hora
  message: {
    error: 'Límite de registros alcanzado. Intenta en 1 hora.',
  },
});

app.use(generalLimiter);
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limitar tamaño de payload

// ==================== ESQUEMAS DE VALIDACIÓN ====================
const schemas = {
  register: Joi.object({
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(8).max(128).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required()
      .messages({
        'string.pattern.base': 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos'
      }),
    plan: Joi.string().valid('free', 'pro', 'premium').default('free')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  project: Joi.object({
    name: Joi.string().min(1).max(100).trim().required()
  }),

  element: Joi.object({
    type: Joi.string().valid('text', 'image', 'button', 'form', 'gallery', 'menu').required(),
    settings: Joi.object().default({}),
    order_position: Joi.number().integer().min(0).optional()
  }),

  payment: Joi.object({
    plan: Joi.string().valid('pro', 'premium').required(),
    amount: Joi.number().positive().precision(2).required()
  })
};

// ==================== CONFIGURACIÓN DE BASE DE DATOS ====================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // máximo 20 conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET no está configurado');
  process.exit(1);
}

// ==================== MIDDLEWARES DE AUTENTICACIÓN ====================
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token requerido',
      code: 'TOKEN_MISSING'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar que el usuario aún existe y está activo
    const userResult = await pool.query(
      'SELECT id, email, plan, is_active FROM usuarios WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Usuario no válido o inactivo',
        code: 'USER_INVALID'
      });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Token inválido',
        code: 'TOKEN_INVALID'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({
      error: 'Error de autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

const requirePlan = (allowedPlans) => {
  return (req, res, next) => {
    if (!allowedPlans.includes(req.user.plan)) {
      return res.status(403).json({
        error: 'Plan insuficiente',
        required: allowedPlans,
        current: req.user.plan,
        upgrade_url: '/api/plans'
      });
    }
    next();
  };
};

// ==================== UTILIDADES DE VALIDACIÓN ====================
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
    req.body = value; // Usar datos validados y sanitizados
    next();
  };
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
  }
  return input;
};

// ==================== RUTAS DE AUTENTICACIÓN MEJORADAS ====================
app.post('/api/auth/register', registerLimiter, validateSchema(schemas.register), async (req, res) => {
  const { email, password, plan } = req.body;

  try {
    // Verificar si el email ya existe
    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'El email ya está registrado',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash robusto de la contraseña
    const saltRounds = 14; // Aumentado para mayor seguridad
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar usuario con campos adicionales
    const result = await pool.query(
      `INSERT INTO usuarios (email, password, plan, is_active, email_verified, created_at) 
       VALUES ($1, $2, $3, true, false, CURRENT_TIMESTAMP) 
       RETURNING id, email, plan, created_at`,
      [email.toLowerCase(), hashedPassword, plan]
    );

    const user = result.rows[0];

    // Crear JWT con información extendida
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        plan: user.plan,
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log de seguridad
    console.log(`✅ Nuevo usuario registrado: ${user.email} (Plan: ${user.plan})`);

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        created_at: user.created_at,
        email_verified: false
      },
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

app.post('/api/auth/login', loginLimiter, validateSchema(schemas.login), async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario con más información
    const result = await pool.query(
      `SELECT id, email, password, plan, is_active, failed_login_attempts, 
       last_failed_login, locked_until FROM usuarios WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Log de intento de acceso fallido
      console.log(`⚠️  Intento de login con email inexistente: ${email}`);
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Cuenta desactivada',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Verificar si la cuenta está bloqueada
    if (user.locked_until && new Date() < user.locked_until) {
      return res.status(423).json({
        error: 'Cuenta temporalmente bloqueada por seguridad',
        code: 'ACCOUNT_LOCKED',
        retry_after: user.locked_until
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Incrementar intentos fallidos
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      let updateQuery = 'UPDATE usuarios SET failed_login_attempts = $1, last_failed_login = CURRENT_TIMESTAMP WHERE id = $2';
      let updateParams = [failedAttempts, user.id];

      // Bloquear cuenta si hay demasiados intentos
      if (failedAttempts >= 5) {
        updateQuery = `UPDATE usuarios SET failed_login_attempts = $1, last_failed_login = CURRENT_TIMESTAMP,
                      locked_until = CURRENT_TIMESTAMP + INTERVAL '30 minutes' WHERE id = $2`;
      }

      await pool.query(updateQuery, updateParams);

      console.log(`⚠️  Login fallido para ${email}. Intentos: ${failedAttempts}`);
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Login exitoso - limpiar intentos fallidos
    await pool.query(
      'UPDATE usuarios SET failed_login_attempts = 0, last_login = CURRENT_TIMESTAMP, locked_until = NULL WHERE id = $1',
      [user.id]
    );

    // Crear JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        plan: user.plan,
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ Login exitoso: ${user.email}`);

    res.json({
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan
      },
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ==================== RUTAS DE PROYECTOS MEJORADAS ====================
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Obtener proyectos con paginación
    const result = await pool.query(
      `SELECT p.id, p.name, p.created_at, p.updated_at, 
       COUNT(e.id) as element_count
       FROM proyectos p 
       LEFT JOIN elementos e ON p.id = e.project_id 
       WHERE p.user_id = $1 
       GROUP BY p.id, p.name, p.created_at, p.updated_at
       ORDER BY p.updated_at DESC 
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    // Contar total para paginación
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM proyectos WHERE user_id = $1',
      [req.user.id]
    );

    const totalProjects = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalProjects / limit);

    res.json({
      projects: result.rows,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_projects: totalProjects,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo proyectos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/projects', authenticateToken, validateSchema(schemas.project), async (req, res) => {
  const { name } = req.body;

  try {
    // Verificar límites por plan con consulta optimizada
    const stats = await pool.query(
      `SELECT COUNT(*) as project_count FROM proyectos WHERE user_id = $1`,
      [req.user.id]
    );

    const count = parseInt(stats.rows[0].project_count);
    const limits = { free: 3, pro: 50, premium: 999 };

    if (count >= limits[req.user.plan]) {
      return res.status(403).json({
        error: `Límite de proyectos alcanzado para plan ${req.user.plan}`,
        limit: limits[req.user.plan],
        current: count,
        upgrade_suggestion: req.user.plan === 'free' ? 'pro' : 'premium'
      });
    }

    // Crear proyecto con validación adicional
    const sanitizedName = sanitizeInput(name);
    const result = await pool.query(
      'INSERT INTO proyectos (name, user_id) VALUES ($1, $2) RETURNING *',
      [sanitizedName, req.user.id]
    );

    console.log(`✅ Proyecto creado: "${sanitizedName}" por ${req.user.email}`);

    res.status(201).json({
      message: 'Proyecto creado exitosamente',
      project: result.rows[0],
      remaining_slots: limits[req.user.plan] - count - 1
    });

  } catch (error) {
    console.error('❌ Error creando proyecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== RUTAS DE ESTADÍSTICAS MEJORADAS ====================
app.get('/api/stats', authenticateToken, requirePlan(['premium']), async (req, res) => {
  try {
    // Estadísticas más detalladas y optimizadas
    const [overviewResult, elementsResult, activityResult, performanceResult] = await Promise.all([
      // Estadísticas generales
      pool.query(`
        SELECT 
          COUNT(DISTINCT p.id) as total_projects,
          COUNT(e.id) as total_elements,
          COUNT(CASE WHEN pg.status = 'completed' THEN 1 END) as successful_payments,
          SUM(CASE WHEN pg.status = 'completed' THEN pg.amount ELSE 0 END) as total_spent,
          MAX(p.updated_at) as last_project_update
        FROM proyectos p
        LEFT JOIN elementos e ON p.id = e.project_id
        LEFT JOIN pagos pg ON p.user_id = pg.user_id
        WHERE p.user_id = $1
      `, [req.user.id]),

      // Uso por tipo de elemento
      pool.query(`
        SELECT e.type, COUNT(*) as count, 
               AVG(LENGTH(e.settings::text)) as avg_complexity
        FROM elementos e
        JOIN proyectos p ON e.project_id = p.id
        WHERE p.user_id = $1
        GROUP BY e.type
        ORDER BY count DESC
      `, [req.user.id]),

      // Actividad por mes (últimos 6 meses)
      pool.query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as projects_created
        FROM proyectos 
        WHERE user_id = $1 
        AND created_at >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `, [req.user.id]),

      // Estadísticas de rendimiento
      pool.query(`
        SELECT 
          AVG(element_count) as avg_elements_per_project,
          MAX(element_count) as max_elements_in_project,
          COUNT(CASE WHEN element_count > 10 THEN 1 END) as complex_projects
        FROM (
          SELECT p.id, COUNT(e.id) as element_count
          FROM proyectos p
          LEFT JOIN elementos e ON p.id = e.project_id
          WHERE p.user_id = $1
          GROUP BY p.id
        ) project_stats
      `, [req.user.id])
    ]);

    res.json({
      overview: {
        ...overviewResult.rows[0],
        total_spent: parseFloat(overviewResult.rows[0].total_spent) || 0
      },
      element_usage: elementsResult.rows,
      activity_by_month: activityResult.rows,
      performance: performanceResult.rows[0],
      user_plan: req.user.plan,
      generated_at: new Date().toISOString(),
      next_update_in: '24h'
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== NUEVAS FUNCIONALIDADES ====================

// Búsqueda de proyectos
app.get('/api/projects/search', authenticateToken, async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Query debe tener al menos 2 caracteres'
      });
    }

    const searchQuery = `%${q.trim()}%`;
    let query = `
      SELECT p.id, p.name, p.created_at, p.updated_at,
             COUNT(e.id) as element_count
      FROM proyectos p 
      LEFT JOIN elementos e ON p.id = e.project_id 
      WHERE p.user_id = $1 AND p.name ILIKE $2
    `;

    const params = [req.user.id, searchQuery];

    if (type) {
      query += ` AND e.type = $3`;
      params.push(type);
    }

    query += ` GROUP BY p.id, p.name, p.created_at, p.updated_at ORDER BY p.updated_at DESC LIMIT 20`;

    const result = await pool.query(query, params);

    res.json({
      projects: result.rows,
      search_query: q,
      results_count: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Duplicar proyecto
app.post('/api/projects/:id/duplicate', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('BEGIN');

    // Verificar proyecto original
    const originalProject = await pool.query(
      'SELECT * FROM proyectos WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (originalProject.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Crear proyecto duplicado
    const newName = `${originalProject.rows[0].name} (Copia)`;
    const newProject = await pool.query(
      'INSERT INTO proyectos (name, user_id) VALUES ($1, $2) RETURNING *',
      [newName, req.user.id]
    );

    // Copiar elementos
    await pool.query(`
      INSERT INTO elementos (project_id, type, settings, order_position)
      SELECT $1, type, settings, order_position 
      FROM elementos 
      WHERE project_id = $2
      ORDER BY order_position
    `, [newProject.rows[0].id, id]);

    await pool.query('COMMIT');

    console.log(`✅ Proyecto duplicado: ${newName} por ${req.user.email}`);

    res.status(201).json({
      message: 'Proyecto duplicado exitosamente',
      project: newProject.rows[0]
    });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error duplicando proyecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Plantillas de proyectos (solo Pro/Premium)
app.get('/api/templates', authenticateToken, requirePlan(['pro', 'premium']), async (req, res) => {
  try {
    const templates = [
      {
        id: 'landing-business',
        name: 'Landing Page Empresarial',
        description: 'Página profesional para empresas con formulario de contacto',
        preview_url: '/templates/landing-business.jpg',
        elements: [
          { type: 'menu', settings: { links: ['Inicio', 'Servicios', 'Contacto'] } },
          { type: 'text', settings: { content: 'Bienvenido a nuestra empresa' } },
          { type: 'image', settings: { src: '/placeholder-hero.jpg' } },
          { type: 'form', settings: { fields: ['name', 'email', 'message'] } }
        ]
      },
      {
        id: 'portfolio',
        name: 'Portfolio Creativo',
        description: 'Muestra tu trabajo con una galería elegante',
        preview_url: '/templates/portfolio.jpg',
        elements: [
          { type: 'text', settings: { content: 'Mi Portfolio' } },
          { type: 'gallery', settings: { columns: 3 } },
          { type: 'button', settings: { text: 'Contactar', link: '#contact' } }
        ]
      }
    ];

    res.json({
      templates,
      available_for_plan: req.user.plan
    });

  } catch (error) {
    console.error('❌ Error obteniendo plantillas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear proyecto desde plantilla
app.post('/api/templates/:templateId/create', authenticateToken, requirePlan(['pro', 'premium']), async (req, res) => {
  const { templateId } = req.params;
  const { project_name } = req.body;

  try {
    // Aquí irían las plantillas reales desde la base de datos
    // Por ahora, simulamos con datos estáticos

    const templateData = {
      'landing-business': {
        name: project_name || 'Mi Landing Page',
        elements: [
          { type: 'menu', settings: { content: 'Menú de navegación' } },
          { type: 'text', settings: { content: 'Título principal de mi negocio' } },
          { type: 'image', settings: { imageUrl: '' } },
          { type: 'form', settings: { content: 'Formulario de contacto' } }
        ]
      }
    };

    if (!templateData[templateId]) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    await pool.query('BEGIN');

    const template = templateData[templateId];

    // Crear proyecto
    const project = await pool.query(
      'INSERT INTO proyectos (name, user_id) VALUES ($1, $2) RETURNING *',
      [template.name, req.user.id]
    );

    // Agregar elementos de la plantilla
    for (let i = 0; i < template.elements.length; i++) {
      const element = template.elements[i];
      await pool.query(
        'INSERT INTO elementos (project_id, type, settings, order_position) VALUES ($1, $2, $3, $4)',
        [project.rows[0].id, element.type, JSON.stringify(element.settings), i + 1]
      );
    }

    await pool.query('COMMIT');

    res.status(201).json({
      message: 'Proyecto creado desde plantilla',
      project: project.rows[0],
      template_used: templateId
    });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error creando desde plantilla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== SISTEMA DE NOTIFICACIONES ====================
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = [];

    // Verificar límites próximos a alcanzar
    const projectCount = await pool.query(
      'SELECT COUNT(*) FROM proyectos WHERE user_id = $1',
      [req.user.id]
    );

    const count = parseInt(projectCount.rows[0].count);
    const limits = { free: 3, pro: 50, premium: 999 };
    const currentLimit = limits[req.user.plan];

    if (count >= currentLimit * 0.8) { // 80% del límite
      notifications.push({
        id: 'project_limit_warning',
        type: 'warning',
        message: `Has usado ${count}/${currentLimit} proyectos disponibles`,
        action_url: '/plans',
        created_at: new Date().toISOString()
      });
    }

    // Verificar pagos pendientes
    const pendingPayments = await pool.query(
      'SELECT COUNT(*) FROM pagos WHERE user_id = $1 AND status = $2',
      [req.user.id, 'pending']
    );

    if (parseInt(pendingPayments.rows[0].count) > 0) {
      notifications.push({
        id: 'pending_payment',
        type: 'info',
        message: 'Tienes pagos pendientes de procesar',
        action_url: '/payments',
        created_at: new Date().toISOString()
      });
    }

    res.json({
      notifications,
      unread_count: notifications.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== MANEJO DE ERRORES MEJORADO ====================
app.use((err, req, res, next) => {
  // Log detallado del error
  console.error('❌ Error no controlado:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.email,
    timestamp: new Date().toISOString()
  });

  // Respuesta según el tipo de error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  if (err.code === '23505') { // Violación de constraint único en PostgreSQL
    return res.status(409).json({
      error: 'Conflicto de datos - registro duplicado',
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Servicio temporalmente no disponible',
      code: 'SERVICE_UNAVAILABLE'
    });
  }

  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    request_id: req.id || 'unknown'
  });
});

// Ruta 404 mejorada
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    available_endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/profile',
      'GET /api/projects',
      'POST /api/projects',
      'GET /api/projects/:id',
      'PUT /api/projects/:id',
      'DELETE /api/projects/:id',
      'GET /api/projects/search',
      'POST /api/projects/:id/duplicate',
      'POST /api/projects/:projectId/elements',
      'PUT /api/elements/:id',
      'DELETE /api/elements/:id',
      'GET /api/templates',
      'POST /api/templates/:templateId/create',
      'POST /api/payments/create-intent',
      'POST /api/payments/:id/confirm',
      'GET /api/payments',
      'POST /api/projects/:id/save',
      'GET /api/projects/:id/export',
      'GET /api/stats',
      'GET /api/notifications'
    ]
  });
});

// ==================== INICIALIZACIÓN Y SALUD ====================
// Endpoint de salud del sistema
app.get('/api/health', async (req, res) => {
  try {
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    const dbTime = Date.now() - dbStart;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'connected',
        response_time_ms: dbTime
      },
      memory: process.memoryUsage(),
      version: '2.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Función para crear índices de base de datos
async function createDatabaseIndexes() {
  try {
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usuarios_email ON usuarios(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proyectos_user_id ON proyectos(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proyectos_updated_at ON proyectos(updated_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_elementos_project_id ON elementos(project_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_elementos_type ON elementos(type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_elementos_order ON elementos(project_id, order_position)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pagos_user_id ON pagos(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pagos_status ON pagos(status)'
    ];

    for (const indexQuery of indexes) {
      try {
        await pool.query(indexQuery);
      } catch (indexError) {
        if (indexError.code !== '42P07') { // Ignorar si el índice ya existe
          console.warn(`Advertencia creando índice: ${indexError.message}`);
        }
      }
    }

    console.log('✅ Índices de base de datos verificados/creados');
  } catch (error) {
    console.error('⚠️  Error verificando índices:', error.message);
  }
}

// Función para verificar y crear tablas necesarias
async function ensureDatabaseTables() {
  try {
    // Verificar si las tablas principales existen
    const tables = ['usuarios', 'proyectos', 'elementos', 'pagos'];

    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [table]);

      if (!result.rows[0].exists) {
        console.error(`❌ Tabla '${table}' no existe. Ejecuta las migraciones primero.`);
        process.exit(1);
      }
    }

    // Verificar columnas importantes que podrían faltar
    const columnChecks = [
      { table: 'usuarios', column: 'is_active', type: 'BOOLEAN DEFAULT true' },
      { table: 'usuarios', column: 'email_verified', type: 'BOOLEAN DEFAULT false' },
      { table: 'usuarios', column: 'failed_login_attempts', type: 'INTEGER DEFAULT 0' },
      { table: 'usuarios', column: 'last_failed_login', type: 'TIMESTAMP' },
      { table: 'usuarios', column: 'locked_until', type: 'TIMESTAMP' },
      { table: 'usuarios', column: 'last_login', type: 'TIMESTAMP' }
    ];

    for (const check of columnChecks) {
      try {
        await pool.query(`
          ALTER TABLE ${check.table} 
          ADD COLUMN IF NOT EXISTS ${check.column} ${check.type}
        `);
      } catch (error) {
        console.warn(`Advertencia añadiendo columna ${check.column}: ${error.message}`);
      }
    }

    console.log('✅ Estructura de base de datos verificada');
  } catch (error) {
    console.error('❌ Error verificando estructura de base de datos:', error);
    process.exit(1);
  }
}

// Función principal de verificación de conexión
async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    console.log('✅ Conexión a PostgreSQL establecida');

    // Verificar estructura de tablas
    await ensureDatabaseTables();

    // Crear índices necesarios
    await createDatabaseIndexes();

  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error);
    console.error('Verifica que DATABASE_URL esté configurado correctamente');
    process.exit(1);
  }
}

// Monitoreo de conexiones de base de datos
setInterval(async () => {
  try {
    const stats = {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingCount: pool.waitingCount
    };

    if (stats.totalConnections > 15) {
      console.warn('⚠️  Alto número de conexiones activas:', stats);
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas de conexión:', error);
  }
}, 60000); // Cada minuto

// Iniciar servidor con verificaciones completas
app.listen(PORT, async () => {
  console.log('\n🛡️  WebShield Backend v2.0 iniciando...');

  // Verificaciones de inicialización
  await checkDatabaseConnection();

  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Seguridad: JWT + Rate Limiting + Helmet activos`);
  console.log(`📈 Rate Limits: General(100/15min) Login(5/15min) Register(3/1h)`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API v2 endpoints disponibles`);
  console.log('✅ WebShield Backend listo para recibir conexiones\n');
});

// Manejo mejorado de cierre graceful
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 Recibida señal ${signal}, cerrando servidor...`);

  try {
    // Cerrar servidor HTTP
    if (server) {
      server.close(() => {
        console.log('✅ Servidor HTTP cerrado');
      });
    }

    // Cerrar conexiones de base de datos
    await pool.end();
    console.log('✅ Pool de conexiones PostgreSQL cerrado');

    console.log('✅ Cierre graceful completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante cierre graceful:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection en:', promise, 'razón:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

module.exports = app;
