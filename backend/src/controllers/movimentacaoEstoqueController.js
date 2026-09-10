const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { calcularEstoque } = require('../services/estoqueService');
const { planejarSaida } = require('../services/stockMath');
const { dataAtualISO, normalizarData } = require('../utils/dateUtils');
const {
    CompraProduto,
    MovimentacaoEstoque,
    Produto,
    Usuario
} = require('../models');

function numeroDecimal(valor) {
    return Number(String(valor).replace(',', '.'));
}

function erroHttp(status, mensagem, dados = {}) {
    const error = new Error(mensagem);
    error.status = status;
    error.dados = dados;
    return error;
}

async function criarMovimentacao(req, res) {
    let transaction;

    try {
        transaction = await sequelize.transaction();
        const idProduto = Number(req.body.id_produto);
        const idUsuario = Number(req.usuario.idUsuario);
        const tipo = req.body.tipo?.trim().toUpperCase();
        const quantidade = numeroDecimal(req.body.quantidade);
        const observacao = req.body.observacao?.trim() || null;

        if (!Number.isInteger(idProduto) || idProduto <= 0) {
            throw erroHttp(400, 'id_produto inválido.');
        }
        if (!['ENTRADA', 'SAIDA'].includes(tipo)) {
            throw erroHttp(400, 'O tipo deve ser ENTRADA ou SAIDA.');
        }
        if (!Number.isFinite(quantidade) || quantidade <= 0) {
            throw erroHttp(400, 'A quantidade deve ser maior que zero.');
        }

        const produto = await Produto.findByPk(idProduto, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        const usuario = await Usuario.findByPk(idUsuario, { transaction });

        if (!produto || produto.removido) {
            throw erroHttp(404, 'Produto ativo não encontrado.');
        }
        if (!usuario) {
            throw erroHttp(401, 'Usuário do token não encontrado.');
        }

        const estoqueAnterior = await calcularEstoque(idProduto, transaction);
        let idCompraProduto = null;

        if (tipo === 'SAIDA') {
            const hoje = dataAtualISO();
            const compras = await CompraProduto.findAll({
                where: {
                    id_produto: idProduto,
                    removida: false,
                    [Op.or]: [
                        { data_vencimento: null },
                        { data_vencimento: { [Op.gte]: hoje } }
                    ]
                },
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            const { alocacoes, restante } = planejarSaida(compras, quantidade);

            if (restante > 0) {
                throw erroHttp(
                    400,
                    'Quantidade de saída maior que o estoque disponível.',
                    { estoque_atual: estoqueAnterior }
                );
            }

            for (const alocacao of alocacoes) {
                await alocacao.compra.update(
                    { quantidade_disponivel: alocacao.saldo },
                    { transaction }
                );
            }

            if (alocacoes.length === 1) {
                idCompraProduto = alocacoes[0].compra.id_compra_produto;
            }
        } else {
            const dataCompra = req.body.dataCompra
                ? normalizarData(req.body.dataCompra)
                : dataAtualISO();
            const dataVencimento = req.body.dataVencimento
                ? normalizarData(req.body.dataVencimento)
                : null;
            const valor = req.body.valor === undefined ? 0 : numeroDecimal(req.body.valor);

            if (!dataCompra || (req.body.dataVencimento && !dataVencimento)) {
                throw erroHttp(400, 'Datas da entrada inválidas.');
            }
            if (dataVencimento && dataVencimento < dataCompra) {
                throw erroHttp(400, 'A data de vencimento não pode ser anterior à compra.');
            }
            if (!Number.isFinite(valor) || valor < 0) {
                throw erroHttp(400, 'O valor da entrada deve ser maior ou igual a zero.');
            }

            const compra = await CompraProduto.create({
                id_produto: idProduto,
                quantidade,
                quantidade_disponivel: quantidade,
                valor,
                data_compra: dataCompra,
                data_vencimento: dataVencimento,
                removida: false
            }, { transaction });
            idCompraProduto = compra.id_compra_produto;
        }

        const movimentacao = await MovimentacaoEstoque.create({
            id_produto: idProduto,
            id_usuario: idUsuario,
            id_compra_produto: idCompraProduto,
            tipo,
            quantidade,
            observacao
        }, { transaction });
        const estoqueAtual = await calcularEstoque(idProduto, transaction);

        await transaction.commit();
        return res.status(201).json({
            mensagem: 'Movimentação registrada e estoque atualizado.',
            movimentacao: {
                ...movimentacao.toJSON(),
                quantidade: Number(movimentacao.quantidade)
            },
            estoque_anterior: estoqueAnterior,
            estoque_atual: estoqueAtual
        });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('Erro ao criar movimentação:', error);
        return res.status(error.status || 500).json({
            erro: error.status ? error.message : 'Erro interno do servidor.',
            ...(error.dados || {})
        });
    }
}

async function listarMovimentacoes(req, res) {
    try {
        const movimentacoes = await MovimentacaoEstoque.findAll({
            include: [
                {
                    model: Produto,
                    as: 'produto',
                    attributes: ['id_produto', 'nome', 'imagem']
                },
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id_usuario', 'nome', 'sobrenome']
                }
            ],
            order: [['data_movimentacao', 'DESC']]
        });

        return res.status(200).json(movimentacoes.map((movimentacao) => {
            const resposta = movimentacao.toJSON();

            if (resposta.produto?.imagem && !/^https?:\/\//i.test(resposta.produto.imagem)) {
                resposta.produto.imagem = `${req.protocol}://${req.get('host')}${resposta.produto.imagem}`;
            }

            return {
                ...resposta,
                quantidade: Number(movimentacao.quantidade)
            };
        }));
    } catch (error) {
        console.error('Erro ao listar movimentações:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

module.exports = { criarMovimentacao, listarMovimentacoes };
