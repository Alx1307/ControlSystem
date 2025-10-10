const bcrypt = require('bcryptjs');
const database = require('../config/database');
const sequelize = database.sequelize;
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { Op } = require('sequelize');

class UserController {
    constructor(UserModel) {
        this.User = UserModel;
    }

    async register(req, res) {
        try {
            const { full_name, email, password } = req.body;
    
            const existingUser = await User.findOne({ where: { email } });
    
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Пользователь с указанным email не найден в системе'
                });
            }
    
            if (existingUser.full_name !== null && existingUser.password !== null) {
                return res.status(400).json({
                    success: false,
                    message: 'Данный пользователь уже завершил регистрацию'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
    
            await existingUser.update({
                full_name: full_name,
                password: hashedPassword
            });
    
            res.status(200).json({
                success: true,
                message: 'Пользователь успешно зарегистрирован'
            });
    
        } catch (error) {
            console.error('Ошибка регистрации:', error);
    
            res.status(500).json({
                success: false,
                message: 'Ошибка при регистрации пользователя',
                error: error.message
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
    
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email и пароль обязательны для входа'
                });
            }
    
            const user = await User.findOne({
                where: { email },
                include: [{ model: Role, as: 'role' }]
            });
    
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Пользователь не найден'
                });
            }
    
            const match = await bcrypt.compare(password, user.password);
    
            if (!match) {
                return res.status(401).json({
                    success: false,
                    message: 'Неверный пароль'
                });
            }
    
            const tokenPayload = {
                id: user.id,
                role: user.role.name,
                email: user.email,
                full_name: user.full_name,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (3600 * 24)
            };
    
            const token = jwt.sign(
                tokenPayload,
                process.env.JWT_SECRET_KEY,
                { algorithm: 'HS256' }
            );
    
            res.status(200).json({
                success: true,
                message: 'Успешный вход в систему',
                token: token,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role.name
                }
            });
    
        } catch (error) {
            console.error('Ошибка входа:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при попытке входа',
                error: error.message
            });
        }
    }

    async getUser(req, res) {
        try {
            const { userId } = req.params;
            const currentUser = req.user;
    
            if (!currentUser.role) {
                return res.status(403).json({
                    success: false,
                    message: 'Ошибка авторизации: роль пользователя не определена'
                });
            }
    
            if (currentUser.role !== 'Менеджер' && currentUser.id !== parseInt(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Нет прав для просмотра информации об этом пользователе'
                });
            }
    
            const user = await User.findOne({
                where: { id: userId },
                include: [{ model: Role, as: 'role' }],
                attributes: { exclude: ['password'] }
            });
    
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Пользователь не найден'
                });
            }
    
            res.status(200).json({
                success: true,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role.name,
                    created_at: user.created_at
                }
            });
    
        } catch (error) {
            console.error('Ошибка получения данных пользователя:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при получении данных пользователя',
                error: error.message
            });
        }
    }

    async addUser(req, res) {
        try {
            const { email, role: roleName } = req.body;
            const currentUser = req.user;
    
            if (currentUser.role !== 'Менеджер') {
                return res.status(403).json({
                    success: false,
                    message: 'Только менеджеры могут добавлять пользователей.'
                });
            }
    
            const existingUser = await this.User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Пользователь с таким email уже существует.'
                });
            }
    
            const role = await Role.findOne({ where: { name: roleName } });
            if (!role) {
                return res.status(400).json({
                    success: false,
                    message: `Роль "${roleName}" не существует. Доступные роли: Менеджер, Инженер, Наблюдатель.`
                });
            }
    
            const newUser = await this.User.create({
                email,
                full_name: null,
                password: null,
                role_id: role.id,
            });
    
            res.status(201).json({
                success: true,
                message: 'Пользователь успешно добавлен.',
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    role: role.name
                }
            });
    
        } catch (error) {
            console.error('Ошибка при добавлении пользователя:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при добавлении пользователя.',
                error: error.message
            });
        }
    }

    async getAllUsers(req, res) {
        try {
            const currentUser = req.user;
    
            if (!currentUser.role || currentUser.role !== 'Менеджер') {
                return res.status(403).json({
                    success: false,
                    message: 'Доступ запрещен. Только менеджеры могут просматривать информацию обо всех пользователях'
                });
            }
    
            const total = await User.count();
    
            const users = await User.findAll({
                include: [{ model: Role, as: 'role' }],
                attributes: { exclude: ['password'] },
                order: [['id', 'ASC']]
            });
    
            res.status(200).json({
                success: true,
                message: 'Список пользователей успешно получен',
                total: total,
                users: users.map(user => ({
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role.name,
                    created_at: user.created_at
                }))
            });
    
        } catch (error) {
            console.error('Ошибка получения списка пользователей:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при получении списка пользователей',
                error: error.message
            });
        }
    }
    
    async updateUser(req, res) {
        try {
            const { userId } = req.params;
            const { full_name, email } = req.body;
    
            const currentUser = req.user;
    
            if (currentUser.id !== parseInt(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Вы можете редактировать только свои данные'
                });
            }
    
            const user = await User.findByPk(userId);
    
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Пользователь не найден'
                });
            }
    
            const updateData = {};
    
            if (full_name !== undefined) {
                updateData.full_name = full_name;
            }
    
            if (email !== undefined) {
                updateData.email = email;
            }
    
            await user.update(updateData);
    
            res.status(200).json({
                success: true,
                message: 'Данные пользователя успешно обновлены',
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    updated_at: user.updated_at
                }
            });
    
        } catch (error) {
            console.error('Ошибка обновления данных пользователя:', error);
    
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    message: 'Пользователь с таким email уже существует'
                });
            }
    
            res.status(500).json({
                success: false,
                message: 'Ошибка при обновлении данных пользователя',
                error: error.message
            });
        }
    }
    
    async deleteUser(req, res) {
        try {
            const { userId } = req.params;
    
            const currentUser = req.user;
    
            if (currentUser.id !== parseInt(userId) && currentUser.role !== 'Менеджер') {
                return res.status(403).json({
                    success: false,
                    message: 'У вас нет прав для удаления этого пользователя'
                });
            }
    
            const user = await User.findByPk(userId, {
                include: [{ model: Role, as: 'role' }]
            });
    
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Пользователь не найден'
                });
            }
    
            if (currentUser.id === parseInt(userId) && currentUser.role === 'Менеджер') {
                const managersCount = await User.count({
                    include: [{
                        model: Role,
                        as: 'role',
                        where: { name: 'Менеджер' }
                    }]
                });
    
                if (managersCount <= 1) {
                    return res.status(403).json({
                        success: false,
                        message: 'Вы не можете удалить себя, так как вы последний менеджер в системе'
                    });
                }
            }
    
            await user.destroy();
    
            res.status(200).json({
                success: true,
                message: 'Пользователь успешно удален'
            });
    
        } catch (error) {
            console.error('Ошибка удаления пользователя:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при удалении пользователя',
                error: error.message
            });
        }
    }
    
    async getEngineers(req, res) {
        try {
            const engineers = await User.findAll({
                include: [{
                    model: Role,
                    as: 'role',
                    where: { name: 'Инженер' }
                }],
                attributes: { exclude: ['password'] },
                order: [['id', 'ASC']]
            });
    
            const total = engineers.length;
    
            res.status(200).json({
                success: true,
                message: 'Список инженеров успешно получен',
                total: total,
                engineers: engineers.map(engineer => ({
                    id: engineer.id,
                    full_name: engineer.full_name,
                    email: engineer.email,
                    role: engineer.role.name,
                    created_at: engineer.created_at
                }))
            });
    
        } catch (error) {
            console.error('Ошибка получения списка инженеров:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при получении списка инженеров',
                error: error.message
            });
        }
    }

    async searchUsers(req, res) {
        try {
            const currentUser = req.user;
            const { search, role, sortBy, sortOrder, page, limit } = req.query;
    
            if (!currentUser.role || currentUser.role !== 'Менеджер') {
                return res.status(403).json({
                    success: false,
                    message: 'Доступ запрещен. Только менеджеры могут просматривать информацию обо всех пользователях'
                });
            }
    
            let whereClause = {};
            let orderClause = [];
    
            if (search) {
                whereClause = {
                    [Op.or]: [
                        { full_name: { [Op.iLike]: `%${search}%` } },
                        { email: { [Op.iLike]: `%${search}%` } }
                    ]
                };
            }
    
            if (role && role !== '') {
                whereClause = {
                    ...whereClause,
                    '$role.name$': role
                };
            }
    
            if (sortBy === 'name') {
                orderClause = [
                    ['full_name', sortOrder || 'ASC']
                ];
            } else if (sortBy === 'email') {
                orderClause = [
                    ['email', sortOrder || 'ASC']
                ];
            } else if (sortBy === 'role') {
                orderClause = [
                    [{ model: Role, as: 'role' }, 'name', sortOrder || 'ASC']
                ];
            } else {
                orderClause = [['id', 'ASC']];
            }
    
            const pageNumber = parseInt(page) || 1;
            const pageSize = parseInt(limit) || 10;
            const offset = (pageNumber - 1) * pageSize;
    
            const { count, rows: users } = await User.findAndCountAll({
                where: whereClause,
                include: [{ 
                    model: Role, 
                    as: 'role',
                    attributes: ['name']
                }],
                attributes: { exclude: ['password'] },
                order: orderClause,
                limit: pageSize,
                offset: offset,
                distinct: true
            });
    
            const total = count;
            const totalPages = Math.ceil(total / pageSize);
    
            res.status(200).json({
                success: true,
                message: 'Список пользователей успешно получен',
                total: total,
                pagination: {
                    page: pageNumber,
                    limit: pageSize,
                    totalPages: totalPages,
                    total: total
                },
                users: users.map(user => ({
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role ? user.role.name : 'Не указана',
                    created_at: user.created_at
                }))
            });
    
        } catch (error) {
            console.error('Ошибка поиска пользователей:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при поиске пользователей',
                error: error.message
            });
        }
    }
}

module.exports = UserController;