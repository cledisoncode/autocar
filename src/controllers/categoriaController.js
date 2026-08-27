const { Categoria } = require('../models');

async function listarCategorias(req, res) {
    try {
        const categorias = await Categoria.findAll({
            order: [['nome', 'ASC']]
        });

        return res.status(200).json(categorias);

    } catch (error) {
        console.error('Erro ao listar categorias:', error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function buscarCategoria(req, res) {
    try {
        const { id } = req.params;
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                erro: 'Categoria não encontrada.'
            });
        }

        return res.status(200).json(categoria);

    } catch (error) {
        console.error('Erro ao buscar categoria:', error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function criarCategoria(req, res) {
    try {
        const { nome } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({
                erro: 'O nome da categoria é obrigatório.'
            });
        }

        const categoria = await Categoria.create({
            nome: nome.trim()
        });

        return res.status(201).json(categoria);

    } catch (error) {
        console.error('Erro ao criar categoria:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                erro: 'Essa categoria já existe.'
            });
        }

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function atualizarCategoria(req, res) {
    try {
        const { id } = req.params;
        const { nome } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({
                erro: 'O nome da categoria é obrigatório.'
            });
        }

        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                erro: 'Categoria não encontrada.'
            });
        }

        categoria.nome = nome.trim();

        await categoria.save();
        return res.status(200).json(categoria);

    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                erro: 'Essa categoria já existe.'
            });
        }

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function excluirCategoria(req, res) {
    try {
        const { id } = req.params;
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                erro: 'Categoria não encontrada.'
            });
        }

        await categoria.destroy();

        return res.status(200).json({
            mensagem: 'Categoria excluída com sucesso.'
        });

    } catch (error) {
        console.error('Erro ao excluir categoria:', error);

        if(error.name === 'SequelizeDatabaseError'){
            return res.status(409).json({
                erro: 'Não é possível excluir esta categoria porque existem produtos associados a ela.'
            })
        }

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}


module.exports = {
    listarCategorias,
    buscarCategoria,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria,
};