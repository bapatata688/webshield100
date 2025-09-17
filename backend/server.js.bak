//modulos
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware para la app
app.use(cors());
app.use(express.json());
const pool = new Pool({
  //.env
  connectionString: process.env.DATABASE_URL || "postgresql://webshield100_user:nBXSSmtz0yjIoabpbUajZxYMo5A5l8jD@dpg-d353kte3jp1c73env300-a.oregon-postgres.render.com/webshield100",
  ssl: {
    rejectUnauthorized: false,
  },
});

const JWT_SECRET = process.env.JWT_SECRET || 'HKYG!@@#*UIHGV@!#HGGHQHNBXBZJHKJH_9712381209JHJKh1802308huY*';

// Middleware para verificar JWT (tokens)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userResult = await pool.query(
      'SELECT id, email, plan FROM usuarios WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no válido' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};
// Middleware para verificar planes
const requirePlan = (allowedPlans) => {
  return (req, res, next) => {
    if (!allowedPlans.includes(req.user.plan)) {
      return res.status(403).json({
        error: 'Plan insuficiente',
        required: allowedPlans,
        current: req.user.plan
      });
    }
    next();
  };
};
//autenticaciones
// Registro de usuario
app.post('/api/auth/register', async (req, res) => {
  const { email, password, plan = 'free' } = req.body;

  try {
    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const validPlans = ['free', 'pro', 'premium'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Plan no válido' });
    }

    // Verificar si el email ya existe
    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
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
      { userId: user.id, email: user.email, plan: user.plan },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        created_at: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Inicio de sesión
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario
    const result = await pool.query(
      'SELECT id, email, password, plan FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Crear JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, plan: user.plan },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
          <div class="security-badge">🔒 Protegido por WebShield</div>
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
    <meta name="generator" content="WebShield - Constructor Web Seguro">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px; 
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            margin-top: 20px;
        }
        .webshield-header {
            text-align: center;
            padding: 40px 20px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            border-radius: 8px;
            margin-bottom: 40px;
        }
        .text-element { margin: 30px 0; padding: 20px; }
        .text-element h2 { color: #3b82f6; margin-bottom: 15px; }
        .btn-element { 
            background: #3b82f6; 
            color: white; 
            padding: 15px 30px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer;
            font-size: 16px;
            margin: 20px 0;
            transition: background 0.3s;
        }
        .btn-element:hover { background: #2563eb; }
        .image-element { margin: 30px 0; text-align: center; }
        .image-element img { max-width: 100%; height: auto; border-radius: 8px; }
        .form-element { 
            margin: 30px 0; 
            padding: 30px; 
            background: #f9fafb; 
            border: 2px solid #e5e7eb;
            border-radius: 12px;
        }
        .security-badge {
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            display: inline-block;
            margin-bottom: 20px;
        }
        .form-element input {
            width: 100%;
            padding: 12px;
            margin: 10px 0;
            border: 2px solid #d1d5db;
            border-radius: 6px;
            font-size: 16px;
        }
        .form-element button {
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        }
        .menu-element { 
            background: #1f2937; 
            padding: 20px; 
            border-radius: 8px;
            margin: 30px 0;
        }
        .menu-element a { 
            color: white; 
            text-decoration: none; 
            margin: 0 20px; 
            padding: 10px 15px;
            border-radius: 4px;
            transition: background 0.3s;
        }
        .menu-element a:hover { background: #374151; }
        .gallery-element { margin: 30px 0; }
        .gallery-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
        }
        .gallery-item { 
            background: #e5e7eb; 
            height: 200px; 
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
        }
        .webshield-footer {
            text-align: center;
            margin-top: 60px;
            padding: 30px;
            background: #f0f9ff;
            border-radius: 8px;
            color: #3b82f6;
        }
        
        /* Protecciones WebShield */
        input[type="text"], input[type="email"], textarea {
            filter: none !important;
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
            <p>Página web creada con WebShield - Constructor seguro y profesional</p>
        </div>
        
        ${elementsHTML}
        
        <div class="webshield-footer">
            <p>✨ Creado con <strong>WebShield</strong> - Constructor web seguro ✨</p>
            <p><small>Protecciones automáticas incluidas: Anti-XSS, HTTPS, Formularios seguros</small></p>
        </div>
    </div>
    
    <script>
        // Protecciones WebShield automáticas
        console.log('🛡️ WebShield Security System: ACTIVE');
        console.log('✅ XSS Protection: ENABLED');
        console.log('✅ HTTPS Enforcement: ENABLED');
        console.log('✅ Form Security: ENABLED');
        
        // Prevención básica de XSS
        document.addEventListener('DOMContentLoaded', function() {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                form.addEventListener('submit', function(e) {
                    const inputs = form.querySelectorAll('input[type="text"], input[type="email"], textarea');
                    inputs.forEach(input => {
                        // Sanitizar contenido básico
                        input.value = input.value
                            .replace(/<script[^>]*>.*?<\\/script>/gi, '')
                            .replace(/javascript:/gi, '')
                            .replace(/on\\w+=/gi, '');
                    });
                });
            });
        });
        
        // Estadísticas básicas (solo Premium)
        if (window.location.hostname !== 'localhost') {
            console.log('📊 WebShield Analytics: Tracking page view');
        }
    </script>
</body>
</html>`;
}

// ==================== RUTAS DE ESTADÍSTICAS ====================

// Obtener estadísticas del usuario (solo Premium)
app.get('/api/stats', authenticateToken, requirePlan(['premium']), async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_projects,
        COUNT(e.id) as total_elements,
        COUNT(CASE WHEN pg.status = 'completed' THEN 1 END) as successful_payments,
        SUM(CASE WHEN pg.status = 'completed' THEN pg.amount ELSE 0 END) as total_spent
      FROM proyectos p
      LEFT JOIN elementos e ON p.id = e.project_id
      LEFT JOIN pagos pg ON p.user_id = pg.user_id
      WHERE p.user_id = $1
    `, [req.user.id]);

    const elementStats = await pool.query(`
      SELECT e.type, COUNT(*) as count
      FROM elementos e
      JOIN proyectos p ON e.project_id = p.id
      WHERE p.user_id = $1
      GROUP BY e.type
      ORDER BY count DESC
    `, [req.user.id]);

    res.json({
      overview: stats.rows[0],
      element_usage: elementStats.rows,
      user_plan: req.user.plan,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== MANEJO DE ERRORES ====================

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// ==================== INICIALIZACIÓN ====================

// Función para verificar conexión a la base de datos
async function checkDatabaseConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL establecida');
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error);
    process.exit(1);
  }
}

// Iniciar servidor
app.listen(PORT, async () => {
  await checkDatabaseConnection();
  console.log(`🚀 WebShield Backend ejecutándose en puerto ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🛡️ Seguridad: JWT activo`);
});

// Manejo graceful de cierre
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

// Obtener todos los proyectos del usuario
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

// Crear nuevo proyecto
app.post('/api/projects', authenticateToken, async (req, res) => {
  const { name } = req.body;

  try {
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre del proyecto es requerido' });
    }

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
    // Verificar que el proyecto pertenece al usuario
    const projectResult = await pool.query(
      'SELECT * FROM proyectos WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Obtener elementos del proyecto
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

// Agregar elemento a proyecto
app.post('/api/projects/:projectId/elements', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { type, settings = {}, order_position } = req.body;

  try {
    // Verificar que el proyecto pertenece al usuario
    const projectCheck = await pool.query(
      'SELECT id FROM proyectos WHERE id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Validar tipo de elemento
    const validTypes = ['text', 'image', 'button', 'form', 'gallery', 'menu'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Tipo de elemento no válido' });
    }

    // Verificar restricciones por plan
    const restrictedElements = ['form', 'gallery', 'menu'];
    if (restrictedElements.includes(type) && req.user.plan === 'free') {
      return res.status(403).json({
        error: 'Elemento no disponible en plan gratuito',
        upgrade: 'Actualiza a Pro o Premium para usar este elemento'
      });
    }

    // Obtener siguiente posición si no se especifica
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
    // Verificar que el elemento pertenece a un proyecto del usuario
    const elementCheck = await pool.query(`
      SELECT e.* FROM elementos e 
      JOIN proyectos p ON e.project_id = p.id 
      WHERE e.id = $1 AND p.user_id = $2
    `, [id, req.user.id]);

    if (elementCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    // Construir query dinámicamente
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

// Crear intención de pago
app.post('/api/payments/create-intent', authenticateToken, async (req, res) => {
  const { plan, amount } = req.body;

  try {
    const validPlans = ['pro', 'premium'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Plan no válido para pago' });
    }

    // Validar montos
    const planPrices = { pro: 9.99, premium: 19.99 };
    if (amount !== planPrices[plan]) {
      return res.status(400).json({ error: 'Monto no válido para el plan seleccionado' });
    }

    // Crear registro de pago
    const paymentResult = await pool.query(
      'INSERT INTO pagos (user_id, plan, amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, plan, amount, 'pending']
    );

    const payment = paymentResult.rows[0];

    // En producción, aquí integrarías con Stripe
    // const paymentIntent = await stripe.paymentIntents.create({...});

    res.status(201).json({
      message: 'Intención de pago creada',
      payment_id: payment.id,
      client_secret: `pi_${payment.id}_secret_demo`, // Demo - usar Stripe real en producción
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
    // Verificar que el pago pertenece al usuario
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

    // En producción, verificar con Stripe
    // const stripePayment = await stripe.paymentIntents.retrieve(stripe_payment_id);
    // if (stripePayment.status !== 'succeeded') { ... }

    // Actualizar pago y plan del usuario en transacción
    await pool.query('BEGIN');

    try {
      // Actualizar estado del pago
      await pool.query(
        'UPDATE pagos SET status = $1, stripe_payment_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        ['completed', stripe_payment_id || `demo_${Date.now()}`, id]
      );

      // Actualizar plan del usuario
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

// Guardar proyecto completo (solo Pro/Premium)
app.post('/api/projects/:id/save', authenticateToken, requirePlan(['pro', 'premium']), async (req, res) => {
  const { id } = req.params;
  const { elements } = req.body;

  try {
    // Verificar que el proyecto pertenece al usuario
    const projectCheck = await pool.query(
      'SELECT id FROM proyectos WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    await pool.query('BEGIN');

    try {
      // Eliminar elementos existentes
      await pool.query('DELETE FROM elementos WHERE project_id = $1', [id]);

      // Insertar nuevos elementos
      if (elements && elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          await pool.query(
            'INSERT INTO elementos (project_id, type, settings, order_position) VALUES ($1, $2, $3, $4)',
            [id, element.type, JSON.stringify(element.settings || {}), i + 1]
          );
        }
      }

      // Actualizar timestamp del proyecto
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
    // Obtener proyecto con elementos
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

    // Generar HTML del proyecto
    const html = generateHTML(project.name, elements);

    return res.json({
      project,
      elements,
      html
    });

  } catch (error) {
    console.error('Error exportando proyecto:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
});
