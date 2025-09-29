const { pool } = require('../config/database');
const { ERROR_MESSAGES, ELEMENT_TYPES } = require('../config/constants');

class ElementController {
  // Crear nuevo elemento en un proyecto
  static async createElement(req, res) {
    const { projectId } = req.params;
    const { type, settings = {}, order_position } = req.body;

    try {
      // Verificar que el proyecto existe y pertenece al usuario
      const projectCheck = await pool.query(
        'SELECT id FROM proyectos WHERE id = $1 AND user_id = $2',
        [projectId, req.user.id]
      );

      if (projectCheck.rows.length === 0) {
        return res.status(404).json({
          error: ERROR_MESSAGES.PROJECT_NOT_FOUND,
          code: 'PROJECT_NOT_FOUND'
        });
      }

      // Verificar que el tipo de elemento es válido
      const validTypes = [...ELEMENT_TYPES.basic, ...ELEMENT_TYPES.advanced];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: 'Tipo de elemento no válido',
          valid_types: validTypes
        });
      }

      // Verificar permisos por plan para elementos avanzados
      if (ELEMENT_TYPES.advanced.includes(type) && req.user.plan === 'free') {
        return res.status(403).json({
          error: 'Elemento no disponible en plan gratuito',
          upgrade: 'Actualiza a Pro o Premium para usar este elemento',
          required_plans: ['pro', 'premium']
        });
      }

      // Determinar posición del elemento
      let finalOrder = order_position;
      if (finalOrder === undefined) {
        const maxOrderResult = await pool.query(
          'SELECT COALESCE(MAX(order_position), 0) + 1 as next_order FROM elementos WHERE project_id = $1',
          [projectId]
        );
        finalOrder = maxOrderResult.rows[0].next_order;
      }

      // Crear elemento
      const result = await pool.query(
        'INSERT INTO elementos (project_id, type, settings, order_position) VALUES ($1, $2, $3, $4) RETURNING *',
        [projectId, type, JSON.stringify(settings), finalOrder]
      );

      console.log(`Elemento creado: ${type} en proyecto ${projectId} por ${req.user.email}`);

      res.status(201).json({
        message: 'Elemento agregado exitosamente',
        element: result.rows[0]
      });

    } catch (error) {
      console.error('Error agregando elemento:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Actualizar elemento existente
  static async updateElement(req, res) {
    const { id } = req.params;
    const { type, settings, order_position } = req.body;

    try {
      // Verificar que el elemento existe y pertenece al usuario
      const elementCheck = await pool.query(`
        SELECT e.* FROM elementos e 
        JOIN proyectos p ON e.project_id = p.id 
        WHERE e.id = $1 AND p.user_id = $2
      `, [id, req.user.id]);

      if (elementCheck.rows.length === 0) {
        return res.status(404).json({
          error: ERROR_MESSAGES.ELEMENT_NOT_FOUND,
          code: 'ELEMENT_NOT_FOUND'
        });
      }

      // Preparar campos a actualizar
      const updates = [];
      const values = [];
      let paramCounter = 1;

      if (type) {
        const validTypes = [...ELEMENT_TYPES.basic, ...ELEMENT_TYPES.advanced];
        if (!validTypes.includes(type)) {
          return res.status(400).json({
            error: 'Tipo de elemento no válido',
            valid_types: validTypes
          });
        }

        // Verificar permisos por plan
        if (ELEMENT_TYPES.advanced.includes(type) && req.user.plan === 'free') {
          return res.status(403).json({
            error: 'Elemento no disponible en plan gratuito',
            upgrade: 'Actualiza a Pro o Premium para usar este elemento'
          });
        }

        updates.push(`type = $${paramCounter++}`);
        values.push(type);
      }

      if (settings) {
        updates.push(`settings = $${paramCounter++}`);
        values.push(JSON.stringify(settings));
      }

      if (order_position !== undefined) {
        updates.push(`order_position = $${paramCounter++}`);
        values.push(order_position);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: 'No hay campos para actualizar',
          code: 'NO_FIELDS_TO_UPDATE'
        });
      }

      // Agregar timestamp de actualización
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `UPDATE elementos SET ${updates.join(', ')} WHERE id = ${paramCounter} RETURNING *`;
      const result = await pool.query(query, values);

      console.log(`Elemento actualizado: ID ${id} por ${req.user.email}`);

      res.json({
        message: 'Elemento actualizado exitosamente',
        element: result.rows[0]
      });

    } catch (error) {
      console.error('Error actualizando elemento:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Eliminar elemento
  static async deleteElement(req, res) {
    const { id } = req.params;

    try {
      const result = await pool.query(`
        DELETE FROM elementos 
        WHERE id = $1 AND project_id IN (
          SELECT id FROM proyectos WHERE user_id = $2
        ) RETURNING id, type, project_id
      `, [id, req.user.id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: ERROR_MESSAGES.ELEMENT_NOT_FOUND,
          code: 'ELEMENT_NOT_FOUND'
        });
      }

      console.log(`Elemento eliminado: ${result.rows[0].type} (ID: ${id}) por ${req.user.email}`);

      res.json({
        message: 'Elemento eliminado exitosamente',
        deleted_element: result.rows[0]
      });

    } catch (error) {
      console.error('Error eliminando elemento:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Obtener elementos de un proyecto
  static async getProjectElements(req, res) {
    const { projectId } = req.params;

    try {
      // Verificar que el proyecto pertenece al usuario
      const projectCheck = await pool.query(
        'SELECT id FROM proyectos WHERE id = $1 AND user_id = $2',
        [projectId, req.user.id]
      );

      if (projectCheck.rows.length === 0) {
        return res.status(404).json({
          error: ERROR_MESSAGES.PROJECT_NOT_FOUND,
          code: 'PROJECT_NOT_FOUND'
        });
      }

      // Obtener elementos ordenados
      const result = await pool.query(
        'SELECT * FROM elementos WHERE project_id = $1 ORDER BY order_position ASC, created_at ASC',
        [projectId]
      );

      res.json({
        elements: result.rows,
        project_id: projectId,
        total_elements: result.rows.length
      });

    } catch (error) {
      console.error('Error obteniendo elementos:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Reordenar elementos en un proyecto
  static async reorderElements(req, res) {
    const { projectId } = req.params;
    const { element_orders } = req.body; // Array de { element_id, new_position }

    try {
      // Verificar que el proyecto pertenece al usuario
      const projectCheck = await pool.query(
        'SELECT id FROM proyectos WHERE id = $1 AND user_id = $2',
        [projectId, req.user.id]
      );

      if (projectCheck.rows.length === 0) {
        return res.status(404).json({
          error: ERROR_MESSAGES.PROJECT_NOT_FOUND,
          code: 'PROJECT_NOT_FOUND'
        });
      }

      if (!Array.isArray(element_orders) || element_orders.length === 0) {
        return res.status(400).json({
          error: 'Se requiere un array de ordenamiento de elementos',
          code: 'INVALID_ELEMENT_ORDERS'
        });
      }

      await pool.query('BEGIN');

      // Actualizar posiciones
      for (const { element_id, new_position } of element_orders) {
        await pool.query(`
          UPDATE elementos SET order_position = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2 AND project_id = $3
        `, [new_position, element_id, projectId]);
      }

      await pool.query('COMMIT');

      console.log(`Elementos reordenados en proyecto ${projectId} por ${req.user.email}`);

      res.json({
        message: 'Elementos reordenados exitosamente',
        updated_count: element_orders.length
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error reordenando elementos:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Duplicar elemento
  static async duplicateElement(req, res) {
    const { id } = req.params;

    try {
      // Obtener elemento original
      const elementResult = await pool.query(`
        SELECT e.* FROM elementos e 
        JOIN proyectos p ON e.project_id = p.id 
        WHERE e.id = $1 AND p.user_id = $2
      `, [id, req.user.id]);

      if (elementResult.rows.length === 0) {
        return res.status(404).json({
          error: ERROR_MESSAGES.ELEMENT_NOT_FOUND,
          code: 'ELEMENT_NOT_FOUND'
        });
      }

      const originalElement = elementResult.rows[0];

      // Obtener nueva posición
      const maxOrderResult = await pool.query(
        'SELECT COALESCE(MAX(order_position), 0) + 1 as next_order FROM elementos WHERE project_id = $1',
        [originalElement.project_id]
      );

      const newOrder = maxOrderResult.rows[0].next_order;

      // Duplicar elemento
      const duplicateResult = await pool.query(
        'INSERT INTO elementos (project_id, type, settings, order_position) VALUES ($1, $2, $3, $4) RETURNING *',
        [originalElement.project_id, originalElement.type, originalElement.settings, newOrder]
      );

      console.log(`Elemento duplicado: ${originalElement.type} por ${req.user.email}`);

      res.status(201).json({
        message: 'Elemento duplicado exitosamente',
        element: duplicateResult.rows[0],
        original_element_id: id
      });

    } catch (error) {
      console.error('Error duplicando elemento:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

module.exports = ElementController;
