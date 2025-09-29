
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { JWT_SECRET, ERROR_MESSAGES, SECURITY_CONFIG } = require('../config/constants');

class AuthController {
  // Registro de usuario
  static async register(req, res) {
    const { email, password, plan } = req.body;

    try {
      // Verificar si el email ya existe
      const existingUser = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: ERROR_MESSAGES.EMAIL_EXISTS,
          code: 'EMAIL_EXISTS'
        });
      }

      // Hash robusto de la contraseña
      const hashedPassword = await bcrypt.hash(password, SECURITY_CONFIG.saltRounds);

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
        { expiresIn: SECURITY_CONFIG.jwtExpiration }
      );

      console.log(`Nuevo usuario registrado: ${user.email} (Plan: ${user.plan})`);

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
      console.error('Error en registro:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Login de usuario
  static async login(req, res) {
    const { email, password } = req.body;

    try {
      // Buscar usuario
      const result = await pool.query(
        'SELECT id, email, password, plan FROM usuarios WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        console.log(`Intento de login con email inexistente: ${email}`);
        return res.status(401).json({
          error: ERROR_MESSAGES.INVALID_CREDENTIALS,
          code: 'INVALID_CREDENTIALS'
        });
      }

      const user = result.rows[0];

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        console.log(`Login fallido para ${email}`);
        return res.status(401).json({
          error: ERROR_MESSAGES.INVALID_CREDENTIALS,
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
        { expiresIn: SECURITY_CONFIG.jwtExpiration }
      );

      console.log(`Login exitoso: ${user.email}`);

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
      console.error('Error en login:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Obtener perfil del usuario
  static async getProfile(req, res) {
    try {
      const result = await pool.query(
        'SELECT id, email, plan, created_at FROM usuarios WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({ user: result.rows[0] });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Actualizar perfil del usuario
  static async updateProfile(req, res) {
    const { email } = req.body;

    try {
      if (email && email !== req.user.email) {
        // Verificar si el nuevo email ya existe
        const existingUser = await pool.query(
          'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
          [email.toLowerCase(), req.user.id]
        );

        if (existingUser.rows.length > 0) {
          return res.status(409).json({
            error: ERROR_MESSAGES.EMAIL_EXISTS,
            code: 'EMAIL_EXISTS'
          });
        }
      }

      const result = await pool.query(
        'UPDATE usuarios SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, plan, created_at, updated_at',
        [email ? email.toLowerCase() : req.user.email, req.user.id]
      );

      res.json({
        message: 'Perfil actualizado exitosamente',
        user: result.rows[0]
      });

    } catch (error) {
      console.error('Error actualizando perfil:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Cambiar contraseña
  static async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;

    try {
      // Obtener la contraseña actual del usuario
      const userResult = await pool.query(
        'SELECT password FROM usuarios WHERE id = $1',
        [req.user.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password);

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Contraseña actual incorrecta',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Hash de la nueva contraseña
      const hashedNewPassword = await bcrypt.hash(newPassword, SECURITY_CONFIG.saltRounds);

      // Actualizar contraseña
      await pool.query(
        'UPDATE usuarios SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedNewPassword, req.user.id]
      );

      console.log(` Contraseña cambiada para usuario: ${req.user.email}`);

      res.json({
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Obtener notificaciones del usuario
  static async getNotifications(req, res) {
    try {
      const notifications = [];

      // Verificar límites de proyectos
      const projectCount = await pool.query(
        'SELECT COUNT(*) FROM proyectos WHERE user_id = $1',
        [req.user.id]
      );

      const count = parseInt(projectCount.rows[0].count);
      const { PLAN_LIMITS } = require('../config/constants');
      const currentLimit = PLAN_LIMITS[req.user.plan].projects;

      if (count >= currentLimit * 0.8) {
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
      console.error('Error obteniendo notificaciones:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

module.exports = AuthController;
