const { Produto, Categoria, CompraProduto } = require('../models');
const {
    adicionarDiasISO,
    dataAtualISO,
    formatarDataParaApp
} = require('../utils/dateUtils');
const { quantidadeDisponivel } = require('./stockMath');

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

async function obterResumoEstoque(idProduto, transaction = null) {
    const compras = await CompraProduto.findAll({
        where: { id_produto: idProduto, removida: false },
        transaction
    });
    const hoje = dataAtualISO();
    const limiteProximoVencimento = adicionarDiasISO(hoje, 30);
    const comprasValidas = compras.filter((compra) =>
        !compra.data_vencimento || compra.data_vencimento >= hoje
    );
    const comprasProximas = comprasValidas.filter((compra) =>
        quantidadeDisponivel(compra) > 0 &&
        compra.data_vencimento &&
        compra.data_vencimento <= limiteProximoVencimento
    );
    const comprasVencidas = compras.filter((compra) =>
        quantidadeDisponivel(compra) > 0 &&
        compra.data_vencimento &&
        compra.data_vencimento < hoje
    );
    const estoqueAtual = comprasValidas.reduce(
        (total, compra) => total + quantidadeDisponivel(compra),
        0
    );

    return {
        estoqueAtual: Math.round((estoqueAtual + Number.EPSILON) * 1000) / 1000,
        possuiComprasVisiveis: compras.length > 0,
        possuiComprasValidas: comprasValidas.length > 0,
        comprasProximas,
        comprasVencidas
    };
}

async function calcularEstoque(idProduto, transaction = null) {
    return (await obterResumoEstoque(idProduto, transaction)).estoqueAtual;
}

function estoqueEstaBaixo(estoqueAtual, quantidadeMinima) {
    return estoqueAtual <= Number(quantidadeMinima);
}

async function buscarEstoque(idCategoria = null) {
    const where = { removido: false };
    if (idCategoria !== null) where.id_categoria = idCategoria;

    const produtos = await Produto.findAll({
        where,
        include: {
            model: Categoria,
            as: 'categoria',
            attributes: ['id_categoria', 'nome']
        },
        order: [['nome', 'ASC']]
    });

    return Promise.all(produtos.map(async (produto) => {
        const resumo = await obterResumoEstoque(produto.id_produto);
        return {
            id_produto: produto.id_produto,
            nome: produto.nome,
            imagem: produto.imagem,
            custo: Number(produto.custo),
            quantidade_minima: Number(produto.quantidade_minima),
            categoria: produto.categoria,
            estoque_atual: resumo.estoqueAtual,
            estoque_baixo: resumo.possuiComprasVisiveis &&
                resumo.possuiComprasValidas &&
                estoqueEstaBaixo(resumo.estoqueAtual, produto.quantidade_minima)
        };
    }));
}

async function buscarAlertas() {
    const produtos = await Produto.findAll({
        where: { removido: false },
        include: {
            model: Categoria,
            as: 'categoria',
            attributes: ['id_categoria', 'nome']
        },
        order: [['nome', 'ASC']]
    });

    const alertas = await Promise.all(produtos.map(async (produto) => {
        const resumo = await obterResumoEstoque(produto.id_produto);
        const estoqueBaixo = resumo.possuiComprasVisiveis &&
            resumo.possuiComprasValidas &&
            estoqueEstaBaixo(resumo.estoqueAtual, produto.quantidade_minima);
        const produtoVencido = resumo.comprasVencidas.length > 0 &&
            resumo.estoqueAtual === 0;

        if (!estoqueBaixo && resumo.comprasProximas.length === 0 &&
            resumo.comprasVencidas.length === 0) {
            return null;
        }

        return {
            produto: {
                id: produto.id_produto,
                nome: produto.nome,
                categoria: produto.categoria.nome,
                foto: produto.imagem,
                compras: [],
                removido: produto.removido
            },
            quantidadeDisponivel: resumo.estoqueAtual,
            estoqueBaixo,
            comprasProximas: resumo.comprasProximas.map(compraParaApp),
            comprasVencidas: resumo.comprasVencidas.map(compraParaApp),
            produtoVencido
        };
    }));

    return alertas.filter(Boolean);
}

module.exports = {
    buscarAlertas,
    buscarEstoque,
    calcularEstoque,
    estoqueEstaBaixo,
    obterResumoEstoque
};
