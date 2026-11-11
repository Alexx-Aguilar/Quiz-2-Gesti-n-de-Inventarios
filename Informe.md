# Gestión de inventarios y comparador de precios

**Quiz 2 · Trabajo práctico · Constructora Del Valle S.A.**<br>
**Opción seleccionada:** 1, Comparador de precios y catálogo de proveedores<br>
**Equipo:** Trabajo individual<br>
**Integrante:** Alex Aguilar López  **Carné:** ______________________________<br>
**Fecha:** 6 de noviembre de 2026

## Resumen ejecutivo

El análisis muestra oportunidades para controlar gasto mediante datos normalizados, comparación de proveedores y controles antes del pago. En octubre, el sobreprecio cuantificable frente a contrato es ₡223 000; su anualización simple asciende a ₡2 676 000 si el patrón se repite. Dos órdenes idénticas de cemento el mismo día son una posible duplicidad por ₡1 290 000, pendiente de verificar con recepción y factura. La solución es un comparador con catálogo interno, equivalencias, dos fuentes JSON simuladas, precios históricos, alertas y dashboard.

## Parte A · Análisis

### A1. Circuito de compra y aprobaciones

| Etapa | Responsable | Documento / registro | Control clave |
|---|---|---|---|
| Requisición | Área solicitante | Requisición con artículo, cantidad, fecha, centro de costo y justificación | Validar necesidad, presupuesto, existencias y especificación; evitar pedidos duplicados |
| Revisión y aprobación | Jefatura y aprobadores según monto | Requisición aprobada y evidencia de cotizaciones | Segregar solicitud, aprobación y compra; sumar compras relacionadas |
| Cotización y selección | Compras | Cuadro comparativo y evaluación del proveedor | Comparar especificación, costo total, plazo, calidad, riesgo y condiciones |
| Orden de compra | Compras; firma según umbral | OC numerada con proveedor, precio, impuestos, entrega y condiciones | Exigir requisición aprobada, presupuesto y proveedor autorizado |
| Recepción | Bodega / responsable de obra | Entrada de almacén o acta de servicio | Conteo e inspección contra OC; reportar faltantes y daños |
| Factura | Cuentas por pagar | Factura del proveedor | Validar proveedor, OC, recepción, precio, cantidad e impuestos |
| Pago | Tesorería con aprobación definida | Comprobante de pago y asiento contable | Three-way match OC–recepción–factura; bloqueo de facturas duplicadas |

**Flujo:** Requisición → validación de inventario y presupuesto → aprobación → cotizaciones y selección → OC → recepción e inspección → factura → conciliación de tres documentos → pago → archivo y evaluación del proveedor.

La matriz propuesta asigna aprobación hasta ₡250 000 a la jefatura solicitante, hasta ₡2 000 000 a Compras, hasta ₡10 000 000 a Gerencia Financiera y por encima a Gerencia General más comité. Conviene aclarar límites inclusivos, si el monto incluye impuestos y transporte, y el tratamiento de órdenes relacionadas; asignar suplentes, exigir declaración de conflicto de interés y guardar evidencia electrónica. Mantener cotizaciones mínimas y documentar excepciones por emergencia o proveedor único.

El fraccionamiento permite eludir cotizaciones o autoridad, favorece favoritismo y debilita competencia. Sumar requisiciones y OC del mismo solicitante, proveedor, categoría/proyecto y ventana móvil de 30 días antes de determinar el umbral. Alertar cuando importes cercanos se repitan; exigir justificación y revisión independiente. No dividir el gasto para alterar su aprobación.

### A2. Taxonomía y ahorro potencial

