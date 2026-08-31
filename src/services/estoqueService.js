const {
    Produto,
    Categoria,
    CompraProduto
} = require('../models');

function dataLocalISO() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
}

function adicionarDias(data, dias) {
    const [ano, mes, dia] = data.split('-').map(Number);
    const resultado = new Date(ano, mes - 1, dia);
    resultado.setDate(resultado.getDate() + dias);

    const anoResultado = resultado.getFullYear();
    const mesResultado = String(resultado.getMonth() + 1).padStart(2, '0');
    const diaResultado = String(resultado.getDate()).padStart(2, '0');

    return `${anoResultado}-${mesResultado}-${diaResultado}`;
}

function formatarDataParaApp(data) {
    if (!data) {
        return null;
    }

    const [ano, mes, dia] = String(data).slice(0, 10).split('-');
    return `${dia}/${mes}/${ano}`;
}

function compraParaApp(compra) {
    return {
        id: compra.id_compra_produto,
        quantidade: Number(compra.quantidade),
        valor: Number(compra.valor),
        dataCompra: formatarDataParaApp(compra.data_compra),
        dataVencimento: formatarDataParaApp(compra.data_vencimento),
        removida: compra.removida
    };
}

// Calcula o estoque a partir das compras/lotes ainda visíveis e não vencidos.
async function obterResumoEstoque(id_produto, transaction = null) {
    const compras = await CompraProduto.findAll({
        where: {
            id_produto,
            removida: false
        },
        transaction
    });

    const hoje = dataLocalISO();
    const limiteProximoVencimento = adicionarDias(hoje, 30);
    const comprasValidas = compras.filter((compra) =>
        !compra.data_vencimento || compra.data_vencimento >= hoje
    );
    const comprasProximas = compras.filter((compra) =>
        compra.data_vencimento &&
        compra.data_vencimento >= hoje &&
        compra.data_vencimento <= limiteProximoVencimento
    );
    const comprasVencidas = compras.filter((compra) =>
        compra.data_vencimento && compra.data_vencimento < hoje
    );

    const estoqueAtual = comprasValidas.reduce(
        (total, compra) => total + Number(compra.quantidade),
        0
    );

    return {
        estoqueAtual,
        possuiComprasVisiveis: compras.length > 0,
        possuiComprasValidas: comprasValidas.length > 0,
        comprasProximas,
        comprasVencidas
    };
}

async function calcularEstoque(id_produto, transaction = null) {
    const resumo = await obterResumoEstoque(id_produto, transaction);
    return resumo.estoqueAtual;
}

// VERIFICA ESTOQUE BAIXO
function estoqueEstaBaixo(estoqueAtual, quantidadeMinima) {
    return estoqueAtual <= quantidadeMinima;
}

//LISTA ESTOQUE
async function buscarEstoque(id_categoria = null) {

    const whereProduto = {
        removido: false
    };

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
            const resumo = await obterResumoEstoque(produto.id_produto);

            return {
                id_produto: produto.id_produto,
                nome: produto.nome,
                imagem: produto.imagem,
                unidade: produto.unidade,
                custo: produto.custo,
                quantidade_minima:produto.quantidade_minima,
                categoria: produto.categoria,
                estoque_atual: resumo.estoqueAtual,
                estoque_baixo:
                    resumo.possuiComprasVisiveis &&
                    resumo.possuiComprasValidas &&
                    estoqueEstaBaixo(
                        resumo.estoqueAtual,
                        produto.quantidade_minima
                    )
            };
        })
    );

    return estoque;
}

//BUSCA ALERTAS
async function buscarAlertas() {
    const produtos = await Produto.findAll({
        where: {
            removido: false
        },
        include: [
            {
                model: Categoria,
                as: 'categoria',
                attributes: ['id_categoria', 'nome']
            }
        ],
        order: [['nome', 'ASC']]
    });

    const alertas = await Promise.all(
        produtos.map(async (produto) => {
            const resumo = await obterResumoEstoque(produto.id_produto);
            const estoqueBaixo =
                resumo.possuiComprasVisiveis &&
                resumo.possuiComprasValidas &&
                estoqueEstaBaixo(
                    resumo.estoqueAtual,
                    produto.quantidade_minima
                );
            const produtoVencido =
                resumo.comprasVencidas.length > 0 &&
                resumo.estoqueAtual === 0;

            if (
                !estoqueBaixo &&
                resumo.comprasProximas.length === 0 &&
                resumo.comprasVencidas.length === 0
            ) {
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
        })
    );

    return alertas.filter(Boolean);
}


module.exports = {
    calcularEstoque,
    obterResumoEstoque,
    estoqueEstaBaixo,
    buscarEstoque,
    buscarAlertas
};
