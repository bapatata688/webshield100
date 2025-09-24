const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const Joi = require('joi');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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
// ==================== MIDDLEWARES DE SEGURIDAD ====================
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

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.set('trust proxy', 1);
// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP. Intenta más tarde.',
    retry_after: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting específico para login (protección brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por IP
  message: {
    error: 'Demasiados intentos de inicio de sesión. Intenta en 15 minutos.',
    security_notice: 'Por tu seguridad, hemos bloqueado temporalmente esta IP.'
  },
  standardHeaders: true,
  legacyHeaders: false,
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
app.use(cors({
  origin: ['https://webshield100-fronted.onrender.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(sanitizeInput);
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
  connectionString: process.env.DATABASE_URL || "postgresql://webshield100_user:nBXSSmtz0yjIoabpbUajZxYMo5A5l8jD@dpg-d353kte3jp1c73env300-a.oregon-postgres.render.com/webshield100",
  ssl: {
    rejectUnauthorized: false,
  },
});
// Función para crear tablas automáticamente
async function createTablesIfNotExist() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS proyectos(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS elementos (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'image', 'button', 'form', 'gallery', 'menu')),
        settings JSONB DEFAULT '{}',
        order_position INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES proyectos(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pagos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'pro', 'premium')),
        amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
        stripe_payment_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ Tablas verificadas/creadas exitosamente');
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
  }
}
const JWT_SECRET = process.env.JWT_SECRET || 'HKYG!@@#*UIHGV@!#HGGHQHNBXBZJHKJH_9712381209JHJKh1802308huY*';

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
      'SELECT id, email, plan FROM usuarios WHERE id = $1',
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
    req.body = value;
    next();
  };
};

const sanitizeInputUtil = (input) => {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
  }
  return input;
};

