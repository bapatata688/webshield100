import React, { useState, useMemo } from 'react';
import { Shield, LogIn, UserPlus, Loader2, Check, X } from 'lucide-react';
import { authAPI } from '../api/config.js';
import '../App.css';

const LoginScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // Validación de requisitos de contraseña
  const passwordRequirements = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSymbol: /[@$!%*?&]/.test(password)
    };
  }, [password]);

  const isPasswordValid = useMemo(() => {
    return Object.values(passwordRequirements).every(req => req);
  }, [passwordRequirements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      // Validar contraseña solo en registro
      if (!isLogin && !isPasswordValid) {
        alert('La contraseña no cumple con todos los requisitos de seguridad');
        return;
      }

      try {
        setIsLoading(true);
        let response;
        if (isLogin) {
          response = await authAPI.login({ email: email.trim(), password });
        } else {
          response = await authAPI.register({
            email: email.trim(),
            password,
            plan: 'free'
          });
        }
        localStorage.setItem('webshield_token', response.token);
        onLogin(response.user);
      } catch (error) {
        alert(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="login-container min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="login-form bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="login-logo flex items-center justify-center mb-4">
            <Shield className="login-shield w-10 h-10 text-blue-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">WebShield</h1>
          </div>
          <p className="text-gray-600 fade-in">Constructor web seguro para tu negocio</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="tu@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="slide-up" style={{ animationDelay: '0.3s' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => !isLogin && setShowPasswordRequirements(true)}
              onBlur={() => setShowPasswordRequirements(false)}
              className="login-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mínimo 8 caracteres"
              required
              minLength="8"
              disabled={isLoading}
            />

            {/* Indicadores de requisitos de contraseña */}
            {!isLogin && (showPasswordRequirements || password.length > 0) && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <p className="text-xs font-medium text-gray-700 mb-2">Requisitos de contraseña:</p>

                <div className="flex items-center text-xs">
                  {passwordRequirements.minLength ? (
                    <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  )}
                  <span className={passwordRequirements.minLength ? 'text-green-700' : 'text-gray-600'}>
                    Mínimo 8 caracteres
                  </span>
                </div>

                <div className="flex items-center text-xs">
                  {passwordRequirements.hasUppercase ? (
                    <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  )}
                  <span className={passwordRequirements.hasUppercase ? 'text-green-700' : 'text-gray-600'}>
                    Una letra mayúscula
                  </span>
                </div>

                <div className="flex items-center text-xs">
                  {passwordRequirements.hasLowercase ? (
                    <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  )}
                  <span className={passwordRequirements.hasLowercase ? 'text-green-700' : 'text-gray-600'}>
                    Una letra minúscula
                  </span>
                </div>

                <div className="flex items-center text-xs">
                  {passwordRequirements.hasNumber ? (
                    <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  )}
                  <span className={passwordRequirements.hasNumber ? 'text-green-700' : 'text-gray-600'}>
                    Un número
                  </span>
                </div>

                <div className="flex items-center text-xs">
                  {passwordRequirements.hasSymbol ? (
                    <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  )}
                  <span className={passwordRequirements.hasSymbol ? 'text-green-700' : 'text-gray-600'}>
                    Un símbolo (@$!%*?&)
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || (!isLogin && !isPasswordValid && password.length > 0)}
            className="login-button w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ animationDelay: '0.4s' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                <span>Iniciar Sesión</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                <span>Crear Cuenta</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center fade-in" style={{ animationDelay: '0.5s' }}>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="login-toggle text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            disabled={isLoading}
          >
            {isLogin ? '¿No tienes cuenta? Crear una nueva' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
