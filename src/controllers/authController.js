const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

function respostaUsuario(usuario) {
    return {
        id: usuario.id_usuario,
        nome: usuario.nome,
        sobrenome: usuario.sobrenome,
        email: usuario.email
    };
}

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function criarToken(usuario) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET não configurado.');
    }

    return jwt.sign(
        {
            idUsuario: usuario.id_usuario,
            email: usuario.email,
            cargo: usuario.cargo
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

async function cadastrar(req, res) {
    try {
        let { nome, sobrenome, email, senha } = req.body;

        nome = nome?.trim();
        sobrenome = sobrenome?.trim();
        email = email?.trim().toLowerCase();

        if (!nome || !sobrenome || !email || !senha) {
            return res.status(400).json({
                erro: 'Nome, sobrenome, e-mail e senha são obrigatórios.'
            });
        }

        if (!emailValido(email)) {
            return res.status(400).json({ erro: 'E-mail inválido.' });
        }

        if (senha.length < 6) {
            return res.status(400).json({
                erro: 'A senha deve ter pelo menos 6 caracteres.'
            });
        }

        const totalUsuarios = await Usuario.count();

        if (totalUsuarios > 0) {
            return res.status(409).json({
                erro: 'Já existe uma conta administrativa cadastrada.'
            });
        }

        const senhaHash = await bcrypt.hash(senha, 12);
        const usuario = await Usuario.create({
            nome,
            sobrenome,
            cargo: 'ADMIN',
            email,
            senha: senhaHash
        });

        return res.status(201).json({
            mensagem: 'Conta administrativa criada com sucesso.',
            usuario: respostaUsuario(usuario)
        });
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                erro: 'Já existe uma conta com este e-mail.'
            });
        }

        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

async function login(req, res) {
    try {
        let { email, senha } = req.body;

        email = email?.trim().toLowerCase();

        if (!email || !senha) {
            return res.status(400).json({
                erro: 'E-mail e senha são obrigatórios.'
            });
        }

        const usuario = await Usuario.findOne({ where: { email } });

        if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
            return res.status(401).json({
                erro: 'E-mail ou senha incorretos.'
            });
        }

        const token = criarToken(usuario);

        return res.status(200).json({
            token,
            usuario: respostaUsuario(usuario)
        });
    } catch (error) {
        console.error('Erro ao realizar login:', error);

        if (error.message === 'JWT_SECRET não configurado.') {
            return res.status(500).json({
                erro: 'Configuração de segurança do servidor ausente.'
            });
        }

        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

module.exports = {
    cadastrar,
    login
};
