require("dotenv").config();
const express = require("express");
const app = express();
const todasLasRutas = require("./routes/index");
const PORT = process.env.SERVER_PORT || 4040;

app.use(express.json()); // Para que el servidor entienda JSON

// Montamos toda la estructura de rutas
app.use("/api/v1", todasLasRutas);

app.listen(PORT, () =>
  console.log(`Servidor modular corriendo en puerto ${PORT}.`)
);
