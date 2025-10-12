const database = require('../config/database');
const sequelize = database.sequelize;
const Defect = require('../models/Defect');
const Object = require('../models/Objects');
const User = require('../models/User');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

class AnalyticsController {
    async getGeneralStats(req, res) {
        try {
            const totalDefects = await Defect.count();
            const totalObjects = await Object.count();
            const totalUsers = await User.count();
            
            const statusStats = await Defect.findAll({
                attributes: [
                    'status_id',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['status_id'],
                raw: true
            });
            
            const priorityStats = await Defect.findAll({
                attributes: [
                    'priority_id',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['priority_id'],
                raw: true
            });
            
            const monthlyStats = await Defect.findAll({
                attributes: [
                    [
                        sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 
                        'month'
                    ],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at'))],
                order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'ASC']],
                raw: true
            });
            
            const activeDefects = await Defect.count({
                where: { status_id: 2 }
            });
            
            const completionStats = await Defect.findAll({
                attributes: [
                    'status_id',
                    [sequelize.fn('AVG', 
                        sequelize.fn('DATE_PART', 'day', 
                            sequelize.fn('AGE', sequelize.col('completed_at'), sequelize.col('created_at'))
                        )
                    ), 'avg_completion_days']
                ],
                where: {
                    status_id: 4,
                    completed_at: { [Op.ne]: null },
                    created_at: { [Op.ne]: null }
                },
                group: ['status_id'],
                raw: true
            });
            
            res.status(200).json({
                success: true,
                stats: {
                    totalDefects,
                    totalObjects,
                    totalUsers,
                    activeDefects,
                    statusStats,
                    priorityStats,
                    monthlyStats: monthlyStats.map(stat => ({
                        month: stat.month,
                        count: parseInt(stat.count)
                    })),
                    completionStats
                }
            });
        } catch (error) {
            console.error('Error getting general stats:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при получении статистики',
                error: error.message
            });
        }
    }
    
