const Wishlist = require('../models/Wishlist');
const Joi = require('joi');
const { validate: isValidUUID } = require('uuid');

const addSchema = Joi.object({
  book_id: Joi.string().required(),
});

const ratingSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
});

async function list(req, res) {
  try {
    const wishlist = await Wishlist.findAllByUser(req.user.userId);
    res.json({ wishlist });
  } catch (err) {
    console.error('List wishlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function add(req, res) {
  try {
    const { error, value } = addSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existing = await Wishlist.findByBookId(req.user.userId, value.book_id);
    if (existing) {
      return res.status(409).json({ error: 'Book already in wishlist' });
    }

    const item = await Wishlist.create(req.user.userId, value.book_id);
    res.status(201).json({ item });
  } catch (err) {
    console.error('Add to wishlist error:', err);
    // Handle unique constraint violation (Postgres error code 23505)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Book already in wishlist' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateRating(req, res) {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ error: 'Invalid wishlist item id' });
    }

    const { error, value } = ratingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const item = await Wishlist.updateRating(req.params.id, req.user.userId, value.rating);
    if (!item) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }

    res.json({ item });
  } catch (err) {
    console.error('Update rating error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function remove(req, res) {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ error: 'Invalid wishlist item id' });
    }

    const deleted = await Wishlist.delete(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Remove from wishlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { list, add, updateRating, remove };