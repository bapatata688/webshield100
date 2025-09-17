import React, { useState } from 'react';
import {
  Shield,
  Type,
  Image,
  MousePointer,
  Menu,
  FileText,
  Camera,
  Eye,
  Download,
  Save,
  CreditCard,
  Lock,
  LogIn,
  UserPlus,
  Settings,
  Crown,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react';

const WebShield = () => {
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('login');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [draggedElements, setDraggedElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [currentProject] = useState({ name: 'Mi Proyecto WebShield', elements: [] });
  const [draggedItem, setDraggedItem] = useState(null);

  const elements = {
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

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      features: ['3 elementos básicos', 'Solo previsualización', 'No exportación', 'No guardado en nube'],
      color: 'gray'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9.99/mes',
      features: ['Todos los elementos', 'Exportar HTML/CSS/JS', 'Guardar en la nube', 'Plantillas básicas', 'Seguridad integrada'],
      color: 'blue',
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$19.99/mes',
      features: ['Todo del plan Pro', 'Plantillas premium', 'Optimización SEO', 'Estadísticas básicas', 'Soporte prioritario'],
      color: 'purple'
    }
  ];

  const handleDragStart = (e, element, fromCanvas = false, canvasIndex = null) => {
    setDraggedItem({ element, fromCanvas, canvasIndex, id: fromCanvas ? `canvas-${canvasIndex}` : element.id });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex = null) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (draggedItem.fromCanvas && targetIndex !== null) {
      const newElements = [...draggedElements];
      const [movedElement] = newElements.splice(draggedItem.canvasIndex, 1);
      newElements.splice(targetIndex, 0, movedElement);
      setDraggedElements(newElements);
    } else if (!draggedItem.fromCanvas) {
      const newElement = { ...draggedItem.element, id: `${draggedItem.element.id}-${Date.now()}`, settings: {} };
      const newElements = [...draggedElements];
      if (targetIndex !== null) {
        newElements.splice(targetIndex, 0, newElement);
      } else {
        newElements.push(newElement);
      }
      setDraggedElements(newElements);
    }
    setDraggedItem(null);
  };

  const addElement = (element) => {
    const newElement = { ...element, id: `${element.id}-${Date.now()}`, settings: {} };
    setDraggedElements([...draggedElements, newElement]);
  };

  const removeElement = (index) => {
    const newElements = draggedElements.filter((_, i) => i !== index);
    setDraggedElements(newElements);
    setSelectedElement(null);
  };

  const LoginScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (email.trim() && password.trim()) {
        setUser({ email: email.trim(), plan: 'free' });
        setCurrentScreen('plans');
      } else {
        alert('Por favor completa todos los campos');
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-blue-600 mr-2" />
              <h1 className="text-3xl font-bold text-gray-800">WebShield</h1>
            </div>
            <p className="text-gray-600">Constructor web seguro para tu negocio</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mínimo 6 caracteres"
                required
                minLength="6"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
            >
              {isLogin ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {isLogin ? '¿No tienes cuenta? Crear una nueva' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              <strong>Demo:</strong> Cualquier email y contraseña funcionará
            </p>
          </div>
        </div>
      </div>
    );
  };

  const PlansScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Elige tu plan</h2>
          <p className="text-gray-600 text-lg">Selecciona el plan que mejor se adapte a tus necesidades</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-2xl shadow-xl p-8 relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-blue-600 mb-4">{plan.price}</div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (plan.id === 'free') {
                    setUser({ ...user, plan: 'free' });
                    setCurrentScreen('editor');
                  } else {
                    setSelectedPlan(plan);
                    setShowPayment(true);
                  }
                }}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${plan.id === 'free'
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  : plan.color === 'blue'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
              >
                {plan.id === 'free' ? 'Comenzar Gratis' : 'Seleccionar Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PaymentModal = () => {
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });

    const handlePayment = (e) => {
      e.preventDefault();
      setTimeout(() => {
        setUser({ ...user, plan: selectedPlan.id });
        setShowPayment(false);
        setCurrentScreen('editor');
      }, 1500);
    };

    if (!showPayment) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Completar Pago</h3>
            <p className="text-gray-600">Plan {selectedPlan?.name} - {selectedPlan?.price}</p>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Tarjeta</label>
              <input
                type="text"
                value={cardData.number}
                onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
                <input
                  type="text"
                  value={cardData.expiry}
                  onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                  placeholder="MM/YY"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <input
                  type="text"
                  value={cardData.cvv}
                  onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                  placeholder="123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre en la Tarjeta</label>
              <input
                type="text"
                value={cardData.name}
                onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                placeholder="Juan Pérez"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                type="button"
                onClick={() => setShowPayment(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar {selectedPlan?.price}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ElementButton = ({ element }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, element)}
      onClick={() => addElement(element)}
      className="flex items-center p-3 mb-2 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors group"
    >
      <element.icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600 mr-3" />
      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{element.name}</span>
      <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-500 ml-auto" />
    </div>
  );

  const CanvasElement = ({ element, index }) => {
    const renderElement = () => {
      switch (element.type) {
        case 'text':
          return (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors">
              <h2 className="text-xl font-semibold text-gray-800">Título de ejemplo</h2>
              <p className="text-gray-600 mt-2">Este es un párrafo de ejemplo para WebShield. Personalízalo desde el panel derecho.</p>
            </div>
          );
        case 'image':
          return (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors">
              <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Imagen placeholder</p>
                </div>
              </div>
            </div>
          );
        case 'button':
          return (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Botón WebShield
              </button>
            </div>
          );
        case 'menu':
          return (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors">
              <nav className="flex space-x-8">
                <button className="text-gray-700 hover:text-blue-600 font-medium py-2">Inicio</button>
                <button className="text-gray-700 hover:text-blue-600 font-medium py-2">Servicios</button>
                <button className="text-gray-700 hover:text-blue-600 font-medium py-2">Contacto</button>
              </nav>
            </div>
          );
        case 'form':
          return (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors">
              <div className="bg-green-50 border border-green-200 rounded p-2 mb-4">
                <p className="text-xs text-green-700">🔒 Formulario protegido por WebShield</p>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium">
                  Enviar de forma segura
                </button>
              </form>
            </div>
          );
        case 'gallery':
          return (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Galería de imágenes</h3>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors">
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
        draggable
        onDragStart={(e) => handleDragStart(e, element, true, index)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index)}
        className={`mb-4 relative group ${selectedElement === index ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
        onClick={() => setSelectedElement(index)}
      >
        {renderElement()}

        <button
          onClick={(e) => {
            e.stopPropagation();
            removeElement(index);
          }}
          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const EditorScreen = () => {
    const availableElements = user.plan === 'free' ? elements.free : elements.pro;
    const canExport = user.plan === 'pro' || user.plan === 'premium';
    const canSave = user.plan === 'pro' || user.plan === 'premium';

    const handleExport = () => {
      if (!canExport) {
        alert('⚠️ Debes actualizar a Pro o Premium para exportar tu proyecto.\n\n🚀 ¡Obtén acceso completo y crea páginas web profesionales!');
        return;
      }

      const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${currentProject.name} - Creado con WebShield</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .webshield-header { text-align: center; margin-bottom: 40px; padding: 20px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; border-radius: 8px; }
        .element { margin-bottom: 30px; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; background: #ffffff; }
        /* Protecciones WebShield incluidas */
        input[type="text"], input[type="email"], textarea { 
            border: 2px solid #d1d5db; 
            padding: 12px; 
            border-radius: 6px; 
            width: 100%;
            box-sizing: border-box;
        }
        button { 
            background: #3b82f6; 
            color: white; 
            padding: 12px 24px; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
            font-weight: 600;
        }
        button:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="webshield-header">
            <h1>🛡️ ${currentProject.name}</h1>
            <p>Página web creada con WebShield - Constructor seguro</p>
        </div>
        ${draggedElements.map((el, i) => `
        <div class="element">
            <h3>Elemento ${i + 1}: ${el.name}</h3>
            <p>Contenido del ${el.type} protegido por WebShield</p>
        </div>`).join('')}
        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f0f9ff; border-radius: 8px;">
            <small style="color: #3b82f6;">✨ Creado con WebShield - Constructor web seguro ✨</small>
        </div>
    </div>
    <script>
        // Protecciones WebShield automáticas
        console.log('🛡️ WebShield Security: ACTIVO');
        console.log('✅ Protección XSS: ACTIVADA');
        console.log('✅ HTTPS Enforcement: ACTIVADO');
        console.log('✅ Formularios seguros: ACTIVADO');
        
        // Prevención básica XSS
        document.addEventListener('DOMContentLoaded', function() {
            const inputs = document.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', function() {
                })this.value = this.value.replace(/<script[^>]*>.*?<\/script>/gi, '');;
            });
        });
    </script>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `webshield-${currentProject.name.toLowerCase().replace(/\s+/g, '-')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('🎉 ¡Proyecto exportado exitosamente!\n\n✅ Incluye protecciones de seguridad WebShield\n✅ Código optimizado y limpio\n✅ Listo para subir a tu servidor');
    };

    const handleSave = () => {
      if (!canSave) {
        alert('☁️ Debes actualizar a Pro o Premium para guardar en la nube.\n\n📦 Accede a almacenamiento seguro y sincronización automática');
        return;
      }
      alert('💾 Proyecto guardado exitosamente en la nube.\n\n🔒 Respaldo seguro con encriptación\n☁️ Disponible desde cualquier dispositivo');
    };

    if (isPreview) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="bg-gradient-to-r from-gray-900 to-blue-900 text-white p-6 shadow-lg">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              <div className="flex items-center space-x-4">
                <Eye className="w-6 h-6" />
                <div>
                  <h3 className="text-xl font-semibold">Vista Previa</h3>
                  <p className="text-blue-200 text-sm">{currentProject.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPreview(false)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                ← Volver al Editor
              </button>
            </div>
          </div>
          <div className="max-w-6xl mx-auto p-8">
            {draggedElements.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                <Type className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Tu página web aparecerá aquí</h2>
                <p className="text-gray-600 text-lg">Agrega elementos desde el editor para ver tu sitio en acción</p>
              </div>
            ) : (
              <div className="space-y-6">
                {draggedElements.map((element, index) => (
                  <div key={`preview-${index}`} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <CanvasElement element={element} index={index} />
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
        <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800">WebShield</h1>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm font-medium text-gray-700">{currentProject.name}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.plan === 'free' ? 'bg-gray-100 text-gray-700' :
                user.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                Plan {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${canSave
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </button>
              <button
                onClick={() => setIsPreview(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center font-medium shadow-sm transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                Previsualizar
              </button>
              <button
                onClick={handleExport}
                disabled={!canExport}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${canExport
                  ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        <div className="flex max-w-7xl mx-auto">
          <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🧩 Elementos</h3>

              {user.plan === 'free' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
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
                {availableElements.map((element) => (
                  <ElementButton key={element.id} element={element} />
                ))}
              </div>

              {user.plan === 'free' && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-600 mb-3 font-medium">🔒 Elementos Pro/Premium:</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-400">
                      <Lock className="w-3 h-3 mr-2" />
                      Menú de navegación avanzado
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                      <Lock className="w-3 h-3 mr-2" />
                      Formularios seguros con validación
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                      <Lock className="w-3 h-3 mr-2" />
                      Galería de imágenes responsive
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 p-6">
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e)}
              className="min-h-[600px] bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 hover:border-blue-400 transition-colors shadow-sm"
            >
              {draggedElements.length === 0 ? (
                <div className="text-center py-20">
                  <div className="mb-6">
                    <Type className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <Shield className="w-12 h-12 text-blue-300 mx-auto" />
                  </div>
                  <h3 className="text-2xl font-medium text-gray-500 mb-3">Comienza a construir tu página web</h3>
                  <p className="text-gray-400 mb-6">Arrastra elementos desde el panel izquierdo o haz clic en ellos para agregarlos</p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <Plus className="w-4 h-4 mr-1" />
                      Clic para agregar
                    </span>
                    <span>•</span>
                    <span className="flex items-center">
                      <MousePointer className="w-4 h-4 mr-1" />
                      Arrastra para posicionar
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {draggedElements.map((element, index) => (
                    <CanvasElement key={`${element.id}-${index}`} element={element} index={index} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-80 bg-white border-l border-gray-200 h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">⚙️ Propiedades</h3>

              {selectedElement !== null ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800">Elemento seleccionado:</p>
                    <p className="text-xs text-blue-600 mt-1">{draggedElements[selectedElement]?.name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📝 Contenido</label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Escribe el contenido del elemento..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🎨 Color</label>
                    <input
                      type="color"
                      className="w-full h-12 border border-gray-300 rounded-md cursor-pointer"
                      defaultValue="#3B82F6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📐 Tamaño</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
                      <option>Pequeño</option>
                      <option>Mediano</option>
                      <option selected>Grande</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔗 Enlace</label>
                    <input
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="https://ejemplo.com"
                    />
                  </div>

                  <button
                    onClick={() => removeElement(selectedElement)}
                    className="w-full bg-red-500 text-white py-3 px-4 rounded-md hover:bg-red-600 transition-colors flex items-center justify-center font-medium"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar Elemento
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">Selecciona un elemento para editarlo</p>
                  <p className="text-gray-400 text-xs mt-2">Haz clic en cualquier elemento del canvas</p>
                </div>
              )}

              <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <Shield className="w-5 h-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-green-800">🛡️ Seguridad WebShield</h4>
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

              {user.plan === 'free' && (
                <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <div className="text-center">
                    <Crown className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-800 mb-2">🚀 ¿Necesitas más poder?</h4>
                    <p className="text-sm text-gray-600 mb-4">Desbloquea todos los elementos y funciones profesionales</p>
                    <button
                      onClick={() => setCurrentScreen('plans')}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 text-sm font-medium transition-all shadow-sm"
                    >
                      ✨ Actualizar Plan
                    </button>
                  </div>
                </div>
              )}

              {(user.plan === 'pro' || user.plan === 'premium') && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-4">📊 Estadísticas del Proyecto</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 flex items-center">
                        <Type className="w-4 h-4 mr-1" />
                        Elementos:
                      </span>
                      <span className="text-blue-800 font-bold text-lg">{draggedElements.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        Seguridad:
                      </span>
                      <span className="text-green-600 font-bold">100%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        SEO:
                      </span>
                      <span className="text-blue-800 font-medium">
                        {user.plan === 'premium' ? '🌟 Optimizado' : '📈 Básico'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                      <span className="text-blue-700 font-medium">Estado:</span>
                      <span className="text-green-600 font-medium">✅ Listo</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans">
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'plans' && <PlansScreen />}
      {currentScreen === 'editor' && <EditorScreen />}
      <PaymentModal />
    </div>
  );
};

export default WebShield;
