function arredondarQuantidade(valor) {
    return Math.round((Number(valor) + Number.EPSILON) * 1000) / 1000;
}

function quantidadeDisponivel(compra) {
    const valor = compra.quantidade_disponivel == null
        ? compra.quantidade
        : compra.quantidade_disponivel;

    return arredondarQuantidade(valor || 0);
}

function ordenarComprasParaSaida(compras) {
    return [...compras].sort((a, b) => {
        const vencimentoA = a.data_vencimento || '9999-12-31';
        const vencimentoB = b.data_vencimento || '9999-12-31';

        return vencimentoA.localeCompare(vencimentoB) ||
            String(a.data_compra).localeCompare(String(b.data_compra)) ||
            Number(a.id_compra_produto) - Number(b.id_compra_produto);
    });
}

function planejarSaida(compras, quantidadeSolicitada) {
    let restante = arredondarQuantidade(quantidadeSolicitada);
    const alocacoes = [];

    for (const compra of ordenarComprasParaSaida(compras)) {
        const disponivel = quantidadeDisponivel(compra);

        if (disponivel <= 0 || restante <= 0) {
            continue;
        }

        const retirada = arredondarQuantidade(Math.min(disponivel, restante));
        alocacoes.push({
            compra,
            retirada,
            saldo: arredondarQuantidade(disponivel - retirada)
        });
        restante = arredondarQuantidade(restante - retirada);
    }

    return { alocacoes, restante };
}

module.exports = {
    arredondarQuantidade,
    quantidadeDisponivel,
    ordenarComprasParaSaida,
    planejarSaida
};
