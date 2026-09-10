const test = require('node:test');
const assert = require('node:assert/strict');
const { planejarSaida, quantidadeDisponivel } = require('../src/services/stockMath');

test('usa quantidade original ao migrar compras antigas', () => {
    assert.equal(quantidadeDisponivel({ quantidade: '3.500', quantidade_disponivel: null }), 3.5);
});

test('saída consome primeiro o produto que vence antes', () => {
    const compras = [
        {
            id_compra_produto: 1,
            quantidade: 5,
            quantidade_disponivel: 5,
            data_compra: '2026-08-01',
            data_vencimento: null
        },
        {
            id_compra_produto: 2,
            quantidade: 3,
            quantidade_disponivel: 3,
            data_compra: '2026-08-02',
            data_vencimento: '2026-09-01'
        }
    ];
    const resultado = planejarSaida(compras, 4);

    assert.equal(resultado.restante, 0);
    assert.equal(resultado.alocacoes[0].compra.id_compra_produto, 2);
    assert.equal(resultado.alocacoes[0].saldo, 0);
    assert.equal(resultado.alocacoes[1].saldo, 4);
});

test('informa quanto faltou quando a saída excede o saldo', () => {
    const resultado = planejarSaida([{
        id_compra_produto: 1,
        quantidade: 2,
        quantidade_disponivel: 2,
        data_compra: '2026-08-01',
        data_vencimento: null
    }], 3);

    assert.equal(resultado.restante, 1);
});
