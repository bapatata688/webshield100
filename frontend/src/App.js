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
import { AppProvider } from './context/AppContext';
import { authAPI, projectsAPI } from './api/config.js';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import PlansScreen from './components/PlansScreen';
import EditorScreen from './components/EditorScreen';
import PaymentModal from './components/PaymentModal';

const WebShield = () => {
  // Estados principales
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

  const handleProjectSelect = (project) => {
    setCurrentProject(project);
    if (project.elements) {
      setDraggedElements(project.elements);
      saveToHistory([], -1, project.elements, setHistory, setHistoryIndex);
    } else {
      setDraggedElements([]);
    }
    setCurrentScreen(SCREEN_TYPES.EDITOR);
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
    const validation = validateUserPlan(user, 'save_project');
    if (!validation.allowed) {
      addNotification(setNotifications, validation.reason, 'error');
      return;
    }

    if (!currentProject?.id) {
      addNotification(setNotifications, 'Error: No hay proyecto activo para guardar.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await projectsAPI.save?.(currentProject.id, draggedElements);
      addNotification(setNotifications, 'Proyecto guardado exitosamente!', 'success');
    } catch (error) {
      addNotification(setNotifications, `Error guardando: ${error.message}`, 'error');
    } finally {
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

  // Crear el objeto de valor para el context
  const contextValue = {
    // Estados
    user,
    currentScreen,
    projects,
    currentProject,
    draggedElements,
    selectedElement,
    isPreview,
    loading,
    notifications,
    searchQuery,
    history,
    historyIndex,
    isSaving,
    showPayment,
    selectedPlan,

    // Setters
    setUser,
    setCurrentScreen,
    setProjects,
    setCurrentProject,
    setDraggedElements,
    setSelectedElement,
    setIsPreview,
    setLoading,
    setNotifications,
    setSearchQuery,
    setHistory,
    setHistoryIndex,
    setIsSaving,
    setShowPayment,
    setSelectedPlan,

    // Funciones de negocio
    handleLogin,
    handleLogout,
    handleProjectSelect,
    handlePlanSelect,
    handlePaymentSuccess,
    addElement,
    updateSelectedElement,
    removeElement,
    duplicateElement,
    undo,
    redo,
    handleSave,
    handleExport,
    loadProjects,
    loadUserProfile
  };

  // Renderizado condicional simplificado (ahora los componentes usan context)
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case SCREEN_TYPES.LOGIN:
        return <LoginScreen />;

      case SCREEN_TYPES.DASHBOARD:
        return <DashboardScreen />;

      case SCREEN_TYPES.PLANS:
        return <PlansScreen />;

      case SCREEN_TYPES.EDITOR:
        return <EditorScreen getDefaultContent={getDefaultContent} />;

      default:
        return <div>Pantalla no encontrada</div>;
    }
  };

  return (
    <AppProvider value={contextValue}>
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
    </AppProvider>
  );
};

export default WebShield;
