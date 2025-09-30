const { DataTypes } = require('sequelize');
const database = require('../config/database');
const sequelize = database.sequelize;

const Attachment = sequelize.define('Attachment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    defect_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'defects',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    file_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    file_path: {
        type: DataTypes.STRING(512),
        allowNull: false
    },
    file_type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    uploaded_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    uploaded_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'attachments',
    timestamps: false
});

module.exports = Attachment;