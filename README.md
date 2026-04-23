# CardioUtil

Se usara PM2

npm install -g pm2

pm2 start app.js --name cardio-util-api -- 4040

pm2 restart cardio-util-api

pm2 delete cardio-util-api
pm2 delete 0

pm2 save
pm2 startup

pm2 logs cardio-util-api



Creacion de contenedor pero no funciona el video balanceador porque no muestra ip de cliente, limitacion de Docker

Situación	                Comando a usar
Cambios en código JS	    Nada. Solo guarda el archivo y espera el reinicio automático. (-d para Ejecutar en segundo plano: Si no quieres ver los logs constantes)
Nueva librería instalada	docker-compose up --build -d (para actualizar node_modules). (-d para Ejecutar en segundo plano: Si no quieres ver los logs constantes)
Cambio en el .env	        docker-compose up -d (necesita recargar las variables).
Detener todo	            Ctrl + C en la terminal.



1.- si vamos a crear el contenedor y tambien en el caso de nuevas  variables que necesita recargar
docker-compose up -d

2.- si vamos a actualizar node_modules, en el caso de nueva libreria instalada
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

3.- los cambios en nuestro codigo se sincronizar automaticamente con el contendor, pero para reiniciar el contendor y se ejecute nuevamente el servidor usar:
docker-compose restart cardio-util



Para la coenxion con la base de datos, se agrego lo siguiente:

this.#pool = new mssql.ConnectionPool({
    user: this.#dbConfig.user,
    password: this.#dbConfig.password,
    server: this.#dbConfig.server,
    database: this.#dbConfig.database,
    port: this.#dbConfig.port ? this.#dbConfig.port : 1433,
    options: {
        encrypt: this.#dbConfig.encrypt ? this.#dbConfig.encrypt : false
    },
    requestTimeout: 0           //ESTA LINEA SE AGREGO AL INDEX DE LA LIBRERIA PORQUE NO SOPORTE EL requestTimeout MAYOR A 15000
});



