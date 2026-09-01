const { Op } = require('sequelize');
const { Servico, CompraProduto } = require('../models');

function dataLocalISO() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
}

function periodoFinanceiro(query) {
    const periodo = query.periodo || 'hoje';

    if (periodo === 'hoje') {
        const inicio = dataLocalISO();
        const [ano, mes, dia] = inicio.split('-').map(Number);
        const proximoDia = new Date(ano, mes - 1, dia + 1);
        const fimExclusivo = [
            proximoDia.getFullYear(),
            String(proximoDia.getMonth() + 1).padStart(2, '0'),
            String(proximoDia.getDate()).padStart(2, '0')
        ].join('-');

        return { periodo, inicio, fimExclusivo };
    }

    if (periodo === 'mes' && /^\d{4}-\d{2}$/.test(query.mes || '')) {
        const [ano, mes] = query.mes.split('-').map(Number);

        if (mes >= 1 && mes <= 12) {
            const inicio = `${query.mes}-01`;
            const proximoMes = new Date(ano, mes, 1);
            const fimExclusivo = [
                proximoMes.getFullYear(),
                String(proximoMes.getMonth() + 1).padStart(2, '0'),
                '01'
            ].join('-');

            return { periodo, inicio, fimExclusivo };
        }
    }

    return null;
}

// GET /api/relatorios/financeiro?periodo=hoje
// GET /api/relatorios/financeiro?periodo=mes&mes=2026-08
async function resumoFinanceiro(req, res) {
    try {
        const intervalo = periodoFinanceiro(req.query);

        if (!intervalo) {
            return res.status(400).json({
                erro: 'Use periodo=hoje ou periodo=mes&mes=AAAA-MM.'
            });
        }

        const [atendimentos, compras] = await Promise.all([
            Servico.findAll({
                where: {
                    data_servico: {
                        [Op.gte]: intervalo.inicio,
                        [Op.lt]: intervalo.fimExclusivo
                    }
                },
                attributes: ['id_servico', 'preco']
            }),
            CompraProduto.findAll({
                where: {
                    data_compra: {
                        [Op.gte]: intervalo.inicio,
                        [Op.lt]: intervalo.fimExclusivo
                    }
                },
                attributes: ['id_compra_produto', 'valor']
            })
        ]);

        const entradas = atendimentos.reduce(
            (total, atendimento) => total + Number(atendimento.preco),
            0
        );
        const despesas = compras.reduce(
            (total, compra) => total + Number(compra.valor),
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

module.exports = {
    resumoFinanceiro
};
