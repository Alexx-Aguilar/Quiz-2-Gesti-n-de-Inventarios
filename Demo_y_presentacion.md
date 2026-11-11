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
- El informe está identificado a nombre de Alex Aguilar López; completar el carné si la entrega lo requiere.
- Grabar demo y preparar diapositivas siguiendo el guion.
- Poder explicar código normalizado, histórico, umbral de alerta y tratamiento de errores.

## Cómo grabar el video demo

1. Actualiza el repo con `git pull origin main`, ejecuta `npm install` y luego `npm start`.
2. Comprueba que MySQL Server esté activo y que el dashboard muestre ofertas. Deja abierto el navegador en `http://localhost:3000`.
3. Prepara el cambio antes de grabar: en `data/sources/novex.json`, cambia solo el precio del cemento de `6250` a `6700`. No edites ni muestres `.env` en pantalla.
4. En Windows, abre **Xbox Game Bar** con `Win + G`, activa el micrófono y graba la pantalla. También puedes iniciar y detener la grabación con `Win + Alt + R`.
5. Narra la demo siguiendo los seis tiempos del inicio de este archivo. Pulsa **Actualizar precios**, explica el aumento de 7,2 %, abre el historial y muestra la fila nueva en `price_captures` y la alerta en `price_alerts` desde Workbench.
6. Detén la grabación antes de los cinco minutos. Revisa que se escuchen la voz y el video y que no aparezcan claves, archivos `.env` ni notificaciones personales.
7. Al terminar, restaura `6250` en el JSON y pulsa actualizar otra vez para dejar la aplicación en estado normal. Guarda el video en MP4 y súbelo por el canal que indique el docente.

La consigna pide el video de demostración, no capturas aparte como entregable. Conviene guardar capturas del dashboard inicial, la alerta y las consultas de Workbench para incluirlas en la exposición o mostrarlas si el docente solicita evidencia.
