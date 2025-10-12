const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

const analyticsController = new AnalyticsController();

router.get('/stats/general', authMiddleware, analyticsController.getGeneralStats.bind(analyticsController));
router.get('/reports/defects', authMiddleware, analyticsController.getDefectsReport.bind(analyticsController));
router.get('/reports/objects', authMiddleware, analyticsController.getObjectsReport.bind(analyticsController));
router.get('/reports/performance', authMiddleware, analyticsController.getPerformanceReport.bind(analyticsController));

module.exports = router;