const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
    const cabecalho = req.headers.authorization || '';
    const [tipo, token] = cabecalho.split(' ');

    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({
            erro: 'Token de autenticação não informado.'
        });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({
            erro: 'Configuração de segurança do servidor ausente.'
        });
    }

    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
        return next();
    } catch (error) {
        return res.status(401).json({
            erro: error.name === 'TokenExpiredError'
                ? 'Token expirado. Faça login novamente.'
                : 'Token inválido.'
        });
    }
}

module.exports = autenticar;
