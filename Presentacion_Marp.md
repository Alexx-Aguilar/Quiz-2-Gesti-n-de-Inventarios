---
marp: true
theme: default
paginate: true
size: 16:9
title: Gestión de inventarios y comparador de precios
author: Alex Aguilar López
description: Quiz 2 · Constructora Del Valle S.A. · Opción 1
style: |
  section {
    background: #f7f8fc;
    color: #162033;
    font-family: Aptos, "Segoe UI", sans-serif;
    padding: 54px 68px;
  }
  h1 { color: #102a43; font-size: 1.8em; }
  h2 { color: #0b7285; font-size: 1.36em; }
  strong { color: #087f8c; }
  section.title { background: linear-gradient(135deg, #102a43 0%, #0b7285 100%); color: white; }
  section.title h1, section.title h2 { color: white; }
  section.dark { background: #102a43; color: white; }
  section.dark h1, section.dark h2 { color: #8ce0e5; }
  section::after { color: #60758a; font-size: 14px; }
  blockquote { border-left: 5px solid #0b7285; background: #e8f4f5; padding: 14px 20px; color: #243b53; }
  table { font-size: 0.78em; }
  th { background: #0b7285; color: white; }
  td, th { padding: 9px 12px; }
  .muted { color: #627d98; font-size: .72em; }
  .big { font-size: 1.5em; color: #087f8c; }
---

<!-- _class: title -->

# Gestión de inventarios
## Comparador de precios de materiales

**Quiz 2 · Constructora Del Valle S.A. · Opción 1**

Alex Aguilar López  
Presentación · 10 minutos

---

## El problema: comprar sin una visión común

- Cada área puede registrar el mismo material con nombres distintos.
- Cotizaciones separadas dificultan comparar proveedores y detectar cambios.
- Órdenes duplicadas o fuera de contrato elevan el gasto.

> Sin un catálogo común y un historial, es difícil convertir compras dispersas en decisiones informadas.

---

## Hallazgos que justifican la propuesta

| Hallazgo del caso | Monto / señal | Lectura |
|:--|--:|:--|
| Ahorro potencial en cemento y varilla | ₡89 000 | Oportunidad de consolidar y negociar |
| Sobreprecio observado en octubre | ₡223 000 | Requiere revisión frente al contrato |
| Anualización simple del sobreprecio | ₡2 676 000 | Referencia, no ahorro garantizado |
| OC-1041 / OC-1042 | ₡1 290 000 | Posible duplicidad; validar recepción y factura |

<span class="muted">Los montos se basan en la muestra analizada y deben verificarse con documentos de compra.</span>

---

## La solución propuesta

### Un comparador con catálogo normalizado

1. Asignar un código interno a cada material.
2. Relacionar códigos y descripciones de cada proveedor.
3. Comparar precios unitarios y conservar capturas históricas.
4. Generar una alerta cuando el cambio supera el umbral configurado.

**Resultado esperado:** información comparable para revisar cotizaciones y priorizar compras.

---

## Flujo de datos y tecnología

```text
Fuentes de proveedor (JSON simulado)
              ↓ validación e importación
Node.js + Express ───── MySQL
              ↓
Catálogo · equivalencias · capturas · alertas · errores
              ↓
       Panel comparador
```

- **Backend:** Node.js y Express; acceso a MySQL mediante `mysql2`.
- **Persistencia:** productos, proveedores, equivalencias e historial de precios.
- **Workbench:** ejecución del esquema y consultas de revisión.

---

## Modelo de datos

| Tabla | Para qué sirve |
|:--|:--|
| `products` | Catálogo interno y unidad del material |
| `suppliers` | Fuentes / proveedores disponibles |
| `product_equivalences` | Relaciona el producto con su referencia de proveedor |
| `price_captures` | Guarda cada precio observado y su fecha |
| `price_alerts` | Registra cambios que superan el umbral |
| `source_errors` | Deja trazabilidad de fallas de importación |

**Clave del diseño:** una equivalencia explícita evita comparar productos solo por el texto de su nombre.

---

## Demostración del sistema

### Caso: aumento simulado del cemento Novex

- Precio inicial: **₡6 250**
- Precio de prueba: **₡6 700**
- Variación: **+7,2 %**
- Umbral de alerta: **5 %**

1. Mostrar el catálogo y las ofertas por proveedor.
2. Actualizar los precios con el JSON de prueba.
3. Verificar la nueva captura y la alerta.
4. Restaurar el precio inicial y dejar el sistema limpio.

<span class="muted">Los precios y fuentes son simulados; no se consultan comercios en tiempo real.</span>

---

## Controles recomendados

- Revisar toda oferta que exceda el precio contractual antes de emitir la orden.
- Confirmar posibles duplicados con requisición, recepción y factura.
- Definir responsables y niveles de autorización para excepciones.
- Homologar unidades y descripciones antes de comparar.
- Consultar fuentes autorizadas y respetar sus condiciones de uso.

---

<!-- _class: dark -->

## Conclusión y próximos pasos

### Normalizar las compras permite negociar con datos

1. Homologar el catálogo y validar las equivalencias.
2. Probar alertas con precios aprobados y datos completos.
3. Incorporar fuentes reales autorizadas con frecuencia definida.
4. Medir ahorro real contra contratos, recepción y facturación.

**Gracias**  
Alex Aguilar López

---

## Notas para presentar

- **Tiempo sugerido:** portada 20 s; problema 1 min; hallazgos 1 min 40 s; solución 1 min; datos 1 min 20 s; demo 3 min; controles 1 min; cierre 40 s.
- Aclara que la anualización del sobreprecio es una extrapolación simple, no un resultado confirmado.
- En la demo, no abras ni proyectes `.env`; usa solo el panel y consultas que no muestren contraseñas.
- Exporta una copia PDF desde Marp para entregar si el docente admite PDF. Si exige `.pptx`, abre el PDF en PowerPoint como referencia o reconstruye/importa el contenido allí.
