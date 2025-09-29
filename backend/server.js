const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { pool, createTablesIfNotExist } = require('./src/config/database');
const { PORT } = require('./src/config/constants');
const securityMiddleware = require('./src/middleware/security');

const authRoutes = require('./src/routes/authRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const elementRoutes = require('./src/routes/elementRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const templateRoutes = require('./src/routes/templateRoutes');

const app = express();
app.set('trust proxy', 1);

// 1. CORS PRIMERO (solo una vez)
app.use(cors({
  origin: [
    'https://webshield100.onrender.com',
    'http://localhost:3000',
    'https://webshield100-fronted.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Body parser SEGUNDO
app.use(express.json({ limit: '10mb' }));

// 3. Security middleware TERCERO (solo una vez)
securityMiddleware(app);

// Health check
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

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/elements', elementRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/templates', templateRoutes);

// Manejo de errores
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

async function checkDatabaseConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Conexion a PostgreSQL establecida');
    await createTablesIfNotExist();
  } catch (error) {
    console.error('Error conectando a PostgreSQL:', error);
    process.exit(1);
  }
}

app.listen(PORT, async () => {
  await checkDatabaseConnection();
  console.log(`WebShield Backend ejecutandose en puerto ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Seguridad: JWT activo`);
});

process.on('SIGTERM', async () => {
  console.log('Cerrando servidor...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Cerrando servidor...');
  await pool.end();
  process.exit(0);
});

module.exports = app;
