const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { TipoServico, Servico, Usuario } = require('../models');
const {
    criarDataHora,
    formatarDataHoraParaApp,
    horarioValido,
    normalizarData
} = require('../utils/dateUtils');

function valorNumerico(valor) {
    return Number(String(valor).replace(',', '.'));
}

function respostaAtendimentoParaApp(atendimento) {
    const dataHora = formatarDataHoraParaApp(atendimento.data_servico);
    const tipoServico = atendimento.tipoServico ||
        atendimento.getDataValue?.('tipoServico');

    return {
        id: atendimento.id_servico,
        nome: atendimento.nome_cliente,
        carro: atendimento.tipo_veiculo,
        placa: atendimento.placa,
        servico: tipoServico.nome,
        data: dataHora.data,
        horario: dataHora.horario,
        valor: Number(atendimento.preco)
    };
}

async function criarAtendimento(req, res) {
    let transaction;

    try {
        transaction = await sequelize.transaction();
        const idUsuario = Number(req.usuario.idUsuario);
        const nome = req.body.nome?.trim();
        const carro = req.body.carro?.trim();
        const placa = req.body.placa?.trim().toUpperCase();
        const servico = req.body.servico?.trim();
        const dataNormalizada = normalizarData(req.body.data);
        const horario = req.body.horario?.trim();
        const valor = valorNumerico(req.body.valor);

        if (!nome || !carro || !placa || !servico) {
            await transaction.rollback();
            return res.status(400).json({
                erro: 'Nome, carro, placa e serviço são obrigatórios.'
            });
        }
        if (!dataNormalizada || !horarioValido(horario)) {
            await transaction.rollback();
            return res.status(400).json({
                erro: 'Informe data em DD/MM/AAAA ou AAAA-MM-DD e horário em HH:MM.'
            });
        }
        if (!Number.isFinite(valor) || valor <= 0) {
            await transaction.rollback();
            return res.status(400).json({ erro: 'O valor deve ser maior que zero.' });
        }

        const usuario = await Usuario.findByPk(idUsuario, { transaction });
        if (!usuario) {
            await transaction.rollback();
            return res.status(401).json({ erro: 'Usuário do token não encontrado.' });
        }

        let tipoServico = await TipoServico.findOne({
            where: { nome: { [Op.iLike]: servico } },
            transaction
        });
        if (!tipoServico) {
            tipoServico = await TipoServico.create({ nome: servico }, { transaction });
        }

        const atendimento = await Servico.create({
            id_usuario: idUsuario,
            id_tipo_servico: tipoServico.id_tipo_servico,
            nome_cliente: nome,
            tipo_veiculo: carro,
            placa,
            data_servico: criarDataHora(dataNormalizada, horario),
            preco: valor
        }, { transaction });

        await transaction.commit();
        atendimento.setDataValue('tipoServico', tipoServico);
        return res.status(201).json(respostaAtendimentoParaApp(atendimento));
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('Erro ao criar atendimento:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

async function listarAtendimentos(req, res) {
    try {
        const atendimentos = await Servico.findAll({
            where: { id_usuario: req.usuario.idUsuario },
            include: {
                model: TipoServico,
                as: 'tipoServico',
                attributes: ['id_tipo_servico', 'nome']
            },
            order: [['data_servico', 'DESC']]
        });
        return res.status(200).json(atendimentos.map(respostaAtendimentoParaApp));
    } catch (error) {
        console.error('Erro ao listar atendimentos:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

module.exports = { criarAtendimento, listarAtendimentos };
