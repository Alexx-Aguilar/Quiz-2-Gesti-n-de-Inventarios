# Guion de demo y presentación

## Demo de hasta 5 minutos

1. **0:00–0:40:** Abrir dashboard y aclarar que precios y fuentes son simulados.
2. **0:40–1:40:** Mostrar cemento, varilla, block y arena; explicar código interno y orden ascendente.
3. **1:40–2:30:** Consultar `GET /api/products/MAT-CEM-GRIS-50KG/compare`.
4. **2:30–3:30:** Cambiar temporalmente precio del cemento Novex de 6250 a 6700 en JSON. Pulsar **Actualizar precios**: debe aparecer variación +7,2 % (umbral 5 %) y conservarse el historial.
5. **3:30–4:20:** Restaurar 6250, actualizar y mostrar alerta de descenso y nueva captura.
6. **4:20–5:00:** Explicar registro de fallas por fuente y que no se consultan tiendas reales.

## Exposición de 10 minutos

1. Problema: compras dispersas y gasto sin taxonomía (1 min).
2. Hallazgos: ₡89 000 de ahorro potencial en A2; ₡223 000 de sobreprecio en A3 y posible duplicidad pendiente (2 min).
3. Matriz y recomendación de dos proveedores (1 min).
4. Arquitectura, tablas, equivalencias e histórico (2 min).
5. Demo del dashboard y alerta (3 min).
6. Limitaciones y siguiente paso: fuentes reales autorizadas (1 min).

## Preparación del equipo

- Instalar Node.js 20+, ejecutar `npm install` y `npm start`.
- Antes de la demo, ejecutar `database/mysql_setup.sql` desde MySQL Workbench y configurar la cuenta local en `.env`.
- Probar la alerta y restaurar el JSON de origen después de la demostración.
- Completar integrantes en `Informe.md`.
- Grabar demo y preparar diapositivas siguiendo el guion.
- Cada integrante debe explicar código normalizado, histórico, umbral y errores.
