const User = require('./User');
const Role = require('./Role');
const DefectPriority = require('./DefectPriority');
const Objects = require('./Objects');
const Defect = require('./Defect');
const Comment = require('./Comment');
const Attachment = require('./Attachment');
const ChangeHistory = require('./ChangeHistory');
const DefectStatus = require('./DefectStatus');

Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

Objects.hasMany(Defect, { foreignKey: 'object_id' });
Defect.belongsTo(Objects, { foreignKey: 'object_id', as: 'object' });

DefectStatus.hasMany(Defect, { foreignKey: 'status_id' });
Defect.belongsTo(DefectStatus, { foreignKey: 'status_id', as: 'status' });

DefectPriority.hasMany(Defect, { foreignKey: 'priority_id' });
Defect.belongsTo(DefectPriority, { foreignKey: 'priority_id', as: 'priority' });

User.hasMany(Defect, { foreignKey: 'assignee_id', as: 'assignedDefects' });
User.hasMany(Defect, { foreignKey: 'reporter_id', as: 'reportedDefects' });
Defect.belongsTo(User, { foreignKey: 'assignee_id', as: 'assignee' });
Defect.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });

Defect.hasMany(Comment, { foreignKey: 'defect_id' });
Comment.belongsTo(Defect, { foreignKey: 'defect_id' });

User.hasMany(Comment, { foreignKey: 'user_id' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Defect.hasMany(Attachment, { foreignKey: 'defect_id' });
Attachment.belongsTo(Defect, { foreignKey: 'defect_id' });

User.hasMany(Attachment, { foreignKey: 'uploaded_by' });
Attachment.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploadedBy' });

User.hasMany(ChangeHistory, { foreignKey: 'user_id' });
ChangeHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
    User,
    Role,
    DefectPriority,
    Objects,
    Defect,
    Comment,
    Attachment,
    ChangeHistory,
    DefectStatus
};