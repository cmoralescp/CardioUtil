
export class ScrapingUtilMasiva {
    constructor(objParameter, objCallback) {
        this.assetsPath = objCallback.getFolderPath();
        this.objCallback = objCallback;
        this.objParameter = objParameter;
    }
    async fillInputRUCIndividual(page, inputSelector, valor) {
        await page.waitForSelector(inputSelector, { state: 'visible', timeout: 10000 });
        await page.fill(inputSelector, valor);
    }
    async addListaMultiple(page, botonSelector, valor) {
        if (botonSelector) {
            console.log(`Haciendo clic en el boton añadir con el siguiente valor: ${valor}`);
            // Esperamos a que el botón sea visible antes de clickear
            await page.waitForSelector(botonSelector);
            await page.click(botonSelector);

        } else {
            console.error(`Criterio "${valor}" no agregado.`);
        }
    }
    async sendListaMultiple(page, botonSelector) {
        if (botonSelector) {
            // Esperamos a que el botón sea visible antes de clickear
            await page.waitForSelector(botonSelector);
            await page.click(botonSelector);

        } else {
            console.error(`Criterio no enviado.`);
        }
    }
    async downloadData(page, linkSelector) {
        if (linkSelector) {
            // Esperamos a que el botón sea visible antes de clickear
            await page.waitForSelector(linkSelector);
            const [download] = await Promise.all([
                page.waitForEvent('download'), // Espera a que comience la descarga
                page.click(linkSelector)       // Dispara el clic en el enlace
            ]);
            const rutaFinalZip = this.objCallback.getFinalPathType('zip')
            // 4. Guardamos el archivo desde la memoria temporal a la ruta física
            await download.saveAs(rutaFinalZip);
            console.log(`Archivo ZIP guardado exitosamente en: ${rutaFinalZip}`);
            try {
                const carpetaPadre = this.objCallback.getFinalPathTypeFolder('txt');
                // 3. Descomprimimos directamente en esa carpeta
                const zip = this.objCallback.getAdmZip(rutaFinalZip);
                // 1. Obtener los nombres de los archivos dentro del ZIP
                const entries = zip.getEntries();
                entries.forEach(entry => {
                    console.log(`Archivo a extraer: ${entry.entryName}`);
                });
                zip.extractAllTo(carpetaPadre, true);
                const nombreArchivoExtraido = entries.length > 0 ? entries[0].entryName : null;
                console.log(nombreArchivoExtraido);
                const rutaFinalTXT = carpetaPadre + nombreArchivoExtraido;
                await this.objCallback.registerDatabase(rutaFinalTXT);

                console.log(`Contenido extraído directamente en: ${carpetaPadre}`);
            } catch (zipError) {
                console.error(`Error al descomprimir: ${zipError.message}`);
            }
        } else {
            console.error(`Criterio no descargado.`);
        }
    }
    async onChangeCriterioBusqueda(page) {
        const { tipoBusqueda } = this.objParameter;
        const inputs = this.objParameter.getListaInputIDHTML();
        const botones = this.objParameter.getListaBotonesIDHTML();
        const inputSelector = inputs[tipoBusqueda];
        const botonSelector = botones[tipoBusqueda];
        const botonSelectorSend = botones['ENVIAR'];
        const linkDescargar = botones['DESCARGAR'];

        for (let index = 0; index < this.objParameter.listaRUC.length; index++) {
            const element = this.objParameter.listaRUC[index];
            await this.fillInputRUCIndividual(page, inputSelector, element);
            await this.addListaMultiple(page, botonSelector, element);
            await this.generateScreenShot(page);
        }

        await this.sendListaMultiple(page, botonSelectorSend);
        await this.downloadData(page, linkDescargar);
        await this.generateScreenShot(page);
    }
    async generateScreenShot(page) {
        const finalPath = this.objCallback.getFinalPath()
        await page.screenshot({
            path: finalPath,
            fullPage: true
        });
        console.log(`Screenshot guardado en: ${finalPath}`);
    }
}