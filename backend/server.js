const express = require('express');
const database = require('./src/config/database');
const sequelize = database.sequelize;
require('dotenv').config();

const userRoutes = require('./src/routes/userRoutes');

const app = express();
app.use(express.json());

app.use('/', userRoutes);

const PORT = process.env.PORT;
app.listen(PORT, async () => {
    console.log(`Сервер запущен на порту http://localhost:${PORT}`);
});