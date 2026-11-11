# Entrega y evidencias

## Lo que ya está preparado en el repositorio

- Backend Node.js conectado a MySQL con `mysql2`.
- Esquema y datos iniciales para ejecutar en Workbench: `database/mysql_setup.sql`.
- Script de cuenta de aplicación y ejemplo para cambiar una contraseña temporal.
- Consulta de verificación de productos, equivalencias, capturas y alertas.
- Dashboard, fuentes JSON simuladas, informe en Markdown y PDF, modelo de datos, README y guiones de video/exposición.
- Informe individual a nombre de Alex Aguilar López. Complete el carné si el docente lo solicita.

## Capturas recomendadas

La consigna pide un video demo y un repositorio, pero no solicita un paquete separado de capturas. Aun así, guarda estas imágenes como respaldo para el informe, la presentación y la revisión del docente:

1. **Workbench con el esquema:** árbol `comparador_precios` y sus seis tablas creadas.
2. **Datos maestros:** resultado de `SELECT` que muestre los 4 productos y las 8 equivalencias.
3. **Histórico:** resultado de `SELECT` que muestre las capturas de ambos proveedores.
4. **Dashboard funcionando:** catálogo con productos, precios comparados, fecha de actualización y alertas vacías antes de probar el cambio.
5. **Alerta demostrada:** cambiar temporalmente el cemento Novex de `6250` a `6700`, actualizar y capturar la alerta de `+7,2 %`; mostrar también la nueva fila en `price_alerts` desde Workbench.

Usa `database/verification_queries.sql` para obtener resultados legibles. Ejecuta cada consulta por separado y captura el grid que corresponde. No uses capturas que muestren contraseñas.

## Pendiente para entregar

- El informe final, con evidencia de Workbench y del cambio de contraseña (sin mostrar la clave), está en `output/pdf/Informe_Gestion_Inventarios_Alex_Aguilar_Lopez.pdf`.
- Crear el archivo final de diapositivas para la exposición de **10 minutos** usando `Presentacion.md` como guion.
- Grabar el **video demo de máximo 5 minutos**. Debe enseñar el dashboard y una alerta real generada en la base de datos.
- La captura reciente confirma que se ejecutó `ALTER USER` correctamente. No incluya la captura original sin ocultar primero la contraseña.
- Ejecutar la aplicación localmente después de configurar MySQL y revisar que el dashboard se conecte sin errores.
- Grabar el video demo de máximo 5 minutos con la guía de `Demo_y_presentacion.md`.
- Subir la presentación y el video al canal indicado por el docente; el repositorio por sí solo no los entrega automáticamente.
