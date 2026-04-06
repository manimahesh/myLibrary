const BookSummary = require('../models/BookSummary');
const Joi = require('joi');

const createSchema = Joi.object({
  book_id: Joi.string().required(),
  summary_text: Joi.string().min(1).required(),
});

const updateSchema = Joi.object({
  summary_text: Joi.string().min(1).required(),
});

async function get(req, res) {
  try {
    const summary = await BookSummary.findByUserAndBook(req.user.userId, req.params.bookId);
    res.json({ summary });
  } catch (err) {
    console.error('Get summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function create(req, res) {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const summary = await BookSummary.create(req.user.userId, value.book_id, value.summary_text);
    res.status(201).json({ summary });
  } catch (err) {
    console.error('Create summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function update(req, res) {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const summary = await BookSummary.update(req.params.id, req.user.userId, value.summary_text);
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    res.json({ summary });
  } catch (err) {
    console.error('Update summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function remove(req, res) {
  try {
    const deleted = await BookSummary.delete(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    res.json({ message: 'Summary deleted' });
  } catch (err) {
    console.error('Delete summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { get, create, update, remove };
