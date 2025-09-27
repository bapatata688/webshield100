// Servicio para generar HTML a partir de elementos del proyecto
class HtmlGenerator {
  static generateHTML(projectName, elements) {
    const elementsHTML = elements.map(element => {
      return HtmlGenerator.generateElementHTML(element);
    }).join('\n    ');

    return HtmlGenerator.generateFullHTML(projectName, elementsHTML);
  }

  static generateElementHTML(element) {
    const settings = element.settings || {};

    switch (element.type) {
      case 'text':
        return HtmlGenerator.generateTextElement(settings);
      case 'button':
        return HtmlGenerator.generateButtonElement(settings);
      case 'image':
        return HtmlGenerator.generateImageElement(settings);
      case 'form':
        return HtmlGenerator.generateFormElement(settings);
      case 'menu':
        return HtmlGenerator.generateMenuElement(settings);
      case 'gallery':
        return HtmlGenerator.generateGalleryElement(settings);
      default:
        return `<div class="unknown-element">Elemento: ${element.type}</div>`;
    }
  }

  static generateTextElement(settings) {
    const title = settings.title || 'Título';
    const content = settings.content || 'Contenido de texto';
    const alignment = settings.alignment || 'left';
    const fontSize = settings.fontSize || '16px';
    const color = settings.color || '#333';

    return `<div class="text-element" style="text-align: ${alignment};">
      <h2 style="color: ${color}; font-size: ${parseInt(fontSize) + 8}px;">${title}</h2>
      <p style="color: ${color}; font-size: ${fontSize};">${content}</p>
    </div>`;
  }

  static generateButtonElement(settings) {
    const text = settings.text || 'Botón';
    const link = settings.link || '#';
    const backgroundColor = settings.backgroundColor || '#3b82f6';
    const textColor = settings.textColor || 'white';
    const size = settings.size || 'medium';
    const borderRadius = settings.borderRadius || '8px';

    const sizeStyles = {
      small: 'padding: 8px 16px; font-size: 14px;',
      medium: 'padding: 15px 30px; font-size: 16px;',
      large: 'padding: 18px 36px; font-size: 18px;'
    };

    return `<button class="btn-element" onclick="location.href='${link}'" 
      style="background: ${backgroundColor}; color: ${textColor}; 
             ${sizeStyles[size]} border: none; border-radius: ${borderRadius}; 
             cursor: pointer; transition: all 0.3s; margin: 20px 0;">
      ${text}
    </button>`;
  }

  static generateImageElement(settings) {
    const src = settings.src || settings.imageUrl || '/placeholder.jpg';
    const alt = settings.alt || 'Imagen';
    const width = settings.width || '100%';
    const height = settings.height || 'auto';
    const borderRadius = settings.borderRadius || '8px';

    return `<div class="image-element" style="margin: 30px 0; text-align: center;">
      <img src="${src}" alt="${alt}" 
           style="max-width: ${width}; height: ${height}; border-radius: ${borderRadius}; 
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
    </div>`;
  }

  static generateFormElement(settings) {
    const title = settings.title || 'Formulario de Contacto';
    const fields = settings.fields || ['name', 'email', 'message'];
    const buttonText = settings.buttonText || 'Enviar';
    const backgroundColor = settings.backgroundColor || '#f9fafb';

    let formFields = '';
    fields.forEach(field => {
      switch (field) {
        case 'name':
          formFields += '<input type="text" name="name" placeholder="Nombre completo" required />\n      ';
          break;
        case 'email':
          formFields += '<input type="email" name="email" placeholder="Correo electrónico" required />\n      ';
          break;
        case 'phone':
          formFields += '<input type="tel" name="phone" placeholder="Teléfono" />\n      ';
          break;
        case 'message':
          formFields += '<textarea name="message" rows="4" placeholder="Mensaje" required></textarea>\n      ';
          break;
        default:
          formFields += `<input type="text" name="${field}" placeholder="${field}" />\n      `;
      }
    });

    return `<form class="form-element" style="margin: 30px 0; padding: 30px; 
             background: ${backgroundColor}; border: 2px solid #e5e7eb; border-radius: 12px;">
      <h3 style="margin-bottom: 20px; color: #374151;">${title}</h3>
      <div class="security-badge" style="background: #10b981; color: white; padding: 8px 16px;
           border-radius: 20px; font-size: 12px; display: inline-block; margin-bottom: 20px;">
        🛡️ Protegido por WebShield
      </div>
      ${formFields}
      <button type="submit" style="background: #3b82f6; color: white; padding: 12px 24px;
               border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 15px;">
        ${buttonText}
      </button>
    </form>`;
  }

  static generateMenuElement(settings) {
    const links = settings.links || ['Inicio', 'Servicios', 'Contacto'];
    const backgroundColor = settings.backgroundColor || '#1f2937';
    const textColor = settings.textColor || 'white';
    const alignment = settings.alignment || 'left';

    const menuLinks = links.map(link => {
      const href = `#${link.toLowerCase().replace(/\s+/g, '-')}`;
      return `<a href="${href}" style="color: ${textColor}; text-decoration: none; 
                margin: 0 20px; padding: 10px 15px; border-radius: 4px; 
                transition: background 0.3s;">${link}</a>`;
    }).join('\n        ');

    return `<nav class="menu-element" style="background: ${backgroundColor}; padding: 20px; 
             border-radius: 8px; margin: 30px 0; text-align: ${alignment};">
      ${menuLinks}
    </nav>`;
  }

