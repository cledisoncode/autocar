const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { Produto, Categoria, CompraProduto } = require('../models');
const fs = require('fs');
const path = require('path');

function excluirImagem(caminhoImagem) {
    if (!caminhoImagem) {
        return;
    }

    const caminhoArquivo = path.join(
        __dirname,
        '../..',
        caminhoImagem
    );

    if (fs.existsSync(caminhoArquivo)) {
        fs.unlinkSync(caminhoArquivo);
    }
}

function normalizarData(data) {
    if (!data || typeof data !== 'string') {
        return null;
    }

    const dataLimpa = data.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(dataLimpa)) {
        return dataLimpa;
    }

    const partes = dataLimpa.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

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

function formatarDataParaApp(data) {
    if (!data) {
        return null;
    }

    const [ano, mes, dia] = String(data).slice(0, 10).split('-');
    return `${dia}/${mes}/${ano}`;
}

function respostaCompraParaApp(produto, categoria, compra) {
    return {
        produto: {
            id: produto.id_produto,
            nome: produto.nome,
            categoria: categoria.nome,
            foto: produto.imagem,
            removido: produto.removido
        },
        compra: {
            id: compra.id_compra_produto,
            quantidade: Number(compra.quantidade),
            valor: Number(compra.valor),
            dataCompra: formatarDataParaApp(compra.data_compra),
            dataVencimento: formatarDataParaApp(compra.data_vencimento),
            removida: compra.removida
        }
    };
}

function respostaProdutoComComprasParaApp(produto) {
    return {
        id: produto.id_produto,
        nome: produto.nome,
        categoria: produto.categoria.nome,
        foto: produto.imagem,
        compras: produto.compras.map((compra) => ({
            id: compra.id_compra_produto,
            quantidade: Number(compra.quantidade),
            valor: Number(compra.valor),
            dataCompra: formatarDataParaApp(compra.data_compra),
            dataVencimento: formatarDataParaApp(compra.data_vencimento),
            removida: compra.removida
        })),
        removido: produto.removido
    };
}

