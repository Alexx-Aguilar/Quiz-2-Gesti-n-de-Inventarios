# GUÍA PASO A PASO: VIDEO DEMO (5 MIN) Y PRESENTACIÓN EN CLASE (10 MIN)
## Quiz #2 · Gestión de Inventarios y Abastecimiento
### Constructora Del Valle S.A.

---

Este documento contiene el guión detallado segundo a segundo para grabar el **Video Demo (Entregable 3 - Máx 5 min)** y la estructura completa de diapositivas y parlamento para la **Presentación en Clase (Entregable 4 - 10 min)**.

---

# PARTE 1: GUIÓN DEL VIDEO DEMO (Máximo 5 Minutos)

### Preparación previa antes de grabar:
1. Abre tu terminal en la carpeta del proyecto y corre:
   ```bash
   npm run seed
   npm start
   ```
2. Abre en tu navegador Chrome o Edge: `http://localhost:3000`.
3. Ten abierta otra ventana o pestaña con la terminal lista para mostrar `npm test`.
4. Utiliza una herramienta gratuita como OBS Studio, Loom, Clipchamp o la grabadora de Windows (`Win + G` o `Win + Alt + R`).

---

### Cronograma y Guión Segundo a Segundo (5:00 min total)

#### Minuto 0:00 - 0:45 | Introducción y Problema de Negocio
- **Qué mostrar en pantalla:** La portada del Dashboard en `http://localhost:3000` (Pestaña "Tablero General").
- **Qué decir:**
  > *"Hola a todos. En esta entrega del Quiz #2 presentamos la solución integral de gestión de inventarios y control de compras para Constructora Del Valle S.A.*  
  > *El reto principal de la empresa era la fuga de valor: compras duplicadas, adquisiciones fuera de contrato con sobreprecios de hasta un 26%, y descontrol en los niveles de stock en bodega.*  
  > *Desarrollamos una solución en Node.js con base de datos relacional SQLite y un frontend web en tiempo real que calcula dinámicamente los puntos de reorden, audita la trazabilidad física por orden de compra y aplica la matriz de aprobación jerárquica para evitar el fraccionamiento."*

#### Minuto 0:45 - 1:45 | Stock y Cálculo Dinámico de Punto de Reorden (PR)
- **Qué mostrar en pantalla:** Haz clic en la pestaña **"Stock y Punto de Reorden"** (o pestaña 2).
- **Qué hacer:** Señala las filas de **Arena ($m^3$)** y **Block 12x20x40**. Muestra el banner rojo de alertas.
- **Qué decir:**
  > *"Aquí vemos el catálogo de materiales. Un requisito fundamental del taller es que el stock no se digita: se calcula a partir de la suma algebraica de los movimientos.*  
  > *Aplicamos las fórmulas solicitadas: el Stock de Seguridad como la diferencia entre la demanda máxima y promedio multiplicada por el tiempo de entrega, y el Punto de Reorden como la demanda promedio por el tiempo de entrega más el stock de seguridad.*  
  > *Como pueden observar, el sistema detecta de inmediato que la Arena para construcción está en nivel CRÍTICO: tenemos solo 14 metros cúbicos frente a un punto de reorden de 20. Al ritmo máximo se agotará en 1.4 días y el proveedor tarda 2 días en entregar, por lo que es nuestra PRIORIDAD 1 de compra hoy mismo. El Block también está en déficit urgente con 2 800 unidades frente a un PR de 3 600."*

#### Minuto 1:45 - 2:45 | Registro de Movimiento y Actualización en Vivo
- **Qué mostrar en pantalla:** Haz clic en la pestaña **"Movimientos de Almacén"**.
- **Qué hacer:** Llena el formulario en vivo:
  - Tipo: `SALIDA`
  - Material: `Varilla #3 grado 40`
  - Bodega Origen: `Bodega Central (La Uruca)`
  - Cantidad: `100`
  - Usuario: `supervisor_obra`
  - Tipo de Documento: `Vale de Salida de Material`
  - N° Documento: `VALE-DEMO-01`
  - Motivo: `Armado de columnas sector norte`
- Haz clic en **"Registrar Movimiento y Actualizar Stock"**.
- Muestra el Toast verde de confirmación y cómo aparece inmediatamente en el historial. Regresa a la pestaña "Stock y Punto de Reorden" para mostrar que la varilla pasó de 850 a 750 unidades de manera instantánea.
- **Qué decir:**
  > *"Vamos a registrar una salida a obra. Seleccionamos Varilla #3, 100 unidades con el vale VALE-DEMO-01. Al guardar, el sistema valida que haya stock suficiente en la bodega de origen, descuenta las 100 varillas e inmediatamente recalcula el inventario y evalúa si se activó una nueva alerta."*

