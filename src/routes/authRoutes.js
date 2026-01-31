const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validation');

// Register route
router.post('/register', validateRegister, register);

// Login route
router.post('/login', validateLogin, login);

module.exports = router;
