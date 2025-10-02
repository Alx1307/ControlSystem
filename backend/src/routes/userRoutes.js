const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const controller = new UserController(User);

router.get('/users/:userId', authMiddleware, controller.getUser.bind(controller));
router.get('/users', authMiddleware, controller.getAllUsers.bind(controller));

router.post('/login', controller.login.bind(controller));
router.post('/users/add', authMiddleware, controller.addUser.bind(controller));

router.patch('/register', controller.register.bind(controller));
router.patch('/users/:userId', authMiddleware, controller.updateUser.bind(controller));

router.delete('/users/:userId', authMiddleware, controller.deleteUser.bind(controller));

module.exports = router;