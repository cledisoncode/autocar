const express                   = require('express');
const cors                      = require('cors');
const path                      = require('path');

const categoriaRoutes           = require('./routes/categoriaRoutes')
const tipoServicoRoutes         = require('./routes/tipoServicoRoutes');
const produtoRoutes             = require('./routes/produtoRoutes');
const movimentacaoEstoqueRoutes = require('./routes/movimentacaoEstoqueRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const atendimentoRoutes = require('./routes/atendimentoRoutes');
const authRoutes = require('./routes/authRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads',express.static(path.join(__dirname, '../uploads')))

app.use('/api/categorias', categoriaRoutes);
app.use('/api/tipos-servico', tipoServicoRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/movimentacoes',movimentacaoEstoqueRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/atendimentos', atendimentoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/relatorios', relatorioRoutes);


module.exports = app;
