const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MovimentacaoEstoque = sequelize.define('MovimentacaoEstoque', {

    id_movimentacao: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    id_produto: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    tipo: {
        type: DataTypes.STRING(10),
        allowNull: false
    },

    quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    data_movimentacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },

    observacao: {
        type: DataTypes.TEXT,
        allowNull: true
    }

}, {
    tableName: 'movimentacoes_estoque',
    timestamps: false
});

module.exports = MovimentacaoEstoque;