const sequelize = require('../config/db');
const {calcularEstoque} = require('../services/estoqueService');
const {
    Produto,
    Usuario,
    MovimentacaoEstoque
} = require('../models');

async function criarMovimentacao(req,res) {
    const transaction = await sequelize.transaction();

    try {
        let {
            id_produto,
            tipo,
            quantidade,
            observacao
        } = req.body;

        let id_usuario = req.usuario.id_usuario
        
        // TRATAMENTO 
        id_produto = Number(id_produto);
        id_usuario = Number(id_usuario);
        quantidade = Number(quantidade);

        tipo = tipo?.trim().toUpperCase();
        observacao = observacao?.trim() || null;

        // VALIDAÇÕES
        if (!Number.isInteger(id_produto) || id_produto <= 0) {
            await transaction.rollback();

            return res.status(400).json({
                erro: 'id_produto inválido.'
            });
        }

        if (!Number.isInteger(id_usuario) || id_usuario <= 0) {
            await transaction.rollback();

            return res.status(400).json({
                erro: 'id_usuario inválido.'
            });
        }

        if (!['ENTRADA', 'SAIDA'].includes(tipo)) {
            await transaction.rollback();

            return res.status(400).json({
                erro: 'O tipo deve ser ENTRADA ou SAIDA.'
            });
        }

        if (!Number.isInteger(quantidade) || quantidade <= 0) {
            await transaction.rollback();

            return res.status(400).json({
                erro: 'A quantidade deve ser um número inteiro maior que zero.'
            });
        }

        // VERIFICAR PRODUTO
        const produto = await Produto.findByPk(id_produto, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!produto) {
            await transaction.rollback();

            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        // VERIFICAR USUÁRIO
        const usuario = await Usuario.findByPk(id_usuario, {
            transaction
        });

        if (!usuario) {
            await transaction.rollback();

            return res.status(404).json({
                erro: 'Usuário não encontrado.'
            });
        }

        // CALCULAR ESTOQUE ATUAL
        const estoqueAtual = await calcularEstoque(id_produto,transaction);

        // VALIDAR SAÍDA
        if (tipo === 'SAIDA' && quantidade > estoqueAtual) {
            await transaction.rollback();

            return res.status(400).json({
                erro: 'Quantidade de saída maior que o estoque disponível.',
                estoque_atual: estoqueAtual
            });
        }

        // CRIAR MOVIMENTAÇÃO
        const movimentacao = await MovimentacaoEstoque.create({
            id_produto,
            id_usuario,
            tipo,
            quantidade,
            observacao
        }, {
            transaction
        });

        // NOVO ESTOQUE
        const novoEstoque =
            tipo === 'ENTRADA'
                ? estoqueAtual + quantidade
                : estoqueAtual - quantidade;

        await transaction.commit();

        return res.status(201).json({
            mensagem: 'Movimentação registrada com sucesso.',
            movimentacao,
            estoque_anterior: estoqueAtual,
            estoque_atual: novoEstoque
        });

    } catch (error) {
        await transaction.rollback();

        console.error('Erro ao criar movimentação:',error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function listarMovimentacoes(req, res) {
    try {
        const movimentacoes = await MovimentacaoEstoque.findAll({
            attributes: [
                'id_movimentacao',
                'id_produto',
                'tipo',
                'quantidade',
                'data_movimentacao',
                'observacao'
            ],

            include: [
                {
                    model: Produto,
                    as: 'produto',
                    attributes: [
                        'id_produto',
                        'nome',
                        'imagem',
                        'unidade'
                    ]
                }
            ],

            order: [['data_movimentacao', 'DESC']]
        });

        return res.status(200).json(movimentacoes);

    } catch (error) {
        console.error('Erro ao listar movimentações:',error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

module.exports = {
    criarMovimentacao,
    listarMovimentacoes
};