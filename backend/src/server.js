require('dotenv').config();

const app = require('./app');
const sequelize = require('./config/db');
require('./models');
const { garantirDadosIniciais } = require('./services/seedService');

const PORT = process.env.PORT || 3000;

async function startServer(){
    try{
        await sequelize.authenticate();
        console.log('PostgreSQL conectado com sucesso.');

        const alterarEstrutura = process.env.DB_SYNC_ALTER !== 'false';
        await sequelize.sync({ alter: alterarEstrutura });
        await garantirDadosIniciais();
        console.log('Tabelas e categorias iniciais prontas.');

        app.listen(PORT, '0.0.0.0', () =>{
            console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
        });
    } catch(err) {
        console.error('Não foi possível iniciar a API:', err);
        process.exitCode = 1;
    }
}

startServer();