  static generateGalleryElement(settings) {
    const title = settings.title || 'Galería';
    const columns = settings.columns || 3;
    const images = settings.images || [];
    const defaultImages = 6; // Número de imágenes placeholder

    const galleryItems = [];

    // Agregar imágenes reales si existen
    images.forEach((img, index) => {
      galleryItems.push(`
        <div class="gallery-item">
          <img src="${img.src || img.url}" alt="${img.alt || `Imagen ${index + 1}`}" 
               style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" />
        </div>`);
    });

    // Agregar imágenes placeholder si no hay suficientes
    for (let i = images.length; i < defaultImages; i++) {
      galleryItems.push(`
        <div class="gallery-item" style="background: #e5e7eb; height: 200px; border-radius: 8px;
             display: flex; align-items: center; justify-content: center; color: #6b7280;">
          Imagen ${i + 1}
        </div>`);
    }

    return `<div class="gallery-element" style="margin: 30px 0;">
      <h3 style="margin-bottom: 20px; color: #374151;">${title}</h3>
      <div class="gallery-grid" style="display: grid; 
           grid-template-columns: repeat(${columns}, 1fr); gap: 15px;">
        ${galleryItems.join('\n        ')}
      </div>
    </div>`;
  }

  static generateFullHTML(projectName, elementsHTML) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName} - WebShield</title>
    <meta name="description" content="Página web creada con WebShield - Constructor web seguro">
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6; 
            color: #333; 
            background: #f8fafc;
            overflow-x: hidden;
        }
        
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px; 
            background: white; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border-radius: 12px; 
            margin-top: 20px;
        }
        
        .webshield-header {
            text-align: center; 
            padding: 40px 20px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white; 
            border-radius: 8px; 
            margin-bottom: 40px;
            position: relative;
            overflow: hidden;
        }
        
        .webshield-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            opacity: 0.1;
        }
        
        .text-element { 
            margin: 30px 0; 
            padding: 20px; 
        }
        
        .text-element h2 { 
            color: #3b82f6; 
            margin-bottom: 15px; 
        }
        
        .btn-element:hover { 
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(59, 130, 246, 0.3);
        }
        
        .image-element { 
            margin: 30px 0; 
            text-align: center; 
        }
        
        .form-element input,
        .form-element textarea {
            width: 100%; 
            padding: 12px; 
            margin: 10px 0;
            border: 2px solid #d1d5db; 
            border-radius: 6px; 
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .form-element input:focus,
        .form-element textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .form-element button:hover {
            background: #2563eb;
            transform: translateY(-1px);
        }
        
        .menu-element a:hover { 
            background: rgba(255, 255, 255, 0.1);
        }
        
        .webshield-footer {
            text-align: center; 
            margin-top: 60px; 
            padding: 30px;
            background: #f0f9ff; 
            border-radius: 8px; 
            color: #3b82f6;
        }
        
        @media (max-width: 768px) {
            .container { 
                margin: 10px; 
                padding: 15px; 
            }
            .webshield-header {
                padding: 30px 15px;
            }
            .menu-element a { 
                display: block; 
                margin: 5px 0; 
                text-align: center;
            }
            .gallery-grid { 
                grid-template-columns: repeat(2, 1fr) !important; 
            }
            .btn-element {
                width: 100%;
                margin: 10px 0;
            }
        }
        
        @media (max-width: 480px) {
            .gallery-grid { 
                grid-template-columns: 1fr !important; 
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="webshield-header">
            <h1>🛡️ ${projectName}</h1>
            <p>Página web creada con WebShield - Constructor seguro y profesional</p>
        </div>
        
        ${elementsHTML}
        
        <div class="webshield-footer">
            <p> Creado con WebShield - Constructor web seguro</p>
            <p style="font-size: 14px; margin-top: 10px; opacity: 0.8;">
                Potenciado por tecnología de seguridad avanzada
            </p>
        </div>
    </div>
    
    <script>
        // WebShield Security Layer
        console.log('🛡️ WebShield Security: ACTIVO');
        
        document.addEventListener('DOMContentLoaded', function() {
            // Sanitización automática de inputs
            const inputs = document.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', function() {
                    this.value = this.value.replace(/<script[^>]*>.*?<\\/script>/gi, '');
                });
            });
            
            // Animaciones suaves
            const elements = document.querySelectorAll('.text-element, .image-element, .form-element');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            });
            
            elements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            });
            
            // Manejo de formularios
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    alert('¡Mensaje enviado! (Demo de WebShield)');
                });
            });
        });
        
        // Protección contra clickjacking
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }
    </script>
</body>
</html>`;
  }
}

module.exports = { generateHTML: HtmlGenerator.generateHTML };
