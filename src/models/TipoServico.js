const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TipoServico = sequelize.define('TipoServico', {
    id_tipo_servico: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    nome: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'tipos_servico',
    timestamps: false
});

module.exports = TipoServico;