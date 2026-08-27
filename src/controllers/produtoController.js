const { Produto, Categoria } = require('../models');
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

async function excluirProduto(req, res) {
    try {
        const { id } = req.params;

        const produto = await Produto.findByPk(id);

        if (!produto) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        await produto.destroy();

        if (produto.imagem) {
            excluirImagem(produto.imagem);
        }

        return res.status(200).json({
            mensagem: 'Produto excluído com sucesso.'
        });

    } catch (error) {
        console.error('Erro ao excluir produto:', error);

        if (error.name === 'SequelizeDatabaseError') {
            return res.status(409).json({
                erro: 'Não é possível excluir este produto porque existem movimentações de estoque associadas a ele.'
            });
        }

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

module.exports = {
    listarProdutos,
    buscarProduto,
    criarProduto,
    atualizarProduto,
    excluirProduto
};