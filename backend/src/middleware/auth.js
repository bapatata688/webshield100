const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { JWT_SECRET, ERROR_MESSAGES } = require('../config/constants');

// Middleware de autenticación JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: ERROR_MESSAGES.TOKEN_MISSING,
      code: 'TOKEN_MISSING'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar que el usuario aun existe y está activo
    const userResult = await pool.query(
      'SELECT id, email, plan FROM usuarios WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: ERROR_MESSAGES.USER_INVALID,
        code: 'USER_INVALID'
      });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: ERROR_MESSAGES.TOKEN_INVALID,
        code: 'TOKEN_INVALID'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        error: ERROR_MESSAGES.TOKEN_EXPIRED,
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({
      error: 'Error de autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware para verificar plan requerido
const requirePlan = (allowedPlans) => {
  return (req, res, next) => {
    if (!allowedPlans.includes(req.user.plan)) {
      return res.status(403).json({
        error: ERROR_MESSAGES.INSUFFICIENT_PLAN,
        required: allowedPlans,
        current: req.user.plan,
        upgrade_url: '/api/plans'
      });
    }
    next();
  };
};

// Middleware para verificar que el usuario es el propietario del proyecto
const verifyProjectOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const projectResult = await pool.query(
      'SELECT id FROM proyectos WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        error: ERROR_MESSAGES.PROJECT_NOT_FOUND,
        code: 'PROJECT_NOT_FOUND'
      });
    }

    next();
  } catch (error) {
    console.error('Error verificando propiedad del proyecto:', error);
    res.status(500).json({
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware para verificar límites por plan
const checkPlanLimits = (resource) => {
  return async (req, res, next) => {
    try {
      const { PLAN_LIMITS } = require('../config/constants');
      const userLimits = PLAN_LIMITS[req.user.plan];

      if (resource === 'projects') {
        const projectCount = await pool.query(
          'SELECT COUNT(*) FROM proyectos WHERE user_id = $1',
          [req.user.id]
        );
        const count = parseInt(projectCount.rows[0].count);

        if (count >= userLimits.projects) {
          return res.status(403).json({
            error: `Límite de proyectos alcanzado para plan ${req.user.plan}`,
            limit: userLimits.projects,
            current: count,
            upgrade_url: '/api/plans'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Error verificando límites del plan:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requirePlan,
  verifyProjectOwnership,
  checkPlanLimits
};
