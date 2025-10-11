const express = require('express');
const router = express.Router();
const AttachmentController = require('../controllers/attachmentController');
const Attachment = require('../models/Attachment');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadMiddleware, handleUploadError } = require('../middleware/uploadMiddleware');

const controller = new AttachmentController(Attachment);

router.get('/all/:defectId', authMiddleware, controller.getDefectAttachments.bind(controller));
router.get('/download/:attachmentId', authMiddleware, controller.downloadAttachment.bind(controller));
router.get('/preview/:attachmentId', authMiddleware, controller.previewAttachment.bind(controller));

router.post('/upload/:defectId', authMiddleware, uploadMiddleware, handleUploadError, controller.uploadAttachment.bind(controller));

router.delete('/delete/:attachmentId', authMiddleware, controller.deleteAttachment.bind(controller));

module.exports = router;