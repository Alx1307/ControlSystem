const { Sequelize } = require('sequelize');
require('dotenv').config();

//класс подключения к бд с использованием паттерна Singleton
class Database {
    constructor() {
        if (!Database.instance) {
            //подключение к бд
            this.sequelize = new Sequelize(
                process.env.DB_NAME,
                process.env.DB_USER,
                process.env.DB_PASSWORD,
                {
                    host: process.env.DB_HOST,
                    dialect: process.env.DB_DIALECT
                }
            );

            //синхронизация таблиц бд
            this.sequelize.sync({ force: false })
                .then(() => {
                    console.log('Модели синхронизированы с базой данных.');
                })
                .catch((err) => {
                    console.error("Ошибка синхронизации моделей:", err);
                });

            Database.instance = this;
        }

        return Database.instance;
    }

    //проверка подключения к базе данных
    async authenticate() {
        try {
            await this.sequelize.authenticate();
            console.log('Успешно подключено к базе данных.');
        } catch (err) {
            console.error('Ошибка подключения к базе данных:', err);
        }
    }

    //получение единственного экземпляра подключения к бд
    static getInstance() {
        if (!Database.instance) {
            return new Database();
        }

        return Database.instance;
    }
};

const database = Database.getInstance();

(async () => {
    await database.authenticate();
})();

module.exports = database;