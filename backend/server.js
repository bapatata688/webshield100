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
app.use(cors());
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

    console.log(`✅ Nuevo usuario registrado: ${user.email} (Plan: ${user.plan})`);

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
    // Buscar usuario
    const result = await pool.query(
      'SELECT id, email, password, plan FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      console.log(`⚠️  Intento de login con email inexistente: ${email}`);
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log(`⚠️  Login fallido para ${email}`);
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

// ==================== RUTAS DE PAGOS ====================
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

// ==================== RUTAS ADICIONALES ====================
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
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error);
    process.exit(1);
  }
}

app.listen(PORT, async () => {
  await checkDatabaseConnection();
  console.log(`🚀 WebShield Backend ejecutándose en puerto ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🛡️ Seguridad: JWT activo`);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Cerrando servidor...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Cerrando servidor...');
  await pool.end();
  process.exit(0);
});

module.exports = app;
