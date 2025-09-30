const { DataTypes } = require('sequelize');
const database = require('../config/database');
const sequelize = database.sequelize;

const DefectPriority = sequelize.define('DefectPriority', {
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
            isIn: [['Низкий', 'Средний', 'Высокий']]
        }
    }
}, {
    tableName: 'defect_priority',
    timestamps: false
});

module.exports = DefectPriority;