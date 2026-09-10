const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/*
 * Cada registro representa uma compra de produto. O valor é o total pago.
 * A remoção é lógica para preservar o histórico e o relatório financeiro.
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

    quantidade_disponivel: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        validate: {
            min: 0
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
