const database = require('../config/database');
const sequelize = database.sequelize;
const User = require('../models/User');
const Defect = require('../models/Defect');

class CommentController {
    constructor(CommentModel) {
        this.Comment = CommentModel;
    }

    async getDefectComments(req, res) {
        try {
            const { defectId } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const offset = (page - 1) * limit;
            const order = [['created_at', 'DESC']];

            const { count, rows: comments } = await this.Comment.findAndCountAll({
                where: {
                    defect_id: defectId
                },
                order,
                limit,
                offset,
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'full_name', 'email']
                    }
                ]
            });

            res.status(200).json({
                success: true,
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                comments
            });
        } catch (error) {
            console.error('Ошибка при получении комментариев дефекта:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при получении комментариев дефекта.',
                error: error.message
            });
        }
    }

    async addComment(req, res) {
        try {
            const { defectId } = req.params;
            const { content } = req.body;
            
            const userId = req.user.id;
            const userRole = req.user.role;

            const defect = await Defect.findByPk(defectId);

            if (!defect) {
                return res.status(404).json({
                    success: false,
                    message: 'Дефект не найден'
                });
            }

            if (userRole !== 'Менеджер' && userRole !== 'Инженер') {
                return res.status(403).json({
                    success: false,
                    message: 'Только менеджеры и инженеры могут оставлять комментарии'
                });
            }

            if (userRole === 'Инженер' && defect.assignee_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Вы можете оставлять комментарии только к дефектам, на которые назначены'
                });
            }

            if (!content || !content.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Текст комментария обязателен'
                });
            }

            const comment = await this.Comment.create({
                defect_id: defectId,
                user_id: userId,
                content: content.trim()
            });

            const newComment = await this.Comment.findByPk(comment.id, {
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'full_name', 'email']
                    }
                ]
            });

            res.status(201).json({
                success: true,
                message: 'Комментарий успешно добавлен',
                comment: newComment
            });
        } catch (error) {
            console.error('Ошибка при добавлении комментария:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при добавлении комментария.',
                error: error.message
            });
        }
    }

    async updateComment(req, res) {
        try {
            const { commentId } = req.params;
            const { content } = req.body;
            
            const userId = req.user.id;
            const userRole = req.user.role;

            const comment = await this.Comment.findByPk(commentId);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Комментарий не найден'
                });
            }

            const defect = await Defect.findByPk(comment.defect_id);

            if (comment.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Вы можете редактировать только свои комментарии'
                });
            }

            if (userRole === 'Инженер' && defect.assignee_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Вы больше не можете редактировать комментарии к этому дефекту'
                });
            }

            if (!content || !content.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Текст комментария обязателен'
                });
            }

            await comment.update({
                content: content.trim()
            });

            const updatedComment = await this.Comment.findByPk(commentId, {
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'full_name', 'email']
                    }
                ]
            });

            res.status(200).json({
                success: true,
                message: 'Комментарий успешно обновлен',
                comment: updatedComment
            });
        } catch (error) {
            console.error('Ошибка при обновлении комментария:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при обновлении комментария.',
                error: error.message
            });
        }
    }

    async deleteComment(req, res) {
        try {
            const { commentId } = req.params;
            
            const userId = req.user.id;
            const userRole = req.user.role;

            const comment = await this.Comment.findByPk(commentId);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Комментарий не найден'
                });
            }

            const canDelete = comment.user_id === userId;
            
            if (!canDelete) {
                return res.status(403).json({
                    success: false,
                    message: 'Вы можете удалять только свои комментарии'
                });
            }

            if (userRole === 'Инженер') {
                const defect = await Defect.findByPk(comment.defect_id);
                if (defect.assignee_id !== userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Вы больше не можете удалять комментарии к этому дефекту'
                    });
                }
            }

            await comment.destroy();

            res.status(200).json({
                success: true,
                message: 'Комментарий успешно удален'
            });
        } catch (error) {
            console.error('Ошибка при удалении комментария:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при удалении комментария.',
                error: error.message
            });
        }
    }
}

module.exports = CommentController;