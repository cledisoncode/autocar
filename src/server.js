require('dotenv').config();

const app = require('./app');
const sequelize = require('./config/db')

const PORT = process.env.PORT || 3000;

async function startServer(){
    try{
        await sequelize.authenticate()
        console.log('Postgres conectado com sucesso!')

        app.listen(PORT, () =>{
            console.log(`Servidor rodando na porta ${PORT}`)
        });
    } catch(err) {
        console.error('Erro ao conectar ao Postgres: ', err)
    }
}

startServer()