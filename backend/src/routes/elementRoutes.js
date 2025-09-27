const express = require('express');
const router = express.Router();

// Importar controladores y middlewares
const ElementController = require('../controllers/elementController');
const { authenticateToken, verifyProjectOwnership } = require('../middleware/auth');
const { schemas, validateSchema, validateParams, validateParamsSchema } = require('../models/schemas');

// ==================== RUTAS DE ELEMENTOS ====================

// POST /api/elements/projects/:projectId - Crear nuevo elemento en un proyecto
router.post('/projects/:projectId', 
  authenticateToken,
  validateParamsSchema(validateParams.projectId),
  validateSchema(schemas.element),
  ElementController.createElement
);

// GET /api/elements/projects/:projectId - Obtener elementos de un proyecto
router.get('/projects/:projectId', 
  authenticateToken,
  validateParamsSchema(validateParams.projectId),
  ElementController.getProjectElements
);

// PUT /api/elements/:id - Actualizar elemento específico
router.put('/:id', 
  authenticateToken,
  validateParamsSchema(validateParams.id),
  validateSchema(schemas.elementUpdate),
  ElementController.updateElement
);

// DELETE /api/elements/:id - Eliminar elemento específico
router.delete('/:id', 
  authenticateToken,
  validateParamsSchema(validateParams.id),
  ElementController.deleteElement
);

// POST /api/elements/:id/duplicate - Duplicar elemento
router.post('/:id/duplicate', 
  authenticateToken,
  validateParamsSchema(validateParams.id),
  ElementController.duplicateElement
);

// POST /api/elements/projects/:projectId/reorder - Reordenar elementos en un proyecto
router.post('/projects/:projectId/reorder', 
  authenticateToken,
  validateParamsSchema(validateParams.projectId),
  ElementController.reorderElements
);

module.exports = router;
