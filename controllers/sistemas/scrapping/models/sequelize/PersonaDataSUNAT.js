const { DataTypes } = require("sequelize");
const { getSecualize } = require("./initSequelize.js");

const sequelize = getSecualize('CP');
const PersonaDataSUNAT = sequelize.define('PersonaDataSUNAT', {
    PKID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }, DocIdentidad: DataTypes.STRING(20),
    Nombre: DataTypes.STRING(250),
    TipoContribuyente: DataTypes.STRING(250),
    ProfesionOficio: DataTypes.STRING(250),
    NombreComercial: DataTypes.STRING(250),
    CondicionContribuyente: DataTypes.STRING(250),
    EstadoContribuyente: DataTypes.STRING(50),
    FechaInscripcion: DataTypes.STRING(20),
    FechaInicioActividades: DataTypes.STRING(20),
    Departamento: DataTypes.STRING(100),
    Provincia: DataTypes.STRING(100),
    Distrito: DataTypes.STRING(100),
    Direccion: DataTypes.STRING(500),
    Telefono: DataTypes.STRING(50),
    Fax: DataTypes.STRING(50),
    ActividadComercioExterior: DataTypes.STRING(500),
    PrincipalCIIU: DataTypes.STRING(100),
    Secundario1CIIU: DataTypes.STRING(100),
    Secundario2CIIU: DataTypes.STRING(100),
    AfectoNuevoRUS: DataTypes.STRING(100),
    BuenContribuyente: DataTypes.STRING(100),
    AgenteRetencion: DataTypes.STRING(250),
    AgentePercepcionVtaInt: DataTypes.STRING(250),
    AgentePercepcionComLiq: DataTypes.STRING(250)
}, {
    tableName: 'PersonaDataSUNAT',
    timestamps: false // Para que no busque campos createdAt/updatedAt
});

module.exports = PersonaDataSUNAT;