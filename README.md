# Constructora Del Valle S.A. · Sistema de Gestión de Inventarios y Abastecimiento
> **Quiz #2 · Trabajo Práctico**  
> **Fecha de Entrega:** Viernes 6 de noviembre de 2026  
> **Tecnología:** Node.js (v20+ / v24) + Base de Datos SQLite Relacional (Camino 2: Back end propio) + Dashboard Web SPA

---

## 🌟 Características Principales de la Solución

Este repositorio contiene la solución completa para la gestión de compras, inventarios y mitigación de fugas de valor de **Constructora Del Valle S.A.**:

1. **Cálculo Dinámico de Niveles de Stock y Punto de Reorden (PR):**
   - El stock actual no se digita: se calcula a partir de la suma algebraica de los movimientos de almacén (`ENTRADA`, `SALIDA`, `TRASLADO`, `AJUSTE`).
   - Calcula automáticamente el Stock de Seguridad ($SS = (d_{max} - d) \times L$) y el Punto de Reorden ($PR = d \times L + SS = d_{max} \times L$).
   - Alertas automatizadas con priorización inteligente (`CRITICA`, `URGENTE`, `MODERADA`, `OPTIMO`).
2. **Detección Algorítmica de Compras Duplicadas y Fraccionamiento (Anti-Splitting):**
   - Escaneo en tiempo real de órdenes con mismo proveedor, mismo artículo, intervalo de fechas cercano ($\le 7$ días) y variación de cantidades ($\le 10\%$).
   - Detección de órdenes divididas artificialmente para eludir umbrales de aprobación gerencial.
3. **Flujo de Aprobación Jerárquico de Órdenes de Compra (Matriz de Aprobación A1):**
   - Estados: `PENDIENTE_APROBACION` $\rightarrow$ `APROBADA` $\rightarrow$ `RECIBIDA`.
   - Asignación obligatoria del nivel de firma según monto: Jefatura de Área ($\le ₡250k$), Jefatura de Compras ($\le ₡2M$), Gerencia Financiera ($\le ₡10M$) o Gerencia General ($> ₡10M$).
   - Restricción estricta de permisos por rol.
4. **Trazabilidad Integral por Material y Lote:**
   - Dado cualquier insumo, muestra de qué Orden de Compra y proveedor provino cada lote físico, a qué precio unitario se adquirió y cómo se distribuye en las distintas bodegas y obras.
5. **Dashboard Web Interactivo en Tiempo Real (Puntos Extra):**
   - Aplicación web responsiva servida directamente por Node.js con KPIs en vivo, registro de movimientos, gestión de aprobaciones y visualizador de trazabilidad.
6. **Suite de Pruebas Automatizadas (Puntos Extra):**
   - 10 pruebas automatizadas con el test runner nativo de Node.js (`npm test`), validando la lógica matemática y de negocio.

---

## 🏗️ Requisitos Previos

- **Node.js**: Versión 20.x, 22.x o 24.x (recomendado v24).
- **NPM**: Versión 9.x o superior.
- No se requiere instalar motores externos de bases de datos pesados: utiliza el motor relacional SQLite integrado de alto rendimiento.

---

## 🚀 Instalación y Puesta en Marcha Rápida

Sigue estos 3 pasos en tu terminal (PowerShell, Bash o CMD):

### 1. Clonar o entrar al directorio del proyecto:
```bash
cd "Quiz #2"
```

### 2. Instalar dependencias del proyecto:
```bash
npm install
```

### 3. Sembrar la base de datos con los datos oficiales de Constructora Del Valle:
```bash
npm run seed
```
*Salida esperada:*
```text
--- Iniciando siembra de datos para Constructora Del Valle S.A. ---
✓ Tablas creadas correctamente
✓ Datos semilla insertados correctamente
--- Siembra completada con éxito ---
```

### 4. Iniciar el servidor:
```bash
npm start
```
*Salida esperada:*
```text
================================================================
  CONSTRUCTORA DEL VALLE S.A. - SISTEMA DE GESTIÓN DE INVENTARIOS
================================================================
✓ Servidor HTTP escuchando en el puerto: 3000
✓ Dashboard Web Interactivo: http://localhost:3000
✓ API REST Base: http://localhost:3000/api/info
================================================================
```

### 5. Abrir en el Navegador:
Ingresa a: **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Ejecución de Pruebas Automatizadas

Para ejecutar la suite de 10 pruebas unitarias y de integración que validan los cálculos matemáticos y las reglas de negocio:

```bash
npm test
```

*Resultado:*
```text
✔ Suite de Pruebas Automatizadas: Constructora Del Valle S.A.
  ✔ 1. Cálculos de Niveles de Stock, Stock de Seguridad y Punto de Reorden (A5)
  ✔ 2. Detección Inteligente de Compras Duplicadas y Fraccionamientos (A3)
  ✔ 3. Matriz de Aprobación Jerárquica y Reglas de Negocio (A1)
  ✔ 4. Movimientos de Almacén y Control de Stock
ℹ tests 10 | pass 10 | fail 0
```

