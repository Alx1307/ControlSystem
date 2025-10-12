const express = require('express');
const cors = require('cors');
const database = require('./src/config/database');
const sequelize = database.sequelize;
require('dotenv').config();

const userRoutes = require('./src/routes/userRoutes');
const objectsRoutes = require('./src/routes/objectsRoutes');
const defectRoutes = require('./src/routes/defectRoutes');
const historyRoutes = require('./src/routes/historyRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const attachmentRoutes = require('./src/routes/attachmentRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');

const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:5173'
}));

app.use('/', userRoutes);
app.use('/objects', objectsRoutes);
app.use('/defects', defectRoutes);
app.use('/history', historyRoutes);
app.use('/comments', commentRoutes);
app.use('/attachments', attachmentRoutes);
app.use('/analytics', analyticsRoutes);

const PORT = process.env.PORT;
app.listen(PORT, async () => {
    console.log(`Сервер запущен на порту http://localhost:${PORT}`);
});