const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { list, create, update, remove } = require('../controllers/addressController');

router.use(authenticate);

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
