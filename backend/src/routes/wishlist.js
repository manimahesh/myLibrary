const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { list, add, updateRating, remove } = require('../controllers/wishlistController');

router.use(authenticate);

router.get('/', list);
router.post('/', add);
router.put('/:id', updateRating);
router.delete('/:id', remove);

module.exports = router;
