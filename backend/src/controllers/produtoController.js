const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const {
    Categoria,
    CompraProduto,
    MovimentacaoEstoque,
    Produto
} = require('../models');
const { formatarDataParaApp, normalizarData } = require('../utils/dateUtils');
const { quantidadeDisponivel } = require('../services/stockMath');

function numeroDecimal(valor) {
    return Number(String(valor).replace(',', '.'));
}

function erroHttp(status, mensagem) {
    const error = new Error(mensagem);
    error.status = status;
    return error;
}

function caminhoFisicoImagem(caminhoImagem) {
    if (!caminhoImagem || !String(caminhoImagem).startsWith('/uploads/')) {
        return null;
    }

    return path.join(__dirname, '../..', String(caminhoImagem).replace(/^\//, ''));
}

function excluirImagem(caminhoImagem) {
    const caminho = caminhoFisicoImagem(caminhoImagem);
    if (caminho && fs.existsSync(caminho)) fs.unlinkSync(caminho);
}

function excluirUploadDaRequisicao(req) {
    if (req.file) excluirImagem(`/uploads/img_produtos/${req.file.filename}`);
}

function urlImagem(req, imagem) {
    if (!imagem || /^https?:\/\//i.test(imagem)) return imagem || null;
    return `${req.protocol}://${req.get('host')}${imagem}`;
}

function compraParaApp(compra) {
    return {
        id: compra.id_compra_produto,
        quantidade: quantidadeDisponivel(compra),
        quantidadeComprada: Number(compra.quantidade),
        valor: Number(compra.valor),
        dataCompra: formatarDataParaApp(compra.data_compra),
        dataVencimento: formatarDataParaApp(compra.data_vencimento),
        removida: compra.removida
    };
}

function produtoParaApp(req, produto) {
    const categoria = produto.categoria || produto.get?.('categoria');
    const compras = produto.compras || produto.get?.('compras') || [];

    return {
        id: produto.id_produto,
        nome: produto.nome,
        categoria: categoria?.nome || null,
        foto: urlImagem(req, produto.imagem),
        compras: compras.map(compraParaApp),
        removido: produto.removido
    };
}

async function criarCompraProduto(req, res) {
    let transaction;
    let imagemAntiga = null;

    try {
        transaction = await sequelize.transaction();
        let {
            nome, categoria, quantidade, valor, dataCompra,
            dataVencimento
        } = req.body;

        nome = nome?.trim();
        categoria = categoria?.trim();
        quantidade = numeroDecimal(quantidade);
        valor = numeroDecimal(valor);

        if (!nome || !categoria) {
            throw erroHttp(400, 'Nome e categoria do produto são obrigatórios.');
        }
        if (!Number.isFinite(quantidade) || quantidade <= 0) {
            throw erroHttp(400, 'A quantidade deve ser maior que zero.');
        }
        if (!Number.isFinite(valor) || valor <= 0) {
            throw erroHttp(400, 'O valor total da compra deve ser maior que zero.');
        }

        const dataCompraNormalizada = normalizarData(dataCompra);
        const dataVencimentoNormalizada = dataVencimento
            ? normalizarData(dataVencimento)
            : null;

        if (!dataCompraNormalizada) {
            throw erroHttp(400, 'A data de compra deve estar em DD/MM/AAAA ou AAAA-MM-DD.');
        }
        if (dataVencimento && !dataVencimentoNormalizada) {
            throw erroHttp(400, 'A data de vencimento deve estar em DD/MM/AAAA ou AAAA-MM-DD.');
        }
        if (dataVencimentoNormalizada && dataVencimentoNormalizada < dataCompraNormalizada) {
            throw erroHttp(400, 'A data de vencimento não pode ser anterior à data da compra.');
        }

        const categoriaEncontrada = await Categoria.findOne({
            where: { nome: { [Op.iLike]: categoria } },
            transaction
        });

        if (!categoriaEncontrada) {
            throw erroHttp(404, 'Categoria não encontrada. Consulte GET /api/categorias.');
        }

        const novaImagem = req.file
            ? `/uploads/img_produtos/${req.file.filename}`
            : null;
        let produto = await Produto.findOne({
            where: {
                nome: { [Op.iLike]: nome },
                id_categoria: categoriaEncontrada.id_categoria,
                removido: false
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!produto) {
            produto = await Produto.create({
                nome,
                imagem: novaImagem,
                id_categoria: categoriaEncontrada.id_categoria,
                quantidade_minima: 2,
                custo: valor / quantidade,
                data_compra: dataCompraNormalizada,
                data_vencimento: dataVencimentoNormalizada,
                removido: false
            }, { transaction });
        } else {
            const atualizacoes = {
                custo: valor / quantidade,
                data_compra: dataCompraNormalizada,
                data_vencimento: dataVencimentoNormalizada
            };
            if (novaImagem) {
                imagemAntiga = produto.imagem;
                atualizacoes.imagem = novaImagem;
            }
            await produto.update(atualizacoes, { transaction });
        }

        const compra = await CompraProduto.create({
            id_produto: produto.id_produto,
            quantidade,
            quantidade_disponivel: quantidade,
            valor,
            data_compra: dataCompraNormalizada,
            data_vencimento: dataVencimentoNormalizada,
            removida: false
        }, { transaction });

        await MovimentacaoEstoque.create({
            id_produto: produto.id_produto,
            id_usuario: req.usuario.idUsuario,
            id_compra_produto: compra.id_compra_produto,
            tipo: 'ENTRADA',
            quantidade,
            observacao: 'Compra de produto registrada pelo aplicativo.'
        }, { transaction });

        await transaction.commit();
        if (imagemAntiga) excluirImagem(imagemAntiga);

        produto.setDataValue('categoria', categoriaEncontrada);
        produto.setDataValue('compras', [compra]);
        return res.status(201).json({
            produto: produtoParaApp(req, produto),
            compra: compraParaApp(compra)
        });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        excluirUploadDaRequisicao(req);
        console.error('Erro ao registrar compra de produto:', error);
        return res.status(error.status || 500).json({
            erro: error.status ? error.message : 'Erro interno do servidor.'
        });
    }
}

async function listarProdutosComCompras(req, res) {
    try {
        const produtos = await Produto.findAll({
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id_categoria', 'nome']
                },
                {
                    model: CompraProduto,
                    as: 'compras',
                    attributes: [
                        'id_compra_produto', 'quantidade', 'quantidade_disponivel',
                        'valor', 'data_compra', 'data_vencimento', 'removida'
                    ]
                }
            ],
            order: [
                ['nome', 'ASC'],
                [{ model: CompraProduto, as: 'compras' }, 'id_compra_produto', 'DESC']
            ]
        });
        return res.status(200).json(
            produtos.map((produto) => produtoParaApp(req, produto))
        );
    } catch (error) {
        console.error('Erro ao listar produtos com compras:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

async function buscarProdutoComCompras(req, res) {
    try {
        const produto = await Produto.findByPk(req.params.id, {
            include: [
                { model: Categoria, as: 'categoria' },
                { model: CompraProduto, as: 'compras' }
            ]
        });
        if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });
        return res.status(200).json(produtoParaApp(req, produto));
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

// Rotas de catálogo preservadas para manter compatibilidade com o backend original.
async function listarProdutos(req, res) {
    try {
        const produtos = await Produto.findAll({
            include: { model: Categoria, as: 'categoria' },
            order: [['nome', 'ASC']]
        });
        return res.status(200).json(produtos);
    } catch (error) {
        console.error('Erro ao listar catálogo:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

async function buscarProduto(req, res) {
    try {
        const produto = await Produto.findByPk(req.params.id, {
            include: { model: Categoria, as: 'categoria' }
        });
        return produto
            ? res.status(200).json(produto)
            : res.status(404).json({ erro: 'Produto não encontrado.' });
    } catch (error) {
        console.error('Erro ao buscar catálogo:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

async function criarProduto(req, res) {
    try {
        const idCategoria = Number(req.body.id_categoria);
        const categoria = Number.isInteger(idCategoria)
            ? await Categoria.findByPk(idCategoria)
            : null;
        const nome = req.body.nome?.trim();
        const custo = numeroDecimal(req.body.custo);

        if (!nome || !categoria || !Number.isFinite(custo) || custo < 0) {
            excluirUploadDaRequisicao(req);
            return res.status(400).json({
                erro: 'Informe nome, id_categoria existente e custo válido.'
            });
        }

        const quantidadeMinima = req.body.quantidade_minima === undefined
            ? 2
            : numeroDecimal(req.body.quantidade_minima);
        if (!Number.isFinite(quantidadeMinima) || quantidadeMinima < 0) {
            excluirUploadDaRequisicao(req);
            return res.status(400).json({ erro: 'quantidade_minima inválida.' });
        }

        const produto = await Produto.create({
            nome,
            imagem: req.file ? `/uploads/img_produtos/${req.file.filename}` : null,
            id_categoria: idCategoria,
            quantidade_minima: quantidadeMinima,
            custo,
            data_compra: normalizarData(req.body.data_compra),
            data_vencimento: normalizarData(req.body.data_vencimento)
        });
        return res.status(201).json(produto);
    } catch (error) {
        excluirUploadDaRequisicao(req);
        console.error('Erro ao criar produto no catálogo:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

async function atualizarProduto(req, res) {
    try {
        const produto = await Produto.findByPk(req.params.id);
        if (!produto) {
            excluirUploadDaRequisicao(req);
            return res.status(404).json({ erro: 'Produto não encontrado.' });
        }

        const idCategoria = Number(req.body.id_categoria);
        const categoria = await Categoria.findByPk(idCategoria);
        const nome = req.body.nome?.trim();
        const custo = numeroDecimal(req.body.custo);
        const quantidadeMinima = numeroDecimal(req.body.quantidade_minima);

        if (!nome || !categoria || !Number.isFinite(custo) || custo < 0 ||
            !Number.isFinite(quantidadeMinima) || quantidadeMinima < 0) {
            excluirUploadDaRequisicao(req);
            return res.status(400).json({ erro: 'Dados do produto inválidos.' });
        }

        const imagemAntiga = produto.imagem;
        await produto.update({
            nome,
            imagem: req.file ? `/uploads/img_produtos/${req.file.filename}` : imagemAntiga,
            id_categoria: idCategoria,
            quantidade_minima: quantidadeMinima,
            custo,
            data_compra: normalizarData(req.body.data_compra),
            data_vencimento: normalizarData(req.body.data_vencimento)
        });

        if (req.file && imagemAntiga) excluirImagem(imagemAntiga);
        return res.status(200).json(produto);
    } catch (error) {
        excluirUploadDaRequisicao(req);
        console.error('Erro ao atualizar produto:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

async function excluirProduto(req, res) {
    try {
        const produto = await Produto.findByPk(req.params.id);
        if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });
        if (produto.removido) return res.status(409).json({ erro: 'Produto já foi removido.' });

        await produto.update({ removido: true });
        return res.status(200).json({
            mensagem: 'Produto removido do estoque com sucesso.',
            removido: true
        });
    } catch (error) {
        console.error('Erro ao remover produto:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

async function excluirCompraProduto(req, res) {
    try {
        const compra = await CompraProduto.findOne({
            where: {
                id_compra_produto: req.params.idCompra,
                id_produto: req.params.id
            }
        });
        if (!compra) return res.status(404).json({ erro: 'Compra não encontrada.' });
        if (compra.removida) return res.status(409).json({ erro: 'Compra já foi removida.' });

        await compra.update({ removida: true });
        const comprasVisiveis = await CompraProduto.count({
            where: { id_produto: req.params.id, removida: false }
        });
        if (comprasVisiveis === 0) {
            await Produto.update(
                { removido: true },
                { where: { id_produto: req.params.id } }
            );
        }

        return res.status(200).json({
            mensagem: 'Compra removida do estoque; histórico financeiro preservado.',
            compra_removida: true,
            produto_removido: comprasVisiveis === 0
        });
    } catch (error) {
        console.error('Erro ao remover compra:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

module.exports = {
    atualizarProduto,
    buscarProduto,
    buscarProdutoComCompras,
    criarCompraProduto,
    criarProduto,
    excluirCompraProduto,
    excluirProduto,
    listarProdutos,
    listarProdutosComCompras
};
