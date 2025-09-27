import { ELEMENT_DEFAULTS, DEFAULT_ELEMENT_SETTINGS } from '../constants/appConstants.js';

export const getDefaultContent = (type) => {
  return ELEMENT_DEFAULTS[type] || '';
};

export const createNewElement = (element) => {
  return {
    ...element,
    id: `${element.id}-${Date.now()}`,
    settings: {
      content: getDefaultContent(element.type),
      ...DEFAULT_ELEMENT_SETTINGS
    }
  };
};

export const addNotification = (setNotifications, message, type = 'info') => {
  const notification = {
    id: Date.now(),
    message,
    type,
    timestamp: new Date()
  };
  
  setNotifications(prev => [...prev, notification]);
  
  // Auto-remove después de 5 segundos
  setTimeout(() => {
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  }, 5000);
};

export const saveToHistory = (history, historyIndex, elements, setHistory, setHistoryIndex) => {
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push([...elements]);
  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
};

export const validateUserPlan = (user, action) => {
  if (!user) return { allowed: false, reason: 'Usuario no autenticado' };
  
  switch (action) {
    case 'add_element':
      if (user.plan === 'free' && user.elementsUsed >= 3) {
        return { allowed: false, reason: 'Límite de elementos alcanzado. Actualiza tu plan.' };
      }
      break;
    case 'create_project':
      if (user.plan === 'free' && user.projectsCount >= 1) {
        return { allowed: false, reason: 'Límite de proyectos alcanzado. Actualiza tu plan.' };
      }
      break;
    case 'export_html':
      if (user.plan === 'free') {
        return { allowed: false, reason: 'Función solo disponible en plan Pro+' };
      }
      break;
    case 'save_project':
      if (user.plan === 'free') {
        return { allowed: false, reason: 'Función solo disponible en plan Pro+' };
      }
      break;
  }
  
  return { allowed: true };
};

export const getSizeClasses = (size) => {
  switch (size) {
    case 'small': return 'text-sm p-2';
    case 'large': return 'text-xl p-6';
    default: return 'text-base p-4';
  }
};

export const getCanvasPermissions = (userPlan) => {
  return {
    canExport: userPlan === 'pro' || userPlan === 'premium',
    canSave: userPlan === 'pro' || userPlan === 'premium',
    maxElements: userPlan === 'free' ? 3 : Infinity,
    maxProjects: userPlan === 'free' ? 1 : Infinity
  };
};
