const emailService = require("../../services/sistemas/operaciones/emailService");
const excelService = require("../../services/sistemas/operaciones/excelService");
const office365Service = require("../../services/sistemas/operaciones/office365Service");
// Simulación de lógica de negocio
exports.getDetalleBuzon = async (req, res) => {
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
          `- ${user.userPrincipalName}: ${
            user.mailboxUsagePercentage !== "N/A"
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
      process.exit(1);
    } else {
      console.log(
        "No se encontraron buzones de correo o no se pudo obtener su información."
      );
    }
  } catch (error) {
    console.error("Fallo la ejecución principal:", error);
  }
};
