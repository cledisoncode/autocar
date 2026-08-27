const {
    Produto,
    Categoria,
    MovimentacaoEstoque
} = require('../models');

//CALCULA ESTOQUE DE UM PRODUTO
async function calcularEstoque(id_produto, transaction = null) {

    const totalEntradas = await MovimentacaoEstoque.sum('quantidade', {
            where: {
                id_produto,
                tipo: 'ENTRADA'
            },
            transaction
        }) || 0;


    const totalSaidas = await MovimentacaoEstoque.sum('quantidade', {
            where: {
                id_produto,
                tipo: 'SAIDA'
            },
            transaction
        }) || 0;

    return totalEntradas - totalSaidas;
}

// VERIFICA ESTOQUE BAIXO
function estoqueEstaBaixo(estoqueAtual, quantidadeMinima) {
    return estoqueAtual <= quantidadeMinima;
}

//LISTA ESTOQUE
async function buscarEstoque(id_categoria = null) {

    const whereProduto = {};

    if (id_categoria !== null) {
        whereProduto.id_categoria = id_categoria;
    }

    const produtos = await Produto.findAll({

        where: whereProduto,

        include: [
            {
                model: Categoria,
                as: 'categoria',
                attributes: [
                    'id_categoria',
                    'nome'
                ]
            }
        ],

        order: [['nome', 'ASC']]
    });


    const estoque = await Promise.all(
        produtos.map(async (produto) => {
            const estoqueAtual = await calcularEstoque(produto.id_produto);

            return {
                id_produto: produto.id_produto,
                nome: produto.nome,
                imagem: produto.imagem,
                unidade: produto.unidade,
                custo: produto.custo,
                quantidade_minima:produto.quantidade_minima,
                categoria: produto.categoria,
                estoque_atual: estoqueAtual,
                estoque_baixo: estoqueEstaBaixo(estoqueAtual,produto.quantidade_minima)
            };
        })
    );

    return estoque;
}

//BUSCA ALERTAS
async function buscarAlertas() {
    const estoque = await buscarEstoque();

    return estoque.filter(produto => produto.estoque_baixo);
}


module.exports = {
    calcularEstoque,
    estoqueEstaBaixo,
    buscarEstoque,
    buscarAlertas
};