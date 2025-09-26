
// components/PlansScreen.js
import React from 'react';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { PLANS } from '../constants/appConstants';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Volver
          </button>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Elige tu plan</h2>
          <p className="text-gray-600 text-lg">Selecciona el plan que mejor se adapte a tus necesidades</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
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
                onClick={() => handlePlanSelection(plan)}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${plan.id === 'free'
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
      </div>
    </div>
  );
};

export default PlansScreen;
