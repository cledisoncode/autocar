const { Op } = require('sequelize');
const { CompraProduto, Servico } = require('../models');
const {
    adicionarDiasISO,
    dataAtualISO,
    inicioDoDia
} = require('../utils/dateUtils');

function periodoFinanceiro(query) {
    const periodo = String(query.periodo || 'hoje').toLowerCase();

    if (periodo === 'todos') {
        return { periodo, inicio: null, fimExclusivo: null };
    }

    if (periodo === 'hoje') {
        const inicio = dataAtualISO();
        return { periodo, inicio, fimExclusivo: adicionarDiasISO(inicio, 1) };
    }

    if (periodo === 'mes') {
        const mesSelecionado = query.mes || dataAtualISO().slice(0, 7);

        if (!/^\d{4}-\d{2}$/.test(mesSelecionado)) return null;
        const [ano, mes] = mesSelecionado.split('-').map(Number);
        if (mes < 1 || mes > 12) return null;

        const inicio = `${mesSelecionado}-01`;
        const fimExclusivo = mes === 12
            ? `${ano + 1}-01-01`
            : `${ano}-${String(mes + 1).padStart(2, '0')}-01`;
        return { periodo, inicio, fimExclusivo };
    }

    return null;
}

async function resumoFinanceiro(req, res) {
    try {
        const intervalo = periodoFinanceiro(req.query);
        if (!intervalo) {
            return res.status(400).json({
                erro: 'Use periodo=hoje, periodo=mes&mes=AAAA-MM ou periodo=todos.'
            });
        }

        const whereServico = { id_usuario: req.usuario.idUsuario };
        const whereCompra = {};

        if (intervalo.inicio) {
            whereServico.data_servico = {
                [Op.gte]: inicioDoDia(intervalo.inicio),
                [Op.lt]: inicioDoDia(intervalo.fimExclusivo)
            };
            whereCompra.data_compra = {
                [Op.gte]: intervalo.inicio,
                [Op.lt]: intervalo.fimExclusivo
            };
        }

        const [atendimentos, compras] = await Promise.all([
            Servico.findAll({
                where: whereServico,
                attributes: ['id_servico', 'preco']
            }),
            CompraProduto.findAll({
                where: whereCompra,
                attributes: ['id_compra_produto', 'valor']
            })
        ]);

        const entradas = atendimentos.reduce(
            (total, item) => total + Number(item.preco),
            0
        );
        const despesas = compras.reduce(
            (total, item) => total + Number(item.valor),
            0
        );

        return res.status(200).json({
            periodo: {
                tipo: intervalo.periodo,
                inicio: intervalo.inicio,
                fimExclusivo: intervalo.fimExclusivo
            },
            entradas,
            despesas,
            lucro: entradas - despesas,
            quantidadeAtendimentos: atendimentos.length,
            quantidadeCompras: compras.length
        });
    } catch (error) {
        console.error('Erro ao gerar resumo financeiro:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
}

module.exports = { periodoFinanceiro, resumoFinanceiro };
