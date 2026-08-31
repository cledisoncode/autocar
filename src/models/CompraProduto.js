const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/*
 * Cada registro representa uma compra/lote de um produto.
 *
 * O valor é o valor total da compra, pois é esse o valor usado pelo
 * financeiro do aplicativo. Uma compra removida continua registrada
 * para preservar o histórico financeiro e os relatórios.
 */
const CompraProduto = sequelize.define('CompraProduto', {
    id_compra_produto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    id_produto: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    quantidade: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        validate: {
            min: 0.001
        }
    },

    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },

    data_compra: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },

    data_vencimento: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },

    removida: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'compras_produto',
    timestamps: false
});

module.exports = CompraProduto;
