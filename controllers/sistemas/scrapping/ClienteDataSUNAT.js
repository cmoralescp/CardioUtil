const { Sequelize, DataTypes } = require("sequelize");
const secualizeConfig = {
    dialect: 'mssql',
    dialectOptions: {
        options: {
            encrypt: false,               // Deshabilita el cifrado de la conexión
            trustServerCertificate: true, // Ignora la validación de certificados
            enableArithAbort: true,
            // Esto fuerza a tedious a no intentar negociaciones SSL modernas
            cryptoCredentialsDetails: {
                minVersion: 'TLSv1'
            }
        }
    },
    logging: false // Opcional, para limpiar la consola
};


// Configura tu conexión a la base de datos Sequelize
const sequelizeCP = new Sequelize("FlexNetCardio", "sa", "pl0K13126", {
    ...secualizeConfig,
    host: "10.10.21.2",
});
const sequelizeCE = new Sequelize("FlexNetCardio", "sa", "pl0K13126", {
    ...secualizeConfig,
    host: "10.10.21.3",
    dialect: "mssql",
});
const sequelizeOM = new Sequelize("FlexNetCardio", "sa", "pl0K13126", {
    ...secualizeConfig,
    host: "10.10.21.22",
    dialect: "mssql",
});
const getSecualize = (EMP) => {
    if (EMP === "CP") {
        return sequelizeCP;
    } else if (EMP === "CE") {
        return sequelizeCE;
    } else if (EMP === "OM") {
        return sequelizeOM;
    }
};

const sequelize = getSecualize('CP');
const ClienteDataSUNAT = sequelize.define('ClienteDataSUNAT', {
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
    tableName: 'ClienteDataSUNAT',
    timestamps: false // Para que no busque campos createdAt/updatedAt
});

module.exports = ClienteDataSUNAT;