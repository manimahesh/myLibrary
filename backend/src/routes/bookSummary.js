const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { get, create, update, remove } = require('../controllers/bookSummaryController');

router.use(authenticate);

router.get('/:bookId', get);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