#### Minuto 2:45 - 3:45 | Matriz de Aprobación Jerárquica y Anti-Fraccionamiento
- **Qué mostrar en pantalla:** Haz clic en la pestaña **"Órdenes y Aprobaciones"**.
- **Qué hacer:**
  1. Muestra la tabla de órdenes de compra con sus diferentes montos en colones y los roles requeridos según la matriz de A1.
  2. Haz clic en el botón verde **"Aprobar"** de una orden pendiente (o crea una nueva orden rápida con el botón "+ Crear Nueva Orden de Compra").
  3. Muestra el modal de aprobación donde se selecciona el rol del funcionario.
  4. Haz clic en **"Confirmar Aprobación"** y luego en **"📥 Recibir"** para que los materiales ingresen automáticamente al inventario físico.
- **Qué decir:**
  > *"En el módulo de órdenes de compra implementamos la matriz de aprobación de la Parte A. Si una orden es menor a ₡250 000 la aprueba el área; si llega hasta ₡2 000 000 exige Jefatura de Compras y 2 cotizaciones; hasta ₡10 000 000 requiere Gerencia Financiera; y montos mayores van a Gerencia General con comité.*  
  > *La orden queda retenida en PENDIENTE_APROBACION hasta que un usuario con el nivel jerárquico exigido la valide. Una vez aprobada, el encargado de almacén pulsa 'Recibir' y el sistema genera automáticamente el movimiento de entrada en bodega."*

#### Minuto 3:45 - 4:30 | Detección de Duplicados, Fuga de Valor y Trazabilidad
- **Qué mostrar en pantalla:**
  1. Haz clic en la pestaña **"Duplicados y Fugas de Valor"**. Muestra las filas de OC-1041 vs OC-1042 y OC-1050 vs OC-1053, y el cuadro resumen de fuga de ₡223 000 al mes y ₡2.67 millones al año.
  2. Haz clic en la pestaña **"Trazabilidad de Material"**. Selecciona "Cemento gris 50 kg".
- **Qué decir:**
  > *"El motor de auditoría escanea la base de datos aplicando nuestra regla de duplicados: mismo proveedor, mismo artículo, intervalo menor a 7 días y cantidades similares. Aquí detectó que OC-1041 y OC-1042 fueron dos compras gemelas el mismo día para fraccionar el monto de ₡2.58 millones y saltarse a la Gerencia Financiera.*  
  > *Además, en la pestaña de Trazabilidad podemos auditar cualquier insumo: vemos de qué orden de compra exacta ingresó cada lote físico, qué proveedor lo trajo y si nos cobraron un sobreprecio respecto al contrato marco pactado."*

#### Minuto 4:30 - 5:00 | Pruebas Automatizadas y Cierre
- **Qué mostrar en pantalla:** Cambia a la terminal y ejecuta `npm test`. Muestra las 10 pruebas pasando en verde.
- **Qué decir:**
  > *"Para respaldar la calidad del software construimos una suite con 10 pruebas automatizadas que verifican los cálculos de PR, las reglas de fraccionamiento y la integridad de las salidas en almacén.*  
  > *Con esta solución, Constructora Del Valle S.A. elimina las fugas de valor y asegura el abastecimiento continuo de sus proyectos. Muchas gracias."*

---

# PARTE 2: GUÍA PARA LA PRESENTACIÓN EN CLASE (10 Minutos)

**Estructura del Equipo:** 10 minutos en total (aprox. 2.5 min por integrante si son 4 personas, o 3.3 min si son 3 personas).

---

### Diapositiva 1: Portada y Presentación del Equipo (1:00 min)
- **Título:** Solución Integral de Inventarios, Abastecimiento y Control de Compras.
- **Subtítulo:** Caso: Constructora Del Valle S.A. · Quiz #2.
- **Contenido visual:** Logotipo de la constructora, nombres de los integrantes y roles en el proyecto (ej. Analista de Procesos, Arquitecto de Base de Datos, Desarrollador Back end, Ingeniero QA).
- **Mensaje clave:** Cómo una empresa mediana pierde millones en compras descentralizadas y cómo la tecnología soluciona el problema de raíz.

---

### Diapositiva 2: El Diagnóstico del Problema en Constructora Del Valle (1:30 min)
- **Título:** ¿Dónde se fugaba el dinero en la empresa?
- **Puntos a exponer:**
  - **Tres áreas comprando por su cuenta:** Obras, Mantenimiento y Bodega Central operando como islas independientes sin comunicación.
  - **Insumos duplicados en el ERP:** El mismo cemento registrado con tres nombres diferentes (`Cemento gris 50 kg`, `Saco cemento uso general`, `CEM-GRIS-50`), impidiendo negociar por volumen.
  - **Compras fuera de contrato (*Maverick Spend*):** 36.3% del gasto de octubre se desvió a proveedores caros cuando existía un contrato marco con Proveedor A (cemento a ₡6 300 y varilla a ₡2 050).
  - **Fuga cuantificada:** ₡223 000 en sobreprecios solo en octubre, proyectando una pérdida anual de ₡2 676 000 en compras directas y más de ₡10 000 000 en descuentos desaprovechados.

---

