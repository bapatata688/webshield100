const { pool } = require('../config/database');
const { ERROR_MESSAGES } = require('../config/constants');

class TemplateController {
  // Obtener plantillas disponibles
  static async getTemplates(req, res) {
    try {
      const templates = [
        {
          id: 'landing-business',
          name: 'Landing Page Empresarial',
          description: 'Página profesional para empresas con formulario de contacto',
          category: 'business',
          preview_url: '/templates/landing-business.jpg',
          difficulty: 'easy',
          estimated_time: '10 minutos',
          elements: [
            { type: 'menu', settings: { links: ['Inicio', 'Servicios', 'Contacto'] } },
            { type: 'text', settings: { title: 'Bienvenido a nuestra empresa', content: 'Ofrecemos soluciones innovadoras' } },
            { type: 'image', settings: { src: '/placeholder-hero.jpg', alt: 'Imagen principal' } },
            { type: 'form', settings: { fields: ['name', 'email', 'message'], title: 'Contáctanos' } }
          ]
        },
        {
          id: 'portfolio',
          name: 'Portfolio Creativo',
          description: 'Muestra tu trabajo con una galería elegante',
          category: 'creative',
          preview_url: '/templates/portfolio.jpg',
          difficulty: 'medium',
          estimated_time: '15 minutos',
          elements: [
            { type: 'text', settings: { title: 'Mi Portfolio', content: 'Descubre mis trabajos más destacados' } },
            { type: 'gallery', settings: { columns: 3, title: 'Proyectos Destacados' } },
            { type: 'button', settings: { text: 'Contactar', link: '#contact' } }
          ]
        },
        {
          id: 'restaurant-menu',
          name: 'Menú de Restaurante',
          description: 'Carta digital elegante para restaurantes',
          category: 'food',
          preview_url: '/templates/restaurant.jpg',
          difficulty: 'easy',
          estimated_time: '12 minutos',
          elements: [
            { type: 'text', settings: { title: 'Nuestro Menú', content: 'Platos elaborados con ingredientes frescos' } },
            { type: 'gallery', settings: { columns: 2, title: 'Especialidades' } },
            { type: 'form', settings: { fields: ['name', 'phone', 'message'], title: 'Hacer Reserva' } }
          ]
        },
        {
          id: 'blog-personal',
          name: 'Blog Personal',
          description: 'Blog moderno para compartir tus ideas',
          category: 'blog',
          preview_url: '/templates/blog.jpg',
          difficulty: 'medium',
          estimated_time: '20 minutos',
          elements: [
            { type: 'text', settings: { title: 'Mi Blog', content: 'Comparto mis pensamientos y experiencias' } },
            { type: 'text', settings: { title: 'Último Post', content: 'Aquí va el contenido de tu último artículo...' } },
            { type: 'button', settings: { text: 'Leer Más', link: '#' } }
          ]
        }
      ];

      // Filtrar plantillas según el plan del usuario
      const availableTemplates = req.user.plan === 'free' 
        ? templates.slice(0, 2) // Solo 2 plantillas para usuarios gratuitos
        : templates;

      res.json({
        templates: availableTemplates,
        available_for_plan: req.user.plan,
        total_templates: templates.length,
        available_count: availableTemplates.length
      });

    } catch (error) {
      console.error('Error obteniendo plantillas:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Crear proyecto desde plantilla
  static async createFromTemplate(req, res) {
    const { templateId } = req.params;
    const { project_name } = req.body;

    try {
      // Definir datos de plantillas
      const templateData = {
        'landing-business': {
          name: project_name || 'Mi Landing Page Empresarial',
          elements: [
            { type: 'menu', settings: { links: ['Inicio', 'Servicios', 'Contacto'], backgroundColor: '#1f2937' } },
            { type: 'text', settings: { title: 'Bienvenido a Nuestra Empresa', content: 'Ofrecemos soluciones innovadoras para hacer crecer tu negocio' } },
            { type: 'image', settings: { src: '', alt: 'Imagen principal' } },
            { type: 'form', settings: { title: 'Contáctanos', fields: ['name', 'email', 'phone', 'message'] } }
          ]
        },
        'portfolio': {
          name: project_name || 'Mi Portfolio Creativo',
          elements: [
            { type: 'text', settings: { title: 'Mi Portfolio', content: 'Descubre mis trabajos más destacados' } },
            { type: 'gallery', settings: { columns: 3, title: 'Proyectos Destacados' } },
            { type: 'text', settings: { title: 'Sobre Mí', content: 'Soy un profesional creativo con experiencia en...' } },
            { type: 'button', settings: { text: 'Contactar', link: '#contact' } }
          ]
        },
        'restaurant-menu': {
          name: project_name || 'Menú de Mi Restaurante',
          elements: [
            { type: 'text', settings: { title: 'Nuestro Menú', content: 'Platos elaborados con ingredientes frescos y locales' } },
            { type: 'gallery', settings: { columns: 2, title: 'Especialidades de la Casa' } },
            { type: 'form', settings: { title: 'Hacer Reserva', fields: ['name', 'phone', 'message'] } }
          ]
        },
        'blog-personal': {
          name: project_name || 'Mi Blog Personal',
          elements: [
            { type: 'text', settings: { title: 'Mi Blog', content: 'Bienvenido a mi espacio personal donde comparto ideas' } },
            { type: 'text', settings: { title: 'Último Artículo', content: 'Aquí puedes escribir el contenido de tu último post...' } },
            { type: 'button', settings: { text: 'Leer Artículos Anteriores', link: '#' } }
          ]
        }
      };

      if (!templateData[templateId]) {
        return res.status(404).json({
          error: 'Plantilla no encontrada',
          code: 'TEMPLATE_NOT_FOUND',
          available_templates: Object.keys(templateData)
        });
      }

      // Verificar límites por plan
      const { PLAN_LIMITS } = require('../config/constants');
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
          current: count
        });
      }

      await pool.query('BEGIN');

      const template = templateData[templateId];

      // Crear proyecto
      const project = await pool.query(
        'INSERT INTO proyectos (name, user_id) VALUES ($1, $2) RETURNING *',
        [template.name, req.user.id]
      );

      // Crear elementos de la plantilla
      for (let i = 0; i < template.elements.length; i++) {
        const element = template.elements[i];
        await pool.query(
          'INSERT INTO elementos (project_id, type, settings, order_position) VALUES ($1, $2, $3, $4)',
          [project.rows[0].id, element.type, JSON.stringify(element.settings), i + 1]
        );
      }

      await pool.query('COMMIT');

      console.log(`Proyecto creado desde plantilla ${templateId}: ${template.name} por ${req.user.email}`);

      res.status(201).json({
        message: 'Proyecto creado desde plantilla exitosamente',
        project: project.rows[0],
        template_used: templateId,
        elements_created: template.elements.length
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error creando desde plantilla:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Estadísticas avanzadas (solo Premium)
  static async getAdvancedStats(req, res) {
    try {
      const [overviewResult, elementsResult, activityResult, performanceResult] = await Promise.all([
        // Estadísticas generales
        pool.query(`
          SELECT 
            COUNT(DISTINCT p.id) as total_projects,
            COUNT(e.id) as total_elements,
            COUNT(CASE WHEN pg.status = 'completed' THEN 1 END) as successful_payments,
            SUM(CASE WHEN pg.status = 'completed' THEN pg.amount ELSE 0 END) as total_spent,
            MAX(p.updated_at) as last_project_update
          FROM proyectos p
          LEFT JOIN elementos e ON p.id = e.project_id
          LEFT JOIN pagos pg ON p.user_id = pg.user_id
          WHERE p.user_id = $1
        `, [req.user.id]),

        // Uso de elementos por tipo
        pool.query(`
          SELECT e.type, COUNT(*) as count, 
                 AVG(LENGTH(e.settings::text)) as avg_complexity
          FROM elementos e
          JOIN proyectos p ON e.project_id = p.id
          WHERE p.user_id = $1
          GROUP BY e.type
          ORDER BY count DESC
        `, [req.user.id]),

        // Actividad por mes
        pool.query(`
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(*) as projects_created
          FROM proyectos 
          WHERE user_id = $1 
          AND created_at >= CURRENT_DATE - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY month DESC
        `, [req.user.id]),

        // Métricas de rendimiento
        pool.query(`
          SELECT 
            AVG(element_count) as avg_elements_per_project,
            MAX(element_count) as max_elements_in_project,
            COUNT(CASE WHEN element_count > 10 THEN 1 END) as complex_projects
          FROM (
            SELECT p.id, COUNT(e.id) as element_count
            FROM proyectos p
            LEFT JOIN elementos e ON p.id = e.project_id
            WHERE p.user_id = $1
            GROUP BY p.id
          ) project_stats
        `, [req.user.id])
      ]);

      res.json({
        overview: {
          ...overviewResult.rows[0],
          total_spent: parseFloat(overviewResult.rows[0].total_spent) || 0
        },
        element_usage: elementsResult.rows,
        activity_by_month: activityResult.rows,
        performance: performanceResult.rows[0],
        user_plan: req.user.plan,
        generated_at: new Date().toISOString(),
        next_update_in: '24h'
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR'
      });
    }
  }
}
