const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Produto = sequelize.define('Produto', {
    id_produto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    nome: {
        type: DataTypes.STRING(150),
        allowNull: false
    },

    imagem: {
        type: DataTypes.STRING(255),
        allowNull: true
    },

    id_categoria: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    unidade: {
        type: DataTypes.STRING(30),
        allowNull: false
    },

    quantidade_minima: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2
    },

    custo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    data_compra: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },

    data_vencimento: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },

    removido: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'produtos',
    timestamps: false
});

module.exports = Produto;
