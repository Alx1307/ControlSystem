const express = require('express');
const database = require('./src/config/database');
const sequelize = database.sequelize;
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT;
app.listen(PORT, async () => {
    console.log(`Сервер запущен на порту http://localhost:${PORT}`);
});