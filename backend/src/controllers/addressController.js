const Address = require('../models/Address');
const Joi = require('joi');

const addressSchema = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  postal_code: Joi.string().required(),
  country: Joi.string().required(),
  is_default: Joi.boolean().default(false),
});

async function list(req, res) {
  try {
    const addresses = await Address.findAllByUser(req.user.userId);
    res.json({ addresses });
  } catch (err) {
    console.error('List addresses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function create(req, res) {
  try {
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const address = await Address.create(req.user.userId, value);
    res.status(201).json({ address });
  } catch (err) {
    console.error('Create address error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function update(req, res) {
  try {
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const address = await Address.update(req.params.id, req.user.userId, value);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ address });
  } catch (err) {
    console.error('Update address error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function remove(req, res) {
  try {
    const deleted = await Address.delete(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ message: 'Address deleted' });
  } catch (err) {
    console.error('Delete address error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { list, create, update, remove };
