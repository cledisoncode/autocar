const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const TipoServico = require('./TipoServico');
const Produto = require('./Produto');
const MovimentacaoEstoque = require('./MovimentacaoEstoque');
const Servico = require('./Servico');

// CATEGORIA => PRODUTO
//Um tipo de categoria pode ser utilizado em vários produtos,E cada produto possui uma categoria
//a mesma lógica se aplica para os demais abaixo
Categoria.hasMany(Produto, {
    foreignKey: 'id_categoria',
    as: 'produtos'
});

Produto.belongsTo(Categoria, {
    foreignKey: 'id_categoria',
    as: 'categoria'
});

// PRODUTO → MOVIMENTAÇÕES
Produto.hasMany(MovimentacaoEstoque, {
    foreignKey: 'id_produto',
    as: 'movimentacoes'
});

MovimentacaoEstoque.belongsTo(Produto, {
    foreignKey: 'id_produto',
    as: 'produto'
});

// USUÁRIO → MOVIMENTAÇÕES
Usuario.hasMany(MovimentacaoEstoque, {
    foreignKey: 'id_usuario',
    as: 'movimentacoes'
});

MovimentacaoEstoque.belongsTo(Usuario, {
    foreignKey: 'id_usuario',
    as: 'usuario'
});

// USUÁRIO → SERVIÇOS
Usuario.hasMany(Servico, {
    foreignKey: 'id_usuario',
    as: 'servicos'
});

Servico.belongsTo(Usuario, {
    foreignKey: 'id_usuario',
    as: 'usuario'
});

// TIPO DE SERVIÇO = > SERVIÇO
TipoServico.hasMany(Servico, {
    foreignKey: 'id_tipo_servico',
    as: 'servicos'
});

Servico.belongsTo(TipoServico, {
    foreignKey: 'id_tipo_servico',
    as: 'tipoServico'
});


module.exports = {
    Usuario,
    Categoria,
    TipoServico,
    Produto,
    MovimentacaoEstoque,
    Servico
};