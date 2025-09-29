import { Type, Image, MousePointer, Menu, FileText, Camera } from 'lucide-react';

export const ELEMENTS = {
  free: [
    { id: 'text', name: 'Texto', icon: Type, type: 'text' },
    { id: 'image', name: 'Imagen', icon: Image, type: 'image' },
    { id: 'button', name: 'Botón', icon: MousePointer, type: 'button' }
  ],
  pro: [
    { id: 'text', name: 'Texto', icon: Type, type: 'text' },
    { id: 'image', name: 'Imagen', icon: Image, type: 'image' },
    { id: 'button', name: 'Botón', icon: MousePointer, type: 'button' },
    { id: 'menu', name: 'Menú', icon: Menu, type: 'menu' },
    { id: 'form', name: 'Formulario', icon: FileText, type: 'form' },
    { id: 'gallery', name: 'Galería', icon: Camera, type: 'gallery' }
  ]
};

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    features: ['3 elementos básicos', '1 proyecto', 'Solo previsualización'],
    color: 'gray'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99/mes',
    features: ['Todos los elementos', 'Proyectos ilimitados', 'Exportar HTML', 'Plantillas'],
    color: 'blue',
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19.99/mes',
    features: ['Todo del plan Pro', 'Estadísticas avanzadas', 'Soporte prioritario'],
    color: 'purple'
  }
];

export const SCREEN_TYPES = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  EDITOR: 'editor',
  PLANS: 'plans',
  PREVIEW: 'preview'
};

export const ELEMENT_DEFAULTS = {
  text: 'Este es un texto editable. Haz clic para personalizarlo.',
  button: 'Mi Botón',
  image: 'Imagen placeholder'
};

export const DEFAULT_ELEMENT_SETTINGS = {
  color: '#3B82F6',
  size: 'medium',
  link: '',
  imageUrl: ''
};

export const APP_CONFIG = {
  STORAGE_KEY: 'webshield_token',
  MAX_FREE_ELEMENTS: 3,
  MAX_FREE_PROJECTS: 1
};
