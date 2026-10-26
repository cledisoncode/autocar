const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const tiposPermitidos = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

function usarSupabaseStorage() {
    return process.env.STORAGE_PROVIDER === 'supabase';
}

function configuracaoSupabase() {
    const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const chave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';
    if (!baseUrl || !chave) {
        throw new Error('Configure SUPABASE_URL e SUPABASE_SECRET_KEY para usar o Supabase Storage.');
    }
    return { baseUrl, chave, bucket };
}

function headersStorage(chave, adicionais = {}) {
    const headers = { apikey: chave, ...adicionais };
    // As chaves secret novas não são JWTs e não devem ir no cabeçalho Bearer.
    if (!chave.startsWith('sb_secret_')) {
        headers.Authorization = `Bearer ${chave}`;
    }
    return headers;
}

function codificarCaminho(caminho) {
    return caminho.split('/').map(encodeURIComponent).join('/');
}

async function salvarImagem(file) {
    if (!file) return null;
    if (!tiposPermitidos[file.mimetype]) {
        throw new Error('Formato de imagem não permitido.');
    }

    if (!usarSupabaseStorage()) {
        return `/uploads/img_produtos/${file.filename}`;
    }

    const { baseUrl, chave, bucket } = configuracaoSupabase();
    const nome = `${Date.now()}-${randomUUID()}${tiposPermitidos[file.mimetype]}`;
    const url = `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURIComponent(nome)}`;
    const resposta = await fetch(url, {
        method: 'POST',
        headers: headersStorage(chave, {
            'Content-Type': file.mimetype,
            'x-upsert': 'false'
        }),
        body: file.buffer
    });

    if (!resposta.ok) {
        const detalhe = await resposta.text();
        throw new Error(`Falha ao enviar imagem ao Supabase Storage (HTTP ${resposta.status}): ${detalhe}`);
    }

    return `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${codificarCaminho(nome)}`;
}

async function excluirImagem(referencia) {
    if (!referencia) return;

    if (referencia.startsWith('/uploads/')) {
        const uploadDir = path.resolve(__dirname, '../../uploads');
        const caminho = path.resolve(uploadDir, referencia.replace(/^\/uploads\//, ''));
        if (caminho.startsWith(`${uploadDir}${path.sep}`) && fs.existsSync(caminho)) {
            fs.unlinkSync(caminho);
        }
        return;
    }

    if (!usarSupabaseStorage()) return;

    const { baseUrl, chave, bucket } = configuracaoSupabase();
    const prefixoPublico = `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/`;
    if (!referencia.startsWith(prefixoPublico)) return;

    const nome = decodeURIComponent(referencia.slice(prefixoPublico.length));
    const resposta = await fetch(
        `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`,
        {
            method: 'DELETE',
            headers: headersStorage(chave, {
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({ prefixes: [nome] })
        }
    );

    if (!resposta.ok && resposta.status !== 404) {
        throw new Error(`Falha ao excluir imagem do Supabase Storage (HTTP ${resposta.status}).`);
    }
}

async function descartarArquivoRecebido(file) {
    if (!file) return;
    if (usarSupabaseStorage()) return;
    if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
}

function validarConfiguracaoStorage() {
    if (usarSupabaseStorage()) configuracaoSupabase();
}

module.exports = {
    descartarArquivoRecebido,
    excluirImagem,
    salvarImagem,
    usarSupabaseStorage,
    validarConfiguracaoStorage
};
