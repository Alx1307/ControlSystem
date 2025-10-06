const database = require('../config/database');
const sequelize = database.sequelize;
const Objects = require('../models/Objects');
const { Op } = require('sequelize');

class ObjectsController {
    constructor(ObjectModel) {
        this.Objects = ObjectModel;
    }

    async _setCurrentUserId(userId, transaction) {
        await sequelize.query('SET LOCAL app.current_user_id = :userId',
            { replacements: { userId: userId.toString() }, transaction });
    }

    async addObject(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { name, description, address, start_date, end_date } = req.body;
            const currentUser = req.user;

            await this._setCurrentUserId(currentUser.id, transaction);

            if (currentUser.role !== 'Менеджер') {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Только менеджеры могут создавать объекты.'
                });
            }

            const newObject = await this.Objects.create({
                name,
                description,
                address,
                start_date: start_date || null,
                end_date: end_date || null,
                manager_id: currentUser.id
            }, { transaction });

            await transaction.commit();

            res.status(201).json({
                success: true,
                message: 'Объект успешно создан.',
                object: newObject
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка при создании объекта:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при создании объекта.',
                error: error.message
            });
        }
    }
    
    async getAllObjects(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC' } = req.query;
    
            const offset = (page - 1) * limit;
            const order = [[sortBy, sortOrder]];
    
            const { count, rows: objects } = await this.Objects.findAndCountAll({
                order,
                limit,
                offset
            });
    
            res.status(200).json({
                success: true,
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                objects
            });
        } catch (error) {
            console.error('Ошибка при получении списка объектов:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при получении списка объектов.',
                error: error.message
            });
        }
    }
    
    async getObject(req, res) {
        try {
            const { objectId } = req.params;
    
            const object = await this.Objects.findByPk(objectId);
            if (!object) {
                return res.status(404).json({
                    success: false,
                    message: 'Объект не найден.'
                });
            }
    
            res.status(200).json({
                success: true,
                object
            });
        } catch (error) {
            console.error('Ошибка при получении объекта:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при получении объекта.',
                error: error.message
            });
        }
    }
    
    async updateObject(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { objectId } = req.params;
            const { name, description, address, start_date, end_date } = req.body;
            const currentUser = req.user;

            await this._setCurrentUserId(currentUser.id, transaction);

            const object = await this.Objects.findByPk(objectId, { transaction });
            if (!object) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Объект не найден.'
                });
            }

            if (currentUser.role !== 'Менеджер') {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Только менеджеры могут обновлять объекты.'
                });
            }

            await object.update({
                name: name || object.name,
                description: description || object.description,
                address: address || object.address,
                start_date: start_date || object.start_date,
                end_date: end_date || object.end_date,
                manager_id: currentUser.id
            }, { transaction });

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Объект успешно обновлен.',
                object
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка при обновлении объекта:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при обновлении объекта.',
                error: error.message
            });
        }
    }

    async deleteObject(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { objectId } = req.params;
            const currentUser = req.user;

            await this._setCurrentUserId(currentUser.id, transaction);

            const object = await this.Objects.findByPk(objectId, { transaction });
            if (!object) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Объект не найден.'
                });
            }

            if (currentUser.role !== 'Менеджер') {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Доступ запрещен. Только менеджеры могут удалять объекты.'
                });
            }

            await object.destroy({ transaction });

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Объект успешно удален.'
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка при удалении объекта:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при удалении объекта.',
                error: error.message
            });
        }
    }

    async searchObjects(req, res) {
        try {
            const { name, address, start_date, end_date } = req.query;
            const where = {};
    
            if (name) where.name = { [Op.iLike]: `%${name}%` };
            if (address) where.address = { [Op.iLike]: `%${address}%` };
            if (start_date) where.start_date = { [Op.gte]: new Date(start_date) };
            if (end_date) where.end_date = { [Op.lte]: new Date(end_date) };

            console.log('Where condition:', where);
    
            const objects = await this.Objects.findAll({
                where: where,
                attributes: ['id', 'name', 'description', 'address', 'start_date', 'end_date']
            });
    
            res.status(200).json({
                success: true,
                objects
            });
        } catch (error) {
            console.error('Ошибка при поиске объектов:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при поиске объектов.',
                error: error.message
            });
        }
    } 
}

module.exports = ObjectsController;