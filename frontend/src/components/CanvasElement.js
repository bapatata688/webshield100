import React from 'react';
import { Image, Camera, Copy, Trash2 } from 'lucide-react';
import { getSizeClasses } from '../utils/appUtils';
import '../App.css';

const CanvasElement = ({ element, index, selectedElement, onSelect, onDuplicate, onRemove, getDefaultContent }) => {
  const settings = element.settings || {};
  const content = settings.content || getDefaultContent(element.type);
  const color = settings.color || '#3B82F6';
  const link = settings.link || '';

  const renderElement = () => {
    const sizeClasses = getSizeClasses(settings.size);

    switch (element.type) {
      case 'text':
        return (
          <div className={`canvas-text-element border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors ${sizeClasses}`}>
            <div style={{ color }} className="prose max-w-none">
              {content.split('\n').map((line, i) => (
                <p key={i} className="mb-2 last:mb-0">{line}</p>
              ))}
            </div>
          </div>
        );

      case 'image':
        const imageUrl = settings.imageUrl || '';
        return (
          <div className={`border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors ${sizeClasses}`}>
            {imageUrl ? (
              <img src={imageUrl} alt={content} className="w-full h-48 object-cover rounded" />
            ) : (
              <div className="canvas-image-placeholder w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">{content}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'button':
        return (
          <div className={`border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors ${sizeClasses}`}>
            <button
              className="canvas-button-element px-8 py-3 rounded-lg hover:opacity-80 transition-colors font-medium"
              style={{ backgroundColor: color, color: 'white' }}
              onClick={() => link && window.open(link, '_blank')}
            >
              {content}
            </button>
          </div>
        );

      case 'menu':
        return (
          <div className={`canvas-menu-element border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors ${sizeClasses}`}>
            <nav className="flex space-x-8">
              <button className="canvas-menu-item text-gray-700 hover:text-blue-600 font-medium py-2">Inicio</button>
              <button className="canvas-menu-item text-gray-700 hover:text-blue-600 font-medium py-2">Servicios</button>
              <button className="canvas-menu-item text-gray-700 hover:text-blue-600 font-medium py-2">Contacto</button>
            </nav>
          </div>
        );

      case 'form':
        return (
          <div className={`border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors ${sizeClasses}`}>
            <div className="canvas-form-shield bg-green-50 border border-green-200 rounded p-2 mb-4">
              <p className="text-xs text-green-700">Formulario protegido por WebShield</p>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input type="text" className="canvas-form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="canvas-form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="canvas-button-element px-6 py-2 rounded-md font-medium text-white hover:opacity-80" style={{ backgroundColor: color }}>
                Enviar de forma segura
              </button>
            </form>
          </div>
        );

      case 'gallery':
        return (
          <div className={`border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors ${sizeClasses}`}>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Galería de imágenes</h3>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="canvas-gallery-item aspect-square bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div>Elemento desconocido</div>;
    }
  };

  return (
    <div
      className={`canvas-element mb-4 relative group ${selectedElement === index ? 'canvas-element-selected ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      onClick={() => onSelect && onSelect(index)}
    >
      {renderElement()}

      <div className="canvas-element-actions absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate && onDuplicate(index);
          }}
          className="canvas-action-button bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 shadow-lg"
          title="Duplicar elemento"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove && onRemove(index);
          }}
          className="canvas-action-button bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
          title="Eliminar elemento"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CanvasElement;
