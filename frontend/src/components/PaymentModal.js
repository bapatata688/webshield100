import React, { useState } from 'react';
import { CreditCard, Loader2, Lock, Shield } from 'lucide-react';
import { paymentsAPI } from '../api/config.js';
import '../App.css';

const PaymentModal = ({ showPayment, selectedPlan, user, setUser, onClose, onSuccess }) => {
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const intent = await paymentsAPI.createIntent({
        plan: selectedPlan.id,
        amount: selectedPlan.id === 'pro' ? 9.99 : 19.99
      });

      setTimeout(async () => {
        try {
          await paymentsAPI.confirm(intent.payment_id, {
            stripe_payment_id: `pi_demo_${Date.now()}`
          });

          setUser({ ...user, plan: selectedPlan.id });
          onSuccess(`Plan ${selectedPlan.name} activado exitosamente!`);
        } catch (error) {
          alert(`Error confirmando pago: ${error.message}`);
        } finally {
          setIsProcessing(false);
        }
      }, 2000);
    } catch (error) {
      alert(`Error creando pago: ${error.message}`);
      setIsProcessing(false);
    }
  };

  if (!showPayment) return null;

  return (
    <div className="payment-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="payment-modal-content bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full scale-in">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Completar Pago</h3>
          <p className="text-gray-600">
            Plan {selectedPlan?.name} - <span className="font-semibold text-blue-600">{selectedPlan?.price}</span>
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 fade-in">
          <div className="flex items-center text-green-700">
            <Shield className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Pago seguro encriptado SSL</span>
          </div>
        </div>

        <form onSubmit={handlePayment} className="space-y-4">
          <div className="slide-up" style={{ animationDelay: '0.1s' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Tarjeta
              <Lock className="inline w-3 h-3 ml-1 text-gray-500" />
            </label>
            <input
              type="text"
              value={cardData.number}
              onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
              placeholder="1234 5678 9012 3456"
              className="payment-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              disabled={isProcessing}
              maxLength="19"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="slide-up" style={{ animationDelay: '0.2s' }}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
              <input
                type="text"
                value={cardData.expiry}
                onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                placeholder="MM/YY"
                className="payment-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={isProcessing}
                maxLength="5"
              />
            </div>
            <div className="slide-up" style={{ animationDelay: '0.3s' }}>
              <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
              <input
                type="text"
                value={cardData.cvv}
                onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                placeholder="123"
                className="payment-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={isProcessing}
                maxLength="4"
              />
            </div>
          </div>

          <div className="slide-up" style={{ animationDelay: '0.4s' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre en la Tarjeta</label>
            <input
              type="text"
              value={cardData.name}
              onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
              placeholder="Juan Pérez"
              className="payment-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              disabled={isProcessing}
            />
          </div>

          <div className="flex space-x-4 mt-6 slide-up" style={{ animationDelay: '0.5s' }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all hover-lift"
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="payment-button flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:opacity-50 transition-all"
            >
              {isProcessing ? (
                <div className="payment-processing flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Procesando...</span>
                </div>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span>Pagar {selectedPlan?.price}</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-xs text-gray-500">
            Tus datos están protegidos con encriptación de nivel bancario
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
