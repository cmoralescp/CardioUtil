require("dotenv").config();
const { response, request } = require("express");
const restSql = require('rest-mssql-nodejs')
const emailService = require("../../services/sistemas/operaciones/emailService");
const excelService = require("../../services/sistemas/operaciones/excelService");
const office365Service = require("../../services/sistemas/operaciones/office365Service");
const AdmZip = require("adm-zip");
const { getDataSUNAT, getDataSUNATMasiva } = require("./scrapping/scrapping");

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
