
export class ScrapingUtil {
    constructor(objParameter, objCallback) {
        this.assetsPath = objCallback.getFolderPath();
        this.objCallback = objCallback;
        this.objParameter = objParameter;
    }
    async onChangeCriterioBusqueda(page) {
        const { tipoBusqueda } = this.objParameter;
        const botones = this.objParameter.getListaBotonesIDHTML();
        const selector = botones[tipoBusqueda];
        if (selector) {
            console.log(`Haciendo clic en el criterio: ${tipoBusqueda}`);
            // Esperamos a que el botón sea visible antes de clickear
            await page.waitForSelector(selector);
            await page.click(selector);
            await this.fillFormularioInicialYBuscar(page);
        } else {
            console.error(`Criterio "${tipoBusqueda}" no reconocido.`);
        }
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