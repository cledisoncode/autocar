const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
    Usuario
} = require('../models');

// CADASTRA USUÁRIO

async function cadastrarUsuario(req, res) {
    try {
        let {
            nome,
            sobrenome,
            cargo,
            email,
            senha
        } = req.body;

        // TRATAMENTO
        nome = nome?.trim();
        sobrenome = sobrenome?.trim();
        cargo = cargo?.trim();
        email = email?.trim().toLowerCase();

        // VALIDAÇÕES
        if (
            !nome ||
            !sobrenome ||
            !cargo ||
            !email ||
            !senha
        ) {

            return res.status(400).json({
                erro: 'Preencha todos os campos'
            });
        }

        if (senha.length < 8) {
            return res.status(400).json({
                erro: 'A senha deve possuir pelo menos 8 caracteres.'
            });
        }

        //VERIFICA EMAIL
        const usuarioExistente = await Usuario.findOne({
                where: {
                    email
                }
            });

        if (usuarioExistente) {
            return res.status(409).json({
                erro: 'Este email já está cadastrado.'
            });
        }

        // CRIA HASH DA SENHA
        const senhaHash = await bcrypt.hash(senha, 10);

        // CRIA USUÁRIO
        const usuario = await Usuario.create({
                nome,
                sobrenome,
                cargo,
                email,
                senha: senhaHash
            });

        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso.',

            usuario: {
                id_usuario: usuario.id_usuario,
                nome: usuario.nome,
                sobrenome: usuario.sobrenome,
                cargo: usuario.cargo,
                email: usuario.email
            }

        });

    } catch (error) {
        console.error('Erro ao cadastrar usuário:',error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function loginUsuario(req, res) {
    try {
        let {
            email,
            senha
        } = req.body;

        //TRATAMENTO
        email = email?.trim().toLowerCase();

        //VALIDAÇÃO
        if (!email || !senha) {
            return res.status(400).json({
                erro: 'Email e senha são obrigatórios.'
            });
        }

        //BUSCA USUÁRIO
        const usuario = await Usuario.findOne({
            where: {
                email
            }
        });

        if (!usuario) {
            return res.status(401).json({
                erro: 'Email ou senha incorretos.'
            });
        }

        //COMPARA SENHA
        const senhaCorreta =await bcrypt.compare(senha,usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: 'Email ou senha incorretos.'
            });
        }
        
        //gera token
        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                email: usuario.email,
                cargo: usuario.cargo
            },

            process.env.JWT_TOKEN_SECRET,

            {expiresIn: '1d'}
        );

        //LOGIN REALIZADO
        return res.status(200).json({
            mensagem: 'Login realizado com sucesso.',

            token,

            usuario: {
                id_usuario: usuario.id_usuario,
                nome: usuario.nome,
                sobrenome: usuario.sobrenome,
                cargo: usuario.cargo,
                email: usuario.email
            }
        });

    } catch (error) {
        console.error('Erro ao realizar login:',error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

module.exports = {
    cadastrarUsuario,
    loginUsuario
};