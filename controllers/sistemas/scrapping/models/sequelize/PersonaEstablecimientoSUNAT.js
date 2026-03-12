const { DataTypes } = require("sequelize");
const { getSecualize } = require("./initSequelize.js");

const sequelize = getSecualize('CP');
const PersonaEstablecimientoSUNAT = sequelize.define('PersonaEstablecimientoSUNAT', {
    PKID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    DocIdentidad: DataTypes.STRING(60),
    Codigo: DataTypes.STRING(60),
    Direccion: DataTypes.STRING(200),
    Tipo: DataTypes.STRING(100),
    Actividad: DataTypes.STRING(100)
}, {
    tableName: 'PersonaEstablecimientoSUNAT',
    timestamps: false // Para que no busque campos createdAt/updatedAt
});

module.exports = PersonaEstablecimientoSUNAT;