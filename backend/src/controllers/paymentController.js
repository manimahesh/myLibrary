const PaymentMethod = require('../models/PaymentMethod');
const Joi = require('joi');

const paymentSchema = Joi.object({
  card_type: Joi.string().valid('visa', 'mastercard', 'amex', 'discover').required(),
  last_four_digits: Joi.string().length(4).pattern(/^\d{4}$/).required(),
  expiry_month: Joi.number().integer().min(1).max(12).required(),
  expiry_year: Joi.number().integer().min(new Date().getFullYear()).required(),
  is_default: Joi.boolean().default(false),
});

async function list(req, res) {
  try {
    const paymentMethods = await PaymentMethod.findAllByUser(req.user.userId);
    res.json({ payment_methods: paymentMethods });
  } catch (err) {
    console.error('List payment methods error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function create(req, res) {
  try {
    const { error, value } = paymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const paymentMethod = await PaymentMethod.create(req.user.userId, value);
    res.status(201).json({ payment_method: paymentMethod });
  } catch (err) {
    console.error('Create payment method error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function update(req, res) {
  try {
    const { error, value } = paymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const paymentMethod = await PaymentMethod.update(req.params.id, req.user.userId, value);
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json({ payment_method: paymentMethod });
  } catch (err) {
    console.error('Update payment method error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function remove(req, res) {
  try {
    const deleted = await PaymentMethod.delete(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json({ message: 'Payment method deleted' });
  } catch (err) {
    console.error('Delete payment method error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { list, create, update, remove };
