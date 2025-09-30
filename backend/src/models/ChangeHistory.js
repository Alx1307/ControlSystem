const { DataTypes } = require('sequelize');
const database = require('../config/database');
const sequelize = database.sequelize;

const ChangeHistory = sequelize.define('ChangeHistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    changed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    action: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    changes: {
        type: DataTypes.JSONB,
        allowNull: false
    }
}, {
    tableName: 'change_history',
    timestamps: false
});

module.exports = ChangeHistory;