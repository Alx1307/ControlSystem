const bcrypt = require('bcryptjs');
const database = require('../config/database');
const sequelize = database.sequelize;
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

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
}

module.exports = UserController;