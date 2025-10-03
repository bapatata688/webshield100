import React, { useState } from 'react';
import {
  Shield, ChevronLeft, Undo2, Redo2, Save, Download, Eye,
  Loader2, Type, AlertTriangle, Lock, Plus, Settings, CheckCircle, Crown,
  Menu, X, ChevronDown, ChevronUp
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
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileProperties, setShowMobileProperties] = useState(false);
  const [showPropertiesCollapsed, setShowPropertiesCollapsed] = useState(false);

  const availableElements = user?.plan === 'free' ? ELEMENTS.free : ELEMENTS.pro;
  const permissions = getCanvasPermissions(user?.plan);

  if (isPreview) {
    return (
      <div className="preview-content min-h-screen bg-gray-50">
        <div className="preview-header bg-gradient-to-r from-gray-900 to-blue-900 text-white p-4 md:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-6xl mx-auto">
            <div className="flex items-center space-x-3 md:space-x-4">
              <Eye className="w-5 h-5 md:w-6 md:h-6" />
              <div>
                <h3 className="text-lg md:text-xl font-semibold">Vista Previa</h3>
                <p className="text-blue-200 text-xs md:text-sm truncate max-w-[200px] sm:max-w-none">
                  {currentProject?.name || 'Proyecto sin nombre'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onPreview(false)}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors hover-lift text-sm md:text-base"
            >
              Volver al Editor
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {draggedElements.length === 0 ? (
            <div className="preview-empty-state text-center py-12 md:py-20 bg-white rounded-lg shadow-sm">
              <Type className="editor-empty-icon w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-4 md:mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 md:mb-4 px-4">
                Tu página web aparecerá aquí
              </h2>
              <p className="text-gray-600 text-base md:text-lg px-4">
                Agrega elementos desde el editor para ver tu sitio en acción
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
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
      {/* Header Responsive */}
      <div className="editor-header bg-white border-b border-gray-200 p-3 md:p-4 shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-7xl mx-auto gap-2">
          {/* Left Section */}
          <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
            <button
              onClick={onBackToDashboard}
              className="text-gray-400 hover:text-gray-600 editor-toolbar-button flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="lg:hidden text-gray-600 hover:text-gray-900 flex-shrink-0"
            >
              {showMobileSidebar ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Shield className="w-6 h-6 md:w-8 md:h-8 text-blue-600 login-shield flex-shrink-0 hidden sm:block" />
            <h1 className="text-base md:text-xl font-bold text-gray-800 hidden sm:block">WebShield</h1>
            <span className="text-sm text-gray-400 hidden md:inline">|</span>
            <span className="text-xs md:text-sm font-medium text-gray-700 truncate max-w-[100px] md:max-w-[200px]">
              {currentProject?.name || 'Proyecto'}
            </span>
            {isSaving && (
              <div className="editor-save-indicator hidden md:flex items-center text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                <span className="text-xs">Guardando...</span>
              </div>
            )}
          </div>

          {/* Right Section - Responsive Buttons */}
          <div className="flex items-center space-x-1 md:space-x-3">
            {/* Desktop Undo/Redo */}
            <div className="hidden md:flex items-center space-x-2">
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
            </div>

            {/* Save Button - Always visible */}
            <button
              onClick={onSave}
              disabled={!permissions.canSave || isSaving}
              className={`editor-toolbar-button flex items-center px-2 md:px-4 py-2 rounded-lg font-medium transition-colors text-xs md:text-sm ${permissions.canSave && !isSaving
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover-lift'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin md:mr-2" />
              ) : (
                <Save className="w-4 h-4 md:mr-2" />
              )}
              <span className="hidden md:inline">{isSaving ? 'Guardando...' : 'Guardar'}</span>
            </button>

            {/* Preview Button */}
            <button
              onClick={() => onPreview(true)}
              className="editor-toolbar-button bg-blue-600 text-white px-2 md:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center font-medium shadow-sm transition-colors hover-lift text-xs md:text-sm"
            >
              <Eye className="w-4 h-4 md:mr-2" />
              <span className="hidden sm:inline">Preview</span>
            </button>

            {/* Export Button - Hidden on mobile */}
            <button
              onClick={onExport}
              disabled={!permissions.canExport || loading}
              className={`hidden sm:flex editor-toolbar-button items-center px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-xs md:text-sm ${permissions.canExport && !loading
                ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover-lift'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin md:mr-2" />
              ) : (
                <Download className="w-4 h-4 md:mr-2" />
              )}
              <span className="hidden md:inline">{loading ? 'Exportando...' : 'Exportar'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto relative">
        {/* Sidebar - Responsive */}
        <div
          className={`
            editor-sidebar bg-white border-r border-gray-200 overflow-y-auto
            fixed lg:relative inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out
            w-80 lg:w-80
            ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${showMobileSidebar ? 'h-screen' : 'lg:h-[calc(100vh-64px)]'}
          `}
        >
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Elementos</h3>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {user?.plan === 'free' && (
              <div className="fade-in bg-amber-50 border border-amber-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs md:text-sm font-medium text-amber-800">Plan Limitado</p>
                    <p className="text-xs text-amber-700 mt-1">Solo 3 elementos básicos disponibles</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {availableElements.map((element, idx) => (
                <div
                  key={element.id}
                  onClick={() => {
                    onAddElement(element);
                    setShowMobileSidebar(false);
                  }}
                  className="editor-element-item flex items-center p-3 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors group"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <element.icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600 mr-3 transition-colors flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors flex-1">
                    {element.name}
                  </span>
                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>

            {user?.plan === 'free' && (
              <div className="scale-in mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600 mb-3 font-medium">Elementos Pro/Premium:</p>
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-400">
                    <Lock className="w-3 h-3 mr-2 flex-shrink-0" />
                    Menú de navegación avanzado
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Lock className="w-3 h-3 mr-2 flex-shrink-0" />
                    Formularios seguros
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Lock className="w-3 h-3 mr-2 flex-shrink-0" />
                    Galería de imágenes
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overlay para mobile */}
        {showMobileSidebar && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Canvas Principal - Responsive */}
        <div className="editor-canvas flex-1 p-3 md:p-6 min-h-[calc(100vh-64px)] overflow-auto">
          <div className="min-h-[400px] md:min-h-[600px] bg-white rounded-xl border-2 border-dashed border-gray-300 p-4 md:p-8 hover:border-blue-400 transition-colors shadow-sm">
            {draggedElements.length === 0 ? (
              <div className="editor-empty-state text-center py-12 md:py-20">
                <div className="mb-4 md:mb-6">
                  <Type className="editor-empty-icon w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-3 md:mb-4" />
                  <Shield className="w-10 h-10 md:w-12 md:h-12 text-blue-300 mx-auto" />
                </div>
                <h3 className="text-xl md:text-2xl font-medium text-gray-500 mb-2 md:mb-3 px-4">
                  Comienza a construir tu página web
                </h3>
                <p className="text-sm md:text-base text-gray-400 mb-4 md:mb-6 px-4">
                  Haz clic en los elementos del panel {window.innerWidth < 1024 ? 'del menú' : 'izquierdo'} para agregarlos
                </p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {draggedElements.map((element, index) => (
                  <CanvasElement
                    key={`${element.id}-${index}`}
                    element={element}
                    index={index}
                    selectedElement={selectedElement}
                    onSelect={(idx) => {
                      onSelectElement(idx);
                      if (window.innerWidth < 1024) {
                        setShowMobileProperties(true);
                      }
                    }}
                    onDuplicate={onDuplicateElement}
                    onRemove={onRemoveElement}
                    getDefaultContent={getDefaultContent}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de Propiedades - Responsive */}
        <div
          className={`
            editor-properties bg-white border-l border-gray-200 overflow-y-auto
            fixed lg:relative inset-y-0 right-0 z-30 transform transition-transform duration-300 ease-in-out
            w-80 lg:w-80
            ${showMobileProperties ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            ${showMobileProperties ? 'h-screen' : 'lg:h-[calc(100vh-64px)]'}
          `}
        >
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Propiedades</h3>
              <button
                onClick={() => setShowMobileProperties(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedElement !== null ? (
              <div className="space-y-4 md:space-y-6 fade-in max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
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

            {/* plan card - Collapsible on mobile */}
            {user?.plan === 'free' && (
              <div className="editor-upgrade-card mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="text-center">
                  <Crown className="w-8 h-8 md:w-10 md:h-10 text-purple-600 mx-auto mb-2 md:mb-3 bounce-animation" />
                  <h4 className="font-medium text-gray-800 mb-2 text-sm md:text-base">
                    ¿Necesitas más poder?
                  </h4>
                  <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                    Desbloquea todos los elementos y funciones profesionales
                  </p>
                  <button
                    onClick={() => onOpenPaymentModal({
                      id: 'pro',
                      name: 'Profesional',
                      price: '$9.99/mes'
                    })}
                    className="relative z-50 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 md:py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 text-xs md:text-sm font-medium transition-all shadow-sm hover-lift active:scale-95"
                  >
                    Actualizar Plan
                  </button>

                </div>
              </div>
            )}
            {/* Security Badge - Collapsible on mobile */}
            <div className="editor-security-badge mt-4 md:mt-6">
              <button
                onClick={() => setShowPropertiesCollapsed(!showPropertiesCollapsed)}
                className="w-full flex items-center justify-between p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg lg:pointer-events-none"
              >
                <div className="flex items-center">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-green-800 text-sm md:text-base">Seguridad WebShield</h4>
                </div>
                <ChevronDown className={`w-5 h-5 text-green-600 lg:hidden transition-transform ${showPropertiesCollapsed ? 'rotate-180' : ''}`} />
              </button>
              <div className={`${showPropertiesCollapsed || window.innerWidth >= 1024 ? 'block' : 'hidden'} mt-2 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg`}>
                <ul className="text-xs md:text-sm text-green-700 space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2 flex-shrink-0" />
                    Formularios protegidos XSS
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2 flex-shrink-0" />
                    HTTPS obligatorio
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2 flex-shrink-0" />
                    Validación automática
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2 flex-shrink-0" />
                    Código limpio y seguro
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay para properties mobile */}
        {showMobileProperties && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setShowMobileProperties(false)}
          />
        )}

        {/* Mobile Properties Toggle Button */}
        {selectedElement !== null && !showMobileProperties && (
          <button
            onClick={() => setShowMobileProperties(true)}
            className="lg:hidden fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg z-10 hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default EditorScreen;
