const validator = require('validator');
const { ELEMENT_TYPES } = require('../config/constants');

class Validators {
  // Sanitizar input básico
  static sanitizeInput(input) {
    if (typeof input === 'string') {
      return validator.escape(input.trim());
    }
    return input;
  }

  // Validar email
  static isValidEmail(email) {
    return validator.isEmail(email);
  }

  // Validar URL
  static isValidURL(url) {
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true
    });
  }

  // Validar tipo de elemento
  static isValidElementType(type) {
    const allTypes = [...ELEMENT_TYPES.basic, ...ELEMENT_TYPES.advanced];
    return allTypes.includes(type);
  }

  // Validar configuraciones de elemento
  static validateElementSettings(type, settings) {
    const errors = [];

    switch (type) {
      case 'text':
        if (settings.title && typeof settings.title !== 'string') {
          errors.push('El título debe ser un texto');
        }
        if (settings.content && typeof settings.content !== 'string') {
          errors.push('El contenido debe ser un texto');
        }
        break;

      case 'image':
        if (settings.src && !Validators.isValidURL(settings.src) && !settings.src.startsWith('/')) {
          errors.push('La URL de la imagen debe ser válida');
        }
        break;

      case 'button':
        if (settings.link && !Validators.isValidURL(settings.link) && !settings.link.startsWith('#') && !settings.link.startsWith('/')) {
          errors.push('El enlace del botón debe ser una URL válida');
        }
        break;

      case 'form':
        if (settings.fields && !Array.isArray(settings.fields)) {
          errors.push('Los campos del formulario deben ser un array');
        }
        break;

      case 'gallery':
        if (settings.columns && (!Number.isInteger(settings.columns) || settings.columns < 1 || settings.columns > 6)) {
          errors.push('Las columnas de la galería deben ser un número entre 1 y 6');
        }
        break;
    }

    return errors;
  }

  // Validar nombre de proyecto
  static validateProjectName(name) {
    const errors = [];
    
    if (!name || typeof name !== 'string') {
      errors.push('El nombre del proyecto es requerido');
      return errors;
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length < 1) {
      errors.push('El nombre del proyecto no puede estar vacío');
    }
    
    if (trimmedName.length > 100) {
      errors.push('El nombre del proyecto no puede exceder 100 caracteres');
    }

    // Verificar caracteres especiales peligrosos
    if (/<script|javascript:|on\w+=/i.test(trimmedName)) {
      errors.push('El nombre del proyecto contiene caracteres no permitidos');
    }

    return errors;
  }

  // Validar plan de pago
  static isValidPaymentPlan(plan) {
    return ['pro', 'premium'].includes(plan);
  }

  // Validar ID numérico
  static isValidId(id) {
    return Number.isInteger(Number(id)) && Number(id) > 0;
  }
}
