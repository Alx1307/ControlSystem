const express = require('express');
const router = express.Router();
const DefectsController = require('../controllers/defectsController');
const Defect = require('../models/Defect');
const authMiddleware = require('../middleware/authMiddleware');

const controller = new DefectsController(Defect);

router.get('/all', authMiddleware, controller.getAllDefects.bind(controller));
router.get('/get/:defectId', authMiddleware, controller.getDefect.bind(controller));
router.get('/search', authMiddleware, controller.searchDefects.bind(controller));

router.post('/add', authMiddleware, controller.addDefect.bind(controller));

router.patch('/assign/:defectId', authMiddleware, controller.assignDefect.bind(controller));
router.patch('/update_status/:defectId', authMiddleware, controller.updateDefectStatus.bind(controller));
router.patch('/:defectId', authMiddleware, controller.updateDefect.bind(controller));

router.delete('/:defectId', authMiddleware, controller.deleteDefect.bind(controller));

module.exports = router;