import React from 'react';
import {
  Shield, ChevronLeft, Undo2, Redo2, Save, Download, Eye,
  Loader2, Type, AlertTriangle, Lock, Plus, Settings, CheckCircle, Crown
} from 'lucide-react';
import { ELEMENTS } from '../constants/appConstants';
import { getCanvasPermissions } from '../utils/appUtils';
import CanvasElement from './CanvasElement';
import '../App.css';

const EditorScreen = ({
  user,
  currentProject,
  draggedElements,
  selectedElement,
  history,
  historyIndex,
  isPreview,
  isSaving,
  loading,
  onAddElement,
  onSelectElement,
  onDuplicateElement,
  onRemoveElement,
  onUpdateElement,
  onUndo,
  onRedo,
  onSave,
  onExport,
  onPreview,
  onBackToDashboard,
  onOpenPaymentModal,
  getDefaultContent
}) => {
  const availableElements = user?.plan === 'free' ? ELEMENTS.free : ELEMENTS.pro;
  const permissions = getCanvasPermissions(user?.plan);

  if (isPreview) {
    return (
      <div className="preview-content min-h-screen bg-gray-50">
        <div className="preview-header bg-gradient-to-r from-gray-900 to-blue-900 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-4">
              <Eye className="w-6 h-6" />
              <div>
                <h3 className="text-xl font-semibold">Vista Previa</h3>
                <p className="text-blue-200 text-sm">{currentProject?.name || 'Proyecto sin nombre'}</p>
              </div>
            </div>
            <button
              onClick={() => onPreview(false)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors hover-lift"
            >
              Volver al Editor
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto p-8">
          {draggedElements.length === 0 ? (
            <div className="preview-empty-state text-center py-20 bg-white rounded-lg shadow-sm">
              <Type className="editor-empty-icon w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Tu página web aparecerá aquí</h2>
              <p className="text-gray-600 text-lg">Agrega elementos desde el editor para ver tu sitio en acción</p>
            </div>
          ) : (
            <div className="space-y-6">
              {draggedElements.map((element, index) => (
                <div key={`preview-${index}`} className="preview-element bg-white rounded-lg shadow-sm overflow-hidden">
                  <CanvasElement
                    element={element}
                    index={index}
                    getDefaultContent={getDefaultContent}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header del Editor */}
      <div className="editor-header bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToDashboard}
              className="text-gray-400 hover:text-gray-600 editor-toolbar-button"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <Shield className="w-8 h-8 text-blue-600 login-shield" />
            <h1 className="text-xl font-bold text-gray-800">WebShield</h1>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm font-medium text-gray-700">{currentProject?.name || 'Proyecto sin nombre'}</span>
            {isSaving && (
              <div className="editor-save-indicator flex items-center text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                <span className="text-xs">Guardando...</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onUndo}
              disabled={historyIndex <= 0}
              className={`editor-toolbar-button flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${historyIndex <= 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              title="Deshacer"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={historyIndex >= history.length - 1}
              className={`editor-toolbar-button flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${historyIndex >= history.length - 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              title="Rehacer"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              onClick={onSave}
              disabled={!permissions.canSave || isSaving}
              className={`editor-toolbar-button flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${permissions.canSave && !isSaving
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover-lift'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={() => onPreview(true)}
              className="editor-toolbar-button bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center font-medium shadow-sm transition-colors hover-lift"
            >
              <Eye className="w-4 h-4 mr-2" />
              Previsualizar
            </button>
            <button
              onClick={onExport}
              disabled={!permissions.canExport || loading}
              className={`editor-toolbar-button flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${permissions.canExport && !loading
                ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover-lift'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Exportando...' : 'Exportar'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Panel de Elementos */}
        <div className="editor-sidebar w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Elementos</h3>

            {user?.plan === 'free' && (
              <div className="fade-in bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Plan Limitado</p>
                    <p className="text-xs text-amber-700 mt-1">Solo 3 elementos básicos disponibles</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {availableElements.map((element, idx) => (
                <div
                  key={element.id}
                  onClick={() => onAddElement(element)}
                  className="editor-element-item flex items-center p-3 mb-2 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors group"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <element.icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600 mr-3 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">{element.name}</span>
                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-500 ml-auto transition-colors" />
                </div>
              ))}
            </div>

            {user?.plan === 'free' && (
              <div className="scale-in mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600 mb-3 font-medium">Elementos Pro/Premium:</p>
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-400">
                    <Lock className="w-3 h-3 mr-2" />
                    Menú de navegación avanzado
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Lock className="w-3 h-3 mr-2" />
                    Formularios seguros
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Lock className="w-3 h-3 mr-2" />
                    Galería de imágenes
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Canvas Principal */}
        <div className="editor-canvas flex-1 p-6">
          <div className="min-h-[600px] bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 hover:border-blue-400 transition-colors shadow-sm">
            {draggedElements.length === 0 ? (
              <div className="editor-empty-state text-center py-20">
                <div className="mb-6">
                  <Type className="editor-empty-icon w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <Shield className="w-12 h-12 text-blue-300 mx-auto" />
                </div>
                <h3 className="text-2xl font-medium text-gray-500 mb-3">Comienza a construir tu página web</h3>
                <p className="text-gray-400 mb-6">Haz clic en los elementos del panel izquierdo para agregarlos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {draggedElements.map((element, index) => (
                  <CanvasElement
                    key={`${element.id}-${index}`}
                    element={element}
                    index={index}
                    selectedElement={selectedElement}
                    onSelect={onSelectElement}
                    onDuplicate={onDuplicateElement}
                    onRemove={onRemoveElement}
                    getDefaultContent={getDefaultContent}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de Propiedades */}
        <div className="editor-properties w-80 bg-white border-l border-gray-200 h-screen overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Propiedades</h3>

            {selectedElement !== null ? (
              <div className="space-y-6 fade-in">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-800">Elemento seleccionado:</p>
                  <p className="text-xs text-blue-600 mt-1">{draggedElements[selectedElement]?.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contenido</label>
                  <textarea
                    rows="3"
                    value={draggedElements[selectedElement]?.settings?.content || ''}
                    onChange={(e) => onUpdateElement('content', e.target.value)}
                    className="login-input w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Escribe el contenido del elemento..."
                  />
                </div>

                {draggedElements[selectedElement]?.type === 'image' && (
                  <div className="slide-up">
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL de Imagen</label>
                    <input
                      type="url"
                      value={draggedElements[selectedElement]?.settings?.imageUrl || ''}
                      onChange={(e) => onUpdateElement('imageUrl', e.target.value)}
                      className="login-input w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    type="color"
                    value={draggedElements[selectedElement]?.settings?.color || '#3B82F6'}
                    onChange={(e) => onUpdateElement('color', e.target.value)}
                    className="w-full h-12 border border-gray-300 rounded-md cursor-pointer hover-scale"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño</label>
                  <select
                    value={draggedElements[selectedElement]?.settings?.size || 'medium'}
                    onChange={(e) => onUpdateElement('size', e.target.value)}
                    className="login-input w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="small">Pequeño</option>
                    <option value="medium">Mediano</option>
                    <option value="large">Grande</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enlace</label>
                  <input
                    type="url"
                    value={draggedElements[selectedElement]?.settings?.link || ''}
                    onChange={(e) => onUpdateElement('link', e.target.value)}
                    className="login-input w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="https://ejemplo.com"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4 pulse-animation" />
                <p className="text-gray-500 text-sm">Selecciona un elemento para editarlo</p>
              </div>
            )}

            {user?.plan === 'free' && (
              <div className="editor-upgrade-card mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="text-center">
                  <Crown className="w-10 h-10 text-purple-600 mx-auto mb-3 bounce-animation" />
                  <h4 className="font-medium text-gray-800 mb-2">¿Necesitas más poder?</h4>
                  <p className="text-sm text-gray-600 mb-4">Desbloquea todos los elementos y funciones profesionales</p>
                  <button
                    onClick={() => onOpenPaymentModal({
                      id: 'pro',
                      name: 'Profesional',
                      price: '$9.99/mes'
                    })}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 text-sm font-medium transition-all shadow-sm hover-lift"
                  >
                    Actualizar Plan
                  </button>
                </div>
              </div>
            )}

            <div className="editor-security-badge mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-3">
                <Shield className="w-5 h-5 text-green-600 mr-2" />
                <h4 className="font-medium text-green-800">Seguridad WebShield</h4>
              </div>
              <ul className="text-sm text-green-700 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Formularios protegidos XSS
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  HTTPS obligatorio
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validación automática
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Código limpio y seguro
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorScreen;
