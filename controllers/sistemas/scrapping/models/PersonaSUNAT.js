class PersonaSUNAT {
    DocIdentidad;
    Nombre;
    TipoContribuyente;
    ProfesionOficio;
    NombreComercial;
    CondicionContribuyente;
    EstadoContribuyente;
    FechaInscripcion;
    FechaInicioActividades;
    Departamento;
    Provincia;
    Distrito;
    Direccion;
    Telefono;
    Fax;
    ActividadComercioExterior;
    PrincipalCIIU;
    Secundario1CIIU;
    Secundario2CIIU;
    AfectoNuevoRUS;
    BuenContribuyente;
    AgenteRetencion;
    AgentePercepcionVtaInt;
    AgentePercepcionComLiq;

    constructor(data) {
        this.DocIdentidad = data[0] ? data[0].trim() : '';
        this.Nombre = data[1] ? data[1].trim() : '';
        this.TipoContribuyente = data[2] ? data[2].trim() : '';
        this.ProfesionOficio = data[3] ? data[3].trim() : '';
        this.NombreComercial = data[4] ? data[4].trim() : '';
        this.CondicionContribuyente = data[5] ? data[5].trim() : '';
        this.EstadoContribuyente = data[6] ? data[6].trim() : '';
        this.FechaInscripcion = data[7] ? data[7].trim() : '';
        this.FechaInicioActividades = data[8] ? data[8].trim() : '';
        this.Departamento = data[9] ? data[9].trim() : '';
        this.Provincia = data[10] ? data[10].trim() : '';
        this.Distrito = data[11] ? data[11].trim() : '';
        this.Direccion = data[12] ? data[12].trim() : '';
        this.Telefono = data[13] ? data[13].trim() : '';
        this.Fax = data[14] ? data[14].trim() : '';
        this.ActividadComercioExterior = data[15] ? data[15].trim() : '';
        this.PrincipalCIIU = data[16] ? data[16].trim() : '';
        this.Secundario1CIIU = data[17] ? data[17].trim() : '';
        this.Secundario2CIIU = data[18] ? data[18].trim() : '';
        this.AfectoNuevoRUS = data[19] ? data[19].trim() : '';
        this.BuenContribuyente = data[20] ? data[20].trim() : '';
        this.AgenteRetencion = data[21] ? data[21].trim() : '';
        this.AgentePercepcionVtaInt = data[22] ? data[22].trim() : '';
        this.AgentePercepcionComLiq = data[23] ? data[23].trim() : '';
    }
}

module.exports = { PersonaSUNAT };
