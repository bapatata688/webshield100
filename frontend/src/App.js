import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { SCREEN_TYPES, APP_CONFIG } from './constants/appConstants';
import {
  createNewElement,
  addNotification,
  saveToHistory,
  validateUserPlan,
  getDefaultContent
} from './utils/appUtils';
import { authAPI, projectsAPI } from './api/config.js';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import PlansScreen from './components/PlansScreen';
import EditorScreen from './components/EditorScreen';
import PaymentModal from './components/PaymentModal';

// Estados principales
const WebShield = () => {
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState(SCREEN_TYPES.LOGIN);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [draggedElements, setDraggedElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  // Estados para pagos
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  // Efectos de inicialización
  useEffect(() => {
    const token = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
    if (token && !user) {
      loadUserProfile();
    }
  }, []);

  useEffect(() => {
    if (user && currentScreen === SCREEN_TYPES.DASHBOARD) {
      loadProjects();
    }
  }, [user, currentScreen]);

  // Funciones de carga
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile?.() || { user: { email: 'demo@example.com', plan: 'free' } };
      setUser(response.user);
      setCurrentScreen(SCREEN_TYPES.DASHBOARD);
    } catch (error) {
      console.error('Error loading profile:', error);
      setCurrentScreen(SCREEN_TYPES.LOGIN);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll?.() || { projects: [] };
      setProjects(response.projects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de navegación
  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentScreen(SCREEN_TYPES.DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem(APP_CONFIG.STORAGE_KEY);
    setUser(null);
    setCurrentProject(null);
    setDraggedElements([]);
    setCurrentScreen(SCREEN_TYPES.LOGIN);
  };

  const handleProjectSelect = async (project) => {
    console.log(' Seleccionando proyecto:', project.id);

    try {
      setLoading(true);

      // Cargar proyecto completo con elementos
      const response = await projectsAPI.getById(project.id);
      console.log(' Proyecto completo recibido:', response);

      const fullProject = response.project;

      setCurrentProject(fullProject);

      if (fullProject.elements && fullProject.elements.length > 0) {
        console.log(' Cargando', fullProject.elements.length, 'elementos');
        setDraggedElements(fullProject.elements);
        saveToHistory([], -1, fullProject.elements, setHistory, setHistoryIndex);
      } else {
        console.log(' Proyecto sin elementos');
        setDraggedElements([]);
      }

      setCurrentScreen(SCREEN_TYPES.EDITOR);
    } catch (error) {
      console.error(' Error cargando proyecto:', error);
      addNotification(setNotifications, 'Error cargando proyecto', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handlePlanSelect = (plan) => {
    console.log("Plan selected:", plan);
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (message) => {
    addNotification(setNotifications, message, 'success');
    setShowPayment(false);
    setCurrentScreen(SCREEN_TYPES.DASHBOARD);
  };

  // Funciones del editor
  const addElement = (element) => {
    const validation = validateUserPlan(user, 'add_element');
    if (!validation.allowed) {
      addNotification(setNotifications, validation.reason, 'error');
      return;
    }

    const newElement = createNewElement(element);
    const newElements = [...draggedElements, newElement];
    setDraggedElements(newElements);
    saveToHistory(history, historyIndex, newElements, setHistory, setHistoryIndex);
  };

  const updateSelectedElement = (property, value) => {
    if (selectedElement === null) return;

    const newElements = [...draggedElements];
    if (!newElements[selectedElement].settings) {
      newElements[selectedElement].settings = {};
    }
    newElements[selectedElement].settings[property] = value;

    setDraggedElements(newElements);
    saveToHistory(history, historyIndex, newElements, setHistory, setHistoryIndex);
  };

  const removeElement = (index) => {
    const newElements = draggedElements.filter((_, i) => i !== index);
    setDraggedElements(newElements);
    saveToHistory(history, historyIndex, newElements, setHistory, setHistoryIndex);
    setSelectedElement(null);
  };

  const duplicateElement = (index) => {
    const elementToDuplicate = { ...draggedElements[index] };
    elementToDuplicate.id = `${elementToDuplicate.type}-${Date.now()}`;
    const newElements = [...draggedElements];
    newElements.splice(index + 1, 0, elementToDuplicate);
    setDraggedElements(newElements);
    saveToHistory(history, historyIndex, newElements, setHistory, setHistoryIndex);
  };

  // Funciones de historial
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setDraggedElements([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setDraggedElements([...history[historyIndex + 1]]);
    }
  };

  // Funciones de guardado y exportación
  const handleSave = async () => {
    console.log(' handleSave iniciado');

    // Validar permisos del usuario
    const validation = validateUserPlan(user, 'save_project');
    if (!validation.allowed) {
      console.log(' Usuario no tiene permisos para guardar');
      addNotification(setNotifications, validation.reason, 'error');
      return;
    }

    // Validar que hay un proyecto activo
    if (!currentProject?.id) {
      console.log(' No hay proyecto activo');
      addNotification(setNotifications, 'Error: No hay proyecto activo para guardar.', 'error');
      return;
    }

    if (isSaving) {
      console.log(' Ya hay un guardado en proceso, ignorando llamada duplicada');
      return;
    }

    try {
      setIsSaving(true);
      console.log(' Project ID:', currentProject.id);
      console.log(' Project Name:', currentProject.name);
      console.log(' draggedElements:', draggedElements);
      console.log(' Tipo de draggedElements:', typeof draggedElements);
      console.log(' Es array?:', Array.isArray(draggedElements));
      console.log(' Cantidad:', draggedElements?.length);

      // Validación de draggedElements
      if (!draggedElements) {
        console.log(' draggedElements es null/undefined, usando array vacío');
        await projectsAPI.save(currentProject.id, []);
        addNotification(setNotifications, 'Proyecto guardado (sin elementos)', 'success');
        return;
      }

      if (!Array.isArray(draggedElements)) {
        console.error(' draggedElements no es un array:', draggedElements);
        throw new Error('Error interno: Los elementos no tienen el formato correcto');
      }

      // Mostrar estructura de cada elemento
      draggedElements.forEach((el, index) => {
        console.log(`  Elemento ${index + 1}:`, {
          type: el?.type,
          hasSettings: !!el?.settings,
          settingsKeys: el?.settings ? Object.keys(el.settings) : []
        });
      });

      // Llamar al API
      const response = await projectsAPI.save(currentProject.id, draggedElements);

      addNotification(setNotifications, 'Proyecto guardado exitosamente!', 'success');

    } catch (error) {
      console.error('Tipo de error:', error.constructor.name);
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
      console.error('Error completo:', error);

      // Mensaje más específico para el usuario
      let userMessage = 'Error guardando proyecto';
      if (error.message.includes('array')) {
        userMessage = 'Error: Formato de datos incorrecto';
      } else if (error.message.includes('inválidos')) {
        userMessage = 'Error: Datos de entrada inválidos';
      } else {
        userMessage = `Error: ${error.message}`;
      }

      addNotification(setNotifications, userMessage, 'error');
    } finally {
      console.log(' Finalizando handleSave, liberando isSaving');
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    const validation = validateUserPlan(user, 'export_html');
    if (!validation.allowed) {
      addNotification(setNotifications, validation.reason, 'error');
      return;
    }

    if (!currentProject?.id) {
      addNotification(setNotifications, 'Debes guardar el proyecto primero antes de exportar.', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await projectsAPI.export?.(currentProject.id) || { html: '<html><body>Demo export</body></html>' };

      const blob = new Blob([response.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '-')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addNotification(setNotifications, 'Proyecto exportado exitosamente!', 'success');
    } catch (error) {
      addNotification(setNotifications, `Error exportando: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Renderizado condicional
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case SCREEN_TYPES.LOGIN:
        return <LoginScreen onLogin={handleLogin} />;

      case SCREEN_TYPES.DASHBOARD:
        return (
          <DashboardScreen
            user={user}
            projects={projects}
            setProjects={setProjects}
            onProjectSelect={handleProjectSelect}
            onLogout={handleLogout}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            loading={loading}
            setLoading={setLoading}
            onNavigateToPlans={() => setCurrentScreen(SCREEN_TYPES.PLANS)}
          />
        );

      case SCREEN_TYPES.PLANS:
        return (
          <PlansScreen
            user={user}
            onPlanSelect={handlePlanSelect}
            onBack={() => setCurrentScreen(user ? SCREEN_TYPES.DASHBOARD : SCREEN_TYPES.LOGIN)}
          />
        );

      case SCREEN_TYPES.EDITOR:
        return (
          <EditorScreen
            user={user}
            currentProject={currentProject}
            draggedElements={draggedElements}
            selectedElement={selectedElement}
            history={history}
            historyIndex={historyIndex}
            isPreview={isPreview}
            isSaving={isSaving}
            loading={loading}
            onAddElement={addElement}
            onSelectElement={setSelectedElement}
            onDuplicateElement={duplicateElement}
            onRemoveElement={removeElement}
            onUpdateElement={updateSelectedElement}
            onUndo={undo}
            onRedo={redo}
            onSave={handleSave}
            onExport={handleExport}
            onPreview={setIsPreview}
            onBackToDashboard={() => setCurrentScreen(SCREEN_TYPES.DASHBOARD)}
            onOpenPaymentModal={(plan) => {  // <-- AGREGAR ESTA LÍNEA
              setSelectedPlan(plan);
              setShowPayment(true);
            }}
            getDefaultContent={getDefaultContent}
          />
        );
      default:
        return <div>Pantalla no encontrada</div>;
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {renderCurrentScreen()}

      {/* Modal de pago */}
      <PaymentModal
        showPayment={showPayment}
        selectedPlan={selectedPlan}
        user={user}
        setUser={setUser}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Notificaciones globales */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-lg flex items-center space-x-2 ${notification.type === 'error'
                ? 'bg-red-500'
                : notification.type === 'success'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
                } text-white`}
            >
              <Bell className="w-4 h-4" />
              <span>{notification.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WebShield;
