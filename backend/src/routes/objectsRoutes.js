const express = require('express');
const router = express.Router();
const ObjectsController = require('../controllers/objectsController');
const Objects = require('../models/Objects');
const authMiddleware = require('../middleware/authMiddleware');

const controller = new ObjectsController(Objects);

router.get('/all', authMiddleware, controller.getAllObjects.bind(controller));
router.get('/get/:objectId', authMiddleware, controller.getObject.bind(controller));
router.get('/search', authMiddleware, controller.searchObjects.bind(controller));
router.get('/defects/:objectId', authMiddleware, controller.getObjectDefects.bind(controller));

router.post('/add', authMiddleware, controller.addObject.bind(controller));

router.patch('/:objectId', authMiddleware, controller.updateObject.bind(controller));

router.delete('/:objectId', authMiddleware, controller.deleteObject.bind(controller));

module.exports = router;