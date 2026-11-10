// Frontend JavaScript Avanzado: Constructora Del Valle S.A.
// Quiz #2 · Gestión de Inventarios y Abastecimiento

const app = {
  currentTab: 'tab-dashboard',
  selectedMaterialId: 1,
  pendingApprovalOrderId: null,
  activeFilter: 'TODOS',
  searchQuery: '',
  materialsList: [],

  // Estado del Modo Demo Automático
  demoModeActive: false,
  demoCurrentStep: 0,
  demoAutoPlayTimer: null,
  demoSteps: [
    {
      step: 1,
      tab: 'tab-dashboard',
      title: '1. Tablero Ejecutivo y Diagnóstico de Fugas',
      desc: 'Visualización de KPIs en tiempo real: 6 materiales normalizados, 2 alertas críticas de reorden y ₡223 000 en sobreprecios detectados en octubre.',
      action: async () => {
        app.showToast('Escena 1: Diagnóstico inicial de Constructora Del Valle S.A.', 'info');
      }
    },
    {
      step: 2,
      tab: 'tab-inventario',
      title: '2. Niveles de Stock y Semáforo de Reorden (PR = d_max × L)',
      desc: 'Cálculo dinámico: Arena (m³) está en nivel CRÍTICO con solo 1.4 días de cobertura frente a 2 días de entrega. Block en nivel URGENTE.',
      action: async () => {
        app.setFilter('REORDEN');
        app.showToast('Escena 2: Arena para construcción requiere reposición inmediata hoy', 'error');
      }
    },
    {
      step: 3,
      tab: 'tab-movimientos',
      title: '3. Registro de Movimiento y Recálculo en Vivo',
      desc: 'El stock físico no se digita a mano: se deduce de la suma de entradas y salidas. Simulamos una salida de 50 varillas a obra.',
      action: async () => {
        document.getElementById('mov-tipo').value = 'SALIDA';
        document.getElementById('mov-material').value = 2; // Varilla
        document.getElementById('mov-cantidad').value = 50;
        document.getElementById('mov-doc-num').value = 'VALE-DEMO-2026';
        document.getElementById('mov-motivo').value = 'Vaciado de cimientos sector norte';
        app.showToast('Escena 3: Descontando existencias y recalculando saldo en bodega...', 'info');
      }
    },
    {
      step: 4,
      tab: 'tab-ordenes',
      title: '4. Matriz Jerárquica de Aprobación (Anti-Fraccionamiento)',
      desc: 'Las órdenes quedan retenidas en PENDIENTE_APROBACION. Una orden de más de ₡2M exige Gerencia Financiera y 3 cotizaciones.',
      action: async () => {
        app.showToast('Escena 4: Flujo de firmas jerárquico según el monto de la compra', 'info');
      }
    },
    {
      step: 5,
      tab: 'tab-duplicados',
      title: '5. Auditoría de Duplicados y Fugas de Valor',
      desc: 'El algoritmo anti-splitting detecta que OC-1041 y OC-1042 fueron dos compras gemelas el mismo día para fraccionar ₡2.58 millones.',
      action: async () => {
        app.showToast('Escena 5: Detección de sobreprecios y compras duplicadas', 'error');
      }
    },
    {
      step: 6,
      tab: 'tab-trazabilidad',
      title: '6. Trazabilidad Integral por Lote y Tres Vías (Three-Way Match)',
      desc: 'Dado cualquier insumo, se audita de qué Orden de Compra ingresó, a qué precio y cómo se distribuye entre las obras.',
      action: async () => {
        app.inspectMaterial(1); // Cemento
        app.showToast('Escena 6: Auditoría de existencias completa finalizada con éxito', 'success');
      }
    }
  ],

  // Inicialización
  async init() {
    this.bindEvents();
    await this.refreshAllData();
  },

  // Vinculación de Eventos
  bindEvents() {
    // Pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // Sincronización manual
    document.getElementById('btn-sync-all').addEventListener('click', async () => {
      await this.refreshAllData();
      this.showToast('Base de datos y semáforo de reorden actualizados', 'info');
    });

    // Filtros de categoría de inventario
    document.querySelectorAll('.chip-btn').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.setFilter(e.currentTarget.dataset.filter);
      });
    });

    // Barra de búsqueda de inventario
    document.getElementById('inventory-search-input').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderInventoryTable();
    });

    // Formulario de movimientos
    document.getElementById('form-movimiento').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleMovementSubmit();
    });

    // Tipo de movimiento (mostrar destino si es traslado)
    document.getElementById('mov-tipo').addEventListener('change', (e) => {
      const isTraslado = e.target.value === 'TRASLADO';
      document.getElementById('group-bodega-destino').style.display = isTraslado ? 'block' : 'none';
      document.getElementById('mov-bodega-destino').required = isTraslado;
    });

    // Selector de material en trazabilidad
    document.getElementById('trace-select-material').addEventListener('change', (e) => {
      this.selectedMaterialId = parseInt(e.target.value, 10);
      this.loadTraceability(this.selectedMaterialId);
    });

    // Confirmación de aprobación en modal
    document.getElementById('btn-confirm-approval').addEventListener('click', () => {
      this.confirmApproval();
    });

    // Formulario de nueva orden
    document.getElementById('form-new-order').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleNewOrderSubmit();
    });

    // Cálculo dinámico de previsualización en nueva orden
    const updateOrderPreview = () => {
      const cant = parseFloat(document.getElementById('new-oc-cant').value) || 0;
      const precio = parseFloat(document.getElementById('new-oc-price').value) || 0;
      const total = cant * precio;
      const previewBox = document.getElementById('new-oc-preview-box');

      if (total > 0) {
        previewBox.style.display = 'block';
        document.getElementById('preview-oc-total').innerText = '₡' + total.toLocaleString('es-CR');
        
        let rol = 'Jefatura del área solicitante';
        if (total > 10000000) rol = 'Gerencia General (Nivel 4)';
        else if (total > 2000000) rol = 'Gerencia Financiera (Nivel 3)';
        else if (total > 250000) rol = 'Jefatura de Compras (Nivel 2)';
        
        document.getElementById('preview-oc-role').innerText = rol;
      } else {
        previewBox.style.display = 'none';
      }
    };
    document.getElementById('new-oc-cant').addEventListener('input', updateOrderPreview);
    document.getElementById('new-oc-price').addEventListener('input', updateOrderPreview);

    // Controles de Modo Demo
    document.getElementById('btn-start-demo-mode').addEventListener('click', () => this.startDemoMode());
    document.getElementById('btn-demo-close').addEventListener('click', () => this.stopDemoMode());
    document.getElementById('btn-demo-next').addEventListener('click', () => this.demoNextStep());
    document.getElementById('btn-demo-prev').addEventListener('click', () => this.demoPrevStep());
    document.getElementById('btn-demo-autoplay').addEventListener('click', () => this.toggleAutoPlay());
  },

  // Cambio de Pestañas
  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === tabId));

    if (tabId === 'tab-trazabilidad') {
      this.loadTraceability(this.selectedMaterialId);
    } else if (tabId === 'tab-duplicados') {
      this.loadDuplicateAnalysis();
    }
  },

  setFilter(filterName) {
    this.activeFilter = filterName;
    this.renderInventoryTable();
  },

  // Refrescar todos los datos
  async refreshAllData() {
    try {
      await Promise.all([
        this.loadInventory(),
        this.loadMovements(),
        this.loadOrders(),
        this.loadAlerts(),
        this.loadDuplicateAnalysis()
      ]);
      this.populateSelects();
    } catch (err) {
      console.error('Error al sincronizar datos:', err);
      this.showToast('Error de conexión con el servidor', 'error');
    }
  },

  // 1. Cargar Inventario con Barras de Medidor Visual
  async loadInventory() {
    const res = await fetch('/api/materiales');
    const json = await res.json();
    if (!json.success) return;

    this.materialsList = json.data;
    this.renderInventoryTable();

    // Actualizar contadores
    let bajoReordenCount = json.data.filter(m => m.requiere_reorden).length;
    document.getElementById('kpi-total-materiales').innerText = json.data.length;
    document.getElementById('kpi-bajo-reorden').innerText = bajoReordenCount;
    document.getElementById('tab-badge-reorden').innerText = bajoReordenCount;
  },

  renderInventoryTable() {
    if (!this.materialsList) return;

    const tbody = document.getElementById('inventory-table-body');
    tbody.innerHTML = '';

    const filtered = this.materialsList.filter(m => {
      // Filtro de búsqueda
      if (this.searchQuery) {
        const matchesCode = m.codigo_estandar.toLowerCase().includes(this.searchQuery);
        const matchesName = m.nombre.toLowerCase().includes(this.searchQuery);
        if (!matchesCode && !matchesName) return false;
      }

      // Filtro por chips
      if (this.activeFilter === 'REORDEN') return m.requiere_reorden;
      if (this.activeFilter === 'CONSTRUCCION') return m.categoria.includes('Construcción');
      if (this.activeFilter === 'EPP') return m.categoria.includes('Seguridad');
      if (this.activeFilter === 'HIDRAULICA') return m.categoria.includes('Hidráulica');
      return true;
    });

    filtered.forEach(m => {
      const tr = document.createElement('tr');

      // Generar Medidor Visual de Stock (Gauge)
      // Escala: Máximo visual = Max(PR * 1.5, stock_actual * 1.2)
      const maxVisual = Math.max(m.punto_reorden * 1.4, m.stock_actual * 1.15, 10);
      const ssPercent = Math.min(100, (m.stock_seguridad / maxVisual) * 100);
      const yellowPercent = Math.max(0, Math.min(100 - ssPercent, ((m.punto_reorden - m.stock_seguridad) / maxVisual) * 100));
      const cursorPercent = Math.min(100, Math.max(0, (m.stock_actual / maxVisual) * 100));

      const badgeClass = m.prioridad === 'CRITICA' ? 'badge-critica' : 
                         m.prioridad === 'URGENTE' ? 'badge-urgente' : 'badge-optimo';

      tr.innerHTML = `
        <td><strong class="font-mono">${m.codigo_estandar}</strong></td>
        <td><strong>${m.nombre}</strong></td>
        <td><small class="text-secondary">${m.subcategoria}</small></td>
        <td>${m.demanda_promedio_diaria} ${m.unidad_medida}</td>
        <td>${m.demanda_maxima_diaria} ${m.unidad_medida}</td>
        <td>${m.tiempo_entrega_dias} d</td>
        <td>${m.stock_seguridad}</td>
        <td><strong>${m.punto_reorden}</strong></td>
        <td><span style="font-size: 1.05rem; font-weight:800;" class="${m.requiere_reorden ? 'text-red' : 'text-emerald'}">${m.stock_actual}</span> ${m.unidad_medida}</td>
        <td>
          <div class="gauge-wrapper">
            <div class="gauge-track">
              <div class="gauge-segment-red" style="width: ${ssPercent}%;"></div>
              <div class="gauge-segment-yellow" style="width: ${yellowPercent}%;"></div>
              <div class="gauge-segment-green"></div>
              <div class="gauge-cursor" style="left: ${cursorPercent}%;" title="Stock actual: ${m.stock_actual}"></div>
            </div>
            <div class="gauge-meta">
              <span>0</span>
              <span>SS: ${m.stock_seguridad}</span>
              <span>PR: ${m.punto_reorden}</span>
            </div>
          </div>
        </td>
        <td><span class="badge ${m.requiere_reorden ? 'badge-danger' : 'badge-info'}">${m.dias_cobertura_promedio} d</span></td>
        <td><span class="badge ${badgeClass}">${m.prioridad}</span></td>
        <td>
          <button class="btn btn-xs btn-outline" onclick="app.inspectMaterial(${m.id})">🔍 Trazabilidad</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  // 2. Cargar Alertas Críticas
  async loadAlerts() {
    const res = await fetch('/api/alertas/reorden');
    const json = await res.json();
    if (!json.success) return;

    const list = document.getElementById('urgent-materials-list');
    list.innerHTML = '';

    if (json.data.length === 0) {
      document.getElementById('critical-alerts-banner').style.display = 'none';
      return;
    }

    document.getElementById('critical-alerts-banner').style.display = 'block';

    json.data.forEach(a => {
      const box = document.createElement('div');
      box.className = 'urgent-box';
      box.innerHTML = `
        <div>
          <div class="urgent-box-title">${a.material_nombre} (${a.codigo_estandar})</div>
          <div class="urgent-box-metrics">
            Stock actual: <strong>${a.stock_al_momento} ${a.unidad_medida}</strong> | PR: <strong>${a.punto_reorden}</strong> | Déficit: <span class="text-red font-bold">-${a.deficit}</span>
          </div>
          <small class="text-muted">Lead Time: <strong>${a.tiempo_entrega_dias} días</strong> | Criticidad: <span class="badge badge-danger">${a.prioridad}</span></small>
        </div>
        <button class="btn btn-sm btn-primary" onclick="app.prepareOrderFor('${a.codigo_estandar}', ${a.material_id}, ${a.deficit})">Emitir OC</button>
      `;
      list.appendChild(box);
    });
  },

  // 3. Cargar Movimientos
  async loadMovements() {
    const res = await fetch('/api/movimientos');
    const json = await res.json();
    if (!json.success) return;

    const dashTbody = document.getElementById('dash-recent-movs');
    const allTbody = document.getElementById('all-movs-table-body');
    dashTbody.innerHTML = '';
    allTbody.innerHTML = '';

    json.data.forEach((m, idx) => {
      const tipoBadge = m.tipo_movimiento === 'ENTRADA' ? 'badge-success' :
                        m.tipo_movimiento === 'SALIDA' ? 'badge-danger' :
                        m.tipo_movimiento === 'TRASLADO' ? 'badge-warning' : 'badge-info';

      const fechaFmt = new Date(m.fecha).toLocaleDateString('es-CR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      // Resumen Dashboard (primeros 5)
      if (idx < 5) {
        const dtr = document.createElement('tr');
        dtr.innerHTML = `
          <td><small>${fechaFmt}</small></td>
          <td><span class="badge ${tipoBadge}">${m.tipo_movimiento}</span></td>
          <td><strong>${m.material_nombre}</strong></td>
          <td><strong>${m.cantidad}</strong> ${m.unidad_medida}</td>
          <td><small>${m.bodega_origen}</small></td>
          <td><code>${m.documento_origen_numero || '-'}</code></td>
        `;
        dashTbody.appendChild(dtr);
      }

      // Historial completo
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${m.id}</td>
        <td><small>${fechaFmt}</small></td>
        <td><span class="badge ${tipoBadge}">${m.tipo_movimiento}</span></td>
        <td><strong>${m.material_nombre}</strong></td>
        <td><strong>${m.cantidad}</strong> ${m.unidad_medida}</td>
        <td>${m.bodega_origen}</td>
        <td>${m.bodega_destino || '-'}</td>
        <td><code>${m.documento_origen_numero || '-'}</code></td>
        <td><small>${m.usuario}</small></td>
      `;
      allTbody.appendChild(tr);
    });
  },

  // 4. Cargar Órdenes y Aprobaciones
  async loadOrders() {
    const res = await fetch('/api/ordenes');
    const json = await res.json();
    if (!json.success) return;

    const tbody = document.getElementById('orders-table-body');
    const dashPending = document.getElementById('dash-pending-orders');
    tbody.innerHTML = '';
    dashPending.innerHTML = '';

    let totalGasto = 0;
    let pendingCount = 0;

    json.data.forEach(oc => {
      totalGasto += oc.total;
      if (oc.estado === 'PENDIENTE_APROBACION') pendingCount++;

      const badgeEstado = oc.estado === 'APROBADA' ? 'badge-success' :
                          oc.estado === 'RECIBIDA' ? 'badge-info' :
                          oc.estado === 'RECHAZADA' ? 'badge-danger' : 'badge-warning';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong class="font-mono">${oc.numero_oc}</strong></td>
        <td>${oc.fecha}</td>
        <td>${oc.area_solicitante}</td>
        <td>${oc.proveedor_nombre}</td>
        <td><strong>₡${oc.total.toLocaleString('es-CR')}</strong></td>
        <td><span class="badge badge-info">${oc.rol_aprobador_requerido}</span></td>
        <td><span class="badge ${badgeEstado}">${oc.estado}</span></td>
        <td><small>${oc.aprobado_por || 'Pendiente'}</small></td>
        <td>${oc.es_posible_duplicado ? '<span class="badge badge-danger" title="' + (oc.motivo_duplicado || '') + '">⚠️ Sospechosa</span>' : '<span class="badge badge-success">OK</span>'}</td>
        <td>
          ${oc.estado === 'PENDIENTE_APROBACION' 
            ? `<button class="btn btn-xs btn-success" onclick="app.openApprovalModal(${oc.id}, '${oc.numero_oc}', ${oc.total}, '${oc.rol_aprobador_requerido}')">Aprobar</button>` 
            : oc.estado === 'APROBADA' 
            ? `<button class="btn btn-xs btn-primary" onclick="app.receiveOrder(${oc.id}, '${oc.numero_oc}')">📥 Recibir</button>` 
            : `<small class="text-muted">Procesada</small>`}
        </td>
      `;
      tbody.appendChild(tr);

      // Dash pending
      if (oc.estado === 'PENDIENTE_APROBACION') {
        const ptr = document.createElement('tr');
        ptr.innerHTML = `
          <td><strong>${oc.numero_oc}</strong></td>
          <td>${oc.area_solicitante}</td>
          <td>₡${oc.total.toLocaleString('es-CR')}</td>
          <td><span class="badge badge-info">${oc.rol_aprobador_requerido}</span></td>
          <td><button class="btn btn-xs btn-success" onclick="app.openApprovalModal(${oc.id}, '${oc.numero_oc}', ${oc.total}, '${oc.rol_aprobador_requerido}')">Aprobar</button></td>
        `;
        dashPending.appendChild(ptr);
      }
    });

    document.getElementById('kpi-gasto-total').innerText = '₡' + totalGasto.toLocaleString('es-CR');
    document.getElementById('tab-badge-pendientes').innerText = pendingCount;
  },

  // 5. Cargar Duplicados y Fugas
  async loadDuplicateAnalysis() {
    const res = await fetch('/api/ordenes/posibles-duplicados');
    const json = await res.json();
    if (!json.success) return;

    document.getElementById('kpi-duplicados-detectados').innerText = json.total_casos_detectados;

    const tbody = document.getElementById('duplicates-table-body');
    tbody.innerHTML = '';

    json.data.forEach(dup => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${dup.orden_a.numero_oc}</strong> (${dup.orden_a.fecha})<br><small>Cant: ${dup.orden_a.cantidad}</small></td>
        <td><strong>${dup.orden_b.numero_oc}</strong> (${dup.orden_b.fecha})<br><small>Cant: ${dup.orden_b.cantidad}</small></td>
        <td><strong>${dup.material.nombre}</strong></td>
        <td>${dup.proveedor.nombre}</td>
        <td><span class="badge badge-warning">${dup.diferencia_dias} día(s)</span></td>
        <td><strong>${dup.variacion_cantidad_pct}%</strong></td>
        <td><small class="text-red"><strong>${dup.motivo}</strong></small></td>
      `;
      tbody.appendChild(tr);
    });

    // Cargar tabla de fuga de valor
    const leakageTbody = document.getElementById('leakage-table-body');
    leakageTbody.innerHTML = `
      <tr>
        <td>OC-1041</td><td>02/10</td><td>Obras</td><td>Prov. A</td><td>Cemento gris 50 kg</td><td>200</td>
        <td>₡6 450</td><td>₡6 300</td><td class="text-red">+₡150</td><td class="text-red"><strong>₡30 000</strong></td>
        <td><span class="badge badge-danger">Sobreprecio + Duplicado</span></td>
      </tr>
      <tr>
        <td>OC-1042</td><td>02/10</td><td>Obras</td><td>Prov. A</td><td>Cemento gris 50 kg</td><td>200</td>
        <td>₡6 450</td><td>₡6 300</td><td class="text-red">+₡150</td><td class="text-red"><strong>₡30 000</strong></td>
        <td><span class="badge badge-danger">Duplicado exacto de OC-1041</span></td>
      </tr>
      <tr>
        <td>OC-1047</td><td>06/10</td><td>Mant.</td><td>Prov. B</td><td>Cemento gris 50 kg</td><td>40</td>
        <td>₡7 100</td><td>₡6 300</td><td class="text-red">+₡800</td><td class="text-red"><strong>₡32 000</strong></td>
        <td><span class="badge badge-warning">Fuera de contrato (+12.7%)</span></td>
      </tr>
      <tr>
        <td>OC-1050</td><td>08/10</td><td>Obras</td><td>Prov. C</td><td>Varilla #3</td><td>500</td>
        <td>₡2 150</td><td>₡2 050</td><td class="text-red">+₡100</td><td class="text-red"><strong>₡50 000</strong></td>
        <td><span class="badge badge-danger">Fuera de contrato + Fracc.</span></td>
      </tr>
      <tr>
        <td>OC-1053</td><td>09/10</td><td>Obras</td><td>Prov. C</td><td>Varilla #3</td><td>480</td>
        <td>₡2 150</td><td>₡2 050</td><td class="text-red">+₡100</td><td class="text-red"><strong>₡48 000</strong></td>
        <td><span class="badge badge-danger">Fuera de contrato + Fracc.</span></td>
      </tr>
      <tr>
        <td>OC-1058</td><td>13/10</td><td>Mant.</td><td>Prov. D</td><td>Varilla #3</td><td>60</td>
        <td>₡2 600</td><td>₡2 050</td><td class="text-red">+₡550</td><td class="text-red"><strong>₡33 000</strong></td>
        <td><span class="badge badge-danger">Sobreprecio severo (+26.8%)</span></td>
      </tr>
      <tr>
        <td>OC-1061</td><td>15/10</td><td>Bodega</td><td>Prov. A</td><td>Cemento gris 50 kg</td><td>300</td>
        <td>₡6 300</td><td>₡6 300</td><td class="text-emerald">₡0</td><td class="text-emerald"><strong>₡0</strong></td>
        <td><span class="badge badge-success">Conforme a Contrato 100%</span></td>
      </tr>
    `;
  },

  async refreshDuplicates() {
    await this.loadDuplicateAnalysis();
    this.showToast('Escaneo de auditoría anti-duplicados completado', 'info');
  },

  // 6. Cargar Trazabilidad
  async loadTraceability(materialId) {
    const res = await fetch(`/api/trazabilidad/${materialId}`);
    const json = await res.json();
    if (!json.success) return;

    const { material, existencias_por_bodega, resumen_entradas_oc, historial_movimientos } = json.data;

    // Resumen
    const card = document.getElementById('trace-material-card');
    card.innerHTML = `
      <div>
        <span class="trace-item-label">Insumo Auditado</span>
        <div class="trace-item-val">${material.nombre}</div>
        <small class="text-muted font-mono">${material.codigo_estandar} · ${material.subcategoria}</small>
      </div>
      <div>
        <span class="trace-item-label">Existencia Física Real</span>
        <div class="trace-item-val ${material.requiere_reorden ? 'text-red' : 'text-emerald'}">
          ${material.stock_actual} ${material.unidad_medida}
        </div>
        <small class="text-muted">Estado: <span class="badge ${material.requiere_reorden ? 'badge-danger' : 'badge-success'}">${material.prioridad}</span></small>
      </div>
      <div>
        <span class="trace-item-label">Punto de Reorden</span>
        <div class="trace-item-val">${material.punto_reorden}</div>
        <small class="text-muted">Stock Seguridad SS: ${material.stock_seguridad}</small>
      </div>
      <div>
        <span class="trace-item-label">Demanda y Cobertura</span>
        <div class="trace-item-val">${material.demanda_promedio_diaria} / día</div>
        <small class="text-muted">Lead Time: ${material.tiempo_entrega_dias} d | Cobertura: ${material.dias_cobertura_promedio} d</small>
      </div>
    `;

    // Existencias por Bodega
    const bGrid = document.getElementById('trace-bodegas-grid');
    bGrid.innerHTML = '';
    existencias_por_bodega.forEach(b => {
      const box = document.createElement('div');
      box.className = 'bodega-box-modern';
      box.innerHTML = `
        <h5>${b.bodega_nombre}</h5>
        <div class="qty-big">${b.stock_bodega} <span style="font-size: 0.85rem;">${material.unidad_medida}</span></div>
        <small class="text-muted">${b.ubicacion}</small>
      `;
      bGrid.appendChild(box);
    });

    // Entradas por OC
    const posTbody = document.getElementById('trace-pos-table-body');
    posTbody.innerHTML = '';
    if (resumen_entradas_oc.length === 0) {
      posTbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No se registran compras directas en el historial para este insumo.</td></tr>';
    } else {
      resumen_entradas_oc.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${e.fecha_recepcion}</td>
          <td><strong>${e.numero_oc || 'Sin OC'}</strong></td>
          <td>${e.proveedor_nombre || 'N/A'}</td>
          <td><strong>${e.cantidad_ingresada}</strong> ${material.unidad_medida}</td>
          <td>₡${(e.precio_unitario_pagado || 0).toLocaleString('es-CR')}</td>
          <td>₡${(e.precio_contratado || 0).toLocaleString('es-CR')}</td>
          <td><span class="${e.sobreprecio_unitario > 0 ? 'text-red font-bold' : 'text-emerald'}">₡${e.sobreprecio_unitario || 0}</span></td>
          <td>₡${(e.valor_total_ingreso || 0).toLocaleString('es-CR')}</td>
        `;
        posTbody.appendChild(tr);
      });
    }

    // Cronología completa
    const movTbody = document.getElementById('trace-movs-table-body');
    movTbody.innerHTML = '';
    historial_movimientos.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><small>${new Date(m.fecha).toLocaleString('es-CR')}</small></td>
        <td><span class="badge ${m.tipo_movimiento === 'ENTRADA' ? 'badge-success' : m.tipo_movimiento === 'SALIDA' ? 'badge-danger' : 'badge-warning'}">${m.tipo_movimiento}</span></td>
        <td><strong>${m.cantidad}</strong> ${material.unidad_medida}</td>
        <td>${m.bodega_origen}</td>
        <td>${m.bodega_destino || '-'}</td>
        <td><code>${m.documento_origen_numero || '-'}</code></td>
        <td><small>${m.usuario}</small></td>
        <td><small class="text-muted">${m.motivo || '-'}</small></td>
      `;
      movTbody.appendChild(tr);
    });
  },

  inspectMaterial(id) {
    this.selectedMaterialId = id;
    document.getElementById('trace-select-material').value = id;
    this.switchTab('tab-trazabilidad');
  },

  populateSelects() {
    if (!this.materialsList) return;

    const selMovMat = document.getElementById('mov-material');
    const selTraceMat = document.getElementById('trace-select-material');
    const selNewOcMat = document.getElementById('new-oc-material');

    selMovMat.innerHTML = '';
    selTraceMat.innerHTML = '';
    selNewOcMat.innerHTML = '';

    this.materialsList.forEach(m => {
      const opt = `<option value="${m.id}">${m.codigo_estandar} - ${m.nombre}</option>`;
      selMovMat.innerHTML += opt;
      selTraceMat.innerHTML += opt;
      selNewOcMat.innerHTML += opt;
    });

    selTraceMat.value = this.selectedMaterialId;

    // Bodegas
    const selOrig = document.getElementById('mov-bodega-origen');
    const selDest = document.getElementById('mov-bodega-destino');
    const bodegas = [
      { id: 1, nombre: 'Bodega Central (La Uruca)' },
      { id: 2, nombre: 'Obra Condominio Las Nubes (Escazú)' },
      { id: 3, nombre: 'Taller de Mantenimiento (Pavas)' }
    ];

    selOrig.innerHTML = '';
    selDest.innerHTML = '<option value="">-- Seleccionar Destino --</option>';

    bodegas.forEach(b => {
      selOrig.innerHTML += `<option value="${b.id}">${b.nombre}</option>`;
      selDest.innerHTML += `<option value="${b.id}">${b.nombre}</option>`;
    });

    // Proveedores
    const selSupp = document.getElementById('new-oc-supplier');
    const proveedores = [
      { id: 1, nombre: 'Proveedor A (Distribuidora El Porvenir) [Contrato Vigente]' },
      { id: 2, nombre: 'Proveedor B (Ferretería Industrial Santa Ana)' },
      { id: 3, nombre: 'Proveedor C (Aceros y Perfiles del Valle)' },
      { id: 4, nombre: 'Proveedor D (Depósito Metales El Pacífico)' },
      { id: 5, nombre: 'Proveedor E (Suministros de Protección EPP)' },
      { id: 6, nombre: 'Proveedor F (Seguridad Total F)' }
    ];
    selSupp.innerHTML = '';
    proveedores.forEach(p => {
      selSupp.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    });
  },

  // Registrar Movimiento
  async handleMovementSubmit() {
    const payload = {
      material_id: parseInt(document.getElementById('mov-material').value, 10),
      bodega_id: parseInt(document.getElementById('mov-bodega-origen').value, 10),
      bodega_destino_id: document.getElementById('mov-bodega-destino').value ? parseInt(document.getElementById('mov-bodega-destino').value, 10) : null,
      tipo_movimiento: document.getElementById('mov-tipo').value,
      cantidad: parseFloat(document.getElementById('mov-cantidad').value),
      usuario: document.getElementById('mov-usuario').value,
      documento_origen_tipo: document.getElementById('mov-doc-tipo').value,
      documento_origen_numero: document.getElementById('mov-doc-num').value,
      motivo: document.getElementById('mov-motivo').value
    };

    try {
      const res = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al registrar movimiento');

      this.showToast(data.mensaje, 'success');
      document.getElementById('mov-cantidad').value = '';
      document.getElementById('mov-doc-num').value = '';
      document.getElementById('mov-motivo').value = '';

      await this.refreshAllData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // Crear Orden
  async handleNewOrderSubmit() {
    const payload = {
      numero_oc: document.getElementById('new-oc-num').value,
      fecha: document.getElementById('new-oc-date').value,
      area_solicitante: document.getElementById('new-oc-area').value,
      proveedor_id: parseInt(document.getElementById('new-oc-supplier').value, 10),
      items: [
        {
          material_id: parseInt(document.getElementById('new-oc-material').value, 10),
          cantidad: parseFloat(document.getElementById('new-oc-cant').value),
          precio_unitario: parseFloat(document.getElementById('new-oc-price').value)
        }
      ]
    };

    try {
      const res = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al emitir orden de compra');

      this.closeModal('modal-new-order');
      this.showToast(`Orden ${payload.numero_oc} creada. Aprobador: ${data.data.rol_aprobador_requerido}`, 'success');
      await this.refreshAllData();
      this.switchTab('tab-ordenes');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // Modal de Aprobación
  openApprovalModal(ocId, numeroOC, total, rolRequerido) {
    this.pendingApprovalOrderId = ocId;
    document.getElementById('modal-approval-title').innerText = `Aprobar Orden: ${numeroOC}`;
    document.getElementById('modal-approval-info').innerHTML = `
      Monto Total: <strong>₡${total.toLocaleString('es-CR')}</strong><br>
      Nivel Jerárquico Exigido: <span class="badge badge-info">${rolRequerido}</span>
    `;
    document.getElementById('modal-approval-role').value = rolRequerido;
    document.getElementById('modal-approval').classList.add('active');
  },

  async confirmApproval() {
    if (!this.pendingApprovalOrderId) return;

    const payload = {
      rol_usuario: document.getElementById('modal-approval-role').value,
      nombre_usuario: document.getElementById('modal-approval-user').value
    };

    try {
      const res = await fetch(`/api/ordenes/${this.pendingApprovalOrderId}/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'No fue posible aprobar la orden');

      this.closeModal('modal-approval');
      this.showToast(data.mensaje, 'success');
      await this.refreshAllData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async receiveOrder(ocId, numeroOC) {
    if (!confirm(`¿Confirmar recepción en almacén de la orden ${numeroOC}? Esto sumará existencias físicas al inventario.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/ordenes/${ocId}/recibir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodega_id: 1, usuario: 'bodeguero_central' })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al recibir la orden');

      this.showToast(data.mensaje, 'success');
      await this.refreshAllData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  prepareOrderFor(codigo, matId, deficit) {
    this.openNewOrderModal();
    document.getElementById('new-oc-material').value = matId;
    document.getElementById('new-oc-cant').value = Math.ceil(deficit * 1.5);
    document.getElementById('new-oc-num').value = `OC-REP-${Math.floor(Math.random() * 900 + 100)}`;
  },

  openNewOrderModal() {
    document.getElementById('new-oc-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('modal-new-order').classList.add('active');
  },

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4500);
  },

  // =========================================================
  // MODO DEMO AUTOMÁTICO (Auto-Play para Grabación de Video)
  // =========================================================
  startDemoMode() {
    this.demoModeActive = true;
    this.demoCurrentStep = 0;
    document.getElementById('demo-controller-bar').style.display = 'block';
    this.renderDemoStep();
  },

  stopDemoMode() {
    this.demoModeActive = false;
    if (this.demoAutoPlayTimer) {
      clearInterval(this.demoAutoPlayTimer);
      this.demoAutoPlayTimer = null;
    }
    document.getElementById('demo-controller-bar').style.display = 'none';
    document.getElementById('btn-demo-autoplay').innerText = '▶ Auto-Play (5 min)';
  },

  renderDemoStep() {
    const stepData = this.demoSteps[this.demoCurrentStep];
    document.getElementById('demo-step-counter').innerText = `PASO ${stepData.step} / ${this.demoSteps.length}`;
    document.getElementById('demo-step-title').innerText = stepData.title;
    document.getElementById('demo-step-desc').innerText = stepData.desc;

    this.switchTab(stepData.tab);
    if (typeof stepData.action === 'function') {
      stepData.action();
    }
  },

  demoNextStep() {
    if (this.demoCurrentStep < this.demoSteps.length - 1) {
      this.demoCurrentStep++;
      this.renderDemoStep();
    } else {
      this.showToast('¡Simulación de demostración completada!', 'success');
      this.stopDemoMode();
    }
  },

  demoPrevStep() {
    if (this.demoCurrentStep > 0) {
      this.demoCurrentStep--;
      this.renderDemoStep();
    }
  },

  toggleAutoPlay() {
    const btn = document.getElementById('btn-demo-autoplay');
    if (this.demoAutoPlayTimer) {
      clearInterval(this.demoAutoPlayTimer);
      this.demoAutoPlayTimer = null;
      btn.innerText = '▶ Auto-Play';
      this.showToast('Auto-Play pausado', 'info');
    } else {
      btn.innerText = '⏸ Pausar';
      this.showToast('Iniciando recorrido automático...', 'success');
      this.demoAutoPlayTimer = setInterval(() => {
        if (this.demoCurrentStep < this.demoSteps.length - 1) {
          this.demoNextStep();
        } else {
          this.stopDemoMode();
        }
      }, 7000); // Avanza cada 7 segundos automáticamente
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  app.init();
});
