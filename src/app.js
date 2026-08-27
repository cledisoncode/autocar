const express                   = require('express');
const path                      = require('path');

const categoriaRoutes           = require('./routes/categoriaRoutes');
const estoqueRoutes             = require('./routes/estoqueRoutes');
const movimentacaoEstoqueRoutes = require('./routes/movimentacaoEstoqueRoutes');
const produtoRoutes             = require('./routes/produtoRoutes');
const servicoRoutes             = require('./routes/servicoRoutes');
const tipoServicoRoutes         = require('./routes/tipoServicoRoutes');
const usuarioRoutes             = require('./routes/usuarioRoutes');


const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use('/uploads',express.static(path.join(__dirname, '../uploads')))

app.use('/api/categorias', categoriaRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/movimentacoes',movimentacaoEstoqueRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/servicos', servicoRoutes);
app.use('/api/tipos-servico', tipoServicoRoutes);
app.use('/api/usuarios', usuarioRoutes);




module.exports = app;