| Categoría › subcategoría | Código estándar | Líneas ERP normalizadas | ¿Mismo insumo? |
|---|---|---|---|
| Materiales de construcción › Cemento gris saco 50 kg | MAT-CEM-GRIS-50KG | 1 Cemento gris 50 kg; 2 Saco cemento uso general; 3 CEM-GRIS-50 | Sí, confirmar marca y especificación |
| Materiales de construcción › Varilla corrugada #3 grado 40, 6 m | MAT-VAR-3-G40-6M | 4 Varilla #3 grado 40; 5 Hierro 3/8 x 6 m | Probablemente; confirmar longitud y grado de línea 5 |
| Equipo de protección › Guantes nitrilo talla L | EPP-GUA-NIT-L | 6 Guantes de nitrilo talla L | No necesariamente igual a guante de trabajo |
| Equipo de protección › Guantes de trabajo talla L | EPP-GUA-TRAB-L | 7 Guantes trabajo L | Insumo distinto; falta especificar material/norma |
| Tuberías y accesorios › Tubo PVC 1/2 SDR 13.5 | TUB-PVC-12-SDR135 | 8 Tubo PVC 1/2 SDR 13.5 | Insumo único |

Cemento: 540 sacos; a precio mínimo observado ₡6 300 = ₡3 402 000. Gasto real ₡3 464 000; ahorro potencial ₡62 000. Varilla: 560 unidades; al menor precio observado ₡2 150 = ₡1 204 000. Gasto real ₡1 231 000; ahorro potencial ₡27 000. **Ahorro combinado: ₡89 000.** A2 usa precios de muestra distintos a los precios contractuales posteriores de A3.

Una taxonomía común agrupa cantidades que aparecen con nombres distintos, mide gasto y compara ofertas equivalentes. Sin unidad, especificación, categoría y código comunes, Compras no distingue si se trata del mismo material y no puede consolidar volumen ni negociar con evidencia fiable.

### A3. Gasto y fuga de valor

OC-1041 y OC-1042 son sospechosas: coinciden en fecha (2/10), proveedor, artículo, cantidad, precio y total. Se marca como exposición pendiente ₡1 290 000, una de las órdenes. La coincidencia no prueba por sí sola que la compra sea improcedente.

| OC | Precio contractual | Variación por unidad | Sobreprecio de línea | Evaluación |
|---|---:|---:|---:|---|
| 1041 | Cemento Prov. A ₡6 300 | ₡150 | ₡30 000 | Sobre precio contractual |
| 1042 | Cemento Prov. A ₡6 300 | ₡150 | ₡30 000 | Sobre precio; posible duplicado de 1041 |
| 1047 | Cemento Prov. A ₡6 300 | ₡800 | ₡32 000 | Prov. B fuera de contrato y más caro |
| 1050 | Varilla Prov. A ₡2 050 | ₡100 | ₡50 000 | Prov. C fuera de contrato y más caro |
| 1053 | Varilla Prov. A ₡2 050 | ₡100 | ₡48 000 | Prov. C fuera de contrato y más caro |
| 1058 | Varilla Prov. A ₡2 050 | ₡550 | ₡33 000 | Prov. D fuera de contrato y más caro |
| 1061 | Cemento Prov. A ₡6 300 | ₡0 | ₡0 | Conforme |

Sobreprecio sumado: cemento ₡30 000 + ₡30 000 + ₡32 000 = ₡92 000; varilla ₡50 000 + ₡48 000 + ₡33 000 = ₡131 000. **Fuga cuantificable: ₡223 000. Proyección anual simple: ₡2 676 000.** La posible duplicidad de ₡1 290 000 no se suma como pérdida sin investigar. Si se confirma indebida, exposición combinada ₡1 513 000; anualizarla daría ₡18 156 000, solo como extrapolación hipotética.

Controles: (1) bloquear automáticamente precios superiores al contrato y exigir excepción aprobada; (2) alertar/bloquear OC cercanas con mismo proveedor, artículo y cantidad, y cotejar recepción y factura; (3) consolidar requisiciones por material y proyecto y exigir aprobaciones según el monto agregado.

### A4. Evaluación ponderada de proveedores

