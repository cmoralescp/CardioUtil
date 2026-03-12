export class Parameter {
    constructor(tipoBusqueda, valor) {
        this.tipoBusqueda = tipoBusqueda;
        this.valor = valor;
    }
    getListaBotonesIDHTML() {
        return {
            'RUC': '#btnPorRuc',
            'DNI': '#btnPorDocumento',
            'RAZON_SOCIAL': '#btnPorRazonSocial'
        };
    }
    getListaInputIDHTML() {
        return {
            'RUC': '#txtRuc',
            'DNI': '#txtNumeroDocumento',
            'RAZON_SOCIAL': '#txtNombreRazonSocial'
        };
    }
}