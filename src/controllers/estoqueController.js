const { Categoria } = require('../models');

const {
    buscarEstoque,
    buscarAlertas
} = require('../services/estoqueService');

async function listarEstoque(req, res) {
    try {
        const {id_categoria,estoque_baixo} = req.query;

        // VALIDAR CATEGORIA
        let categoriaFiltro = null;

        if (id_categoria !== undefined) {
            categoriaFiltro = Number(id_categoria);

            if (!Number.isInteger(categoriaFiltro) ||categoriaFiltro <= 0){
                return res.status(400).json({
                    erro: 'id_categoria inválido.'
                });
            }

            const categoria = await Categoria.findByPk(categoriaFiltro);

            if (!categoria) {
                return res.status(404).json({
                    erro: 'Categoria não encontrada.'
                });
            }
        }

        // BUSCA ESTOQUE
        let resultado = await buscarEstoque(categoriaFiltro);

        // FILTRO ESTOQUE BAIXO
        if (estoque_baixo !== undefined) {

            if (estoque_baixo !== 'true' &&estoque_baixo !== 'false'){
                return res.status(400).json({
                    erro: 'estoque_baixo deve ser true ou false.'
                });
            }

            const filtro = estoque_baixo === 'true';

            resultado = resultado.filter(
                produto => produto.estoque_baixo === filtro
            );
        }

        return res.status(200).json(resultado);

    } catch (error) {

        console.error('Erro ao listar estoque:',error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function listarAlertas(req, res) {
    try {
        const alertas =await buscarAlertas();

        return res.status(200).json({
            total_alertas: alertas.length,
            produtos: alertas
        });

    } catch (error) {
        console.error('Erro ao listar alertas:',error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

module.exports = {
    listarEstoque,
    listarAlertas
};