const express = require("express");
const router = express.Router();

const rutasOperaciones = require("./sistemas/operaciones");

// Definimos los prefijos
router.use("/sistemas/operaciones", rutasOperaciones);

module.exports = router;
