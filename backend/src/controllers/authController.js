const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Usuario, CodigoRecuperacaoSenha } = require('../models');

const TEMPO_EXPIRACAO_CODIGO_MS = 10 * 60 * 1000;
const INTERVALO_REENVIO_CODIGO_MS = 60 * 1000;
const LIMITE_TENTATIVAS_CODIGO = 5;

function provedorEmailConfigurado() {
    return String(process.env.EMAIL_PROVIDER || 'smtp').trim().toLowerCase();
}

function criarTransportadorEmail() {
    const { SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
    const porta = Number(process.env.SMTP_PORT || 587);

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM || !Number.isInteger(porta) || porta < 1 || porta > 65535) {
        return null;
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: porta,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD
        }
    });
}

function emailEstaConfigurado() {
    const provedor = provedorEmailConfigurado();

    if (provedor === 'brevo') {
        return Boolean(process.env.BREVO_API_KEY?.trim() && process.env.BREVO_FROM_EMAIL?.trim());
    }

    if (provedor === 'smtp') {
        return Boolean(criarTransportadorEmail());
    }

    return false;
}

async function enviarEmailRecuperacao({ para, assunto, texto }) {
    if (provedorEmailConfigurado() === 'brevo') {
        const resposta = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: process.env.BREVO_FROM_NAME?.trim() || 'AUTOCAR',
                    email: process.env.BREVO_FROM_EMAIL.trim()
                },
                to: [{ email: para }],
                subject: assunto,
                textContent: texto
            })
        });

        if (!resposta.ok) {
            const detalhe = (await resposta.text()).slice(0, 500);
            throw new Error(`Brevo respondeu HTTP ${resposta.status}${detalhe ? `: ${detalhe}` : '.'}`);
        }

        return;
    }

    const transportador = criarTransportadorEmail();
    if (!transportador) {
        throw new Error('Configuração SMTP ausente ou inválida.');
    }

    await transportador.sendMail({
        from: process.env.SMTP_FROM,
        to: para,
        subject: assunto,
        text: texto
    });
}

function hashCodigoRecuperacao(idUsuario, codigo) {
    return crypto
        .createHmac('sha256', process.env.JWT_SECRET)
        .update(`${idUsuario}:${codigo}`)
        .digest('hex');
}

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

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                erro: 'Configuração de segurança do servidor ausente.'
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
            token: criarToken(usuario),
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

async function verificarEmail(req, res) {
    const email = req.body?.email?.trim().toLowerCase();

    if (!email || !emailValido(email)) {
        return res.status(400).json({ erro: 'E-mail inválido.' });
    }

    const existe = Boolean(await Usuario.findOne({
        where: { email },
        attributes: ['id_usuario']
    }));

    return res.status(200).json({ existe });
}

