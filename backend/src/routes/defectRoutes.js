const express = require('express');
const router = express.Router();
const DefectsController = require('../controllers/defectsController');
const Defect = require('../models/Defect');
const authMiddleware = require('../middleware/authMiddleware');

const controller = new DefectsController(Defect);

router.get('/all', authMiddleware, controller.getAllDefects.bind(controller));
router.get('/:defectId', authMiddleware, controller.getDefect.bind(controller));

router.post('/add', authMiddleware, controller.addDefect.bind(controller));

module.exports = router;