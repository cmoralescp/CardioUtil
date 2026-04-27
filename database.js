const mongoose = require('mongoose')

mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/operaciones-ti', {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,

    // serverSelectionTimeoutMS: Tiempo máximo para encontrar el servidor (60s)
    serverSelectionTimeoutMS: 5000,
    // socketTimeoutMS: Aumentado a 120,000ms (2 min) para evitar cortes en COLLSCAN largos
    socketTimeoutMS: 30000, //120000,         
    // connectTimeoutMS: Tiempo de espera para la conexión inicial (60s)
    connectTimeoutMS: 5000,
    // maxPoolSize: Permite manejar más consultas simultáneas sin encolar procesos
    maxPoolSize: 20, //15,
    // minPoolSize: Mantiene conexiones calientes para una respuesta más rápida
    minPoolSize: 5, //2,
    // keepAlive: Mantiene la conexión activa para evitar re-conexiones costosas
    // keepAlive: true,
    keepAliveInitialDelay: 300000
})
    .then(db => console.log('Database is connected'))
    .catch(err => console.log('error: ' + err));

module.exports = { mongoose };