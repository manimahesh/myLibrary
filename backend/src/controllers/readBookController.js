const ReadBook = require('../models/ReadBook');
const Joi = require('joi');
const { validate: isValidUUID } = require('uuid');

const markSchema = Joi.object({
  book_id: Joi.string().min(1).required(),
  read_at: Joi.string().isoDate().optional(),
});

async function list(req, res) {
  try {
    const readBooks = await ReadBook.findAllByUser(req.user.userId);
    res.json({ readBooks });
  } catch (err) {
    console.error('List read books error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function markAsRead(req, res) {
  try {
    const { error, value } = markSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existing = await ReadBook.findByBookId(req.user.userId, value.book_id);
    if (existing) {
      return res.status(409).json({ error: 'Book already marked as read', item: existing });
    }

    const item = await ReadBook.create(req.user.userId, value.book_id, value.read_at);
    res.status(201).json({ item });
  } catch (err) {
    console.error('Mark as read error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Book already marked as read' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function unmarkAsRead(req, res) {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ error: 'Invalid read book id' });
    }

    const deleted = await ReadBook.delete(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Read book record not found' });
    }
    res.json({ message: 'Unmarked as read' });
  } catch (err) {
    console.error('Unmark as read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { list, markAsRead, unmarkAsRead };
