require("dotenv").config();

const { ConfidentialClientApplication } = require("@azure/msal-node");
const axios = require("axios");
const excelService = require("./excelService");

const office365Service = {
  getConfidential: async () => {
    return new Promise((resolve, reject) => {
      try {
        const OFFICE365SERVICE_TENANT_ID = process.env.OFFICE365SERVICE_TENANT_ID;
        const OFFICE365SERVICE_CLIENT_ID = process.env.OFFICE365SERVICE_CLIENT_ID;
        const OFFICE365SERVICE_CLIENT_SECRET = process.env.OFFICE365SERVICE_CLIENT_SECRET;

        if (!OFFICE365SERVICE_TENANT_ID || !OFFICE365SERVICE_CLIENT_ID || !OFFICE365SERVICE_CLIENT_SECRET) {
          resolve(null);
        }
        const AUTHORITY = `https://login.microsoftonline.com/${OFFICE365SERVICE_TENANT_ID}`;
        const msalConfig = {
          auth: {
            clientId: OFFICE365SERVICE_CLIENT_ID,
            authority: AUTHORITY,
            clientSecret: OFFICE365SERVICE_CLIENT_SECRET,
          },
        };
        const cca = new ConfidentialClientApplication(msalConfig);
        resolve(cca);
      } catch (error) {
        reject(error);
      }
    });
  },
  getAccessToken: async () => {
    try {
      const confidential = await office365Service.getConfidential();
      if (!confidential) {
        console.error(
          "Error: Las variables de entorno OFFICE365SERVICE_TENANT_ID, OFFICE365SERVICE_CLIENT_ID y OFFICE365SERVICE_CLIENT_SECRET no están configuradas en el archivo .env."
        );
        console.error(
          "Asegúrate de crear un archivo .env en la raíz de tu proyecto con estos valores."
        );
        process.exit(1);
      }

      const GRAPH_SCOPES = ["https://graph.microsoft.com/.default"];
      const result = await confidential.acquireTokenByClientCredential({
        scopes: GRAPH_SCOPES,
      });
      return result.accessToken;
    } catch (error) {
      console.error("Error al obtener el token de acceso:", error.message);
      throw error;
    }
  },
  getMailboxDetails: async (userId, accessToken) => {
    const userDetailsUrl = `https://graph.microsoft.com/v1.0/users/${userId}?$select=mail,mailboxSettings,displayName,userPrincipalName`;
    const inboxInfoUrl = `https://graph.microsoft.com/v1.0/users/${userId}/mailFolders/Inbox?$select=unreadItemCount`;

    let userDetails = {
      displayName: "N/A",
      userPrincipalName: "N/A",
      mail: "N/A",
    };
    let unreadCount = "N/A";

    try {
      const userResponse = await axios.get(userDetailsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      userDetails = userResponse.data;

      try {
        const inboxResponse = await axios.get(inboxInfoUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        if (
          inboxResponse.data &&
          typeof inboxResponse.data.unreadItemCount === "number"
        ) {
          unreadCount = inboxResponse.data.unreadItemCount;
        }
      } catch (inboxError) {
        if (inboxError.response) {
          if (
            inboxError.response.status === 400 &&
            inboxError.response.data.error.code ===
              "MailboxNotEnabledForRESTAPI"
          ) {
            console.warn(
              `      Advertencia: Buzón de ${
                userDetails.userPrincipalName || userId
              } no habilitado para la API REST (puede ser local o inactivo). No se obtendrá el conteo de no leídos.`
            );
          } else if (inboxError.response.status === 404) {
            console.warn(
              `      Advertencia: La bandeja de entrada del usuario ${
                userDetails.userPrincipalName || userId
              } no se encontró.`
            );
          } else if (inboxError.response.status === 403) {
            console.warn(
              `      Advertencia: Acceso denegado al conteo de no leídos para ${
                userDetails.userPrincipalName || userId
              }. Verifique permiso Mail.Read.All. Detalles:`,
              inboxError.response.data.error.message
            );
          } else {
            console.error(
              `      Error al obtener conteo de no leídos para ${
                userDetails.userPrincipalName || userId
              }:`,
              inboxError.response
                ? inboxError.response.data
                : inboxError.message
            );
          }
        } else {
          console.error(
            `      Error desconocido al obtener conteo de no leídos para ${
              userDetails.userPrincipalName || userId
            }:`,
            inboxError.message
          );
        }
      }

      return {
        userDetails,
        unreadCount,
      };
    } catch (error) {
      if (error.response) {
        if (
          error.response.status === 400 &&
          error.response.data.error.code === "MailboxNotEnabledForRESTAPI"
        ) {
          console.warn(
            `Advertencia: Buzón del usuario ${userId} no habilitado para la API REST (puede ser local o inactivo). No se obtendrán detalles del buzón.`
          );
          return {
            userDetails: {
              displayName: "N/A",
              userPrincipalName: userId,
              mail: "N/A",
            },
            unreadCount: "N/A",
          };
        } else if (error.response.status === 404) {
          console.warn(
            `Advertencia: Usuario con ID ${userId} no tiene un buzón o no se encontró.`
          );
          return null;
        } else if (
          error.response.status === 403 &&
          error.response.data.error &&
          error.response.data.error.code === "ErrorAccessDenied"
        ) {
          console.error(
            `Error de acceso denegado para usuario ${userId} (probablemente MailboxSettings.Read.All o User.Read.All). Detalles:`,
            error.response.data.error.message
          );
          return null;
        }
      }
      console.error(
        `Error al obtener info de buzón (general) para el usuario ${userId}:`,
        error.response ? error.response.data : error.message
      );
      return null;
    }
  },
  getMailboxUsageReports: async (accessToken) => {
    const reportUrl = `https://graph.microsoft.com/v1.0/reports/getMailboxUsageDetail(period='D7')`;
    const mailboxUsageData = new Map();

    try {
      const response = await axios.get(reportUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "text/csv, application/json",
        },
      });

      let reportData;
      if (
        typeof response.data === "string" &&
        response.data.includes("User Principal Name")
      ) {
        console.warn("La API de informes devolvió un string CSV. Parseando...");
        reportData = excelService.parseCSV(response.data);
      } else if (response.data && Array.isArray(response.data.value)) {
        reportData = response.data.value;
      } else {
        console.error(
          "Formato de respuesta inesperado de la API de informes:",
          response.data
        );
        return new Map();
      }

      // --- AÑADIDO PARA DEPURACIÓN ---
      if (reportData && reportData.length > 0) {
        console.log(
          "\n--- Primeros 5 entries del Reporte de Uso de Buzones ---"
        );
        for (let i = 0; i < Math.min(5, reportData.length); i++) {
          console.log(
            `Entry ${i}: "User Principal Name" = ${reportData[i]["User Principal Name"]}`
          );
          console.log(
            `Entry ${i}: "Storage Used (Byte)" = ${reportData[i]["Storage Used (Byte)"]}`
          );
          console.log(
            `Entry ${i}: "Prohibit Send/Receive Quota (Byte)" = ${reportData[i]["Prohibit Send/Receive Quota (Byte)"]}`
          );
          // También verifica si tiene una propiedad 'key' en el nivel superior si estuviera en JSON directo
          if (reportData[i].key) {
            console.log(`Entry ${i}: key = ${reportData[i].key}`);
          }
        }
        console.log("---------------------------------------------------\n");
      }
      // --- FIN AÑADIDO PARA DEPURACIÓN ---

      if (reportData && reportData.length > 0) {
        reportData.forEach((entry) => {
          // Acceso directo al nombre de la columna CSV
          const upn = entry["User Principal Name"]; // Esta es la clave que estamos usando en el Map

          // Verifica si la propiedad existe y si tiene un valor que no sea un ID codificado
          // Suponemos que un UPN real contendrá un '@' (ej. user@domain.com)
          // Y si no lo tiene, intentamos usar el Display Name o buscar una mejor forma de mapear.
          let keyToUse = upn;

          // Si el "User Principal Name" del reporte NO es un UPN real (no contiene '@'),
          // entonces esto indica que el reporte está dando IDs codificados.
          // En tu imagen, 'key' es el ID codificado. Y 'User Principal Name' en el reporte también es el ID codificado.
          // Esto sugiere que los UPNs reales no están en esta columna del reporte.
          // Si tienes una forma de mapear ese ID a un userPrincipalName real (email), hazlo aquí.
          // Por ahora, asumiremos que los 'userPrincipalName' del reporte son los IDs que se usan como clave en el Map.
          // Si necesitas un mapeo, aquí es donde lo implementarías.

          if (
            keyToUse &&
            entry["Storage Used (Byte)"] !== undefined &&
            entry["Prohibit Send/Receive Quota (Byte)"] !== undefined
          ) {
            const currentEntryDate = new Date(entry["Report Refresh Date"]);

            if (
              !mailboxUsageData.has(keyToUse) ||
              currentEntryDate >
                mailboxUsageData.get(keyToUse).reportRefreshDate
            ) {
              mailboxUsageData.set(keyToUse, {
                reportRefreshDate: currentEntryDate,
                storageUsed: entry["Storage Used (Byte)"],
                quota: entry["Prohibit Send/Receive Quota (Byte)"],
              });
            }
          }
        });
      }
      return mailboxUsageData;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.error(
          `Error de acceso denegado al obtener informes de uso de buzones. ` +
            `Asegúrate de que la aplicación tenga el permiso 'Reports.Read.All' concedido por un administrador. Detalles:`,
          error.response.data.error.message
        );
      } else {
        console.error(
          `Error al obtener informes de uso de buzones:`,
          error.response ? error.response.data : error.message
        );
      }
      return new Map();
    }
  },
  getFormatBytes: (bytes) => {
    if (bytes === 0) return "0 GB"; // Si es 0 bytes, muestra 0 GB
    if (bytes === null || typeof bytes === "undefined" || isNaN(bytes))
      return "N/A";

    const gb = bytes / (1024 * 1024 * 1024); // Convertir directamente a GB
    const dm = 2; // Decimal places

    return parseFloat(gb.toFixed(dm));
  },
  listUsersAndMailboxInfo: async () => {
    let users = [];
    let nextLink =
      "https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName";

    try {
      const accessToken = await office365Service.getAccessToken();

      while (nextLink) {
        const response = await axios.get(nextLink, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        users = users.concat(response.data.value);
        nextLink = response.data["@odata.nextLink"];
      }

      console.log(
        `Se encontraron ${users.length} usuarios. Obteniendo detalles de buzón y mensajes no leídos...`
      );

      const mailboxUsageDataMap = await office365Service.getMailboxUsageReports(
        accessToken
      );
      if (mailboxUsageDataMap.size === 0) {
        console.warn(
          "No se pudieron obtener datos de uso de buzones de los informes. " +
            "La información de porcentaje de uso será 'N/A'. " +
            "Asegúrate de tener el permiso 'Reports.Read.All' concedido por un administrador."
        );
      }

      const mailboxDetails = [];

      const mailboxPromises = users.map(async (user) => {
        if (user.userPrincipalName) {
          const details = await office365Service.getMailboxDetails(user.id, accessToken);

          if (details) {
            let mailboxUsagePercentage = "N/A";
            let totalUsedFormatted = "N/A";
            let quotaFormatted = "N/A";

            // --- CAMBIO CLAVE AQUÍ: La clave de búsqueda en mailboxUsageDataMap ---
            // Si el "User Principal Name" del reporte es un ID (como en tu imagen de depuración),
            // entonces user.userPrincipalName (el email) NO coincidirá.
            // Necesitamos que ambas claves (la del Map y la de búsqueda) sean iguales.
            // Para depurar, vamos a intentar buscar por el userPrincipalName.
            // Si el reporte de uso NO te da UPNs reales, esta parte seguirá fallando.
            // La solución final dependerá de si podemos obtener el UPN real en el reporte,
            // o si necesitamos un mapeo de ID a UPN.
            const usageReportEntry = mailboxUsageDataMap.get(
              user.userPrincipalName
            );

            if (usageReportEntry) {
              const storageUsedBytes = parseInt(
                usageReportEntry.storageUsed,
                10
              );
              const quotaBytes = parseInt(usageReportEntry.quota, 10);

              totalUsedFormatted = office365Service.getFormatBytes(storageUsedBytes);
              quotaFormatted = office365Service.getFormatBytes(quotaBytes);

              if (
                !isNaN(storageUsedBytes) &&
                !isNaN(quotaBytes) &&
                quotaBytes > 0
              ) {
                mailboxUsagePercentage = (storageUsedBytes / quotaBytes) * 100;
              } else {
                console.warn(
                  `      Advertencia: No se pudo calcular el porcentaje de uso para ${user.userPrincipalName}. ` +
                    `Valores (Bytes): Usado=${storageUsedBytes}, Cuota=${quotaBytes}.`
                );
              }
            } else {
              console.warn(
                `      Advertencia: No se encontraron datos de uso de buzón en los informes para el UPN: ${user.userPrincipalName}.`
              );
            }

            return {
              displayName: details.userDetails.displayName,
              userPrincipalName: details.userDetails.userPrincipalName,
              email: details.userDetails.mail || "N/A",
              unreadCount: details.unreadCount,
              mailboxUsagePercentage:
                mailboxUsagePercentage !== "N/A"
                  ? parseFloat(mailboxUsagePercentage.toFixed(2))
                  : "N/A",
              storageUsedFormatted_GB: totalUsedFormatted,
              quotaFormatted_GB: quotaFormatted,
            };
          }
        }
        return null;
      });

      const results = await Promise.all(mailboxPromises);
      mailboxDetails.push(...results.filter((mb) => mb !== null));

      return mailboxDetails;
    } catch (error) {
      console.error("Error al procesar usuarios y buzones:", error.message);
      throw error;
    }
  },
};

module.exports = office365Service;
