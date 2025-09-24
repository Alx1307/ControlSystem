const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Не выполнена авторизация.' });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.userData = decodedToken;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Некорректный токен.' });
    }
};

module.exports = authMiddleware;