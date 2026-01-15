# CardioUtil

Situación	                Comando a usar
Cambios en código JS	    Nada. Solo guarda el archivo y espera el reinicio automático. (-d para Ejecutar en segundo plano: Si no quieres ver los logs constantes)
Nueva librería instalada	docker-compose up --build -d (para actualizar node_modules). (-d para Ejecutar en segundo plano: Si no quieres ver los logs constantes)
Cambio en el .env	        docker-compose up -d (necesita recargar las variables).
Detener todo	            Ctrl + C en la terminal.



1.- si vamos a crear el contenedor y tambien en el caso de nuevas  variables que necesita recargar
docker-compose up -d

2.- si vamos a actualizar node_modules, en el caso de nueva libreria instalada
docker-compose up --build -d

3.- los cambios en nuestro codigo se sincronizar automaticamente con el contendor, pero para reiniciar el contendor y se ejecute nuevamente el servidor usar:
docker-compose restart cardio-util




