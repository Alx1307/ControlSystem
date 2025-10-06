const express = require('express');
const router = express.Router();
const HistoryController = require('../controllers/historyController');
const ChangeHistory = require('../models/ChangeHistory');
const authMiddleware = require('../middleware/authMiddleware');

const controller = new HistoryController(ChangeHistory);

router.get('/object/:objectId', authMiddleware, controller.getObjectHistory.bind(controller));
router.get('/defect/:defectId', authMiddleware, controller.getDefectHistory.bind(controller));

module.exports = router;