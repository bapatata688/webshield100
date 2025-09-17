-- Crear base de datos
CREATE DATABASE webshield;

-- Usar la base de datos
\c webshield;

-- Extensión para UUIDs (opcional, pero recomendada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de proyectos
CREATE TABLE proyectos (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de elementos
CREATE TABLE elementos (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'image', 'button', 'form', 'gallery', 'menu')),
    settings JSONB DEFAULT '{}',
    order_position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

-- Tabla de pagos
CREATE TABLE pagos (
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

-- Índices para optimizar consultas
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_proyectos_user_id ON proyectos(user_id);
CREATE INDEX idx_elementos_project_id ON elementos(project_id);
CREATE INDEX idx_elementos_order ON elementos(project_id, order_position);
CREATE INDEX idx_pagos_user_id ON pagos(user_id);
CREATE INDEX idx_pagos_status ON pagos(status);

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proyectos_updated_at BEFORE UPDATE ON proyectos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_elementos_updated_at BEFORE UPDATE ON elementos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pagos_updated_at BEFORE UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos de ejemplo para testing
INSERT INTO usuarios (email, password, plan) VALUES 
('admin@webshield.com', '$2b$10$rOzJg.hXnVWk.X5KmzZ5/eY5rXyE0JKMT.L9F/5dZ8X9XqUYUmHdW', 'premium'),
('demo@webshield.com', '$2b$10$rOzJg.hXnVWk.X5KmzZ5/eY5rXyE0JKMT.L9F/5dZ8X9XqUYUmHdW', 'free'),
('pro@webshield.com', '$2b$10$rOzJg.hXnVWk.X5KmzZ5/eY5rXyE0JKMT.L9F/5dZ8X9XqUYUmHdW', 'pro');

INSERT INTO proyectos (name, user_id) VALUES 
('Mi Primera Página', 1),
('Sitio de Prueba', 2),
('Proyecto Profesional', 3);

INSERT INTO elementos (project_id, type, settings, order_position) VALUES 
(1, 'text', '{"content": "Bienvenido a WebShield", "style": {"fontSize": "24px", "color": "#3B82F6"}}', 1),
(1, 'button', '{"text": "Contáctanos", "link": "/contact", "style": {"backgroundColor": "#3B82F6"}}', 2),
(2, 'text', '{"content": "Demo de WebShield", "style": {"fontSize": "18px"}}', 1);

-- Mostrar estructura de tablas
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
