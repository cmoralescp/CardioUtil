require("dotenv").config();
const { response, request } = require("express");
const restSql = require('rest-mssql-nodejs')
const emailService = require("../../services/sistemas/operaciones/emailService");
const excelService = require("../../services/sistemas/operaciones/excelService");
const office365Service = require("../../services/sistemas/operaciones/office365Service");
const AdmZip = require("adm-zip");
const { getDataSUNAT, getDataSUNATMasiva } = require("./scrapping/scrapping");
const connectionNetworkService = require("../../services/sistemas/operaciones/connectionNetwork");
const Dedicado = require("../../models/Dedicado");

const DB_CP = new (restSql)({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_CP,
  database: process.env.DB_DATABASE,
  requestTimeout: 300000,
})
const DB_CE = new (restSql)({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_CE,
  database: process.env.DB_DATABASE,
  requestTimeout: 300000,
})
const getConexion = (empresa) => {
  if (empresa == 'CP') {
    return DB_CP
  } else if (empresa == 'CE') {
    return DB_CE
  } else if (empresa == 'OM') {
    return DB_OM;
  }
}
const createZipAttachment = async (data) => {
  const zip = new AdmZip();
  const keys = Object.keys(data);
  const buffers = await Promise.all(
    keys.map(key => excelService.saveBuffer(data[key], key))
  );
  buffers.forEach((buffer, index) => {
    const fileName = `${keys[index]}.xlsx`;
    zip.addFile(fileName, buffer);
  });
  return zip.toBuffer();
};
// Simulación de lógica de negocio
exports.getDetalleBuzon = async (req = request, res = response) => {
  try {
    const mailboxesAll = await office365Service.listUsersAndMailboxInfo();
    const mailboxes = mailboxesAll.filter(
      (mb) => mb.quotaFormatted_GB !== "N/A"
    );
    console.log("\n--- Información de Buzones y Mensajes ---");
    if (mailboxes.length > 0) {
      //   excelService.exportJSONArrayToExcel(mailboxes, "mailboxes", "Buzones");
      //   console.log("Información exportada a 'data/mailboxes.xlsx'");
      const excelBuffer = await excelService.saveBuffer(mailboxes);
      const attachments = {
        filename: "reporte.xlsx",
        content: excelBuffer,
      };
      console.log("\nResumen de porcentaje de uso de buzones:");
      mailboxes.forEach((user) => {
        console.log(
          `- ${user.userPrincipalName}: ${user.mailboxUsagePercentage !== "N/A"
            ? user.mailboxUsagePercentage + "%"
            : "N/A"
          }`
        );
      });
      console.log("Información enviada satisfactoriamente.");
      await emailService.send(
        "sistemas@cardioperfusion.com",
        // "sistemas@cardioperfusion.com",
        "Detalle de tamaño de Buzones",
        "Informacion generada automaticamente consumiendo API Office 365",
        attachments
      );
      //   process.exit(1);
      res.end();
    } else {
      console.log(
        "No se encontraron buzones de correo o no se pudo obtener su información."
      );
    }
  } catch (error) {
    console.error("Fallo la ejecución principal:", error);
  }
};
//http://localhost:4040/api/v1/sistemas/operaciones/getDataERI?empresa=CP&anio=2025&mesInicio=1&mesFin=12
exports.getDataERI = async (req = request, res = response) => {
  try {
    req.setTimeout(500000);
    const { empresa, anio, mesInicio, mesFin } = req.query;
    if (!empresa || !anio || !mesInicio || !mesFin) {
      return res.status(400).json("Parametros insuficientes");
    }
    if (!['CP', 'CE'].includes(empresa)) {
      return res.status(400).json("Empresa no registra datos");
    }
    const parametros = { anio, mesInicio, mesFin };
    const con = await getConexion(empresa);
    const getDataResult = (result) => result.data && result.data.length > 0 ? result.data[0] : [];
    let data = {};
    data["Ventas_CostoVentas"] = getDataResult(await con.executeStoredProcedure('pDC_DataERI_Ventas_CostoVentas', null, parametros));
    data["Gastos"] = getDataResult(await con.executeStoredProcedure('pDC_DataERI_Gastos', null, parametros));
    data["CuentasCostos"] = getDataResult(await con.executeStoredProcedure('pDC_DataERI_CuentasCostos', null, parametros));
    let dataCuentasEspecialesResumen = getDataResult(await con.executeStoredProcedure('pDC_DataERI_CuentasEspecialesResumen', null, parametros));
    let dataCuentasEspecialesDetalle = getDataResult(await con.executeStoredProcedure('pDC_DataERI_CuentasEspecialesDetalle', null, parametros));
    for (let index = 0; index < dataCuentasEspecialesResumen.length; index++) {
      const element = dataCuentasEspecialesResumen[index];
      const abonoDetalle = dataCuentasEspecialesDetalle.filter(item => item.Cuenta === element.Cuenta && item.Tipo === 'Abono');
      const cargoDetalle = dataCuentasEspecialesDetalle.filter(item => item.Cuenta === element.Cuenta && item.Tipo === 'Cargo');
      // element["AbonoDetalle"] = abonoDetalle;
      // element["CargoDetalle"] = cargoDetalle;
      element["TotalAbono"] = abonoDetalle.reduce((acumulador, objeto) => acumulador + (objeto.Cantidad * objeto.CostoUnitario), 0);
      element["TotalCargo"] = cargoDetalle.reduce((acumulador, objeto) => acumulador + (objeto.Cantidad * objeto.CostoUnitario), 0);
      element["DiferenciaAbono"] = element.Abono - element["TotalAbono"];
      element["DiferenciaCargo"] = element.Cargo - element["TotalCargo"];
    }
    data["CuentasEspecialesResumen"] = dataCuentasEspecialesResumen;
    data["CuentasEspecialesDetalle"] = dataCuentasEspecialesDetalle;
    const attachmentBuffer = await createZipAttachment(data);
    const attachments = {
      filename: "data.zip",
      content: attachmentBuffer,
      contentType: 'application/zip'
    };
    const dataFormat = {
      sender: "cesar.morales@cardioperfusion.com",
      message: "Informacion generada automaticamente",
      mesString: (mes) => mes.length === 1 ? `0${mes}` : mes,
      getAsunto: (queryParameters) => {
        let asunto = `Detalle ERI `;
        asunto += `${empresa === 'CE' ? 'Cardio Equipos' : 'Cardio Perfusion'}`
        asunto += ` - Ejercicio: ${queryParameters.anio}`
        asunto += ` - Periodo: ${dataFormat.mesString(queryParameters.mesInicio)} al ${dataFormat.mesString(queryParameters.mesFin)}`
        return asunto;
      }
    };
    await emailService.send(
      dataFormat.sender,
      dataFormat.getAsunto(req.query),
      dataFormat.message,
      attachments
    );
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
}
//http://localhost:4040/api/v1/sistemas/operaciones/getDataClienteSUNAT
exports.getDataClienteSUNAT = async (req = request, res = response) => {
  await getDataSUNAT();
  return res.status(200).json({ message: 'ok' });
}
//http://localhost:4040/api/v1/sistemas/operaciones/getDataClienteSUNATMasiva
exports.getDataClienteSUNATMasiva = async (req = request, res = response) => {
  await getDataSUNATMasiva();
  return res.status(200).json({ message: 'ok' });
}
//http://localhost:4040/api/v1/sistemas/operaciones/getVideoBalanceadorLink
exports.getVideoBalanceadorLink = async (req = request, res = response) => {
  const { dataURLMiraflores, dataURLLurin, dataURLPorDefecto } = req.query;
  if (!dataURLMiraflores || !dataURLLurin || !dataURLPorDefecto) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
  }
  const ipClienteRequest = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const ipCliente = ipClienteRequest.includes(',') ? ipClienteRequest.split(',')[0].trim() : ipClienteRequest;
  const ipClienteRegex = ipCliente.match(/(\d+\.\d+\.\d+\.\d+)/)?.[0] || ipCliente;
  let url = dataURLPorDefecto;
  if (ipClienteRegex.includes('192.168.100')) {
    url = dataURLMiraflores;
  } else if (ipClienteRegex.includes('192.168.200')) {
    url = dataURLLurin;
  }
  return res.status(200).json({ urlListData: url });
}
//http://localhost:4040/api/v1/sistemas/operaciones/validaConexion
//http://localhost:4040/api/v1/sistemas/operaciones/validaConexion?mostrarSoloConexionesCaidas=1
exports.validaConexion = async (req, res) => {
  // Captura de parámetro de filtro (si es 1 muestra todo, si no, solo caídas)
  const mostrarTodo = req.query.mostrarSoloConexionesCaidas && req.query.mostrarSoloConexionesCaidas === '1' ? false : true;
  // let listaIP = [
  //   {
  //     "ip": "10.10.21.18",
  //     "sede": "CIRION",
  //     "validaPuertos": true,
  //     "puertos": [7080]
  //   },
  //   {
  //     "ip": "10.10.21.50",
  //     "sede": "CIRION",
  //     "validaPuertos": true,
  //     "puertos": [7080]
  //   },
  //   {
  //     "ip": "192.168.100.15",
  //     "sede": "CIRION",
  //     "validaPuertos": true,
  //     "puertos": [5000, 27017]
  //   },
  //   {
  //     "ip": "192.100.200.1",
  //     "sede": "LURIN"
  //   }
  // ];
  // Ejecutar directament en MongoDB para subir la data, solo lo he puesto aqui como referencia
  //db.dedicados.insertMany(listaIP)

  const listaIP = await Dedicado.find().lean();

  try {
    let filasExcel = [];

    for (const item of listaIP) {
      const estadoICMP = await connectionNetworkService.testICMP(item.ip);
      if (item.validaPuertos && Array.isArray(item.puertos)) {
        // Generar una fila por cada puerto
        for (const p of item.puertos) {
          const estadoPuerto = await connectionNetworkService.testPort(item.ip, p);
          filasExcel.push({
            IP: item.ip,
            SEDE: item.sede,
            CONEXION: estadoICMP,
            PUERTO_ESTADO: `Puerto ${p}: ${estadoPuerto}`,
            _esCaida: estadoICMP === 'FALLIDA' || estadoPuerto.includes('CERRADO')
          });
        }
      } else {
        // Fila única si no valida puertos
        filasExcel.push({
          IP: item.ip,
          SEDE: item.sede,
          CONEXION: estadoICMP,
          PUERTO_ESTADO: '',
          _esCaida: estadoICMP === 'FALLIDA'
        });
      }
    }

    // Filtrado lógico
    const resultadoFinal = mostrarTodo
      ? filasExcel
      : filasExcel.filter(f => f._esCaida);

    let dataLimpia = [];

    if (resultadoFinal.length > 0) {
      // Limpiamos la propiedad auxiliar de control antes de enviar
      dataLimpia = resultadoFinal.map(({ _esCaida, ...resto }) => resto);
  
      const excelBuffer = await excelService.saveBuffer(dataLimpia);
      const attachments = {
        filename: "reporte.xlsx",
        content: excelBuffer,
      };
      const dataFormat = {
        sender: process.env.RECEIVER_VALIDATION_EQUIPOS_DEDICADOS,
        message: "Informacion generada automaticamente",
        mesString: (mes) => mes.length === 1 ? `0${mes}` : mes,
        getAsunto: () => {
          let asunto = `Validacion de conexion - ${new Date().toLocaleDateString()} ${mostrarTodo ? '(Mostrando todo)' : '(Solo caídas)'}`;
          asunto += ` - Data de conexion de equipos`
          return asunto;
        }
      };
      await emailService.send(
        dataFormat.sender,
        dataFormat.getAsunto(),
        dataFormat.message,
        attachments
      );
    }

    res.json(dataLimpia);

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el proceso de validación' });
  }
};