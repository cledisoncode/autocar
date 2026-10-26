const fs = require('fs');
const path = require('path');
const {Sequelize} = require('sequelize');

const host = process.env.DB_HOST;
const sslObrigatorio = process.env.DB_SSL === 'true' ||
    String(host || '').includes('supabase');
const caminhoCaInformado = process.env.DB_SSL_CA?.trim();
const caInline = process.env.DB_SSL_CA_CONTENT?.trim();
const caminhoCa = caminhoCaInformado
    ? path.resolve(__dirname, '../../', caminhoCaInformado)
    : null;
const opcoesSsl = { rejectUnauthorized: true };

if (caminhoCa && fs.existsSync(caminhoCa)) {
    opcoesSsl.ca = fs.readFileSync(caminhoCa, 'utf8');
} else if (caInline) {
    opcoesSsl.ca = caInline.replace(/\\n/g, '\n');
}

const dialectOptions = sslObrigatorio
    ? { ssl: opcoesSsl }
    : {};

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: process.env.DB_LOGGING === 'true' ? console.log : false,
        timezone: process.env.APP_UTC_OFFSET || '-03:00',
        dialectOptions
    }
);

function validarConfiguracaoBanco() {
    const obrigatorias = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];
    const ausentes = obrigatorias.filter((chave) => !process.env[chave]?.trim());

    if (ausentes.length > 0) {
        throw new Error(
            `Configuração do PostgreSQL incompleta. Defina: ${ausentes.join(', ')}.`
        );
    }

    if (String(process.env.DB_HOST).includes('supabase') && !caminhoCa && !caInline) {
        throw new Error(
            'Configure DB_SSL_CA ou DB_SSL_CA_CONTENT com o certificado CA do Supabase.'
        );
    }

    if (caminhoCa && !fs.existsSync(caminhoCa) && !caInline) {
        throw new Error('O arquivo configurado em DB_SSL_CA não foi encontrado.');
    }

    const porta = process.env.DB_PORT || '5432';
    if (!/^\d+$/.test(porta) || Number(porta) < 1 || Number(porta) > 65535) {
        throw new Error('DB_PORT deve ser uma porta válida entre 1 e 65535.');
    }
}

module.exports = sequelize;
module.exports.validarConfiguracaoBanco = validarConfiguracaoBanco;
