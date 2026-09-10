const APP_TIMEZONE = process.env.APP_TIMEZONE || 'America/Belem';
const APP_UTC_OFFSET = process.env.APP_UTC_OFFSET || '-03:00';

function partesDataNoFuso(data = new Date()) {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(data);

    return Object.fromEntries(
        partes
            .filter((parte) => parte.type !== 'literal')
            .map((parte) => [parte.type, parte.value])
    );
}

function dataAtualISO(data = new Date()) {
    const { year, month, day } = partesDataNoFuso(data);
    return `${year}-${month}-${day}`;
}

function dataISOValida(valor) {
    const partes = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!partes) {
        return false;
    }

    const [, ano, mes, dia] = partes;
    const data = new Date(`${ano}-${mes}-${dia}T00:00:00Z`);

    return !Number.isNaN(data.getTime()) &&
        data.getUTCFullYear() === Number(ano) &&
        data.getUTCMonth() + 1 === Number(mes) &&
        data.getUTCDate() === Number(dia);
}

function normalizarData(valor) {
    if (!valor || typeof valor !== 'string') {
        return null;
    }

    const data = valor.trim();

    if (dataISOValida(data)) {
        return data;
    }

    const partes = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!partes) {
        return null;
    }

    const [, dia, mes, ano] = partes;
    const iso = `${ano}-${mes}-${dia}`;
    return dataISOValida(iso) ? iso : null;
}

function formatarDataParaApp(valor) {
    if (!valor) {
        return null;
    }

    const iso = String(valor).slice(0, 10);

    if (!dataISOValida(iso)) {
        return null;
    }

    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
}

function horarioValido(valor) {
    const partes = String(valor || '').trim().match(/^(\d{2}):(\d{2})$/);
    return Boolean(
        partes &&
        Number(partes[1]) <= 23 &&
        Number(partes[2]) <= 59
    );
}

function criarDataHora(dataISO, horario) {
    if (!dataISOValida(dataISO) || !horarioValido(horario)) {
        return null;
    }

    const data = new Date(`${dataISO}T${horario}:00${APP_UTC_OFFSET}`);
    return Number.isNaN(data.getTime()) ? null : data;
}

function formatarDataHoraParaApp(valor) {
    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return null;
    }

    return {
        data: new Intl.DateTimeFormat('pt-BR', {
            timeZone: APP_TIMEZONE,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(data),
        horario: new Intl.DateTimeFormat('pt-BR', {
            timeZone: APP_TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        }).format(data)
    };
}

function adicionarDiasISO(dataISO, quantidade) {
    if (!dataISOValida(dataISO)) {
        return null;
    }

    const [ano, mes, dia] = dataISO.split('-').map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia + quantidade));
    return data.toISOString().slice(0, 10);
}

function inicioDoDia(dataISO) {
    return new Date(`${dataISO}T00:00:00${APP_UTC_OFFSET}`);
}

module.exports = {
    APP_TIMEZONE,
    APP_UTC_OFFSET,
    adicionarDiasISO,
    criarDataHora,
    dataAtualISO,
    dataISOValida,
    formatarDataHoraParaApp,
    formatarDataParaApp,
    horarioValido,
    inicioDoDia,
    normalizarData
};
