const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const controller = new UserController(User);

router.post('/login', controller.login.bind(controller));

router.patch('/register', controller.register.bind(controller));

module.exports = router;