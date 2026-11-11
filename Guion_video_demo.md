# Guion para el video demo

**Duración objetivo:** 3:30–4:30 minutos  
**Presenta:** Alex Aguilar López  
**Sistema:** Comparador de precios de materiales · Opción 1

## Antes de grabar

1. En una terminal de VS Code, ejecuta `npm start` y confirma que abre `http://localhost:3000`.
2. Deja abierta la aplicación. Cierra o minimiza ventanas que no usarás y activa No molestar.
3. Confirma que `data/sources/novex.json` contiene el precio inicial `6250` para el cemento.
4. Prepara el cambio a `6700` para la demostración. No abras ni grabes `.env`.
5. Graba con **Xbox Game Bar** (`Win + G`, o `Win + Alt + R`) y comprueba que el micrófono está habilitado. Guarda el MP4.

## Narración y acciones

### 0:00–0:25 · Presentación

**En pantalla:** página principal del comparador.

**Di:** “Hola, soy Alex Aguilar López. En este video presento el sistema de gestión de inventarios y comparación de precios desarrollado para el Quiz 2, opción 1. El proyecto organiza materiales y permite revisar precios de distintos proveedores.”

### 0:25–1:10 · Catálogo y ofertas

**En pantalla:** desplázate por el panel y enfoca los productos y sus precios.

**Di:** “El catálogo usa un código interno para identificar cada material. Las equivalencias relacionan ese producto con el código o la descripción que utiliza cada proveedor. Así se pueden comparar artículos equivalentes y mantener un historial de precios. Los datos que vemos aquí son de ejemplo y no son cotizaciones en tiempo real.”

### 1:10–1:50 · Explicar el flujo

**En pantalla:** muestra el resumen de ofertas y, si está disponible, la sección de historial.

**Di:** “La aplicación está construida con Node.js y Express, y guarda la información en MySQL. Al actualizar, procesa las fuentes de prueba, valida los datos y registra las capturas. Si una variación supera el umbral configurado, se genera una alerta que ayuda a detectar cambios para su revisión.”

### 1:50–3:05 · Provocar y verificar una alerta

**En pantalla:** cambia en `data/sources/novex.json` el cemento de `6250` a `6700`, vuelve al panel y pulsa **Actualizar precios**.

**Di:** “Ahora voy a simular un aumento en el precio del cemento Novex. El precio pasa de seis mil doscientos cincuenta a seis mil setecientos colones. Esto representa un aumento aproximado del siete coma dos por ciento. Como supera el umbral del cinco por ciento, el sistema registra una alerta. También queda guardada una nueva captura para conservar el historial.”

### 3:05–3:45 · Restaurar y cerrar

**En pantalla:** devuelve el precio a `6250`, pulsa **Actualizar precios** y muestra el resultado actualizado.

**Di:** “Para terminar, restauro el precio de prueba y actualizo otra vez los datos. La solución permite centralizar el catálogo, comparar precios equivalentes y dejar trazabilidad de los cambios. En una implementación real, se deben validar las equivalencias, usar fuentes autorizadas y revisar cada alerta antes de tomar una decisión de compra. Gracias.”

## Revisión final del archivo

- Reproduce el MP4 y comprueba que se escuche la narración y se lea el panel.
- Recorta la grabación para dejar únicamente la demostración y la explicación.
- Verifica que no aparezcan contraseñas, `.env`, notificaciones ni datos personales.
- Restaura `6250` en el JSON y confirma que el servidor quede funcionando.
- Entrega el video por el medio y con el nombre de archivo que indique el docente.

## Importante

La herramienta de esta sesión no puede controlar ni guardar una grabación de pantalla verificable en MP4. Este guion deja preparada la narración y los pasos; la grabación debe iniciarse desde tu Windows con Xbox Game Bar u OBS Studio.
