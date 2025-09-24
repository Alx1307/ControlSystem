const bcrypt = require('bcryptjs');
const database = require('../config/database');
const sequelize = database.sequelize;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class UserController {
    constructor(UserModel) {
        this.User = UserModel;
    }

    // async function registration(req, res) {
    //     const { user_surname, user_name, user_patronymic, user_email, user_password } = req.body;

    //     try {
    //         let user = await User.findOne({ where: { user_email }});

    //         if (!user) {
    //             return res.status(404).send('Сотрудник с указанным email не найден');
    //         }

    //         res.status(200).send('Сотрудник успешно зарегистрирован.');
    //     } catch (err) {
    //         res.status(500).send(err.message);
    //     }
    // }
}

module.exports = UserController;