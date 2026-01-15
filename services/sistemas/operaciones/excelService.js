require("dotenv").config();
const XLSX = require("xlsx");
const excelService = {
  exportJSONArrayToExcel: async (jsonArray, title, sheetName) => {
    if (!title) {
      title = "data";
    }
    if (!sheetName) {
      sheetName = "Hoja1";
    }
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(jsonArray);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, "data/" + title + ".xlsx");
  },
  parseCSV: (csvString) => {
    const lines = csvString.trim().split("\n");
    if (lines.length === 0) {
      return [];
    }

    const headers = lines[0]
      .split(",")
      .map((header) => header.trim().replace(/"/g, ""));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length !== headers.length) {
        console.warn(
          `La fila ${
            i + 1
          } tiene un número de columnas diferente al de los encabezados. Se saltará o se procesará parcialmente.`
        );
        continue;
      }
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j].trim().replace(/"/g, "");
      }
      data.push(row);
    }
    return data;
  },
  saveBuffer: (JSONArray, title = "Reporte") => {
    return new Promise((resolve, reject) => {
      try {
        const libro = XLSX.utils.book_new();
        const hoja = XLSX.utils.json_to_sheet(JSONArray);
        XLSX.utils.book_append_sheet(libro, hoja, title);
        const excelBuffer = XLSX.write(libro, {
          type: "buffer",
          bookType: "xlsx",
        });
        resolve(excelBuffer);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = excelService;
