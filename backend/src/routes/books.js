const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getNytTop, googleSearch, getBookDetail } = require('../controllers/booksController');

router.use(authenticate);

router.get('/nyt-top', getNytTop);
router.get('/google-search', googleSearch);
router.get('/:id', getBookDetail);

module.exports = router;
