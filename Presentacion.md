# Gestión de inventarios y comparador de precios

Guion de diapositivas para una exposición de 10 minutos. Pasar a PowerPoint o Google Slides y sustituir espacios con nombres del equipo.

## 1. Portada · 20 s

Gestión de inventarios · Quiz 2<br>
Constructora Del Valle S.A. · Opción 1<br>
Equipo e integrantes: completar

## 2. Problema · 1 min

- Áreas compran el mismo material con nombres diferentes.
- Las compras dispersas impiden comparar volumen y precios.
- Compras fuera de contrato y posibles duplicados generan fuga de valor.

## 3. Hallazgos del caso · 1 min 40 s

- A2: ahorro potencial de ₡89 000 en la muestra de cemento y varilla.
- A3: sobreprecio cuantificable de ₡223 000 en octubre; anualización simple ₡2 676 000.
- OC-1041/1042: posible duplicidad por ₡1 290 000; pendiente verificar recepción y factura.
- Reorden: arena y block bajo PR.

## 4. Propuesta · 1 min

Comparador de catálogo con código interno, equivalencias por proveedor, comparación de ofertas y captura histórica. Alerta cuando la variación alcanza el umbral definido.

## 5. Modelo y flujo · 1 min 20 s

Productos → equivalencias proveedor → capturas históricas → alertas. Dos archivos fuente JSON simulados; el proceso lee cada fuente, valida estructura, guarda historial y registra errores.

## 6. Demo · 3 min

Seguir pasos del archivo `Demo_y_presentacion.md`: mostrar catálogo y cambiar temporalmente cemento Novex de ₡6 250 a ₡6 700 para disparar la alerta del 5 %.

## 7. Controles recomendados · 1 min

- No aprobar precio sobre contrato sin excepción autorizada.
- Detectar OC parecidas y revisar documentos de recepción/factura.
- Agregar requisiciones relacionadas para aplicar umbral de autorización.

## 8. Conclusión y siguientes pasos · 40 s

Normalizar compras permite negociar con datos y reducir errores. Para producción: instalar la aplicación, homologar artículos y conectar solo fuentes autorizadas con revisión de sus términos y frecuencia permitida.
