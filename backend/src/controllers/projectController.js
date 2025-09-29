const { pool } = require('../config/database');
const { ERROR_MESSAGES, PLAN_LIMITS } = require('../config/constants');

class ProjectController {
  // Obtener todos los proyectos del usuario
  static async getAllProjects(req, res) {
    try {
      const result = await pool.query(
        'SELECT id, name, created_at, updated_at FROM proyectos WHERE user_id = $1 ORDER BY updated_at DESC',
        [req.user.id]
      );

      res.json({ projects: result.rows });
    } catch (error) {
      console.error('Error obteniendo proyectos:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Crear nuevo proyecto
  static async createProject(req, res) {
    const { name } = req.body;

    try {
      // Verificar límites por plan
      const projectCount = await pool.query(
        'SELECT COUNT(*) FROM proyectos WHERE user_id = $1',
        [req.user.id]
      );

      const count = parseInt(projectCount.rows[0].count);
      const userLimits = PLAN_LIMITS[req.user.plan];

      if (count >= userLimits.projects) {
        return res.status(403).json({
          error: `Límite de proyectos alcanzado para plan ${req.user.plan}`,
          limit: userLimits.projects,
          current: count,
          upgrade_url: '/api/plans'
        });
      }

      // Crear proyecto
      const result = await pool.query(
        'INSERT INTO proyectos (name, user_id) VALUES ($1, $2) RETURNING *',
        [name.trim(), req.user.id]
      );

      console.log(`Nuevo proyecto creado: ${name} por ${req.user.email}`);

      res.status(201).json({
        message: 'Proyecto creado exitosamente',
        project: result.rows[0]
      });

    } catch (error) {
      console.error('Error creando proyecto:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Obtener proyecto específico con elementos
  static async getProject(req, res) {
    const { id } = req.params;

    try {
      const projectResult = await pool.query(
        'SELECT * FROM proyectos WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          error: ERROR_MESSAGES.PROJECT_NOT_FOUND,
          code: 'PROJECT_NOT_FOUND'
        });
      }

      // Obtener elementos del proyecto
      const elementsResult = await pool.query(
        'SELECT * FROM elementos WHERE project_id = $1 ORDER BY order_position ASC',
        [id]
      );

      const project = projectResult.rows[0];
      project.elements = elementsResult.rows;

      res.json({ project });

    } catch (error) {
      console.error('Error obteniendo proyecto:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Actualizar proyecto
  static async updateProject(req, res) {
    const { id } = req.params;
    const { name } = req.body;

    try {
      const result = await pool.query(
        'UPDATE proyectos SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
        [name.trim(), id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: ERROR_MESSAGES.PROJECT_NOT_FOUND,
          code: 'PROJECT_NOT_FOUND'
        });
      }

      res.json({
        message: 'Proyecto actualizado exitosamente',
        project: result.rows[0]
      });

    } catch (error) {
      console.error('Error actualizando proyecto:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Eliminar proyecto
  static async deleteProject(req, res) {
    const { id } = req.params;

    try {
      const result = await pool.query(
        'DELETE FROM proyectos WHERE id = $1 AND user_id = $2 RETURNING id, name',
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: ERROR_MESSAGES.PROJECT_NOT_FOUND,
          code: 'PROJECT_NOT_FOUND'
        });
      }

      console.log(`Proyecto eliminado: ${result.rows[0].name} por ${req.user.email}`);

      res.json({
        message: 'Proyecto eliminado exitosamente',
        deleted_project: result.rows[0]
      });

    } catch (error) {
      console.error('Error eliminando proyecto:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Buscar proyectos
  static async searchProjects(req, res) {
    try {
      const { q, type } = req.query;

      const searchQuery = `%${q.trim()}%`;
      let query = `
        SELECT p.id, p.name, p.created_at, p.updated_at,
               COUNT(e.id) as element_count
        FROM proyectos p 
        LEFT JOIN elementos e ON p.id = e.project_id 
        WHERE p.user_id = $1 AND p.name ILIKE $2
      `;

      const params = [req.user.id, searchQuery];

      if (type) {
        query += ` AND e.type = $3`;
        params.push(type);
      }

      query += ` GROUP BY p.id, p.name, p.created_at, p.updated_at ORDER BY p.updated_at DESC LIMIT 20`;

      const result = await pool.query(query, params);

      res.json({
        projects: result.rows,
        search_query: q,
        results_count: result.rows.length
      });

    } catch (error) {
      console.error('Error en búsqueda:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Duplicar proyecto
  static async duplicateProject(req, res) {
    const { id } = req.params;

    try {
      await pool.query('BEGIN');

      // Obtener proyecto original
      const originalProject = await pool.query(
        'SELECT * FROM proyectos WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (originalProject.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({
          error: ERROR_MESSAGES.PROJECT_NOT_FOUND,
          code: 'PROJECT_NOT_FOUND'
        });
      }

      // Verificar límites antes de duplicar
      const projectCount = await pool.query(
        'SELECT COUNT(*) FROM proyectos WHERE user_id = $1',
        [req.user.id]
      );

      const count = parseInt(projectCount.rows[0].count);
      const userLimits = PLAN_LIMITS[req.user.plan];

      if (count >= userLimits.projects) {
        await pool.query('ROLLBACK');
        return res.status(403).json({
          error: `Límite de proyectos alcanzado para plan ${req.user.plan}`,
          limit: userLimits.projects,
          current: count
        });
      }

      // Crear proyecto duplicado
      const newName = `${originalProject.rows[0].name} (Copia)`;
      const newProject = await pool.query(
        'INSERT INTO proyectos (name, user_id) VALUES ($1, $2) RETURNING *',
        [newName, req.user.id]
      );

      // Duplicar elementos
      await pool.query(`
        INSERT INTO elementos (project_id, type, settings, order_position)
        SELECT $1, type, settings, order_position 
        FROM elementos 
        WHERE project_id = $2
        ORDER BY order_position
      `, [newProject.rows[0].id, id]);

      await pool.query('COMMIT');

      console.log(`Proyecto duplicado: ${newName} por ${req.user.email}`);

      res.status(201).json({
        message: 'Proyecto duplicado exitosamente',
        project: newProject.rows[0]
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error duplicando proyecto:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Guardar proyecto completo (solo Pro/Premium)
  // Guardar proyecto completo (Pro/Premium)
  static async saveProject(req, res) {
    const { id } = req.params;
    const { name, elements } = req.body;

    console.log('=== SAVE PROJECT DEBUG ===');
    console.log('Project ID:', id);
    console.log('User ID:', req.user?.id);
    console.log('Elements received:', elements);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    try {
      await pool.query('BEGIN');

      // Verificar que el proyecto existe y pertenece al usuario
      const projectCheck = await pool.query(
        'SELECT * FROM proyectos WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (projectCheck.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({
          error: 'Proyecto no encontrado',
          code: 'PROJECT_NOT_FOUND'
        });
      }

      // Actualizar nombre del proyecto y timestamp
      if (name) {
        await pool.query(
          'UPDATE proyectos SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [name.trim(), id]
        );
      }

      // Eliminar elementos existentes
      await pool.query('DELETE FROM elementos WHERE project_id = $1', [id]);
      console.log('Deleted existing elements');

      // Insertar nuevos elementos completos
      if (elements && elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];

          if (!element.type) {
            throw new Error(`Elemento ${i + 1} no tiene tipo definido`);
          }

          // Guardar todos los campos del elemento en settings excepto type
          const fullSettings = { ...element };
          delete fullSettings.type;

          await pool.query(
            'INSERT INTO elementos (project_id, type, settings, order_position) VALUES ($1, $2, $3, $4)',
            [id, element.type, JSON.stringify(fullSettings || {}), i + 1]
          );

          console.log(`Element ${i + 1} inserted successfully`);
        }
      }

      await pool.query('COMMIT');

      console.log(`Proyecto guardado exitosamente: ID ${id}`);

      res.json({
        message: 'Proyecto guardado exitosamente en la nube',
        elements_count: elements ? elements.length : 0
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error guardando proyecto:', error);
      console.error('Stack:', error.stack);

      res.status(500).json({
        error: error.message || 'Error interno',
        code: 'SAVE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  // Exportar proyecto (solo Pro/Premium)
  static async exportProject(req, res) {
    const { id } = req.params;

    try {
      const projectResult = await pool.query(
        'SELECT name FROM proyectos WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          error: ERROR_MESSAGES.PROJECT_NOT_FOUND,
          code: 'PROJECT_NOT_FOUND'
        });
      }

      const elementsResult = await pool.query(
        'SELECT type, settings FROM elementos WHERE project_id = $1 ORDER BY order_position ASC',
        [id]
      );

      const project = projectResult.rows[0];
      const elements = elementsResult.rows;

      // Importar el generador de HTML
      const { generateHTML } = require('../services/htmlGenerator');
      const html = generateHTML(project.name, elements);

      res.json({
        project: project.name,
        html: html,
        elements_count: elements.length,
        export_date: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error exportando proyecto:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

module.exports = ProjectController;
