-- Ejecutar en Workbench como root/administrador después de mysql_setup.sql.
-- Antes de ejecutar, sustituya PONGA_AQUI_UNA_CLAVE_SEGURA por una clave local fuerte.
CREATE USER IF NOT EXISTS 'comparador_app'@'localhost'
  IDENTIFIED BY 'PONGA_AQUI_UNA_CLAVE_SEGURA';
GRANT SELECT, INSERT, UPDATE ON comparador_precios.* TO 'comparador_app'@'localhost';

-- Use la misma clave en DB_PASSWORD dentro de .env. Nunca suba .env a GitHub.
