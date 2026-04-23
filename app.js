require("dotenv").config();
const express = require("express");
const cors = require('cors');
const app = express();
const todasLasRutas = require("./routes/index");
const PORT = process.env.SERVER_PORT || 4040;

app.use(express.json()); // Para que el servidor entienda JSON

// Configuración simple: permite todo (solo para desarrollo)
app.use(cors());

// O configuración recomendada para producción:
app.use(cors({
  origin: process.env.VIDEO_CLIENT_CORS_ORIGIN, // Tu puerto de Vite/React
  methods: ['GET'],
  credentials: true
}));

// Montamos toda la estructura de rutas
app.use("/api/v1", todasLasRutas);

app.listen(PORT, () =>
  console.log(`Servidor modular corriendo en puerto ${PORT}.`)
);
