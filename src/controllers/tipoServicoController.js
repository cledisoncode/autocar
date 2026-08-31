const { TipoServico } = require('../models');

async function listarTiposServico(req, res) {
    try {
        const tiposServico = await TipoServico.findAll({
            order: [['nome', 'ASC']]
        });

        return res.status(200).json(tiposServico);

    } catch (error) {
        console.error('Erro ao listar tipos de serviço:', error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function buscarTipoServico(req, res) {
    try {
        const { id } = req.params;
        const tipoServico = await TipoServico.findByPk(id);

        if (!tipoServico) {
            return res.status(404).json({
                erro: 'Tipo de serviço não encontrado.'
            });
        }

        return res.status(200).json(tipoServico);

    } catch (error) {
        console.error('Erro ao buscar tipo de serviço:', error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function criarTipoServico(req, res) {
    try {
        const { nome } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({
                erro: 'O nome do tipo de serviço é obrigatório.'
            });
        }

        const tipoServico = await TipoServico.create({
            nome: nome.trim()
        });
        return res.status(201).json(tipoServico);

    } catch (error) {
        console.error('Erro ao criar tipo de serviço:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                erro: 'Esse tipo de serviço já existe.'
            });
        }

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function atualizarTipoServico(req, res) {
    try {
        const { id } = req.params;
        const { nome } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({
                erro: 'O nome do tipo de serviço é obrigatório.'
            });
        }

        const tipoServico = await TipoServico.findByPk(id);

        if (!tipoServico) {
            return res.status(404).json({
                erro: 'Tipo de serviço não encontrado.'
            });
        }

        tipoServico.nome = nome.trim();

        await tipoServico.save();
        return res.status(200).json(tipoServico);

    } catch (error) {
        console.error('Erro ao atualizar tipo de serviço:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                erro: 'Esse tipo de serviço já existe.'
            });
        }

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function excluirTipoServico(req, res) {
    try {
        const { id } = req.params;
        const tipoServico = await TipoServico.findByPk(id);

        if (!tipoServico) {
            return res.status(404).json({
                erro: 'Tipo de serviço não encontrado.'
            });
        }

        await tipoServico.destroy();

        return res.status(200).json({
            mensagem: 'Tipo de serviço excluído com sucesso.'
        });

    } catch (error) {
        console.error('Erro ao excluir tipo de serviço:', error);

        if (error.name === 'SequelizeDatabaseError') {
            return res.status(409).json({
                erro: 'Não é possível excluir este tipo de serviço porque existem serviços associados a ele.'
            });
        }

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

module.exports = {
    listarTiposServico,
    buscarTipoServico,
    criarTipoServico,
    atualizarTipoServico,
    excluirTipoServico
};