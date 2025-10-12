const { DataTypes } = require('sequelize');
const database = require('../config/database');
const sequelize = database.sequelize;

const Defect = sequelize.define('Defect', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    object_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'objects',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    status_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        references: {
            model: 'defect_status',
            key: 'id'
        }
    },
    priority_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
        references: {
            model: 'defect_priority',
            key: 'id'
        }
    },
    assignee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    reporter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'defects',
    timestamps: false
});

module.exports = Defect;