const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { Parameter } = require('./models/Parameter');
const { ScrapingUtil } = require('./models/ScrapingUtil');
const { Establecimiento } = require('./models/Establecimiento');
const PersonaEstablecimientoSUNAT = require('./models/sequelize/PersonaEstablecimientoSUNAT');
const { ScrapingUtilMasiva } = require('./models/ScrapingUtilMasiva');
const { ParameterMasiva } = require('./models/ParameterMasiva');
const PersonaDataSUNAT = require('./models/sequelize/PersonaDataSUNAT');
const { PersonaSUNAT } = require('./models/PersonaSUNAT');

const objCallback = {
    getFolderPath(folderName = 'assets') {
        return path.resolve(__dirname, folderName);
    },
    getFinalPath(customName = '') {
        const folderPath = this.getFolderPath();
        const timestamp = Date.now();
        const fileName = customName ? `${customName}_${timestamp}.png` : `screenshot_${timestamp}.png`;
        return path.join(folderPath, '\\images\\' + fileName);
    },
    getFinalPathTypeFolder(type = 'zip') {
        const folderPath = this.getFolderPath();
        return folderPath + '\\' + type + '\\';
    },
    getFinalPathType(type = 'zip', customName = '') {
        const folderPath = this.getFolderPath();
        const timestamp = Date.now();
        const fileName = customName ? `${customName}_${timestamp}.zip` : `download_${timestamp}.zip`;
        return path.join(folderPath, '\\' + type + '\\' + fileName);
    },
    getAdmZip(rutaFinalZip) {
        const AdmZip = require('adm-zip');
        return new AdmZip(rutaFinalZip);
    },
    async registerEstablecimientoDatabase(dataArrayJSON, filtroValor) {
        try {
            const registros = dataArrayJSON.map(item => new Establecimiento(filtroValor, item.codigo, item.tipo, item.direccion, item.actividad));
            console.log(registros);

            console.log(`Guardando ${registros.length} registros en la base de datos...`);

            // Inserción masiva
            await PersonaEstablecimientoSUNAT.bulkCreate(registros);

            console.log("¡Datos guardados correctamente!");
        } catch (error) {
            console.error("Error al insertar en la base de datos:", error);
        }
    },
    async registerDatabase(rutaFinalTXT) {
        try {
            console.log('call register');
            console.log(rutaFinalTXT);

            console.log('Iniciando registro en base de datos...');
            console.log(`Procesando archivo: ${rutaFinalTXT}`);

            const clientesArray = [];

            // 1. Crear interfaz de lectura línea por línea
            const fileStream = fs.createReadStream(rutaFinalTXT);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            let esPrimeraLinea = true;

            for await (const line of rl) {
                if (esPrimeraLinea) {
                    esPrimeraLinea = false;
                    continue;
                }
                if (line.trim() !== "") {
                    // Separamos por pipe '|' que es el estándar de SUNAT
                    const columns = line.split('|');

                    // Instanciamos la clase y almacenamos en el array
                    const cliente = new PersonaSUNAT(columns);
                    clientesArray.push(cliente);
                }
            }

            console.log(`Guardando ${clientesArray.length} registros en la base de datos...`);

            // Inserción masiva
            await PersonaDataSUNAT.bulkCreate(clientesArray);

            console.log("¡Datos guardados correctamente!");
        } catch (error) {
            console.error("Error al insertar en la base de datos:", error);
        }
    }
};
// http://localhost:4040/api/v1/sistemas/operaciones/getDataClienteSUNAT
const getDataSUNAT = async () => {
    try {
        const browser = await chromium.launch({ headless: false, slowMo: 50 });
        const page = await browser.newPage();

        const objParameter = new Parameter('RUC', '20108629909');
        // const objParameter = new Parameter('RUC', '20131257750');
        // const objParameter = new Parameter('DNI', '46788906');
        // const objParameter = new Parameter('RAZON_SOCIAL', 'ASOCIACION PERUANO JAPONESA');
        const objUtil = new ScrapingUtil(objParameter, objCallback);
        await page.goto('https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp');
        await objUtil.onChangeCriterioBusqueda(page);
        await browser.close();

    } catch (error) {
        console.log(error);
    }
}
// http://localhost:4040/api/v1/sistemas/operaciones/getDataClienteSUNATMasiva
const getDataSUNATMasiva = async () => {
    try {
        const browser = await chromium.launch({ headless: false, slowMo: 50 });
        const page = await browser.newPage();

        const objParameter = new ParameterMasiva('RUC', ['20131257750', '20108629909']);
        // const objParameter = new Parameter('RUC', '20131257750');
        // const objParameter = new Parameter('DNI', '46788906');
        // const objParameter = new Parameter('RAZON_SOCIAL', 'ASOCIACION PERUANO JAPONESA');
        const objUtil = new ScrapingUtilMasiva(objParameter, objCallback);
        await page.goto('https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsmulruc/jrmS00Alias');
        await objUtil.onChangeCriterioBusqueda(page);
        await browser.close();

    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    getDataSUNAT,
    getDataSUNATMasiva
}