---

## 📂 Estructura del Proyecto

```
├── .env.example                       # Plantilla de variables de entorno
├── .env                               # Configuración local de puerto y umbrales
├── package.json                       # Metadatos del proyecto y scripts
├── README.md                          # Guía de instalación y arquitectura
├── INFORME_PRACTICO_QUIZ2.md          # Informe técnico formal (Parte A + Parte B)
├── GUIA_VIDEO_DEMO_Y_PRESENTACION.md  # Guión para video de 5 min y diapositivas de clase
├── database/
│   ├── schema.sql                     # DDL de la base de datos (9 tablas relacionales)
│   └── seed.sql                       # Datos iniciales exactos del enunciado (Caso Del Valle)
├── src/
│   ├── index.js                       # Bootstrap del servidor Express
│   ├── db/
│   │   ├── database.js                # Conexión nativa a SQLite
│   │   └── seed.js                    # Script para reiniciar y poblar la BD
│   ├── services/
│   │   ├── reordenService.js          # Cálculo de PR, SS, stock y alertas
│   │   ├── duplicadosService.js       # Detección de duplicados y fraccionamientos
│   │   ├── aprobacionService.js       # Matriz de aprobación y control de firmas
│   │   └── trazabilidadService.js     # Historial de lotes y OCs de origen
│   ├── routes/
│   │   ├── materialesRoutes.js        # /api/materiales
│   │   ├── movimientosRoutes.js       # /api/movimientos
│   │   ├── ordenesRoutes.js           # /api/ordenes
│   │   ├── alertasRoutes.js           # /api/alertas
│   │   └── trazabilidadRoutes.js      # /api/trazabilidad
│   └── public/                        # Frontend Web SPA (Puntos Extra)
│       ├── index.html                 # Tablero interactivo (HTML5)
│       ├── css/styles.css             # Hoja de estilos moderna y responsiva
│       └── js/app.js                  # Lógica de consumo de API REST
└── tests/
    └── inventario.test.js             # Pruebas automatizadas (node:test)
```

---

## 🔌 Documentación de la API REST

### Materiales e Inventario
- `GET /api/materiales`: Retorna todos los materiales con stock físico actual calculado, $SS$, $PR$, días de cobertura y estado de alerta.
- `GET /api/materiales/:id/stock`: Detalle de stock y métricas para un insumo específico.
- `POST /api/materiales`: Registra un nuevo material en el catálogo maestro.

### Movimientos de Almacén
- `GET /api/movimientos`: Lista los movimientos de inventario con filtros por material, bodega o tipo.
- `POST /api/movimientos`: Registra `ENTRADA`, `SALIDA`, `TRASLADO` o `AJUSTE`. Valida existencias en la bodega de origen y actualiza de inmediato el stock y las alertas de reorden.

### Órdenes de Compra y Aprobaciones
- `GET /api/ordenes`: Lista las órdenes de compra con estado, aprobador, desglose de líneas y auditoría de sobreprecios contra contratos marco.
- `POST /api/ordenes`: Emite una nueva OC. Evalúa la matriz de aprobación según el monto y detecta posibles fraccionamientos previos con el proveedor.
- `POST /api/ordenes/:id/aprobar`: Valida las credenciales del usuario y cambia el estado de la orden a `APROBADA`.
- `POST /api/ordenes/:id/recibir`: Registra el ingreso físico de los materiales a bodega, creando el movimiento de `ENTRADA` y sumando existencias.
- `GET /api/ordenes/posibles-duplicados`: Ejecuta el algoritmo de detección de compras duplicadas.

### Alertas y Trazabilidad
- `GET /api/alertas/reorden`: Lista los materiales que se encuentran por debajo del punto de reorden clasificados por criticidad.
- `GET /api/trazabilidad/:id`: Retorna la distribución del insumo por bodegas, el historial cronológico y las órdenes de compra exactas de las que provino cada entrada.

---

## ⚙️ Variables de Entorno (`.env`)

```ini
PORT=3000
NODE_ENV=development
DB_PATH=./database/inventario.db

# Umbrales Matriz de Aprobación (en Colones ₡)
UMBRAL_JEFATURA_AREA=250000
UMBRAL_JEFATURA_COMPRAS=2000000
UMBRAL_GERENCIA_FINANCIERA=10000000

# Parámetros de Detección de Duplicados
DUPLICADOS_DIAS_VENTANA=7
DUPLICADOS_TOLERANCIA_CANTIDAD_PORCENTAJE=10
```

---

## 👥 Créditos y Autores
- **Proyecto:** Quiz #2 · Trabajo Práctico de Gestión de Inventarios
- **Empresa Ficticia:** Constructora Del Valle S.A.
- **Licencia:** MIT (Uso Académico)
