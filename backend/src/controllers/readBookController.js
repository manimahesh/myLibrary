const ReadBook = require('../models/ReadBook');
const { getBookDetails } = require('../services/googleBooksService');
const Joi = require('joi');
const { validate: isValidUUID } = require('uuid');

const markSchema = Joi.object({
  book_id: Joi.string().min(1).required(),
  read_at: Joi.string().isoDate().optional(),
});

async function list(req, res) {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 25);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const { items, total } = await ReadBook.findPageByUser(req.user.userId, limit, offset);
    res.json({ readBooks: items, total, limit, offset });
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

    // Warm the DB book cache so future list loads don't need to hit Google
    getBookDetails(value.book_id).catch(() => {});

    res.status(201).json({ item });
  } catch (err) {
    console.error('Mark as read error:', err);
    if (err.code === '23505') {
      try {
        const existing = await ReadBook.findByBookId(req.user.userId, req.body.book_id);
        return res.status(409).json({ error: 'Book already marked as read', item: existing });
      } catch (lookupErr) {
        console.error('Read book duplicate lookup error:', lookupErr);
        return res.status(500).json({ error: 'Internal server error' });
      }
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
