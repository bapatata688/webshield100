const crypto = require('crypto');
const { PLAN_LIMITS } = require('../config/constants');

class Helpers {
  // Generar ID único
  static generateUniqueId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Formatear fecha para mostrar
  static formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Calcular límites restantes para un usuario
  static calculateRemainingLimits(userPlan, currentUsage) {
    const limits = PLAN_LIMITS[userPlan];

    return {
      projects: {
        limit: limits.projects,
        used: currentUsage.projects || 0,
        remaining: Math.max(0, limits.projects - (currentUsage.projects || 0)),
        percentage: Math.min(100, ((currentUsage.projects || 0) / limits.projects) * 100)
      },
      elements_per_project: {
        limit: limits.elements_per_project,
        // Este se calculará por proyecto individual
      }
    };
  }

  // Limpiar configuración de elemento para almacenar
  static sanitizeElementSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      return {};
    }

    const cleaned = {};

    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string') {
        cleaned[key] = Validators.sanitizeInput(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        cleaned[key] = value;
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map(item =>
          typeof item === 'string' ? Validators.sanitizeInput(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = Helpers.sanitizeElementSettings(value);
      }
    }

    return cleaned;
  }

  // Verificar si un usuario puede usar una característica
  static canUseFeature(userPlan, feature) {
    const planFeatures = PLAN_LIMITS[userPlan]?.features || [];
    return planFeatures.includes(feature);
  }

  // Generar slug a partir de texto
  static generateSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Paginar resultados
  static paginate(array, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const totalItems = array.length;
    const totalPages = Math.ceil(totalItems / limit);
    const items = array.slice(offset, offset + limit);

    return {
      items,
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: totalItems,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    };
  }

  // Calcular estadísticas básicas de array
  static calculateStats(numbers) {
    if (!Array.isArray(numbers) || numbers.length === 0) {
      return { mean: 0, median: 0, mode: 0, min: 0, max: 0 };
    }

    const sorted = [...numbers].sort((a, b) => a - b);
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;

    const median = numbers.length % 2 === 0
      ? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
      : sorted[Math.floor(numbers.length / 2)];

    // Calcular moda
    const frequency = {};
    numbers.forEach(num => frequency[num] = (frequency[num] || 0) + 1);
    const mode = Object.keys(frequency).reduce((a, b) =>
      frequency[a] > frequency[b] ? a : b
    );

    return {
      mean: Math.round(mean * 100) / 100,
      median,
      mode: parseFloat(mode),
      min: Math.min(...numbers),
      max: Math.max(...numbers)
    };
  }

  // Generar respuesta de error estandarizada
  static createErrorResponse(message, code = null, details = null) {
    const response = { error: message };
    if (code) response.code = code;
    if (details) response.details = details;
    response.timestamp = new Date().toISOString();
    return response;
  }

  // Generar respuesta de éxito estandarizada
  static createSuccessResponse(message, data = null) {
    const response = {
      success: true,
      message
    };
    if (data) response.data = data;
    response.timestamp = new Date().toISOString();
    return response;
  }

  // Escapar caracteres HTML
  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Validar y limpiar configuraciones JSON
  static validateJsonSettings(settings) {
    try {
      if (typeof settings === 'string') {
        return JSON.parse(settings);
      }
      return settings || {};
    } catch (error) {
      console.warn('JSON inválido en configuraciones:', error);
      return {};
    }
  }

  // Generar token temporal (para reset de contraseña, etc.)
  static generateTemporaryToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Verificar si un objeto está vacío
  static isEmpty(obj) {
    return obj === null || obj === undefined ||
      (typeof obj === 'object' && Object.keys(obj).length === 0) ||
      (typeof obj === 'string' && obj.trim() === '') ||
      (Array.isArray(obj) && obj.length === 0);
  }
}

module.exports = { Validators, Helpers };
