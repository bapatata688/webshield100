const { pool } = require('../config/database');
const { ERROR_MESSAGES, PLAN_PRICES, PAYMENT_STATUS } = require('../config/constants');

class PaymentController {
  // Crear intención de pago
  static async createPaymentIntent(req, res) {
    const { plan, amount } = req.body;

    try {
      const validPlans = ['pro', 'premium'];
      if (!validPlans.includes(plan)) {
        return res.status(400).json({ 
          error: 'Plan no válido para pago',
          valid_plans: validPlans
        });
      }

      // Verificar monto correcto
      if (amount !== PLAN_PRICES[plan]) {
        return res.status(400).json({ 
          error: 'Monto no válido para el plan seleccionado',
          expected_amount: PLAN_PRICES[plan],
          received_amount: amount
        });
      }

      // Verificar que el usuario no tenga ya este plan o superior
      if (req.user.plan === plan) {
        return res.status(400).json({
          error: `Ya tienes el plan ${plan}`,
          current_plan: req.user.plan
        });
      }

      if (req.user.plan === 'premium') {
        return res.status(400).json({
          error: 'Ya tienes el plan más alto disponible',
          current_plan: req.user.plan
        });
      }

      // Crear registro de pago
      const paymentResult = await pool.query(
        'INSERT INTO pagos (user_id, plan, amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [req.user.id, plan, amount, PAYMENT_STATUS.PENDING]
      );

      const payment = paymentResult.rows[0];

      console.log(`Intención de pago creada: Plan ${plan} por ${req.user.email}`);

      res.status(201).json({
        message: 'Intención de pago creada',
        payment_id: payment.id,
        client_secret: `pi_${payment.id}_secret_demo`, // En producción sería de Stripe
        amount: payment.amount,
        plan: payment.plan,
        currency: 'USD'
      });

    } catch (error) {
      console.error('Error creando intención de pago:', error);
      res.status(500).json({ 
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR' 
      });
    }
  }

  // Confirmar pago
  static async confirmPayment(req, res) {
    const { id } = req.params;
    const { stripe_payment_id } = req.body;

    try {
      // Verificar que el pago existe y pertenece al usuario
      const paymentCheck = await pool.query(
        'SELECT * FROM pagos WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (paymentCheck.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Pago no encontrado',
          code: 'PAYMENT_NOT_FOUND' 
        });
      }

      const payment = paymentCheck.rows[0];

      if (payment.status !== PAYMENT_STATUS.PENDING) {
        return res.status(400).json({ 
          error: 'El pago ya fue procesado',
          current_status: payment.status,
          code: 'PAYMENT_ALREADY_PROCESSED'
        });
      }

      await pool.query('BEGIN');

