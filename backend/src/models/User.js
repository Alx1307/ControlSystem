const { DataTypes } = require('sequelize');
const database = require('../config/database');
const sequelize = database.sequelize;

const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    user_surname: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    user_name: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    user_patronymic: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    user_role: {
        type: DataTypes.STRING(15),
        allowNull: false,
        validate: {
            correct_role(value) {
                const roles = ['Менеджер', 'Инженер', 'Наблюдатель'];

                if (!roles.includes(value)) {
                    return new Error('Некорректная роль.');
                }
            }
        }
    },
    user_email: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true
    },
    user_password: {
        type: DataTypes.STRING(20),
        allowNull: false
    }
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = User;