Notas ilustrativas, no cotizaciones ni evaluación real de empresas. Escala 1 (débil) a 5 (fuerte); nota mayor siempre favorable.

| Criterio | Peso | Novex | Construplaza | EPA |
|---|---:|---:|---:|---:|
| Precio total | 25 % | 4 | 4 | 3 |
| Calidad y conformidad | 20 % | 4 | 4 | 4 |
| Cumplimiento de plazos | 20 % | 4 | 3 | 4 |
| Crédito / pago | 10 % | 3 | 4 | 3 |
| Servicio posventa | 10 % | 4 | 4 | 5 |
| Cobertura geográfica | 10 % | 4 | 4 | 5 |
| Riesgo de dependencia | 5 % | 3 | 4 | 4 |
| **Puntaje / 100** | **100 %** | **77** | **76** | **77** |

Fórmula: Σ(peso porcentual × nota/5). Recomiendo dar volumen preferente a un proveedor competitivo por categoría y conservar un segundo proveedor homologado. Puntajes cercanos y riesgo de interrupción apoyan dos fuentes. Decidir con ofertas comparables, conformidad técnica, costo puesto en obra y referencias verificables.

### A5. Stock de seguridad y reorden

| Material | Stock seguridad (SS) | Punto reorden (PR) | Actual | Decisión |
|---|---:|---:|---:|---|
| Cemento 50 kg | (55−40)×3 = **45 sacos** | 40×3+45 = **165** | 190 | No; 25 sobre PR |
| Varilla #3 | (160−120)×5 = **200 unid.** | 120×5+200 = **800** | 850 | No; 50 sobre PR |
| Block | (900−600)×4 = **1 200 unid.** | 600×4+1 200 = **3 600** | 2 800 | Sí; 800 bajo PR |
| Arena | (10−6)×2 = **8 m³** | 6×2+8 = **20** | 14 | Sí; 6 bajo PR |

Prioridad sugerida: arena primero por mayor déficit relativo al PR (30 %) y menor plazo (2 días); block después (22,2 % bajo PR, entrega 4 días). Emitir requisiciones hoy para ambos y confirmar consumos/obras. El resultado depende de saldos utilizables y órdenes abiertas correctos.

Para trazabilidad, cada movimiento registra ID, tipo (entrada/salida/traslado/ajuste), artículo/código, cantidad y unidad, ubicación origen/destino, fecha/hora, usuario, documento (OC o vale), proveedor u obra, lote si aplica, condición, aprobación de ajustes y referencia al movimiento de contrapartida de un traslado. El saldo deriva del libro de movimientos.

## Parte B · Solución elegida

El prototipo ofrece cuatro artículos normalizados y ocho equivalencias simuladas. El backend Node.js conecta con MySQL mediante `mysql2`; la creación de tablas y datos maestros se prepara en `database/mysql_setup.sql` para ejecutar desde MySQL Workbench. Conserva cada lectura, compara el precio más reciente por artículo y fuente y crea alertas cuando el cambio absoluto es igual o mayor al umbral configurable del 5 %. Cada JSON se procesa por separado; los errores se guardan y no detienen las otras fuentes. Incluye dashboard, API e instrucciones en `README.md`.

**Modelo relacional:** `products` 1:N `product_equivalences`; `suppliers` 1:N `product_equivalences`; `product_equivalences` 1:N `price_captures` y 1:N `price_alerts`. La tabla `source_errors` registra fallas de lectura.

Fuentes JSON simuladas y documentadas, sin datos de tiendas reales. La actualización programada se configura en el Programador de tareas del sistema para ejecutar `npm run update`.

## Conclusiones

El valor inmediato proviene de un catálogo único, control de precio contractual y conciliación documental antes de pagar. Hay que investigar la OC sospechosa y confirmar las especificaciones de insumos equivalentes antes de registrar pérdidas definitivas. Para operación real, conectar solo fuentes autorizadas y validar productos y precios.
