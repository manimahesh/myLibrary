const express = require('express');
const router = express.Router();
const { register, login, getMe, updateMe, changePassword } = require('../controllers/authController');
const authenticate = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
