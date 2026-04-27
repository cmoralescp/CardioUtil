const { model, Schema } = require('mongoose')

const DedicadoSchema = new Schema({
    ip: { type: String, required: true },
    sede: { type: String, required: true },
    validaPuertos: { type: Boolean },
    puertos: { String: Boolean },
    descripcion: { type: String }
});

module.exports = model('Dedicado', DedicadoSchema);