const { DataTypes } = require('sequelize');
const database = require('../config/database');
const sequelize = database.sequelize;

const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    report_type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    parameters: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'reports',
    timestamps: false
});

module.exports = Report;