const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { Parameter } = require('./models/Parameter');
const { ScrapingUtil } = require('./models/ScrapingUtil');
const { Establecimiento } = require('./models/Establecimiento');
const ClienteDataSUNAT = require('./ClienteDataSUNAT');
const { ScrapingUtilMasiva } = require('./models/ScrapingUtilMasiva');
const { ParameterMasiva } = require('./models/ParameterMasiva');

const objCallback = {
    getFolderPath(folderName = 'assets') {
        return path.resolve(__dirname, folderName);
    },
    getFinalPath(customName = '') {
        const folderPath = this.getFolderPath() ;
        const timestamp = Date.now();
        const fileName = customName ? `${customName}_${timestamp}.png` : `screenshot_${timestamp}.png`;
        return path.join(folderPath, '\\images\\' + fileName);
    },
    getFinalPathZip(customName = '') {
        const folderPath = this.getFolderPath();
        const timestamp = Date.now();
        const fileName = customName ? `${customName}_${timestamp}.zip` : `download_${timestamp}.zip`;
        return path.join(folderPath, '\\zip\\' + fileName);
    },

    async registerDatabase(dataArrayJSON, filtroValor) {
        try {
            const registros = dataArrayJSON.map(item => new Establecimiento(filtroValor, item.codigo, item.tipo, item.direccion, item.actividad));
            console.log(registros);

            console.log(`Guardando ${registros.length} registros en la base de datos...`);

            // Inserción masiva
            await ClienteDataSUNAT.bulkCreate(registros);

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