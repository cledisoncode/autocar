require('dotenv').config();

const sequelize = require('./config/db');

const {
    Usuario,
    Categoria,
    TipoServico,
    Produto,
    MovimentacaoEstoque,
    Servico
} = require('./models')

async function testarModels(){
    try{
        console.log('Testando conexao')

        await sequelize.authenticate();

        console.log('Conexao com BD funcionando!')

        console.log('\nTestando Models')
        console.log('Usuario', Usuario.name);
        console.log('Categoria',Categoria.name);
        console.log('TipoServico', TipoServico.name);
        console.log('Produto', Produto.name);
        console.log('MovimentacaoEstoque', MovimentacaoEstoque.name);
        console.log('Servico', Servico.name);

        console.log('Testando consulta de categorias');

        const categorias = await Categoria.findAll({
            include: {
                model: Produto,
                as: 'produtos'
            }
        });
        console.log('Categorias encontradas:')
        console.dir(categorias.map(categoria => categoria.toJSON()),
            {depth: null}
        )

    } catch (err){
        console.error('Erro durante o teste:');
        console.error(err);
    } finally{
        await sequelize.close();
    }
}

testarModels()