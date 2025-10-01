import React from 'react';
import { ChevronLeft, CheckCircle, Crown, Zap, Rocket } from 'lucide-react';
import { PLANS } from '../constants/appConstants';
import '../App.css';

const PlansScreen = ({ user, onPlanSelect, onBack }) => {
  const handlePlanSelection = (plan) => {
    if (plan.id === 'free') {
      if (user) {
        onBack();
      } else {
        alert('Debes iniciar sesión para continuar');
      }
    } else {
      onPlanSelect(plan);
    }
  };

  return (
    <div className="plans-container min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="plans-header flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors hover-lift"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span>Volver</span>
          </button>
        </div>

        <div className="text-center mb-12 fade-in">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Elige tu plan</h2>
          <p className="text-gray-600 text-lg">Selecciona el plan que mejor se adapte a tus necesidades</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan, index) => (
            <div
              key={plan.id}
              className={`plan-card bg-white rounded-2xl shadow-xl p-8 relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="plan-popular-badge bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium inline-flex items-center">
                    <Crown className="w-4 h-4 mr-1" />
                    Más Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  {plan.id === 'free' && (
                    <div className="bg-gray-100 p-3 rounded-full">
                      <Zap className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                  {plan.id === 'pro' && (
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Crown className="w-8 h-8 text-blue-600" />
                    </div>
                  )}
                  {plan.id === 'premium' && (
                    <div className="bg-purple-100 p-3 rounded-full">
                      <Rocket className="w-8 h-8 text-purple-600" />
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-blue-600 mb-4">{plan.price}</div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="plan-feature flex items-center"
                    style={{ animationDelay: `${index * 0.1 + idx * 0.1}s` }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelection(plan)}
                className={`plan-button w-full py-3 px-6 rounded-lg font-medium transition-all ${plan.id === 'free'
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : plan.color === 'blue'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
              >
                {plan.id === 'free' ? 'Continuar Gratis' : 'Seleccionar Plan'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-gray-600 mb-4">¿Necesitas ayuda para elegir?</p>
          <button className="text-blue-600 hover:text-blue-800 font-medium transition-colors hover-scale">
            Contáctanos para una consulta gratuita
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlansScreen;
