
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

            // 2. Obtenemos el nombre sugerido por el servidor o usamos uno personalizado
            const nombreArchivo = await download.suggestedFilename();

            // 3. Construimos la ruta final en tu carpeta assets
            const rutaFinal = this.objCallback.getFinalPathZip() //path.join(this.assetsPath, nombreArchivo);

            // 4. Guardamos el archivo desde la memoria temporal a la ruta física
            await download.saveAs(rutaFinal);

            console.log(`Archivo ZIP guardado exitosamente en: ${rutaFinal}`);

            // Opcional: Tomar screenshot de la página después de la descarga
            await this.generateScreenShot(page, 'post_descarga');



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

        // await page.waitForSelector(inputSelector, { state: 'visible', timeout: 10000 });
        // await page.fill(inputSelector, '20131257750');
        // await this.generateScreenShot(page);


    }
    async fillFormularioInicialYBuscar(page) {
        try {
            const { tipoBusqueda, valor } = this.objParameter;
            const inputs = this.objParameter.getListaInputIDHTML();
            const inputSelector = inputs[tipoBusqueda];
            const btnBuscarSelector = '#btnAceptar';
            console.log(`Escribiendo valor: ${valor}`);
            // 1. Aseguramos que el input esté listo y escribimos
            await page.waitForSelector(inputSelector, { state: 'visible', timeout: 10000 });
            await page.fill(inputSelector, valor); // fill es mejor que type para borrar contenido previo
            await this.generateScreenShot(page);
            // 2. Click en Buscar
            console.log("Haciendo clic en Buscar...");
            await page.click(btnBuscarSelector);
            await this.generateScreenShot(page);
            await this.getEstablecimientosAnexos(page);
            await this.generateScreenShot(page);
            const data = await this.getTablaAnexos(page, valor);
            await this.objCallback.registerDatabase(data, valor);
        } catch (error) {
            console.log(error);
        }
    }
    async getEstablecimientosAnexos(page) {
        // Usamos la clase específica del botón que aparece en tu captura
        const btnAnexosSelector = '.btnInfLocAnex';

        try {
            console.log("Haciendo clic en Establecimientos Anexos...");
            await page.waitForSelector(btnAnexosSelector, { state: 'visible' });
            await page.click(btnAnexosSelector);
        } catch (error) {
            console.error("No se pudo hacer clic en el botón de anexos:", error.message);
        }
    }
    async getTablaAnexos(page) {
        console.log("Extrayendo datos de la tabla de establecimientos...");

        // Esperamos a que la tabla esté presente en el DOM
        await page.waitForSelector('table.table', { state: 'visible' });

        const datos = await page.$$eval('table.table tbody tr', (rows) => {
            return rows.map(row => {
                const cells = row.querySelectorAll('td');
                // Solo procesamos si la fila tiene celdas (evita headers o filas vacías)
                if (cells.length >= 3) {
                    return {
                        codigo: cells[0].innerText.trim(),
                        tipo: cells[1].innerText.trim(),
                        direccion: cells[2].innerText.trim(),
                        actividad: cells[3] ? cells[3].innerText.trim() : '-'
                    };
                }
                return null;
            }).filter(item => item !== null); // Limpiamos nulos
        });
        console.log(`Se encontraron ${datos.length} establecimientos.`);
        console.log(datos);
        return datos;
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