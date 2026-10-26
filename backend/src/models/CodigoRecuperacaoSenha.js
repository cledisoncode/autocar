const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CodigoRecuperacaoSenha = sequelize.define('CodigoRecuperacaoSenha', {
    id_codigo_recuperacao: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    codigo_hash: {
        type: DataTypes.STRING(64),
        allowNull: false
    },
    tentativas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    criado_em: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    expira_em: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'codigos_recuperacao_senha',
    timestamps: false
});

module.exports = CodigoRecuperacaoSenha;
