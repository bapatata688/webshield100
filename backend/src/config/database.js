const { Pool } = require('pg');

// Configuración del pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    "postgresql://webshield100_user:nBXSSmtz0yjIoabpbUajZxYMo5A5l8jD@dpg-d353kte3jp1c73env300-a.oregon-postgres.render.com/webshield100",
  ssl: {
    rejectUnauthorized: false,
  },
});

// Función para crear tablas automáticamente si no existiesen.
async function createTablesIfNotExist() {
  try {
    // Tabla usuarios
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

    // Tabla proyectos
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

    // Tabla elementos
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

    // Tabla pagos
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

    console.log(' Tablas verificadas/creadas exitosamente');
  } catch (error) {
    console.error(' Error creando tablas:', error);
    throw error;
  }
}

// Función para verificar conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return result.rows[0];
  } catch (error) {
    console.error('Error testeando base de datos:', error);
    throw error;
  }
}

module.exports = {
  pool,
  createTablesIfNotExist,
  testConnection
};