async function solicitarRecuperacaoSenha(req, res) {
    const email = req.body?.email?.trim().toLowerCase();

    if (!email || !emailValido(email)) {
        return res.status(400).json({ erro: 'Informe um e-mail válido.' });
    }

    if (!emailEstaConfigurado()) {
        return res.status(503).json({
            erro: 'Configure EMAIL_PROVIDER e as credenciais do provedor de e-mail no servidor.'
        });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ erro: 'Configuração de segurança do servidor ausente.' });
    }

    try {
        const usuario = await Usuario.findOne({ where: { email } });

        // A resposta é igual para e-mails cadastrados e não cadastrados.
        if (!usuario) {
            return res.status(202).json({
                mensagem: 'Se o e-mail estiver cadastrado, enviaremos um código de recuperação.'
            });
        }

        const codigoExistente = await CodigoRecuperacaoSenha.findOne({
            where: { id_usuario: usuario.id_usuario }
        });

        if (codigoExistente && Date.now() - new Date(codigoExistente.criado_em).getTime() < INTERVALO_REENVIO_CODIGO_MS) {
            return res.status(202).json({
                mensagem: 'Se o e-mail estiver cadastrado, enviaremos um código de recuperação.'
            });
        }

        const codigo = String(crypto.randomInt(10_000_000, 100_000_000));
        const criadoEm = new Date();
        const expiraEm = new Date(criadoEm.getTime() + TEMPO_EXPIRACAO_CODIGO_MS);
        const codigoHash = hashCodigoRecuperacao(usuario.id_usuario, codigo);

        if (codigoExistente) {
            await codigoExistente.update({
                codigo_hash: codigoHash,
                tentativas: 0,
                criado_em: criadoEm,
                expira_em: expiraEm
            });
        } else {
            await CodigoRecuperacaoSenha.create({
                id_usuario: usuario.id_usuario,
                codigo_hash: codigoHash,
                tentativas: 0,
                criado_em: criadoEm,
                expira_em: expiraEm
            });
        }

        try {
            await enviarEmailRecuperacao({
                para: usuario.email,
                assunto: 'Código para recuperar sua senha AUTOCAR',
                texto: `Seu código de recuperação é ${codigo}. Ele expira em 10 minutos. Se você não solicitou a troca, ignore esta mensagem.`
            });
        } catch (errorEmail) {
            await CodigoRecuperacaoSenha.destroy({
                where: { id_usuario: usuario.id_usuario }
            });
            console.error('Falha ao enviar código de recuperação por e-mail:', errorEmail);
            return res.status(502).json({ erro: 'Não foi possível enviar o e-mail de recuperação.' });
        }

        return res.status(202).json({
            mensagem: 'Se o e-mail estiver cadastrado, enviaremos um código de recuperação.'
        });
    } catch (error) {
        console.error('Erro ao solicitar recuperação de senha:', error);
        return res.status(500).json({ erro: 'Não foi possível iniciar a recuperação da senha.' });
    }
}

async function redefinirSenha(req, res) {
    const email = req.body?.email?.trim().toLowerCase();
    const codigo = String(req.body?.codigo || '').trim();
    const novaSenha = req.body?.novaSenha;

    if (!email || !emailValido(email) || !/^\d{8}$/.test(codigo) || typeof novaSenha !== 'string') {
        return res.status(400).json({ erro: 'Informe o e-mail, o código de 8 dígitos e a nova senha.' });
    }

    if (novaSenha.length < 6) {
        return res.status(400).json({ erro: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ erro: 'Configuração de segurança do servidor ausente.' });
    }

    try {
        const usuario = await Usuario.findOne({ where: { email } });
        const registroCodigo = usuario
            ? await CodigoRecuperacaoSenha.findOne({ where: { id_usuario: usuario.id_usuario } })
            : null;

        const codigoInvalido = () => res.status(400).json({
            erro: 'Código inválido ou expirado. Solicite um novo código e tente novamente.'
        });

        if (!usuario || !registroCodigo) {
            return codigoInvalido();
        }

        if (new Date(registroCodigo.expira_em).getTime() <= Date.now() || registroCodigo.tentativas >= LIMITE_TENTATIVAS_CODIGO) {
            await registroCodigo.destroy();
            return codigoInvalido();
        }

        const hashInformado = Buffer.from(hashCodigoRecuperacao(usuario.id_usuario, codigo), 'hex');
        const hashArmazenado = Buffer.from(registroCodigo.codigo_hash, 'hex');
        const codigoConfere = hashInformado.length === hashArmazenado.length &&
            crypto.timingSafeEqual(hashInformado, hashArmazenado);

        if (!codigoConfere) {
            const tentativas = registroCodigo.tentativas + 1;
            if (tentativas >= LIMITE_TENTATIVAS_CODIGO) {
                await registroCodigo.destroy();
            } else {
                await registroCodigo.update({ tentativas });
            }
            return codigoInvalido();
        }

        usuario.senha = await bcrypt.hash(novaSenha, 12);
        await usuario.save();
        await registroCodigo.destroy();

        return res.status(200).json({ mensagem: 'Senha alterada com sucesso.' });
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        return res.status(500).json({ erro: 'Não foi possível alterar a senha.' });
    }
}

async function perfil(req, res) {
    const usuario = await Usuario.findByPk(req.usuario.idUsuario);

    if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    return res.status(200).json({ usuario: respostaUsuario(usuario) });
}

module.exports = {
    cadastrar,
    login,
    perfil,
    verificarEmail,
    solicitarRecuperacaoSenha,
    redefinirSenha
};
