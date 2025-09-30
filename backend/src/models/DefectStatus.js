const { DataTypes } = require('sequelize');
const database = require('../config/database');
const sequelize = database.sequelize;

const DefectStatus = sequelize.define('DefectStatus', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            isIn: [['Новый', 'В работе', 'На проверке', 'Закрыт', 'Отменен']]
        }
    }
}, {
    tableName: 'defect_status',
    timestamps: false
});

module.exports = DefectStatus;