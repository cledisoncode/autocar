const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Servico = sequelize.define('Servico', {
    id_servico: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    id_tipo_servico: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    nome_cliente: {
        type: DataTypes.STRING(150),
        allowNull: false
    },

    tipo_veiculo: {
        type: DataTypes.STRING(50),
        allowNull: false
    },

    placa: {
        type: DataTypes.STRING(10),
        allowNull: true
    },

    data_servico: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },

    preco: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    }
}, {
    tableName: 'servicos',
    timestamps: false
});

module.exports = Servico;