// ==================== RUTAS DE AUTENTICACIÓN ====================
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
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar usuario
    const result = await pool.query(
      'INSERT INTO usuarios (email, password, plan) VALUES ($1, $2, $3) RETURNING id, email, plan, created_at',
      [email.toLowerCase(), hashedPassword, plan]
    );

    const user = result.rows[0];

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

    console.log(` Nuevo usuario registrado: ${user.email} (Plan: ${user.plan})`);

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        created_at: user.created_at
      },
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error(' Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

app.post('/api/auth/login', loginLimiter, validateSchema(schemas.login), async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario
    const result = await pool.query(
      'SELECT id, email, password, plan FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      console.log(`  Intento de login con email inexistente: ${email}`);
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log(`  Login fallido para ${email}`);
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

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

    console.log(` Login exitoso: ${user.email}`);

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
    console.error(' Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obtener perfil del usuario
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, plan, created_at FROM usuarios WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== RUTAS DE PROYECTOS ====================
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, created_at, updated_at FROM proyectos WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json({ projects: result.rows });
  } catch (error) {
    console.error('Error obteniendo proyectos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/projects', authenticateToken, validateSchema(schemas.project), async (req, res) => {
  const { name } = req.body;

  try {
    // Verificar límites por plan
    const projectCount = await pool.query(
      'SELECT COUNT(*) FROM proyectos WHERE user_id = $1',
      [req.user.id]
    );
    const count = parseInt(projectCount.rows[0].count);
    const limits = { free: 3, pro: 50, premium: 999 };

    if (count >= limits[req.user.plan]) {
      return res.status(403).json({
        error: `Límite de proyectos alcanzado para plan ${req.user.plan}`,
        limit: limits[req.user.plan],
        current: count
      });
    }

    const result = await pool.query(
      'INSERT INTO proyectos (name, user_id) VALUES ($1, $2) RETURNING *',
      [name.trim(), req.user.id]
    );

    res.status(201).json({
      message: 'Proyecto creado exitosamente',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Error creando proyecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener proyecto específico con elementos
app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const projectResult = await pool.query(
      'SELECT * FROM proyectos WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const elementsResult = await pool.query(
      'SELECT * FROM elementos WHERE project_id = $1 ORDER BY order_position ASC',
      [id]
    );

    const project = projectResult.rows[0];
    project.elements = elementsResult.rows;
    res.json({ project });
  } catch (error) {
    console.error('Error obteniendo proyecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar proyecto
app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre del proyecto es requerido' });
    }
    const result = await pool.query(
      'UPDATE proyectos SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [name.trim(), id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    res.json({
      message: 'Proyecto actualizado exitosamente',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando proyecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar proyecto
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM proyectos WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    res.json({ message: 'Proyecto eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando proyecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== RUTAS DE ELEMENTOS ====================
app.post('/api/projects/:projectId/elements', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { type, settings = {}, order_position } = req.body;
  try {
    const projectCheck = await pool.query(
      'SELECT id FROM proyectos WHERE id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const validTypes = ['text', 'image', 'button', 'form', 'gallery', 'menu'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Tipo de elemento no válido' });
    }

    const restrictedElements = ['form', 'gallery', 'menu'];
    if (restrictedElements.includes(type) && req.user.plan === 'free') {
      return res.status(403).json({
        error: 'Elemento no disponible en plan gratuito',
        upgrade: 'Actualiza a Pro o Premium para usar este elemento'
      });
    }

    let finalOrder = order_position;
    if (finalOrder === undefined) {
      const maxOrderResult = await pool.query(
        'SELECT COALESCE(MAX(order_position), 0) + 1 as next_order FROM elementos WHERE project_id = $1',
        [projectId]
      );
      finalOrder = maxOrderResult.rows[0].next_order;
    }

    const result = await pool.query(
      'INSERT INTO elementos (project_id, type, settings, order_position) VALUES ($1, $2, $3, $4) RETURNING *',
      [projectId, type, JSON.stringify(settings), finalOrder]
    );

    res.status(201).json({
      message: 'Elemento agregado exitosamente',
      element: result.rows[0]
    });
  } catch (error) {
    console.error('Error agregando elemento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar elemento
app.put('/api/elements/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { type, settings, order_position } = req.body;
  try {
    const elementCheck = await pool.query(`
      SELECT e.* FROM elementos e 
      JOIN proyectos p ON e.project_id = p.id 
      WHERE e.id = $1 AND p.user_id = $2
    `, [id, req.user.id]);
    if (elementCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    const updates = [];
    const values = [];
    let paramCounter = 1;
    if (type) {
      const validTypes = ['text', 'image', 'button', 'form', 'gallery', 'menu'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Tipo de elemento no válido' });
      }
      updates.push(`type = $${paramCounter++}`);
      values.push(type);
    }
    if (settings) {
      updates.push(`settings = $${paramCounter++}`);
      values.push(JSON.stringify(settings));
    }
    if (order_position !== undefined) {
      updates.push(`order_position = $${paramCounter++}`);
      values.push(order_position);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE elementos SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`;
    const result = await pool.query(query, values);

    res.json({
      message: 'Elemento actualizado exitosamente',
      element: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando elemento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar elemento
app.delete('/api/elements/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      DELETE FROM elementos 
      WHERE id = $1 AND project_id IN (
        SELECT id FROM proyectos WHERE user_id = $2
      ) RETURNING id
    `, [id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }
    res.json({ message: 'Elemento eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando elemento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// RUTAS DE PAGOS 
app.post('/api/payments/create-intent', authenticateToken, async (req, res) => {
  const { plan, amount } = req.body;
  try {
    const validPlans = ['pro', 'premium'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Plan no válido para pago' });
    }

    const planPrices = { pro: 9.99, premium: 19.99 };
    if (amount !== planPrices[plan]) {
      return res.status(400).json({ error: 'Monto no válido para el plan seleccionado' });
    }

    const paymentResult = await pool.query(
      'INSERT INTO pagos (user_id, plan, amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, plan, amount, 'pending']
    );

    const payment = paymentResult.rows[0];

    res.status(201).json({
      message: 'Intención de pago creada',
      payment_id: payment.id,
      client_secret: `pi_${payment.id}_secret_demo`,
      amount: payment.amount,
      plan: payment.plan
    });
  } catch (error) {
    console.error('Error creando intención de pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Confirmar pago
app.post('/api/payments/:id/confirm', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { stripe_payment_id } = req.body;
  try {
    const paymentCheck = await pool.query(
      'SELECT * FROM pagos WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    const payment = paymentCheck.rows[0];
    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'El pago ya fue procesado' });
    }

    await pool.query('BEGIN');
    try {
      await pool.query(
        'UPDATE pagos SET status = $1, stripe_payment_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        ['completed', stripe_payment_id || `demo_${Date.now()}`, id]
      );

      await pool.query(
        'UPDATE usuarios SET plan = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [payment.plan, req.user.id]
      );

      await pool.query('COMMIT');

      res.json({
        message: 'Pago confirmado exitosamente',
        new_plan: payment.plan,
        amount: payment.amount
      });
    } catch (transactionError) {
      await pool.query('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Error confirmando pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener historial de pagos
app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, plan, amount, status, created_at FROM pagos WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ payments: result.rows });
  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Guardar proyecto completo (solo Pro/Premium)
app.post('/api/projects/:id/save', authenticateToken, requirePlan(['pro', 'premium']), async (req, res) => {
  const { id } = req.params;
  const { elements } = req.body;
  try {
    const projectCheck = await pool.query(
      'SELECT id FROM proyectos WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    await pool.query('BEGIN');
    try {
      await pool.query('DELETE FROM elementos WHERE project_id = $1', [id]);

      if (elements && elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          await pool.query(
            'INSERT INTO elementos (project_id, type, settings, order_position) VALUES ($1, $2, $3, $4)',
            [id, element.type, JSON.stringify(element.settings || {}), i + 1]
          );
        }
      }

      await pool.query(
        'UPDATE proyectos SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      await pool.query('COMMIT');
      res.json({ message: 'Proyecto guardado exitosamente en la nube' });
    } catch (transactionError) {
      await pool.query('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Error guardando proyecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Exportar proyecto (solo Pro/Premium)
app.get('/api/projects/:id/export', authenticateToken, requirePlan(['pro', 'premium']), async (req, res) => {
  const { id } = req.params;
  try {
    const projectResult = await pool.query(
      'SELECT name FROM proyectos WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    const elementsResult = await pool.query(
      'SELECT type, settings FROM elementos WHERE project_id = $1 ORDER BY order_position ASC',
      [id]
    );

    const project = projectResult.rows[0];
    const elements = elementsResult.rows;
    const html = generateHTML(project.name, elements);

    res.json({
      project: project.name,
      html: html,
      elements_count: elements.length,
      export_date: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error exportando proyecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

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
    console.error('Error en búsqueda:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Duplicar proyecto
app.post('/api/projects/:id/duplicate', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('BEGIN');

    const originalProject = await pool.query(
      'SELECT * FROM proyectos WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (originalProject.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const newName = `${originalProject.rows[0].name} (Copia)`;
    const newProject = await pool.query(
      'INSERT INTO proyectos (name, user_id) VALUES ($1, $2) RETURNING *',
      [newName, req.user.id]
    );

    await pool.query(`
      INSERT INTO elementos (project_id, type, settings, order_position)
      SELECT $1, type, settings, order_position 
      FROM elementos 
      WHERE project_id = $2
      ORDER BY order_position
    `, [newProject.rows[0].id, id]);

    await pool.query('COMMIT');

    console.log(`Proyecto duplicado: ${newName} por ${req.user.email}`);

    res.status(201).json({
      message: 'Proyecto duplicado exitosamente',
      project: newProject.rows[0]
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error duplicando proyecto:', error);
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
    console.error('Error obteniendo plantillas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear proyecto desde plantilla
app.post('/api/templates/:templateId/create', authenticateToken, requirePlan(['pro', 'premium']), async (req, res) => {
  const { templateId } = req.params;
  const { project_name } = req.body;

  try {
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

    const project = await pool.query(
      'INSERT INTO proyectos (name, user_id) VALUES ($1, $2) RETURNING *',
      [template.name, req.user.id]
    );

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
    console.error('Error creando desde plantilla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Estadísticas avanzadas (solo Premium)
app.get('/api/stats', authenticateToken, requirePlan(['premium']), async (req, res) => {
  try {
    const [overviewResult, elementsResult, activityResult, performanceResult] = await Promise.all([
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

      pool.query(`
        SELECT e.type, COUNT(*) as count, 
               AVG(LENGTH(e.settings::text)) as avg_complexity
        FROM elementos e
        JOIN proyectos p ON e.project_id = p.id
        WHERE p.user_id = $1
        GROUP BY e.type
        ORDER BY count DESC
      `, [req.user.id]),

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
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = [];

    const projectCount = await pool.query(
      'SELECT COUNT(*) FROM proyectos WHERE user_id = $1',
      [req.user.id]
    );

    const count = parseInt(projectCount.rows[0].count);
    const limits = { free: 3, pro: 50, premium: 999 };
    const currentLimit = limits[req.user.plan];

    if (count >= currentLimit * 0.8) {
      notifications.push({
        id: 'project_limit_warning',
        type: 'warning',
        message: `Has usado ${count}/${currentLimit} proyectos disponibles`,
        action_url: '/plans',
        created_at: new Date().toISOString()
      });
    }

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
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Función para generar HTML
function generateHTML(projectName, elements) {
  const elementsHTML = elements.map(element => {
    const settings = element.settings || {};
    switch (element.type) {
      case 'text':
        return `<div class="text-element">
          <h2>${settings.title || 'Título'}</h2>
          <p>${settings.content || 'Contenido de texto'}</p>
        </div>`;
      case 'button':
        return `<button class="btn-element" onclick="location.href='${settings.link || '#'}'">${settings.text || 'Botón'}</button>`;
      case 'image':
        return `<div class="image-element">
          <img src="${settings.src || '/placeholder.jpg'}" alt="${settings.alt || 'Imagen'}" />
        </div>`;
      case 'form':
        return `<form class="form-element">
          <div class="security-badge"> Protegido por WebShield</div>
          <input type="text" placeholder="Nombre" required />
          <input type="email" placeholder="Email" required />
          <button type="submit">Enviar</button>
        </form>`;
      case 'menu':
        return `<nav class="menu-element">
          <a href="#home">Inicio</a>
          <a href="#services">Servicios</a>
          <a href="#contact">Contacto</a>
        </nav>`;
      case 'gallery':
        return `<div class="gallery-element">
          <div class="gallery-grid">
            ${Array(6).fill().map((_, i) => `<div class="gallery-item"><img src="/gallery-${i + 1}.jpg" alt="Imagen ${i + 1}" /></div>`).join('')}
          </div>
        </div>`;
      default:
        return `<div class="unknown-element">Elemento: ${element.type}</div>`;
    }
  }).join('\n    ');

  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName} - WebShield</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6; color: #333; background: #f8fafc;
        }
        .container { 
            max-width: 1200px; margin: 0 auto; padding: 20px; 
            background: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border-radius: 12px; margin-top: 20px;
        }
        .webshield-header {
            text-align: center; padding: 40px 20px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white; border-radius: 8px; margin-bottom: 40px;
        }
        .text-element { margin: 30px 0; padding: 20px; }
        .text-element h2 { color: #3b82f6; margin-bottom: 15px; }
        .btn-element { 
            background: #3b82f6; color: white; padding: 15px 30px; 
            border: none; border-radius: 8px; cursor: pointer;
            font-size: 16px; margin: 20px 0; transition: background 0.3s;
        }
        .btn-element:hover { background: #2563eb; }
        .image-element { margin: 30px 0; text-align: center; }
        .image-element img { max-width: 100%; height: auto; border-radius: 8px; }
        .form-element { 
            margin: 30px 0; padding: 30px; background: #f9fafb; 
            border: 2px solid #e5e7eb; border-radius: 12px;
        }
        .security-badge {
            background: #10b981; color: white; padding: 8px 16px;
            border-radius: 20px; font-size: 12px; display: inline-block;
            margin-bottom: 20px;
        }
        .form-element input {
            width: 100%; padding: 12px; margin: 10px 0;
            border: 2px solid #d1d5db; border-radius: 6px; font-size: 16px;
        }
        .form-element button {
            background: #3b82f6; color: white; padding: 12px 24px;
            border: none; border-radius: 6px; cursor: pointer; font-size: 16px;
        }
        .menu-element { 
            background: #1f2937; padding: 20px; border-radius: 8px; margin: 30px 0;
        }
        .menu-element a { 
            color: white; text-decoration: none; margin: 0 20px; 
            padding: 10px 15px; border-radius: 4px; transition: background 0.3s;
        }
        .menu-element a:hover { background: #374151; }
        .gallery-element { margin: 30px 0; }
        .gallery-grid { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
        }
        .gallery-item { 
            background: #e5e7eb; height: 200px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center; color: #6b7280;
        }
        .webshield-footer {
            text-align: center; margin-top: 60px; padding: 30px;
            background: #f0f9ff; border-radius: 8px; color: #3b82f6;
        }
        @media (max-width: 768px) {
            .container { margin: 10px; padding: 15px; }
            .menu-element a { display: block; margin: 5px 0; }
            .gallery-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="webshield-header">
            <h1>🛡️ ${projectName}</h1>
            <p>Página web creada con WebShield - Constructor seguro</p>
        </div>
        ${elementsHTML}
        <div class="webshield-footer">
            <p> Creado con WebShield - Constructor web seguro </p>
        </div>
    </div>
    <script>
        console.log('🛡️ WebShield Security: ACTIVO');
        document.addEventListener('DOMContentLoaded', function() {
            const inputs = document.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', function() {
                    this.value = this.value.replace(/<script[^>]*>.*?<\\/script>/gi, '');
                });
            });
        });
    </script>
</body>
</html>`;
}

// ==================== MANEJO DE ERRORES ====================
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// ==================== INICIALIZACIÓN ====================
async function checkDatabaseConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL establecida');

    // Crear tablas automáticamente
    await createTablesIfNotExist();

  } catch (error) {
    console.error(' Error conectando a PostgreSQL:', error);
    process.exit(1);
  }
}

app.listen(PORT, async () => {
  await checkDatabaseConnection();
  console.log(` WebShield Backend ejecutándose en puerto ${PORT}`);
  console.log(` Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Seguridad: JWT activo`);
});

process.on('SIGTERM', async () => {
  console.log(' Cerrando servidor...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log(' Cerrando servidor...');
  await pool.end();
  process.exit(0);
});

module.exports = app;
