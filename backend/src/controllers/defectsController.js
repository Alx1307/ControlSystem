const database = require('../config/database');
const sequelize = database.sequelize;
const Defect = require('../models/Defect');
const Objects = require('../models/Objects');
const DefectStatus = require('../models/DefectStatus');
const DefectPriority = require('../models/DefectPriority');
const User = require('../models/User');
const Role = require('../models/Role');
const { Op } = require('sequelize');

class DefectsController {
    constructor(DefectModel) {
        this.Defect = DefectModel;
    }

    async addDefect(req, res) {
        try {
            const { title, description, object_id, status_id, priority_id, assignee_id, due_date } = req.body;
            const currentUser = req.user;
    
            if (currentUser.role !== 'Менеджер') {
                return res.status(403).json({
                    success: false,
                    message: 'Только менеджеры могут создавать дефекты.'
                });
            }

            const objectExists = await Objects.findByPk(object_id);
            if (!objectExists) {
                return res.status(400).json({
                    success: false,
                    message: `Объект с id ${object_id} не найден.`
                });
            }

            const statusExists = await DefectStatus.findByPk(status_id);
            if (status_id && !statusExists) {
                return res.status(400).json({
                    success: false,
                    message: `Статус с id ${status_id} не найден.`
                });
            }

            const priorityExists = await DefectPriority.findByPk(priority_id);
            if (priority_id && !priorityExists) {
                return res.status(400).json({
                    success: false,
                    message: `Приоритет с id ${priority_id} не найден.`
                });
            }

            if (assignee_id) {
                const assigneeExists = await User.findByPk(assignee_id, {
                    include: [{
                        model: Role,
                        as: 'role',
                        attributes: ['name']
                    }]
                });
    
                if (!assigneeExists) {
                    return res.status(400).json({
                        success: false,
                        message: `Пользователь с id ${assignee_id} не найден.`
                    });
                }
    
                if (!assigneeExists.role || assigneeExists.role.name !== 'Инженер') {
                    return res.status(400).json({
                        success: false,
                        message: `Дефект может быть назначен только сотруднику с ролью "Инженер".`
                    });
                }
            }
    
            const newDefect = await this.Defect.create({
                title,
                description,
                object_id,
                status_id: status_id || 1,
                priority_id: priority_id || 2,
                assignee_id: assignee_id || null,
                reporter_id: currentUser.id,
                due_date: due_date || null
            });
    
            res.status(201).json({
                success: true,
                message: 'Дефект успешно создан.',
                defect: newDefect
            });
        } catch (error) {
            console.error('Ошибка при создании дефекта:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при создании дефекта.',
                error: error.message
            });
        }
    }
    
    async getAllDefects(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = 'id', sortOrder = 'ASC' } = req.query;
            const offset = (page - 1) * limit;
            const order = [[sortBy, sortOrder]];
            const currentUser = req.user;
            const where = {};
    
            if (currentUser.role === 'Инженер') {
                where[Op.or] = [
                    { assignee_id: currentUser.id }
                ];
            }
    
            const { count, rows: defects } = await this.Defect.findAndCountAll({
                where,
                order,
                limit,
                offset,
                include: [
                    { model: User, as: 'reporter', attributes: ['id', 'full_name', 'email'] },
                    { model: User, as: 'assignee', attributes: ['id', 'full_name', 'email'] },
                    { model: DefectStatus, as: 'status', attributes: ['id', 'name'] },
                    { model: DefectPriority, as: 'priority', attributes: ['id', 'name'] },
                    { model: Objects, as: 'object', attributes: ['id', 'name', 'address'] }
                ]
            });
    
            res.status(200).json({
                success: true,
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                defects
            });
        } catch (error) {
            console.error('Ошибка при получении списка дефектов:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при получении списка дефектов.',
                error: error.message
            });
        }
    }

    async getDefect(req, res) {
        try {
            const { defectId } = req.params;
            const currentUser = req.user;
    
            const defect = await this.Defect.findByPk(defectId, {
                include: [
                    { model: User, as: 'reporter', attributes: ['id', 'full_name', 'email'] },
                    { model: User, as: 'assignee', attributes: ['id', 'full_name', 'email'] },
                    { model: DefectStatus, as: 'status', attributes: ['id', 'name'] },
                    { model: DefectPriority, as: 'priority', attributes: ['id', 'name'] },
                    { model: Objects, as: 'object', attributes: ['id', 'name', 'address'] }
                ]
            });
    
            if (!defect) {
                return res.status(404).json({
                    success: false,
                    message: 'Дефект не найден.'
                });
            }

            if (currentUser.role === 'Инженер') {
                if (defect.assignee_id !== currentUser.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Вы можете просматривать только те дефекты, на которые назначены.'
                    });
                }
            }
    
            res.status(200).json({
                success: true,
                defect
            });
        } catch (error) {
            console.error('Ошибка при получении дефекта:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при получении дефекта.',
                error: error.message
            });
        }
    }
}

module.exports = DefectsController;