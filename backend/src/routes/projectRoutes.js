const express = require('express');
const router = express.Router();

// Importar controladores y middlewares
const ProjectController = require('../controllers/projectController');
const { authenticateToken, requirePlan, verifyProjectOwnership, checkPlanLimits } = require('../middleware/auth');
const { schemas, validateSchema, validateParams, validateParamsSchema, validateQuery, validateQuerySchema } = require('../models/schemas');

// ==================== RUTAS DE PROYECTOS ====================

// GET /api/projects - Obtener todos los proyectos del usuario
router.get('/',
  authenticateToken,
  ProjectController.getAllProjects
)

// POST /api/projects - Crear nuevo proyecto
router.post('/',
  authenticateToken,
  checkPlanLimits('projects'),
  validateSchema(schemas.project),
  ProjectController.createProject
);

// GET /api/projects/search - Buscar proyectos
router.get('/search',
  authenticateToken,
  validateQuerySchema(validateQuery.search),
  ProjectController.searchProjects
);

// GET /api/projects/:id - Obtener proyecto específico con elementos
router.get('/:id',
  authenticateToken,
  validateParamsSchema(validateParams.id),
  verifyProjectOwnership,
  ProjectController.getProject
);

// PUT /api/projects/:id - Actualizar proyecto
router.put('/:id',
  authenticateToken,
  validateParamsSchema(validateParams.id),
  validateSchema(schemas.projectUpdate),
  verifyProjectOwnership,
  ProjectController.updateProject
);

// DELETE /api/projects/:id - Eliminar proyecto
router.delete('/:id',
  authenticateToken,
  validateParamsSchema(validateParams.id),
  verifyProjectOwnership,
  ProjectController.deleteProject
);

// POST /api/projects/:id/duplicate - Duplicar proyecto
router.post('/:id/duplicate',
  authenticateToken,
  validateParamsSchema(validateParams.id),
  checkPlanLimits('projects'),
  verifyProjectOwnership,
  ProjectController.duplicateProject
);

// ==================== RUTAS AVANZADAS (PRO/PREMIUM) ====================

// POST /api/projects/:id/save - Guardar proyecto completo
router.post('/:id/save',
  authenticateToken,
  requirePlan(['pro', 'premium']),
  validateParamsSchema(validateParams.id),
  validateSchema(schemas.projectSave),
  verifyProjectOwnership,
  ProjectController.saveProject
);

// GET /api/projects/:id/export - Exportar proyecto como HTML
router.get('/:id/export',
  authenticateToken,
  requirePlan(['pro', 'premium']),
  validateParamsSchema(validateParams.id),
  verifyProjectOwnership,
  ProjectController.exportProject
);

module.exports = router;
