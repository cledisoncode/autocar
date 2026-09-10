const express                   = require('express');
const cors                      = require('cors');
const path                      = require('path');
const multer                    = require('multer');
const autenticar                = require('./middlewares/authMiddleware');

const categoriaRoutes           = require('./routes/categoriaRoutes')
const tipoServicoRoutes         = require('./routes/tipoServicoRoutes');
const produtoRoutes             = require('./routes/produtoRoutes');
const movimentacaoEstoqueRoutes = require('./routes/movimentacaoEstoqueRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const atendimentoRoutes = require('./routes/atendimentoRoutes');
const authRoutes = require('./routes/authRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes');

const app = express();

const origensPermitidas = (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((origem) => origem.trim());

app.use(cors({
    origin: origensPermitidas.includes('*') ? '*' : origensPermitidas
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', servico: 'AUTOCAR API' });
});

app.use('/api/auth', authRoutes);
app.use('/api', autenticar);

app.use('/api/categorias', categoriaRoutes);
app.use('/api/tipos-servico', tipoServicoRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/movimentacoes',movimentacaoEstoqueRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/atendimentos', atendimentoRoutes);
app.use('/api/relatorios', relatorioRoutes);

app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada.' });
});

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({
            erro: error.code === 'LIMIT_FILE_SIZE'
                ? 'A imagem deve ter no máximo 5 MB.'
                : `Erro no envio da imagem: ${error.message}`
        });
    }

    if (error) {
        console.error('Erro não tratado:', error);
        const erroDeUpload = error.message === 'Formato de imagem não permitido.';
        return res.status(erroDeUpload ? 400 : 500).json({
            erro: error.message || 'Não foi possível processar a requisição.'
        });
    }

    return next();
});

module.exports = app;
