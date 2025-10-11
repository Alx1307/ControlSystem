const database = require('../config/database');
const sequelize = database.sequelize;
const User = require('../models/User');
const Defect = require('../models/Defect');
const path = require('path');
const fs = require('fs');

class AttachmentController {
    constructor(AttachmentModel) {
        this.Attachment = AttachmentModel;
    }

    async getDefectAttachments(req, res) {
        try {
            const { defectId } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const offset = (page - 1) * limit;
            const order = [['uploaded_at', 'DESC']];

            const { count, rows: attachments } = await this.Attachment.findAndCountAll({
                where: {
                    defect_id: defectId
                },
                order,
                limit,
                offset,
                include: [
                    {
                        model: User,
                        as: 'uploadedBy',
                        attributes: ['id', 'full_name', 'email']
                    }
                ]
            });

            res.status(200).json({
                success: true,
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                attachments
            });
        } catch (error) {
            console.error('Ошибка при получении вложений дефекта:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при получении вложений дефекта.',
                error: error.message
            });
        }
    }

    async uploadAttachment(req, res) {
        try {
            const { defectId } = req.params;
            
            const userId = req.user.id;
            const userRole = req.user.role;
    
            const defect = await Defect.findByPk(defectId);
    
            if (!defect) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(404).json({
                    success: false,
                    message: 'Дефект не найден'
                });
            }
    
            if (userRole !== 'Менеджер' && userRole !== 'Инженер') {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(403).json({
                    success: false,
                    message: 'Только менеджеры и инженеры могут загружать файлы'
                });
            }
    
            if (userRole === 'Инженер' && defect.assignee_id !== userId) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(403).json({
                    success: false,
                    message: 'Вы можете загружать файлы только к дефектам, на которые назначены'
                });
            }
    
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Файл обязателен'
                });
            }
    
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'application/pdf', 
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain'
            ];
            
            if (!allowedTypes.includes(req.file.mimetype)) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Недопустимый тип файла. Разрешены: изображения (JPEG, PNG, GIF, WEBP), PDF, документы (DOC, DOCX), таблицы (XLS, XLSX), текстовые файлы'
                });
            }
    
            const maxSize = 10 * 1024 * 1024;
            if (req.file.size > maxSize) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Размер файла не должен превышать 10MB'
                });
            }
    
            const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
            
            const attachment = await this.Attachment.create({
                defect_id: defectId,
                file_name: originalName,
                file_path: req.file.filename,
                file_type: req.file.mimetype,
                uploaded_by: userId
            });
    
            const newAttachment = await this.Attachment.findByPk(attachment.id, {
                include: [
                    {
                        model: User,
                        as: 'uploadedBy',
                        attributes: ['id', 'full_name', 'email']
                    }
                ]
            });
    
            res.status(201).json({
                success: true,
                message: 'Файл успешно загружен',
                attachment: newAttachment
            });
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при загрузке файла.',
                error: error.message
            });
        }
    }

    async deleteAttachment(req, res) {
        try {
            const { attachmentId } = req.params;
            
            const userId = req.user.id;
            const userRole = req.user.role;

            const attachment = await this.Attachment.findByPk(attachmentId);
            if (!attachment) {
                return res.status(404).json({
                    success: false,
                    message: 'Файл не найден'
                });
            }

            const defect = await Defect.findByPk(attachment.defect_id);
        
            const canDelete = attachment.uploaded_by === userId;
        
            if (!canDelete) {
                return res.status(403).json({
                    success: false,
                    message: 'Вы можете удалять только свои файлы'
                });
            }

            if (userRole === 'Инженер' && defect.assignee_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Вы больше не можете удалять файлы этого дефекта'
                });
            }

            const filePath = path.join(__dirname, '../uploads', attachment.file_path);
        
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await attachment.destroy();

            res.status(200).json({
                success: true,
                message: 'Файл успешно удален'
            });
        } catch (error) {
            console.error('Ошибка при удалении файла:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при удалении файла.',
                error: error.message
            });
        }
    }

    async downloadAttachment(req, res) {
        try {
            const { attachmentId } = req.params;
    
            const attachment = await this.Attachment.findByPk(attachmentId);
            if (!attachment) {
                return res.status(404).json({
                    success: false,
                    message: 'Файл не найден'
                });
            }
    
            const filePath = path.join(__dirname, '../uploads', attachment.file_path);
        
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'Файл не найден на сервере'
                });
            }
    
            const fileName = Buffer.from(attachment.file_name, 'utf8').toString('latin1');
            
            res.setHeader('Content-Type', attachment.file_type);
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(attachment.file_name)}`);
        
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        } catch (error) {
            console.error('Ошибка при скачивании файла:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при скачивании файла.',
                error: error.message
            });
        }
    }

    async previewAttachment(req, res) {
        try {
            const { attachmentId } = req.params;

            const attachment = await this.Attachment.findByPk(attachmentId);
            if (!attachment) {
                return res.status(404).json({
                    success: false,
                    message: 'Файл не найден'
                });
            }

            const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!imageTypes.includes(attachment.file_type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Просмотр доступен только для изображений'
                });
            }

            const filePath = path.join(__dirname, '../uploads', attachment.file_path);
        
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'Файл не найден на сервере'
                });
            }

            res.setHeader('Content-Type', attachment.file_type);
        
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        } catch (error) {
            console.error('Ошибка при просмотре файла:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при просмотре файла.',
                error: error.message
            });
        }
    }
}

module.exports = AttachmentController;