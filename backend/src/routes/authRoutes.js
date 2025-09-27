const express = require('express');
const router = express.Router();

// Importar controladores y middlewares
const AuthController = require('../controllers/authController');
const { loginLimiter, registerLimiter } = require('../middleware/security');
const { authenticateToken } = require('../middleware/auth');
const { schemas, validateSchema } = require('../models/schemas');

// ==================== RUTAS PÚBLICAS ====================

// POST /api/auth/register - Registro de usuario
router.post('/register', 
  registerLimiter, 
  validateSchema(schemas.register), 
  AuthController.register
);

// POST /api/auth/login - Inicio de sesión
router.post('/login', 
  loginLimiter, 
  validateSchema(schemas.login), 
  AuthController.login
);

// ==================== RUTAS PROTEGIDAS ====================

// GET /api/auth/profile - Obtener perfil del usuario
router.get('/profile', 
  authenticateToken, 
  AuthController.getProfile
);

// PUT /api/auth/profile - Actualizar perfil del usuario
router.put('/profile', 
  authenticateToken,
  validateSchema(schemas.profileUpdate || schemas.register.fork(['email'], { optional: true })),
  AuthController.updateProfile
);

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password', 
  authenticateToken,
  validateSchema(schemas.changePassword || {
    currentPassword: schemas.register.extract('password'),
    newPassword: schemas.register.extract('password')
  }),
  AuthController.changePassword
);

// GET /api/auth/notifications - Obtener notificaciones del usuario
router.get('/notifications', 
  authenticateToken, 
  AuthController.getNotifications
);

// ==================== RUTAS DE VERIFICACIÓN ====================

// GET /api/auth/verify-token - Verificar validez del token
router.get('/verify-token', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      plan: req.user.plan
    },
    message: 'Token válido'
  });
});

// POST /api/auth/refresh-token - Refrescar token (si se implementa)
router.post('/refresh-token', authenticateToken, (req, res) => {
  // En una implementación real, aquí se generaría un nuevo token
  res.json({
    message: 'Funcionalidad de refresh token no implementada en esta versión',
    current_token_valid: true
  });
});

module.exports = router;
