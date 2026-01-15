const express = require("express");
const router = express.Router();
const operacionesController = require("../../controllers/sistemas/operacionesController");

// Asociamos URL con la función del controlador
router.get("/getDetalleBuzon", operacionesController.getDetalleBuzon);

module.exports = router;
