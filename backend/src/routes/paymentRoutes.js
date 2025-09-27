const express = require('express');
const router = express.Router();

// Importar controladores y middlewares
const PaymentController = require('../controllers/paymentController');
const { authenticateToken, requirePlan } = require('../middleware/auth');
const { schemas, validateSchema, validateParams, validateParamsSchema } = require('../models/schemas');

// ==================== RUTAS DE PAGOS ====================

// GET /api/payments/plans - Obtener información de planes disponibles
router.get('/plans', 
  authenticateToken,
  PaymentController.getAvailablePlans
);

// POST /api/payments/create-intent - Crear intención de pago
router.post('/create-intent', 
  authenticateToken,
  validateSchema(schemas.payment),
  PaymentController.createPaymentIntent
);

// POST /api/payments/:id/confirm - Confirmar pago
router.post('/:id/confirm', 
  authenticateToken,
  validateParamsSchema(validateParams.id),
  validateSchema(schemas.paymentConfirm),
  PaymentController.confirmPayment
);

// GET /api/payments - Obtener historial de pagos del usuario
router.get('/', 
  authenticateToken,
  PaymentController.getPaymentHistory
);

// POST /api/payments/:id/cancel - Cancelar pago pendiente
router.post('/:id/cancel', 
  authenticateToken,
  validateParamsSchema(validateParams.id),
  PaymentController.cancelPayment
);

// GET /api/payments/:id/invoice - Generar factura de pago
router.get('/:id/invoice', 
  authenticateToken,
  validateParamsSchema(validateParams.id),
  PaymentController.generateInvoice
);

module.exports = router;
