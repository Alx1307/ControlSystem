const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/commentController');
const Comment = require('../models/Comment');
const authMiddleware = require('../middleware/authMiddleware');

const controller = new CommentController(Comment);

router.get('/all/:defectId', authMiddleware, controller.getDefectComments.bind(controller));

router.post('/add/:defectId', authMiddleware, controller.addComment.bind(controller));

router.patch('/update/:commentId', authMiddleware, controller.updateComment.bind(controller));

router.delete('/delete/:commentId', authMiddleware, controller.deleteComment.bind(controller));

module.exports = router;