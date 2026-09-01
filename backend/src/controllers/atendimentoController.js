const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { Usuario, TipoServico, Servico } = require('../models');

function normalizarData(data) {
    if (!data || typeof data !== 'string') {
        return null;
    }

    const partes = data.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!partes) {
        return null;
    }

    const [, dia, mes, ano] = partes;
    const dataConvertida = new Date(`${ano}-${mes}-${dia}T00:00:00Z`);

    if (
        Number.isNaN(dataConvertida.getTime()) ||
        dataConvertida.getUTCFullYear() !== Number(ano) ||
        dataConvertida.getUTCMonth() + 1 !== Number(mes) ||
        dataConvertida.getUTCDate() !== Number(dia)
    ) {
        return null;
    }

    return `${ano}-${mes}-${dia}`;
}

function horarioValido(horario) {
    if (!horario || typeof horario !== 'string') {
        return false;
    }

    const partes = horario.trim().match(/^(\d{2}):(\d{2})$/);

    if (!partes) {
        return false;
    }

    const [, hora, minuto] = partes;
    return Number(hora) <= 23 && Number(minuto) <= 59;
}

function valorNumerico(valor) {
    return Number(String(valor).replace(',', '.'));
}

function respostaAtendimentoParaApp(atendimento) {
    const data = new Date(atendimento.data_servico);
    const partesData = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(data);
    const horario = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).format(data);

    return {
        id: atendimento.id_servico,
        nome: atendimento.nome_cliente,
        carro: atendimento.tipo_veiculo,
        placa: atendimento.placa,
        servico: atendimento.tipoServico.nome,
        data: partesData,
        horario,
        valor: Number(atendimento.preco)
    };
}

async function criarAtendimento(req, res) {
    const transaction = await sequelize.transaction();

    try {
        let { idUsuario, nome, carro, placa, servico, data, horario, valor } = req.body;

        idUsuario = Number(idUsuario);
        nome = nome?.trim();
        carro = carro?.trim();
        placa = placa?.trim().toUpperCase();
        servico = servico?.trim();
        valor = valorNumerico(valor);

        const dataNormalizada = normalizarData(data);

        if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
            await transaction.rollback();
            return res.status(400).json({ erro: 'idUsuario inválido.' });
        }

        if (!nome || !carro || !placa || !servico) {
            await transaction.rollback();
            return res.status(400).json({
                erro: 'Nome, carro, placa e serviço são obrigatórios.'
            });
        }

        if (!dataNormalizada || !horarioValido(horario)) {
            await transaction.rollback();
            return res.status(400).json({
                erro: 'Informe data em DD/MM/AAAA e horário em HH:MM válidos.'
            });
        }

        if (!Number.isFinite(valor) || valor <= 0) {
            await transaction.rollback();
            return res.status(400).json({
                erro: 'O valor deve ser maior que zero.'
            });
        }

        const usuario = await Usuario.findByPk(idUsuario, { transaction });

        if (!usuario) {
            await transaction.rollback();
            return res.status(404).json({ erro: 'Usuário não encontrado.' });
        }

        let tipoServico = await TipoServico.findOne({
            where: {
                nome: {
                    [Op.iLike]: servico
                }
            },
            transaction
        });

        if (!tipoServico) {
            tipoServico = await TipoServico.create({ nome: servico }, { transaction });
        }

        const atendimento = await Servico.create({
            id_usuario: usuario.id_usuario,
            id_tipo_servico: tipoServico.id_tipo_servico,
            nome_cliente: nome,
            tipo_veiculo: carro,
            placa,
            data_servico: `${dataNormalizada}T${horario}:00`,
            preco: valor
        }, { transaction });

        await transaction.commit();

        atendimento.tipoServico = tipoServico;
        return res.status(201).json(respostaAtendimentoParaApp(atendimento));
    } catch (error) {
        await transaction.rollback();
        console.error('Erro ao criar atendimento:', error);

        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

async function listarAtendimentos(req, res) {
    try {
        const where = {};

        if (req.query.idUsuario !== undefined) {
            const idUsuario = Number(req.query.idUsuario);

            if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
                return res.status(400).json({ erro: 'idUsuario inválido.' });
            }

            where.id_usuario = idUsuario;
        }

        const atendimentos = await Servico.findAll({
            where,
            include: {
                model: TipoServico,
                as: 'tipoServico',
                attributes: ['id_tipo_servico', 'nome']
            },
            order: [['data_servico', 'DESC']]
        });

        return res.status(200).json(
            atendimentos.map(respostaAtendimentoParaApp)
        );
    } catch (error) {
        console.error('Erro ao listar atendimentos:', error);

        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

module.exports = {
    criarAtendimento,
    listarAtendimentos
};
