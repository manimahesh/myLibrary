const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { list, markAsRead, unmarkAsRead } = require('../controllers/readBookController');

router.use(auth);

router.get('/', list);
router.post('/', markAsRead);
router.delete('/:id', unmarkAsRead);

module.exports = router;