// Registra uma nova compra usando os nomes de campos consumidos pelo React Native.
async function criarCompraProduto(req, res) {
    const transaction = await sequelize.transaction();

    try {
        let { nome, categoria, quantidade, valor, dataCompra, dataVencimento } = req.body;

        nome = nome?.trim();
        categoria = categoria?.trim();
        quantidade = Number(String(quantidade).replace(',', '.'));
        valor = Number(String(valor).replace(',', '.'));

        if (!nome || !categoria) {
            await transaction.rollback();
            return res.status(400).json({
                erro: 'Nome e categoria do produto são obrigatórios.'
            });
        }

        if (!Number.isFinite(quantidade) || quantidade <= 0) {
            await transaction.rollback();
            return res.status(400).json({
                erro: 'A quantidade deve ser maior que zero.'
            });
        }

        if (!Number.isFinite(valor) || valor <= 0) {
            await transaction.rollback();
            return res.status(400).json({
                erro: 'O valor da compra deve ser maior que zero.'
            });
        }

        const dataCompraNormalizada = normalizarData(dataCompra);
        const dataVencimentoNormalizada = dataVencimento
            ? normalizarData(dataVencimento)
            : null;

        if (!dataCompraNormalizada) {
            await transaction.rollback();
            return res.status(400).json({
                erro: 'A data de compra deve estar em DD/MM/AAAA ou AAAA-MM-DD.'
            });
        }

        if (dataVencimento && !dataVencimentoNormalizada) {
            await transaction.rollback();
            return res.status(400).json({
                erro: 'A data de vencimento deve estar em DD/MM/AAAA ou AAAA-MM-DD.'
            });
        }

        if (
            dataVencimentoNormalizada &&
            dataVencimentoNormalizada < dataCompraNormalizada
        ) {
            await transaction.rollback();
            return res.status(400).json({
                erro: 'A data de vencimento não pode ser anterior à data da compra.'
            });
        }

        const categoriaEncontrada = await Categoria.findOne({
            where: {
                nome: {
                    [Op.iLike]: categoria
                }
            },
            transaction
        });

        if (!categoriaEncontrada) {
            await transaction.rollback();
            return res.status(404).json({
                erro: 'Categoria não encontrada. Cadastre-a antes de registrar a compra.'
            });
        }

        const imagem = req.file
            ? `/uploads/img_produtos/${req.file.filename}`
            : null;

        let produto = await Produto.findOne({
            where: {
                nome: {
                    [Op.iLike]: nome
                },
                id_categoria: categoriaEncontrada.id_categoria,
                removido: false
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!produto) {
            produto = await Produto.create({
                nome,
                imagem,
                id_categoria: categoriaEncontrada.id_categoria,
                unidade: 'unidade',
                quantidade_minima: 2,
                custo: valor / quantidade,
                data_compra: dataCompraNormalizada,
                data_vencimento: dataVencimentoNormalizada,
                removido: false
            }, { transaction });
        } else if (!produto.imagem && imagem) {
            await produto.update({ imagem }, { transaction });
        }

        const compra = await CompraProduto.create({
            id_produto: produto.id_produto,
            quantidade,
            valor,
            data_compra: dataCompraNormalizada,
            data_vencimento: dataVencimentoNormalizada
        }, { transaction });

        await transaction.commit();

        return res.status(201).json(
            respostaCompraParaApp(produto, categoriaEncontrada, compra)
        );
    } catch (error) {
        await transaction.rollback();
        console.error('Erro ao registrar compra de produto:', error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

// Retorna a estrutura de Produto consumida pelo app React Native.
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
                        'id_compra_produto',
                        'quantidade',
                        'valor',
                        'data_compra',
                        'data_vencimento',
                        'removida'
                    ]
                }
            ],
            order: [
                ['nome', 'ASC'],
                [{ model: CompraProduto, as: 'compras' }, 'id_compra_produto', 'DESC']
            ]
        });

        return res.status(200).json(
            produtos.map(respostaProdutoComComprasParaApp)
        );
    } catch (error) {
        console.error('Erro ao listar produtos com compras:', error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function listarProdutos(req, res) {
    try {
        const produtos = await Produto.findAll({
            include: {
                model: Categoria,
                as: 'categoria',
                attributes: ['id_categoria', 'nome']
            },
            order: [['nome', 'ASC']]
        });

        return res.status(200).json(produtos);

    } catch (error) {
        console.error('Erro ao listar produtos:', error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function buscarProduto(req, res) {
    try {
        const { id } = req.params;

        const produto = await Produto.findByPk(id, {
            include: {
                model: Categoria,
                as: 'categoria',
                attributes: ['id_categoria', 'nome']
            }
        });

        if (!produto) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        return res.status(200).json(produto);

    } catch (error) {
        console.error('Erro ao buscar produto:', error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function criarProduto(req, res) {
    try {
        let {
            nome,
            id_categoria,
            unidade,
            quantidade_minima,
            custo,
            data_compra,
            data_vencimento
        } = req.body;

        const imagem = req.file
            ? `/uploads/img_produtos/${req.file.filename}`
            : null;

        nome = nome?.trim();
        unidade = unidade?.trim();

        if (!nome) {
            return res.status(400).json({
                erro: 'O nome do produto é obrigatório.'
            });
        }

        if (!unidade) {
            return res.status(400).json({
                erro: 'A unidade do produto é obrigatória.'
            });
        }

        if (!Number.isInteger(Number(id_categoria))) {
            return res.status(400).json({
                erro: 'id_categoria inválido.'
            });
        }

        id_categoria = Number(id_categoria);

        const categoria = await Categoria.findByPk(id_categoria);

        if (!categoria) {
            return res.status(404).json({
                erro: 'Categoria não encontrada.'
            });
        }

        if (custo === undefined || custo === null || custo === '') {
            return res.status(400).json({
                erro: 'O custo do produto é obrigatório.'
            });
        }

        custo = Number(custo);

        if (!Number.isFinite(custo) || custo < 0) {
            return res.status(400).json({
                erro: 'O custo deve ser um número maior ou igual a zero.'
            });
        }

        if (quantidade_minima !== undefined && quantidade_minima !== null && quantidade_minima !== '') {
            quantidade_minima = Number(quantidade_minima);

            if (!Number.isInteger(quantidade_minima) || quantidade_minima < 0) {
                return res.status(400).json({
                    erro: 'A quantidade mínima deve ser um número inteiro maior ou igual a zero.'
                });
            }
        } else {
            quantidade_minima = 2;
        }

        const produto = await Produto.create({
            nome,
            imagem,
            id_categoria,
            unidade,
            quantidade_minima,
            custo,
            data_compra: data_compra || null,
            data_vencimento: data_vencimento || null
        });

        return res.status(201).json(produto);

    } catch (error) {
        console.error('Erro ao criar produto:', error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function atualizarProduto(req, res) {
    try {
        const { id } = req.params;

        let {
            nome,
            id_categoria,
            unidade,
            quantidade_minima,
            custo,
            data_compra,
            data_vencimento
        } = req.body;

        const produto = await Produto.findByPk(id);

        if (!produto) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        nome = nome?.trim();
        unidade = unidade?.trim();

        if (!nome) {
            return res.status(400).json({
                erro: 'O nome do produto é obrigatório.'
            });
        }

        if (!unidade) {
            return res.status(400).json({
                erro: 'A unidade do produto é obrigatória.'
            });
        }

        if (!Number.isInteger(Number(id_categoria))) {
            return res.status(400).json({
                erro: 'id_categoria inválido.'
            });
        }

        id_categoria = Number(id_categoria);

        const categoria = await Categoria.findByPk(id_categoria);

        if (!categoria) {
            return res.status(404).json({
                erro: 'Categoria não encontrada.'
            });
        }

        if (custo === undefined || custo === null || custo === '') {
            return res.status(400).json({
                erro: 'O custo do produto é obrigatório.'
            });
        }

        custo = Number(custo);

        if (!Number.isFinite(custo) || custo < 0) {
            return res.status(400).json({
                erro: 'O custo deve ser um número maior ou igual a zero.'
            });
        }

        quantidade_minima = Number(quantidade_minima);

        if (!Number.isInteger(quantidade_minima) ||quantidade_minima < 0){
            return res.status(400).json({
                erro: 'A quantidade mínima deve ser um número inteiro maior ou igual a zero.'
            });
        }

        // Guarda o caminho da imagem antiga
        const imagemAntiga = produto.imagem;

        // Se enviou nova imagem, usa a nova.Caso contrário, mantém a antiga.
        const novaImagem = req.file
            ? `/uploads/img_produtos/${req.file.filename}`
            : imagemAntiga;

        await produto.update({
            nome,
            imagem: novaImagem,
            id_categoria,
            unidade,
            quantidade_minima,
            custo,
            data_compra: data_compra || null,
            data_vencimento: data_vencimento || null
        });

        // Só apaga a imagem antiga depois que o banco for atualizado
        if (req.file && imagemAntiga) {
            excluirImagem(imagemAntiga);
        }

        return res.status(200).json(produto);

    } catch (error) {
        console.error('Erro ao atualizar produto:', error);

        // Se uma nova imagem foi enviada mas ocorreu erro, apagamos a nova imagem para não deixar arquivo órfão.
        if (req.file) {
            const novaImagem = path.join(__dirname,'../..',
                'uploads',
                'img_produtos',
                req.file.filename
            );

            if (fs.existsSync(novaImagem)) {
                fs.unlinkSync(novaImagem);
            }
        }

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

// Exclusão lógica para preservar o histórico de compras do produto.
async function excluirProduto(req, res) {
    try {
        const { id } = req.params;

        const produto = await Produto.findByPk(id);

        if (!produto) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        if (produto.removido) {
            return res.status(409).json({
                erro: 'Produto já foi removido do estoque.'
            });
        }

        await produto.update({ removido: true });

        return res.status(200).json({
            mensagem: 'Produto removido do estoque com sucesso.',
            removido: true
        });

    } catch (error) {
        console.error('Erro ao excluir produto:', error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

// Remove uma compra da visualização do estoque, mantendo-a no histórico.
async function excluirCompraProduto(req, res) {
    try {
        const { id, idCompra } = req.params;

        const produto = await Produto.findByPk(id);

        if (!produto) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        const compra = await CompraProduto.findOne({
            where: {
                id_compra_produto: idCompra,
                id_produto: produto.id_produto
            }
        });

        if (!compra) {
            return res.status(404).json({
                erro: 'Compra não encontrada para este produto.'
            });
        }

        if (compra.removida) {
            return res.status(409).json({
                erro: 'Compra já foi removida do estoque.'
            });
        }

        await compra.update({ removida: true });

        const comprasVisiveis = await CompraProduto.count({
            where: {
                id_produto: produto.id_produto,
                removida: false
            }
        });

        if (comprasVisiveis === 0) {
            await produto.update({ removido: true });
        }

        return res.status(200).json({
            mensagem: 'Compra removida do estoque com sucesso.',
            compra_removida: true,
            produto_removido: comprasVisiveis === 0
        });
    } catch (error) {
        console.error('Erro ao remover compra de produto:', error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

module.exports = {
    criarCompraProduto,
    listarProdutosComCompras,
    listarProdutos,
    buscarProduto,
    criarProduto,
    atualizarProduto,
    excluirProduto,
    excluirCompraProduto
};
