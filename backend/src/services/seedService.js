const { Categoria } = require('../models');

const CATEGORIAS_PADRAO = [
    'Lavagem Interna',
    'Lavagem Externa',
    'Vidros',
    'Acabamento'
];

async function garantirDadosIniciais() {
    await Promise.all(
        CATEGORIAS_PADRAO.map((nome) =>
            Categoria.findOrCreate({ where: { nome }, defaults: { nome } })
        )
    );
}

module.exports = {
    CATEGORIAS_PADRAO,
    garantirDadosIniciais
};