### Diapositiva 3: El Circuito de Compra y la Matriz de Aprobación Mejorada (1:30 min)
- **Título:** Circuito de Abastecimiento y Control Anti-Fraccionamiento.
- **Puntos a exponer:**
  - El circuito estándar de 7 etapas: Requisición $\rightarrow$ Aprobación $\rightarrow$ Cotización $\rightarrow$ OC $\rightarrow$ Recepción $\rightarrow$ *Three-Way Match* $\rightarrow$ Pago.
  - **El control clave:** Explicar el *Three-Way Match* (Cruce de tres vías: Orden de Compra vs Informe de Recepción en Bodega vs Factura Comercial). Si hay discrepancia en precio o cantidad, no se desembolsa el dinero.
  - **Riesgo de fraccionamiento:** Cómo se dividían compras de ₡2.5 millones en dos órdenes gemelas de ₡1.29 millones para saltarse la aprobación de la Gerencia Financiera.
  - **La mejora propuesta:** Regla de acumulación temporal por ventana de 30 días en el ERP para frenar compras divididas.

---

### Diapositiva 4: Evaluación de Proveedores y Estrategia de Abastecimiento (1:00 min)
- **Título:** Matriz Ponderada de Proveedores: ¿Consolidar o Esquema Dual?
- **Puntos a exponer:**
  - Comparativa de 7 criterios (Precio 25%, Plazos 20%, Calidad 20%, Crédito 15%, Logística 10%, Posventa 5%, Riesgo 5%).
  - Resultados: Construplaza (4.375 / 5.0) en primer lugar y Novex (4.325 / 5.0) en segundo lugar.
  - **Conclusión estratégica:** No conviene consolidar el 100% en uno solo por el riesgo de parálisis de obras ante huelgas o desabastecimiento. Se recomienda **Dual Sourcing 70/30** (70% Construplaza como primario, 30% Novex como respaldo competitivo).

---

### Diapositiva 5: Niveles de Stock, Stock de Seguridad y Punto de Reorden (1:30 min)
- **Título:** Modelo Matemático de Inventarios en Construcción.
- **Puntos a exponer:**
  - Fórmulas: $SS = (d_{max} - d) \times L$ y $PR = d \times L + SS = d_{max} \times L$.
  - Mostrar la tabla de los 4 insumos analizados:
    - Cemento (190 sacos > PR 165): Stock saludable.
    - Varilla (850 unid > PR 800): Stock saludable.
    - Block (2 800 unid < PR 3 600): **Déficit de -800 bloques** (Prioridad 2).
    - Arena ($14\text{ m}^3 < \text{PR } 20\text{ m}^3$): **Déficit de -6 $\text{m}^3$** (Prioridad 1 Crítica, 1.4 días de cobertura restante).
  - Trazabilidad mínima requerida: 10 datos obligatorios en cada movimiento.

---

### Diapositiva 6: Arquitectura de la Solución Tecnológica (1:00 min)
- **Título:** Solución Node.js + Base de Datos Relacional.
- **Puntos a exponer:**
  - Backend propio en Node.js (v24) y Express con arquitectura en capas (Rutas, Servicios de Negocio, Capa de Datos).
  - Base de datos relacional SQLite con 9 tablas normalizadas, llaves foráneas activas e índices para consultas de alta velocidad.
  - Servicios desacoplados: `reordenService`, `duplicadosService`, `aprobacionService` y `trazabilidadService`.
  - Puntos extra: Dashboard web interactivo SPA, pruebas automatizadas (`node:test`) y motor de matriz de aprobación jerárquico.

---

### Diapositiva 7: Demostración en Vivo del Sistema (2:00 min)
- **Título:** Demostración Funcional en Vivo.
- **Acciones a realizar:**
  - Mostrar rápidamente el Dashboard en el navegador:
    1. Ver las alertas críticas activas de Arena y Block.
    2. Registrar una salida o traslado de material en vivo para demostrar que el stock se recalcula matemáticamente.
    3. Mostrar el detector de compras duplicadas identificando las OCs sospechosas de octubre.
    4. Abrir la trazabilidad de un material para ver de qué OC provino cada existencia física.

---

### Diapositiva 8: Pruebas Automatizadas y Calidad del Código (0:30 min)
- **Título:** Aseguramiento de Calidad y Pruebas Unitarias.
- **Puntos a exponer:**
  - Mostrar terminal con los 10 tests automatizados pasando al 100%.
  - Se verificaron formalmente los casos borde: rechazo de salidas sin saldo suficiente, validación de permisos jerárquicos de aprobación y cálculo exacto de las fórmulas de reorden de la Parte A.

---

### Diapositiva 9: Lecciones Aprendidas y Conclusiones de Negocio (0:45 min)
- **Título:** Aprendizajes Clave de la Experiencia.
- **Puntos a exponer:**
  1. La tecnología no arregla un mal proceso: primero se estandarizó la taxonomía y la matriz de firmas, luego se programó el software.
  2. El inventario físico debe estar vinculado a documentos contractuales para garantizar el *Three-Way Match*.
  3. Prevenir las compras duplicadas y el *maverick spend* le ahorra a la empresa más del 5% del presupuesto anual de obra.

---

### Diapositiva 10: Preguntas y Cierre (0:15 min)
- **Contenido:** Agradecimiento a la clase y al docente, sesión abierta de preguntas y respuestas.

---
*Fin de la Guía · Constructora Del Valle S.A.*
