class Establecimiento {
    Codigo;
    Tipo;
    Direccion;
    Actividad;
    DocIdentidad;
    constructor(docIdentidad, codigo, tipo, direccion, actividad) {
        this.Codigo = codigo;
        this.Tipo = tipo;
        this.Direccion = direccion;
        this.Actividad = actividad
        this.DocIdentidad = docIdentidad
    }
    async register() {
        console.log(111);
        
    }
}

module.exports = { Establecimiento };
