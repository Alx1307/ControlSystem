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

    async deleteDefect(req, res) {
        try {
            const { defectId } = req.params;
            const currentUser = req.user;
    
            const defect = await this.Defect.findByPk(defectId);
            if (!defect) {
                return res.status(404).json({
                    success: false,
                    message: 'Дефект не найден.'
                });
            }
    
            if (currentUser.role !== 'Менеджер') {
                return res.status(403).json({
                    success: false,
                    message: 'Только менеджеры могут удалять дефекты.'
                });
            }
    
            await defect.destroy();
    
            res.status(200).json({
                success: true,
                message: 'Дефект успешно удален.'
            });
        } catch (error) {
            console.error('Ошибка при удалении дефекта:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при удалении дефекта.',
                error: error.message
            });
        }
    }

    async assignDefect(req, res) {
        try {
            const { defectId } = req.params;
            const { assignee_id } = req.body;
            const currentUser = req.user;
    
            const defect = await this.Defect.findByPk(defectId);
            if (!defect) {
                return res.status(404).json({
                    success: false,
                    message: 'Дефект не найден.'
                });
            }
    
            if (currentUser.role !== 'Менеджер') {
                return res.status(403).json({
                    success: false,
                    message: 'Только менеджеры могут назначать исполнителей.'
                });
            }

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
    
            await defect.update({ assignee_id });
    
            res.status(200).json({
                success: true,
                message: 'Исполнитель успешно назначен.',
                defect
            });
        } catch (error) {
            console.error('Ошибка при назначении исполнителя:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при назначении исполнителя.',
                error: error.message
            });
        }
    }

    async _isStatusTransitionValid(currentStatusId, newStatusId, userRole) {
        const current = parseInt(currentStatusId);
        const newStatus = parseInt(newStatusId);
    
        const validTransitions = {
            '1': [2, 5],
            '2': [3, 5],
            '3': [4, 5],
            '4': [],
            '5': []
        };
    
        const allowedStatuses = validTransitions[currentStatusId] || [];
        if (!allowedStatuses.includes(newStatus)) {
            return false;
        }
    
        if (userRole === 'Инженер') {
            if (![2, 3].includes(newStatus)) {
                return false;
            }
            
            if ([4, 5].includes(newStatus)) {
                return false;
            }
            
            if (current === 1 && newStatus === 3) {
                return false;
            }
        }
    
        if (userRole === 'Менеджер') {
            if (![4, 5].includes(newStatus)) {
                return false;
            }
            
            if ([2, 3].includes(newStatus)) {
                return false;
            }
        }
    
        if (newStatus < current && newStatus !== 5) {
            return false;
        }
    
        if (newStatus !== 5) {
            const expectedNextStatus = current + 1;
            if (newStatus !== expectedNextStatus) {
                return false;
            }
        }
    
        return true;
    }    

    async updateDefectStatus(req, res) {
        try {
            const { defectId } = req.params;
            const { status_id } = req.body;
            const currentUser = req.user;
    
            const defect = await this.Defect.findByPk(defectId, {
                include: [
                    { model: DefectStatus, as: 'status', attributes: ['id', 'name'] }
                ]
            });
    
            if (!defect) {
                return res.status(404).json({
                    success: false,
                    message: 'Дефект не найден.'
                });
            }
    
            if (!['Менеджер'].includes(currentUser.role) && currentUser.id !== defect.assignee_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Только менеджеры или назначенный исполнитель могут изменять статус дефекта.'
                });
            }
    
            const currentStatusId = defect.status_id.toString();
            const currentStatusName = defect.status.name;
    
            const newStatus = await DefectStatus.findByPk(status_id);
            if (!newStatus) {
                return res.status(400).json({
                    success: false,
                    message: `Статус с id ${status_id} не найден.`
                });
            }
    
            const isValidTransition = await this._isStatusTransitionValid(
                currentStatusId, 
                newStatus.id, 
                currentUser.role
            );
            
            if (!isValidTransition) {
                let errorMessage = `Невозможно изменить статус с "${currentStatusName}" на "${newStatus.name}".`;
                
                if (currentUser.role === 'Инженер' && [4, 5].includes(newStatus.id)) {
                    errorMessage = 'Инженер не может закрывать или отменять дефекты.';
                } else if (currentUser.role === 'Менеджер' && [2, 3].includes(newStatus.id)) {
                    errorMessage = 'Менеджер может только закрывать или отменять дефекты.';
                } else if (newStatus.id < defect.status_id && newStatus.id !== 5) {
                    errorMessage = 'Запрещен обратный переход статусов.';
                } else if (![2, 3].includes(newStatus.id) && currentUser.role === 'Инженер') {
                    errorMessage = 'Инженер может устанавливать только статусы "В работе" и "Решен".';
                } else if (![4, 5].includes(newStatus.id) && currentUser.role === 'Менеджер') {
                    errorMessage = 'Менеджер может устанавливать только статусы "Закрыт" и "Отменен".';
                }
    
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }
    
            await defect.update({ status_id: newStatus.id });
    
            const updatedDefect = await this.Defect.findByPk(defectId, {
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
                message: 'Статус дефекта успешно обновлен.',
                defect: updatedDefect
            });
        } catch (error) {
            console.error('Ошибка при обновлении статуса дефекта:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при обновлении статуса дефекта.',
                error: error.message
            });
        }
    }

    async updateDefect(req, res) {
        try {
            const { defectId } = req.params;
            const { title, description, object_id, status_id, priority_id, assignee_id, due_date } = req.body;
            const currentUser = req.user;
    
            const defect = await this.Defect.findByPk(defectId);
            if (!defect) {
                return res.status(404).json({
                    success: false,
                    message: 'Дефект не найден.'
                });
            }
    
            if (currentUser.role !== 'Менеджер') {
                return res.status(403).json({
                    success: false,
                    message: 'Доступ запрещен. Только менеджеры могут обновлять информацию о дефекте.'
                });
            }
    
            if (status_id !== undefined && status_id !== defect.status_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Изменение статуса запрещено через этот метод. Используйте метод изменения статуса.'
                });
            }
    
            const updateData = {
                title: title || defect.title,
                description: description || defect.description,
                object_id: object_id || defect.object_id,
                priority_id: priority_id || defect.priority_id,
                assignee_id: assignee_id || defect.assignee_id,
                due_date: due_date || defect.due_date,
                status_id: defect.status_id
            };
    
            await defect.update(updateData);
    
            res.status(200).json({
                success: true,
                message: 'Дефект успешно обновлен.',
                defect
            });
        } catch (error) {
            console.error('Ошибка при обновлении дефекта:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при обновлении дефекта.',
                error: error.message
            });
        }
    }

    async searchDefects(req, res) {
        try {
            const { title, description, object_id, status_id, priority_id, assignee_id, reporter_id } = req.query;
            const where = {};
    
            if (title) where.title = { [Op.iLike]: `%${title}%` };
            if (description) where.description = { [Op.iLike]: `%${description}%` };
            if (object_id) where.object_id = object_id;
            if (status_id) where.status_id = status_id;
            if (priority_id) where.priority_id = priority_id;
            if (assignee_id) where.assignee_id = assignee_id;
            if (reporter_id) where.reporter_id = reporter_id;
    
            const defects = await this.Defect.findAll({
                where,
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
                defects
            });
        } catch (error) {
            console.error('Ошибка при поиске дефектов:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при поиске дефектов.',
                error: error.message
            });
        }
    }
}

module.exports = DefectsController;