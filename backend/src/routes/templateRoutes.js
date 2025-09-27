const express = require('express');
const router = express.Router();

const TemplateController = require('../controllers/templateController');
const { authenticateToken, requirePlan } = require('../middleware/auth');
const { schemas, validateSchema, validateParams, validateParamsSchema } = require('../models/schemas');

// GET /api/templates - Obtener plantillas disponibles
router.get('/', 
  authenticateToken,
  requirePlan(['pro', 'premium']),
  TemplateController.getTemplates
);

// POST /api/templates/:templateId/create - Crear proyecto desde plantilla
router.post('/:templateId/create', 
  authenticateToken,
  requirePlan(['pro', 'premium']),
  validateParamsSchema(validateParams.templateId),
  validateSchema(schemas.template),
  TemplateController.createFromTemplate
);

// GET /api/templates/stats - Estadísticas avanzadas (solo Premium)
router.get('/stats', 
  authenticateToken,
  requirePlan(['premium']),
  TemplateController.getAdvancedStats
);

module.exports = router;
