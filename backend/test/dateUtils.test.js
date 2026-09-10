const test = require('node:test');
const assert = require('node:assert/strict');
const {
    adicionarDiasISO,
    criarDataHora,
    formatarDataHoraParaApp,
    formatarDataParaApp,
    normalizarData
} = require('../src/utils/dateUtils');

test('normaliza datas válidas e rejeita datas inexistentes', () => {
    assert.equal(normalizarData('29/08/2026'), '2026-08-29');
    assert.equal(normalizarData('2026-08-29'), '2026-08-29');
    assert.equal(normalizarData('31/02/2026'), null);
});

test('formata data para o contrato do aplicativo', () => {
    assert.equal(formatarDataParaApp('2026-08-29'), '29/08/2026');
    assert.equal(adicionarDiasISO('2026-12-31', 1), '2027-01-01');
});

test('data e horário independem do fuso da máquina', () => {
    const data = criarDataHora('2026-08-29', '14:30');
    assert.deepEqual(formatarDataHoraParaApp(data), {
        data: '29/08/2026',
        horario: '14:30'
    });
});
