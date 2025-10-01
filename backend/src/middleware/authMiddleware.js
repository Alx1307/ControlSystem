const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Не выполнена авторизация. Отсутствует токен.'
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Не выполнена авторизация. Некорректный формат токена.'
        });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY, {
            algorithms: ['HS256']
        });

        req.user = decodedToken;

        next();
    } catch (err) {
        let message = 'Некорректный токен.';

        if (err.name === 'TokenExpiredError') {
            message = 'Срок действия токена истек.';
        } else if (err.name === 'JsonWebTokenError') {
            message = 'Недействительный токен.';
        } else if (err.name === 'NotBeforeError') {
            message = 'Токен еще не действует.';
        }

        return res.status(401).json({
            success: false,
            message: message,
            error: err.message
        });
    }
};

module.exports = authMiddleware;