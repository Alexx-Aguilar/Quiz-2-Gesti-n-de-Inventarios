# Comparador de precios de proveedores

Dashboard web para comparar materiales entre dos catálogos JSON de demostración, guardar cada captura en MySQL y alertar sobre cambios de precio. El backend es Node.js + Express y la base se administra con MySQL Workbench.

## Requisitos

- Node.js 20 o superior y npm.
- MySQL Server 8.0 o superior en ejecución.
- MySQL Workbench conectado a ese servidor.

Workbench es el cliente gráfico y por sí solo no crea un servidor. Si no aparece una conexión local, instale **MySQL Server** y Workbench con MySQL Installer; durante la configuración conserve el puerto 3306 y deje activo el servicio MySQL.

## Configuración de MySQL Workbench

1. Abra Workbench y conéctese a su servidor local, normalmente `Local instance MySQL80`.
2. Abra `database/mysql_setup.sql` desde **File → Open SQL Script**.
3. Ejecute el script con el botón del rayo. Crea la base `comparador_precios`, las tablas y los cuatro productos normalizados.
4. Cree el usuario de la aplicación. Abra `database/create_app_user.example.sql`, cambie `PONGA_AQUI_UNA_CLAVE_SEGURA` por una contraseña fuerte y ejecute el script como administrador. El usuario recibe solo permisos de lectura, inserción y actualización.
5. Confirme que el esquema `comparador_precios` aparece en el panel **Schemas**.

## Instalar y arrancar la aplicación

Desde la carpeta del proyecto, en PowerShell:

```powershell
Copy-Item .env.example .env
```

Edite `.env` y asegúrese de que `DB_USER` y `DB_PASSWORD` coincidan con el usuario creado en Workbench. Luego ejecute:

```powershell
npm install
npm start
```

`npm install` descarga `mysql2`, un controlador sin complementos nativos, y genera el `package-lock.json` de este proyecto. No requiere Visual Studio ni herramientas de compilación C++.

Abra `http://localhost:3000` y pulse **Actualizar precios**. El comparador cargará las equivalencias desde los JSON, guardará la primera captura en MySQL y mostrará las ofertas.

## Datos de conexión

`.env.example` incluye `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`. Los valores predeterminados esperan MySQL local en el puerto 3306. No escriba claves reales en archivos versionados; `.env` está excluido por `.gitignore`.

## Actualización recurrente

El botón de la página ejecuta una captura inmediata. Para programarlas, cree una tarea de Windows que ejecute `npm run update` desde la carpeta del proyecto con la frecuencia elegida. La tabla `price_captures` conserva todas las lecturas; el umbral configurable está en `ALERT_THRESHOLD_PERCENT` (5 % por defecto). Los errores de una fuente se registran, la otra se sigue procesando y los errores anteriores quedan resueltos cuando la fuente vuelve a funcionar.

## API

- `GET /api/products`: catálogo normalizado.
- `GET /api/products/:code/compare`: precio actual por proveedor, de menor a mayor.
- `GET /api/products/:code/history`: capturas históricas.
- `GET /api/alerts`: variaciones de precio.
- `GET /api/errors`: errores de fuentes sin resolver.
- `GET /api/config`: umbral de alerta.
- `POST /api/update`: actualizar ambas fuentes ahora.

## Fuentes de precios

`data/sources/novex.json` y `construplaza.json` son datos ficticios. No representan cotizaciones reales ni consultan sitios externos. Antes de integrar una tienda real, revise sus términos y `robots.txt`, limite la frecuencia y no evada bloqueos.

## Modelo de datos

`products` contiene artículos internos; `suppliers`, proveedores; `product_equivalences`, códigos externos relacionados con el código interno; `price_captures`, histórico; `price_alerts`, alertas; `source_errors`, fallos y resolución por fuente.
