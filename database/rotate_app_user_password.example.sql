-- Si creó comparador_app con una clave temporal (por ejemplo, 1234), cámbiela.
-- Reemplace el valor de ejemplo por una clave fuerte y local antes de ejecutar.
ALTER USER 'comparador_app'@'localhost'
  IDENTIFIED BY 'PONGA_AQUI_UNA_CLAVE_FUERTE';

-- Actualice DB_PASSWORD en el archivo .env con la misma clave.