      try {
        // Actualizar estado del pago
        await pool.query(
          'UPDATE pagos SET status = $1, stripe_payment_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [PAYMENT_STATUS.COMPLETED, stripe_payment_id || `demo_${Date.now()}`, id]
        );

        // Actualizar plan del usuario
        await pool.query(
          'UPDATE usuarios SET plan = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [payment.plan, req.user.id]
        );

        await pool.query('COMMIT');

        console.log(`Pago confirmado: Plan ${payment.plan} para ${req.user.email}`);

        res.json({
          message: 'Pago confirmado exitosamente',
          new_plan: payment.plan,
          amount: payment.amount,
          payment_id: id,
          upgrade_benefits: getUpgradeBenefits(payment.plan)
        });

      } catch (transactionError) {
        await pool.query('ROLLBACK');
        throw transactionError;
      }

    } catch (error) {
      console.error('Error confirmando pago:', error);
      res.status(500).json({ 
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR' 
      });
    }
  }

  // Obtener historial de pagos del usuario
  static async getPaymentHistory(req, res) {
    try {
      const result = await pool.query(
        `SELECT id, plan, amount, status, stripe_payment_id, created_at, updated_at 
         FROM pagos 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [req.user.id]
      );

      // Calcular estadísticas
      const totalSpent = result.rows
        .filter(payment => payment.status === PAYMENT_STATUS.COMPLETED)
        .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

      const completedPayments = result.rows.filter(p => p.status === PAYMENT_STATUS.COMPLETED).length;

      res.json({ 
        payments: result.rows,
        statistics: {
          total_payments: result.rows.length,
          completed_payments: completedPayments,
          total_spent: totalSpent.toFixed(2),
          current_plan: req.user.plan
        }
      });

    } catch (error) {
      console.error('Error obteniendo historial de pagos:', error);
      res.status(500).json({ 
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR' 
      });
    }
  }

  // Cancelar pago pendiente
  static async cancelPayment(req, res) {
    const { id } = req.params;

    try {
      const result = await pool.query(
        `UPDATE pagos 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 AND user_id = $3 AND status = $4 
         RETURNING *`,
        [PAYMENT_STATUS.CANCELLED, id, req.user.id, PAYMENT_STATUS.PENDING]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Pago no encontrado o no se puede cancelar',
          code: 'PAYMENT_NOT_CANCELLABLE' 
        });
      }

      console.log(`Pago cancelado: ID ${id} por ${req.user.email}`);

      res.json({ 
        message: 'Pago cancelado exitosamente',
        cancelled_payment: result.rows[0]
      });

    } catch (error) {
      console.error('Error cancelando pago:', error);
      res.status(500).json({ 
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR' 
      });
    }
  }

  // Obtener información de planes disponibles
  static async getAvailablePlans(req, res) {
    try {
      const plans = {
        free: {
          name: 'Gratuito',
          price: 0,
          features: [
            '3 proyectos',
            'Elementos básicos',
            'Soporte por email'
          ],
          limitations: [
            'Sin exportación',
            'Sin plantillas avanzadas'
          ]
        },
        pro: {
          name: 'Profesional',
          price: PLAN_PRICES.pro,
          features: [
            '50 proyectos',
            'Todos los elementos',
            'Exportación HTML',
            'Plantillas premium',
            'Soporte prioritario'
          ],
          recommended: req.user.plan === 'free'
        },
        premium: {
          name: 'Premium',
          price: PLAN_PRICES.premium,
          features: [
            'Proyectos ilimitados',
            'Todos los elementos',
            'Exportación HTML',
            'Plantillas premium',
            'Analíticas avanzadas',
            'Soporte VIP 24/7',
            'Funciones beta'
          ],
          recommended: req.user.plan !== 'premium'
        }
      };

      res.json({
        current_plan: req.user.plan,
        available_plans: plans,
        upgrade_recommendations: getUpgradeRecommendations(req.user.plan)
      });

    } catch (error) {
      console.error('Error obteniendo planes:', error);
      res.status(500).json({ 
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR' 
      });
    }
  }

  // Generar factura de pago
  static async generateInvoice(req, res) {
    const { id } = req.params;

    try {
      const paymentResult = await pool.query(
        `SELECT p.*, u.email 
         FROM pagos p 
         JOIN usuarios u ON p.user_id = u.id 
         WHERE p.id = $1 AND p.user_id = $2 AND p.status = $3`,
        [id, req.user.id, PAYMENT_STATUS.COMPLETED]
      );

      if (paymentResult.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Factura no encontrada o pago no completado',
          code: 'INVOICE_NOT_FOUND' 
        });
      }

      const payment = paymentResult.rows[0];

      const invoice = {
        invoice_number: `WS-${payment.id.toString().padStart(6, '0')}`,
        date: payment.created_at,
        customer: {
          email: payment.email,
          plan: payment.plan
        },
        items: [{
          description: `WebShield Plan ${payment.plan.toUpperCase()}`,
          quantity: 1,
          unit_price: payment.amount,
          total: payment.amount
        }],
        subtotal: payment.amount,
        tax: 0, // Implementar cálculo de impuestos si es necesario
        total: payment.amount,
        payment_method: 'Tarjeta de crédito',
        transaction_id: payment.stripe_payment_id
      };

      res.json({ 
        message: 'Factura generada exitosamente',
        invoice
      });

    } catch (error) {
      console.error('Error generando factura:', error);
      res.status(500).json({ 
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR' 
      });
    }
  }
}

// Funciones auxiliares
function getUpgradeBenefits(plan) {
  const benefits = {
    pro: [
      'Acceso a elementos avanzados',
      'Exportación HTML',
      '50 proyectos totales',
      'Plantillas premium'
    ],
    premium: [
      'Proyectos ilimitados',
      'Analíticas avanzadas',
      'Soporte prioritario 24/7',
      'Acceso a funciones beta'
    ]
  };

  return benefits[plan] || [];
}

function getUpgradeRecommendations(currentPlan) {
  const recommendations = {
    free: {
      recommended_plan: 'pro',
      reason: 'Obtén más proyectos y elementos avanzados',
      savings: 'Ahorra 20% con facturación anual'
    },
    pro: {
      recommended_plan: 'premium',
      reason: 'Desbloquea proyectos ilimitados y analíticas',
      savings: 'Acceso completo a todas las funciones'
    }
  };

  return recommendations[currentPlan] || null;
}

module.exports = PaymentController;
