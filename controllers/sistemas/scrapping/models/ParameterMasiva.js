export class ParameterMasiva {
    constructor(tipoBusqueda, valor) {
        this.tipoBusqueda = tipoBusqueda;
        this.listaRUC = valor;
    }
    getListaBotonesIDHTML() {
        return {
            'RUC': 'button:has-text("Añadir")',
            'ENVIAR': 'button:has-text("Enviar")',
            'DESCARGAR': 'a[href*="descargaArchivoAlias"]:has-text("RM")',
        };
    }
    getListaInputIDHTML() {
        return {
            'RUC': '#txtRuc',
        };
    }
}