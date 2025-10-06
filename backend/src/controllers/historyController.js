const database = require('../config/database');
const sequelize = database.sequelize;
const ChangeHistory = require('../models/ChangeHistory');
const User = require('../models/User');
const { Op } = require('sequelize');

class HistoryController {
    constructor(HistoryModel) {
        this.ChangeHistory = HistoryModel;
    }

    async getObjectHistory(req, res) {
        try {
            const { objectId } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const offset = (page - 1) * limit;
            const order = [['changed_at', 'DESC']];

            const { count, rows: history } = await this.ChangeHistory.findAndCountAll({
                where: {
                    entity_type: 'object',
                    entity_id: objectId
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
                history
            });
        } catch (error) {
            console.error('Ошибка при получении истории изменений объекта:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при получении истории изменений объекта.',
                error: error.message
            });
        }
    }

    async getDefectHistory(req, res) {
        try {
            const { defectId } = req.params;
            const { page = 1, limit = 10 } = req.query;
    
            const offset = (page - 1) * limit;
            const order = [['changed_at', 'DESC']];
    
            const { count, rows: history } = await this.ChangeHistory.findAndCountAll({
                where: {
                    entity_type: 'defect',
                    entity_id: defectId
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
                history
            });
        } catch (error) {
            console.error('Ошибка при получении истории изменений дефекта:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при получении истории изменений дефекта.',
                error: error.message
            });
        }
    }    
}

module.exports = HistoryController;