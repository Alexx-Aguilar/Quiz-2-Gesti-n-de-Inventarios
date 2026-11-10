# Comparador de precios de proveedores

Prototipo para comparar materiales de construcción entre proveedores, conservar cada captura de precio y alertar sobre variaciones.

El dashboard permite buscar y filtrar artículos, ordenar ofertas por precio, revisar diferencias unitarias, consultar el historial de capturas y ver los cambios de precio y errores pendientes de cada fuente. Está diseñado para escritorio y móvil.

## Requisitos y ejecución

Requiere Node.js 24 o superior. La base SQLite usa el módulo integrado `node:sqlite`, por lo que no necesita `better-sqlite3`, compilación C++ ni Visual Studio. Copie `.env.example` a `.env`, ejecute `npm install` y `npm start`. Abra `http://localhost:3000` y pulse **Actualizar precios** para cargar las ofertas iniciales.

## Fuentes y datos

`data/sources/novex.json` y `construplaza.json` contienen catálogos simulados permitidos por la consigna. No se consultan tiendas reales ni se requieren claves. Los precios no son cotizaciones. Antes de integrar fuentes reales, revise sus términos y `robots.txt`, limite las consultas y no evada restricciones.

## API

- `GET /api/products`: catálogo normalizado.
- `GET /api/products/:code/compare`: precio vigente por proveedor, menor a mayor.
- `GET /api/products/:code/history`: historial del artículo.
- `GET /api/alerts`: alertas por variaciones de precio.
- `GET /api/errors`: errores sin resolver de fuentes.
- `GET /api/config`: configuración pública del comparador, incluido el umbral.
- `POST /api/update`: captura ambas fuentes ahora.

Cada actualización agrega registros al histórico. El umbral de alerta se configura con `ALERT_THRESHOLD_PERCENT` (5 % por defecto) y también se muestra en el dashboard. Las fuentes se procesan de manera independiente; un fallo se registra en la base y no detiene la otra fuente. Cuando una fuente se recupera, sus errores abiertos quedan marcados como resueltos y se conservan en la base para auditoría.

Para una actualización recurrente, configure el Programador de tareas de Windows para ejecutar `npm run update` con la frecuencia deseada. La base `data/catalog.db` se crea al iniciar y está excluida de Git.

## Estructura de datos

`products` guarda el catálogo interno; `suppliers` las fuentes; `product_equivalences` relaciona códigos de proveedor con códigos internos; `price_captures` conserva el histórico; `price_alerts` registra variaciones y `source_errors` documenta fallos.

## Demostración

Consulte `Demo_y_presentacion.md` para mostrar el dashboard y provocar una alerta. Puede cambiar temporalmente un precio en el JSON de origen, actualizar y luego restaurarlo.
