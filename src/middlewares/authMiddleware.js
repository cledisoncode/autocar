const jwt = require('jsonwebtoken');

function autenticarToken(req, res, next) {

    try {
        const authHeader = req.headers.authorization;

        // console.log('Authorization recebido:',authHeader);

        if (!authHeader) {
            return res.status(401).json({
                erro: 'Token não informado.'
            });
        }

        const [tipo, token] = authHeader.split(' ');

        if (tipo !== 'Bearer' || !token) {
            return res.status(401).json({
                erro: 'Formato do token inválido.'
            });
        }

        const usuario = jwt.verify(
            token,
            process.env.JWT_TOKEN_SECRET
        );

        req.usuario = usuario;
        next();

    } catch (error) {

        console.error('Erro na autenticação:',error);

        return res.status(401).json({
            erro: 'Token inválido ou expirado.'
        });
    }
}

module.exports = autenticarToken;