    async getDefectsReport(req, res) {
        try {
            const { 
                startDate, 
                endDate, 
                objectId, 
                statusId, 
                priorityId,
                assigneeId,
                format = 'json' 
            } = req.query;
            
            let whereClause = {};
            
            if (startDate && endDate) {
                whereClause.created_at = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            } else if (startDate) {
                whereClause.created_at = {
                    [Op.gte]: new Date(startDate)
                };
            } else if (endDate) {
                whereClause.created_at = {
                    [Op.lte]: new Date(endDate)
                };
            }
            
            if (objectId) whereClause.object_id = objectId;
            if (statusId) whereClause.status_id = statusId;
            if (priorityId) whereClause.priority_id = priorityId;
            if (assigneeId) whereClause.assignee_id = assigneeId;
            
            const defects = await Defect.findAll({
                where: whereClause,
                include: [
                    {
                        model: Object,
                        as: 'object',
                        attributes: ['id', 'name', 'address']
                    },
                    {
                        model: User,
                        as: 'assignee',
                        attributes: ['id', 'full_name', 'email']
                    },
                    {
                        model: User,
                        as: 'reporter',
                        attributes: ['id', 'full_name', 'email']
                    }
                ],
                order: [['id', 'DESC']]
            });
            
            if (format === 'excel') {
                return await this.exportDefectsToExcel(defects, res);
            } else if (format === 'csv') {
                return await this.exportDefectsToCSV(defects, res);
            }
            
            res.status(200).json({
                success: true,
                defects,
                total: defects.length
            });
            
        } catch (error) {
            console.error('Error getting defects report:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при формировании отчета по дефектам',
                error: error.message
            });
        }
    }
    
    async getObjectsReport(req, res) {
        try {
            const { format = 'json' } = req.query;
            
            const objects = await Object.findAll({
                include: [
                    {
                        model: Defect,
                        as: 'defects',
                        attributes: ['id', 'status_id', 'priority_id', 'created_at', 'completed_at'],
                        include: [
                            {
                                model: User,
                                as: 'assignee',
                                attributes: ['full_name']
                            }
                        ]
                    }
                ]
            });
            
            const objectsWithStats = objects.map(object => {
                const defects = object.defects || [];
                const totalDefects = defects.length;
                const openDefects = defects.filter(d => [1, 2, 3].includes(d.status_id)).length;
                const closedDefects = defects.filter(d => [4, 5].includes(d.status_id)).length;
                
                const completedDefects = defects.filter(d => d.status_id === 4 && d.completed_at && d.created_at);
                let avgCompletionTime = 0;
                
                if (completedDefects.length > 0) {
                    const totalCompletionTime = completedDefects.reduce((sum, defect) => {
                        const created = new Date(defect.created_at);
                        const completed = new Date(defect.completed_at);
                        const diffTime = completed - created;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return sum + diffDays;
                    }, 0);
                    avgCompletionTime = (totalCompletionTime / completedDefects.length).toFixed(1);
                }
                
                return {
                    ...object.toJSON(),
                    stats: {
                        totalDefects,
                        openDefects,
                        closedDefects,
                        completionRate: totalDefects > 0 ? (closedDefects / totalDefects * 100).toFixed(2) : 0,
                        avgCompletionTime: avgCompletionTime > 0 ? avgCompletionTime : 'Н/Д'
                    }
                };
            });
            
            if (format === 'excel') {
                return await this.exportObjectsToExcel(objectsWithStats, res);
            } else if (format === 'csv') {
                return await this.exportObjectsToCSV(objectsWithStats, res);
            }
            
            res.status(200).json({
                success: true,
                objects: objectsWithStats,
                total: objectsWithStats.length
            });
            
        } catch (error) {
            console.error('Error getting objects report:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при формировании отчета по объектам',
                error: error.message
            });
        }
    }
    
    async getPerformanceReport(req, res) {
        try {
            const { startDate, endDate, format = 'json' } = req.query;
            
            let dateFilter = {};
            if (startDate && endDate) {
                dateFilter = {
                    created_at: {
                        [Op.between]: [new Date(startDate), new Date(endDate)]
                    }
                };
            }
            
            const users = await User.findAll({
                where: { role_id: 2 },
                include: [
                    {
                        model: Defect,
                        as: 'assignedDefects',
                        required: false,
                        where: dateFilter,
                        attributes: ['id', 'status_id', 'priority_id', 'created_at', 'completed_at']
                    }
                ]
            });
            
            const performanceData = users.map(user => {
                let defects = user.assignedDefects || [];
                
                const totalDefects = defects.length;
                const completedDefects = defects.filter(d => [4, 5].includes(d.status_id)).length;
                const avgCompletionTime = this.calculateAverageCompletionTime(defects);
                
                let efficiencyScore = 0;
                if (totalDefects > 0 && avgCompletionTime) {
                    efficiencyScore = Math.max(0, 100 - (avgCompletionTime * 2));
                }
                
                return {
                    user: {
                        id: user.id,
                        full_name: user.full_name,
                        email: user.email
                    },
                    performance: {
                        totalDefects,
                        completedDefects,
                        completionRate: totalDefects > 0 ? (completedDefects / totalDefects * 100).toFixed(2) : 0,
                        avgCompletionTime: avgCompletionTime || 'Н/Д',
                        efficiencyScore: efficiencyScore > 0 ? efficiencyScore.toFixed(1) + '%' : 'Н/Д'
                    }
                };
            });
            
            if (format === 'excel') {
                return await this.exportPerformanceToExcel(performanceData, res);
            } else if (format === 'csv') {
                return await this.exportPerformanceToCSV(performanceData, res);
            }
            
            res.status(200).json({
                success: true,
                performance: performanceData
            });
            
        } catch (error) {
            console.error('Error getting performance report:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при формировании отчета по производительности',
                error: error.message
            });
        }
    }
    
    async exportDefectsToExcel(defects, res) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Дефекты');
        
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Название', key: 'title', width: 30 },
            { header: 'Объект', key: 'object', width: 25 },
            { header: 'Статус', key: 'status', width: 15 },
            { header: 'Приоритет', key: 'priority', width: 15 },
            { header: 'Исполнитель', key: 'assignee', width: 20 },
            { header: 'Создатель', key: 'reporter', width: 20 },
            { header: 'Срок', key: 'due_date', width: 15 },
            { header: 'Дата создания', key: 'created_at', width: 15 },
            { header: 'Дата выполнения', key: 'completed_at', width: 15 },
            { header: 'Время выполнения (дни)', key: 'completion_time', width: 20 }
        ];
        
        defects.forEach(defect => {
            const completionTime = defect.completed_at && defect.created_at 
                ? this.calculateDaysDifference(defect.created_at, defect.completed_at)
                : 'Н/Д';
                
            worksheet.addRow({
                id: defect.id,
                title: defect.title,
                object: defect.object?.name || 'Не указан',
                status: this.getStatusText(defect.status_id),
                priority: this.getPriorityText(defect.priority_id),
                assignee: defect.assignee?.full_name || 'Не назначен',
                reporter: defect.reporter?.full_name || 'Неизвестно',
                due_date: defect.due_date ? new Date(defect.due_date).toLocaleDateString('ru-RU') : 'Не указан',
                created_at: new Date(defect.created_at).toLocaleDateString('ru-RU'),
                completed_at: defect.completed_at ? new Date(defect.completed_at).toLocaleDateString('ru-RU') : 'Не выполнено',
                completion_time: completionTime
            });
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=defects_report.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();
    }
    
    async exportDefectsToCSV(defects, res) {
        const headers = 'ID,Название,Объект,Статус,Приоритет,Исполнитель,Создатель,Срок,Дата создания,Дата выполнения,Время выполнения (дни)\n';
        
        const rows = defects.map(defect => {
            const completionTime = defect.completed_at && defect.created_at 
                ? this.calculateDaysDifference(defect.created_at, defect.completed_at)
                : 'Н/Д';
                
            return `${defect.id},"${defect.title}","${defect.object?.name || 'Не указан'}","${this.getStatusText(defect.status_id)}","${this.getPriorityText(defect.priority_id)}","${defect.assignee?.full_name || 'Не назначен'}","${defect.reporter?.full_name || 'Неизвестно'}","${defect.due_date ? new Date(defect.due_date).toLocaleDateString('ru-RU') : 'Не указан'}","${new Date(defect.created_at).toLocaleDateString('ru-RU')}","${defect.completed_at ? new Date(defect.completed_at).toLocaleDateString('ru-RU') : 'Не выполнено'}","${completionTime}"`;
        }).join('\n');
        
        const csv = headers + rows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=defects_report.csv');
        res.send(csv);
    }
    
    async exportObjectsToExcel(objects, res) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Объекты');
        
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Название', key: 'name', width: 25 },
            { header: 'Адрес', key: 'address', width: 30 },
            { header: 'Всего дефектов', key: 'total_defects', width: 15 },
            { header: 'Открытые', key: 'open_defects', width: 12 },
            { header: 'Закрытые', key: 'closed_defects', width: 12 },
            { header: 'Процент завершения', key: 'completion_rate', width: 18 },
            { header: 'Среднее время выполнения (дни)', key: 'avg_completion_time', width: 25 }
        ];
        
        objects.forEach(object => {
            worksheet.addRow({
                id: object.id,
                name: object.name,
                address: object.address || 'Не указан',
                total_defects: object.stats.totalDefects,
                open_defects: object.stats.openDefects,
                closed_defects: object.stats.closedDefects,
                completion_rate: `${object.stats.completionRate}%`,
                avg_completion_time: object.stats.avgCompletionTime
            });
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=objects_report.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();
    }
    
    async exportObjectsToCSV(objects, res) {
        const headers = 'ID,Название,Адрес,Всего дефектов,Открытые,Закрытые,Процент завершения,Среднее время выполнения (дни)\n';
        
        const rows = objects.map(object => 
            `${object.id},"${object.name}","${object.address || 'Не указан'}",${object.stats.totalDefects},${object.stats.openDefects},${object.stats.closedDefects},${object.stats.completionRate}%,${object.stats.avgCompletionTime}`
        ).join('\n');
        
        const csv = headers + rows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=objects_report.csv');
        res.send(csv);
    }
    
    async exportPerformanceToExcel(performanceData, res) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Производительность');
        
        worksheet.columns = [
            { header: 'Сотрудник', key: 'employee', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Всего дефектов', key: 'total_defects', width: 15 },
            { header: 'Завершено', key: 'completed', width: 12 },
            { header: 'Процент завершения', key: 'completion_rate', width: 18 },
            { header: 'Среднее время (дни)', key: 'avg_time', width: 18 },
            { header: 'Оценка эффективности', key: 'efficiency_score', width: 20 }
        ];
        
        performanceData.forEach(data => {
            worksheet.addRow({
                employee: data.user.full_name,
                email: data.user.email,
                total_defects: data.performance.totalDefects,
                completed: data.performance.completedDefects,
                completion_rate: `${data.performance.completionRate}%`,
                avg_time: data.performance.avgCompletionTime,
                efficiency_score: data.performance.efficiencyScore
            });
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=performance_report.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();
    }
    
    async exportPerformanceToCSV(performanceData, res) {
        const headers = 'Сотрудник,Email,Всего дефектов,Завершено,Процент завершения,Среднее время (дни),Оценка эффективности\n';
        
        const rows = performanceData.map(data => 
            `"${data.user.full_name}","${data.user.email}",${data.performance.totalDefects},${data.performance.completedDefects},${data.performance.completionRate}%,${data.performance.avgCompletionTime},${data.performance.efficiencyScore}`
        ).join('\n');
        
        const csv = headers + rows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=performance_report.csv');
        res.send(csv);
    }
    
    calculateAverageCompletionTime(defects) {
        const completedDefects = defects.filter(d => 
            [4, 5].includes(d.status_id) && d.completed_at && d.created_at
        );
        
        if (completedDefects.length === 0) return null;
        
        const totalTime = completedDefects.reduce((sum, defect) => {
            const created = new Date(defect.created_at);
            const completed = new Date(defect.completed_at);
            const diffTime = completed - created;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return sum + diffDays;
        }, 0);
        
        return (totalTime / completedDefects.length).toFixed(1);
    }
    
    calculateDaysDifference(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    
    getStatusText(statusId) {
        const statuses = {
            1: 'Новый',
            2: 'В работе',
            3: 'На проверке',
            4: 'Закрыт',
            5: 'Отменен'
        };
        return statuses[statusId] || 'Неизвестно';
    }
    
    getPriorityText(priorityId) {
        const priorities = {
            1: 'Низкий',
            2: 'Средний',
            3: 'Высокий'
        };
        return priorities[priorityId] || 'Неизвестно';
    }
}

module.exports = AnalyticsController;