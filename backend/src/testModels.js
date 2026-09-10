require('dotenv').config();

const sequelize = require('./config/db');
const models = require('./models');

async function testarModels() {
    try {
        await sequelize.authenticate();
        console.log('Conexão com o PostgreSQL funcionando.');
        console.log('Models carregados:', Object.keys(models).join(', '));
        await Promise.all([
            models.Usuario.count(),
            models.Categoria.count(),
            models.TipoServico.count(),
            models.Produto.count(),
            models.CompraProduto.count(),
            models.MovimentacaoEstoque.count(),
            models.Servico.count()
        ]);
        console.log('Consultas básicas executadas com sucesso.');
    } catch (error) {
        console.error('Falha no teste dos models:', error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

testarModels();
