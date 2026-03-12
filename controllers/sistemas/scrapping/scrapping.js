const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { Parameter } = require('./models/Parameter');
const { ScrapingUtil } = require('./models/ScrapingUtil');
const { Establecimiento } = require('./models/Establecimiento');
const ClienteDataSUNAT = require('./ClienteDataSUNAT');

const objCallback = {
    getFolderPath(folderName = 'assets') {
        return path.resolve(__dirname, folderName);
    },
    getFinalPath(customName = '') {
        const folderPath = this.getFolderPath();
        const timestamp = Date.now();
        const fileName = customName ? `${customName}_${timestamp}.png` : `screenshot_${timestamp}.png`;
        return path.join(folderPath, fileName);
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
const getDataClienteSUNATMasiva = async () => {
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

module.exports = {
    getDataSUNAT,
    getDataClienteSUNATMasiva
}