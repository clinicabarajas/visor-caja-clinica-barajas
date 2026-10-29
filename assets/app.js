(() => {
  "use strict";

  const config = window.VISOR_CONFIG;
  const source = new window.GoogleSheetsDataSource(config);
  const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: config.currency });
  const integer = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
  const state = { view: "resumen", mode: "day", data: null, currentPeriod: "—", firstLoad: true };

  const viewMeta = {
    resumen: ["Resumen financiero", "Información consolidada del periodo seleccionado"],
    facturacion: ["Diario de facturación", "Facturas y formas de cobro, sin nombres ni DNI"],
    gastos: ["Gastos", "Registro con la estructura solicitada por la asesoría"],
    caja: ["Arqueo de caja", "Facturación, cuadre, efectivo, bancos y cierre"]
  };

  const root = document.querySelector("#viewRoot");
  const toast = document.querySelector("#toast");
  const authButton = document.querySelector("#authButton");

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function formatDateLong(value) {
    if (!value) return "—";
    const [year, month, day] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: config.timeZone }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  function getPeriod() {
    return { mode: state.mode, day: document.querySelector("#dayInput").value, start: document.querySelector("#rangeStartInput").value, end: document.querySelector("#rangeEndInput").value, month: document.querySelector("#monthInput").value };
  }

  function getPeriodLabel() {
    const period = getPeriod();
    if (period.mode === "day") return formatDateLong(period.day);
    if (period.mode === "range") return `${formatDateLong(period.start)} – ${formatDateLong(period.end)}`;
    if (!period.month) return "—";
    const [year, month] = period.month.split("-").map(Number);
    return new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: config.timeZone }).format(new Date(Date.UTC(year, month - 1, 1)));
  }

  function periodKind() { return state.mode === "day" ? "Día seleccionado" : state.mode === "month" ? "Mes seleccionado" : "Intervalo seleccionado"; }
  function money(value) { return value === null || value === undefined ? "—" : euro.format(value); }
  function count(value) { return value === null || value === undefined ? "—" : integer.format(value); }

  function panel(title, subtitle, body, tag = "") {
    return `<article class="panel"><div class="panel-header"><div><h2>${escapeHtml(title)}</h2>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}</div>${tag ? `<span class="panel-tag">${escapeHtml(tag)}</span>` : ""}</div><div class="panel-body">${body}</div></article>`;
  }

  function infoRows(entries) {
    return `<div class="info-list">${entries.map(([label, value, strong]) => `<div class="info-row${strong ? " is-total" : ""}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>`;
  }

  function emptyRow(columns, text = "No hay registros para el periodo seleccionado") { return `<tr><td class="empty-cell" colspan="${columns}">${escapeHtml(text)}</td></tr>`; }

  function renderLocked() {
    const message = source.configured ? "Accede con una cuenta de Google autorizada para consultar los datos reales del libro CAJA." : "La web está preparada para datos reales. Falta completar una autorización de Google antes de activarla.";
    root.innerHTML = `<div class="locked-state"><div class="lock-symbol" aria-hidden="true">🔒</div><h2>Visor privado de solo consulta</h2><p>${escapeHtml(message)}</p><button class="button button-primary" type="button" data-connect>Acceder con Google</button><small>No se descarga ni se guarda el libro contable en GitHub.</small></div>`;
    root.querySelector("[data-connect]")?.addEventListener("click", queryData);
  }

  function renderSummary() {
    const s = state.data.summary;
    const activity = infoRows([["Facturación del día", money(s.activity.day)], ["Facturación del mes", money(s.activity.month)], ["Facturación del semestre", money(s.activity.semester)], ["Facturación del año", money(s.activity.year), true], ["ORL · día", money(s.activity.orlDay)], ["Audioprótesis · día", money(s.activity.audioDay)]]);
    const treasury = infoRows([["Caja fuerte", money(s.treasury.safe)], ["Caja operativa", money(s.treasury.operatingCash)], ["Efectivo físico", money(s.treasury.physicalCash)], ["Banco sincronizado", money(s.treasury.syncedBank)], ["Bankinter manual", money(s.treasury.bankinter)], ["Liquidez total", money(s.treasury.liquidity), true]]);
    const control = infoRows([["Último cierre", s.control.lastClose], ["Corte de tesorería", s.control.treasuryCutoff], ["Descuadre de caja", money(s.control.difference)], ["Gastos del mes", money(s.control.monthExpenses)], ["Movimientos bancarios del mes · neto", money(s.control.bankMonthNet), true]]);
    const monthActivity = infoRows([["Pruebas", count(s.monthActivity.tests)], ["Privadas", count(s.monthActivity.private)], ["Seguros", count(s.monthActivity.insurance)], ["Incidencias", count(s.monthActivity.incidents), true]]);
    const professionals = infoRows([["Barajas", money(s.monthProfessionals.barajas)], ["Sammarco", money(s.monthProfessionals.sammarco)], ["Lemes", money(s.monthProfessionals.lemes)], ["Audioprótesis", money(s.monthProfessionals.audio), true]]);
    const contribution = infoRows([["Sammarco", money(s.clinicContribution.sammarco)], ["Lemes", money(s.clinicContribution.lemes)], ["Total clínica", money(s.clinicContribution.total), true]]);
    const audio = infoRows([["Audífonos vendidos", count(s.audioMonth.hearingAids)], ["Venta de audífonos", money(s.audioMonth.hearingAidSales)], ["Reparaciones", money(s.audioMonth.repairs)], ["Pruebas y revisiones", money(s.audioMonth.tests)], ["Tarjetas de cliente", money(s.audioMonth.customerCards)], ["Pequeño material y otros", money(s.audioMonth.smallMaterials)], ["Total audioprótesis", money(s.audioMonth.total), true]]);
    const marginRows = s.audioMargins.length ? s.audioMargins.map(row => `<tr><td>${escapeHtml(row.category)}</td><td class="numeric">${money(row.billing)}</td><td class="numeric">${money(row.margin)}</td><td><span class="badge olive">${escapeHtml(row.status)}</span></td></tr>`).join("") : emptyRow(4, "El detalle de margen solo está disponible en el último cierre");
    const margins = `<div class="table-scroll"><table class="data-table compact-table"><thead><tr><th>Categoría</th><th>Facturación base</th><th>Margen bruto</th><th>Estado</th></tr></thead><tbody>${marginRows}</tbody></table></div><p class="footnote">Facturación base sin IGIC menos coste directo imputado. Si falta cualquier coste, el margen queda pendiente.</p>`;
    root.innerHTML = `<div class="period-banner"><div><span>${periodKind()}</span><strong>${escapeHtml(state.currentPeriod)}</strong></div><span class="status-badge">Último cierre del periodo: ${escapeHtml(s.control.lastClose)}</span></div><div class="three-panel-grid">${panel("Actividad", "Facturación por horizonte temporal", activity)}${panel("Tesorería", "Posición de caja y bancos", treasury)}${panel("Control", "Cierre, gastos y conciliación", control)}</div><div class="three-panel-grid">${panel("Actividad clínica del mes", "Volumen de pruebas", monthActivity)}${panel("Facturación profesional · mes", "Base facturada", professionals)}${panel("Aportación clínica · mes", "Disponible para el último cierre", contribution)}</div><div class="two-panel-grid">${panel("Audioprótesis · actividad del mes", "Base sin IGIC · último cierre", audio)}${panel("Margen audioprótesis · mes", "Seguimiento de costes directos", margins)}</div><div class="criteria-note"><strong>Criterios del informe</strong><p>El efectivo físico se divide entre caja operativa y caja fuerte. Los gastos proceden del libro CAJA. El saldo bancario sincronizado y Bankinter se muestran con el criterio registrado en el propio libro.</p><p>No se incluyen nombres ni DNI de pacientes, beneficio neto, objetivos, nóminas, agenda ni pagos futuros.</p></div>`;
  }

  function renderFacturacion() {
    const t = state.data.billingTotals;
    const totals = [["Base", t.base], ["IGIC", t.igic], ["Total", t.total], ["Efectivo", t.cash], ["Datáfono", t.card], ["Transferencia", t.transfer], ["Efectivo + datáfono", t.cashAndCard], ["ORL seguros", t.orlInsurance], ["ORL privado", t.orlPrivate], ["ORL total", t.orlTotal], ["Prótesis", t.prostheses]];
    const rows = state.data.invoices.length ? state.data.invoices.map(row => `<tr><td>${escapeHtml(row.p)}</td><td>${escapeHtml(row.fecha)}</td><td><strong>${escapeHtml(row.factura)}</strong></td><td><span class="badge">${escapeHtml(row.paciente || "—")}</span></td><td>${escapeHtml(row.seguro)}</td><td>${escapeHtml(row.profesional)}</td><td class="numeric">${money(row.subtotal)}</td><td class="numeric">${money(row.igic)}</td><td class="numeric"><strong>${money(row.total)}</strong></td><td class="numeric">${money(row.cobrado)}</td><td class="numeric">${money(row.efectivo)}</td><td class="numeric">${money(row.datafono)}</td><td class="numeric">${money(row.transferencia)}</td><td class="numeric">${money(row.fz)}</td><td class="numeric">${money(row.jjb)}</td><td>${escapeHtml(row.observaciones || "—")}</td></tr>`).join("") : emptyRow(16);
    root.innerHTML = `<div class="period-banner"><div><span>${periodKind()}</span><strong>${escapeHtml(state.currentPeriod)}</strong></div><span class="status-badge">${state.data.invoices.length} registros</span></div><div class="kpi-ribbon">${totals.map(([label, value]) => `<div class="kpi-cell"><span>${escapeHtml(label)}</span><strong>${money(value)}</strong></div>`).join("")}</div><div class="section-heading"><div><h2>Diario de facturación</h2><p>Solo se consulta el número de paciente. Las columnas de nombre y DNI no se solicitan a Google.</p></div></div><div class="table-panel"><div class="table-scroll"><table class="data-table wide-table"><thead><tr><th>P</th><th>Fecha</th><th>N.º factura</th><th>N.º paciente</th><th>Seguros</th><th>Profesional</th><th>Subtotal</th><th>IGIC</th><th>Total</th><th>Cobrado</th><th>Efectivo</th><th>Datáfono</th><th>Transferencia</th><th>FZ</th><th>JJB</th><th>Observaciones</th></tr></thead><tbody>${rows}</tbody></table></div><div class="table-footer"><span>Datos reales · sin nombres ni DNI</span><span>Total: ${money(t.total)}</span></div></div>`;
  }

  function renderGastos() {
    const t = state.data.expenseTotals;
    const rows = state.data.expenses.length ? state.data.expenses.map(row => `<tr><td>${escapeHtml(row.fecha)}</td><td><strong>${escapeHtml(row.factura)}</strong></td><td>${escapeHtml(row.concepto)}</td><td class="numeric">${money(row.efectivo)}</td><td class="numeric">${money(row.tarjeta)}</td><td class="numeric">${money(row.transferencia)}</td><td class="numeric">${money(row.ingresos)}</td><td>${escapeHtml(row.observaciones || "—")}</td></tr>`).join("") : emptyRow(8);
    root.innerHTML = `<div class="period-banner"><div><span>${periodKind()}</span><strong>${escapeHtml(state.currentPeriod)}</strong></div><span class="status-badge">${state.data.expenses.length} registros</span></div><div class="four-panel-grid"><div class="summary-item"><span>Total gasto en efectivo</span><strong>${money(t.cash)}</strong></div><div class="summary-item"><span>Total Visa</span><strong>${money(t.card)}</strong></div><div class="summary-item"><span>Total transferencias</span><strong>${money(t.transfer)}</strong></div><div class="summary-item"><span>Total ingresos banco</span><strong>${money(t.bankIncome)}</strong></div></div><div class="section-heading"><div><h2>Registro de gastos</h2><p>Estructura conservada como fue diseñada para la asesoría.</p></div></div><div class="table-panel"><div class="table-scroll"><table class="data-table"><thead><tr><th>Fecha</th><th>N.º factura</th><th>Descripción</th><th>Efectivo</th><th>Visas</th><th>Transferencia</th><th>Ingresos</th><th>Observaciones</th></tr></thead><tbody>${rows}</tbody></table></div><div class="table-footer"><span>Datos reales del libro CAJA</span><span>Solo consulta</span></div></div>`;
  }

  function renderCaja() {
    const c = state.data.cash;
    if (!c.available) { root.innerHTML = `<div class="period-banner"><div><span>${periodKind()}</span><strong>${escapeHtml(state.currentPeriod)}</strong></div></div><div class="locked-state compact"><h2>No hay cierre de caja para este periodo</h2><p>Prueba con otra fecha o elige un intervalo que contenga un cierre.</p></div>`; return; }
    const professionalRows = c.professionalRows.map(row => `<tr class="${row.emphasis ? "emphasis-row" : ""}"><td><strong>${escapeHtml(row.concept)}</strong></td><td class="numeric">${money(row.jjb)}</td><td class="numeric">${money(row.fz)}</td><td class="numeric"><strong>${money(row.total)}</strong></td></tr>`).join("");
    const denominationRows = c.denominations.map(row => `<tr class="${row.total ? "emphasis-row" : ""}"><td><strong>${escapeHtml(row.value)}</strong></td><td class="numeric">${count(row.count)}</td><td class="numeric">${money(row.amount)}</td></tr>`).join("");
    const reconciliationRows = c.reconciliation.map(row => `<div class="reconciliation-row${row.emphasis ? " is-total" : ""}"><span class="sign ${row.sign === "+" ? "plus" : row.sign === "−" ? "minus" : ""}">${escapeHtml(row.sign)}</span><span>${escapeHtml(row.label)}</span><strong>${money(row.value)}</strong></div>`).join("");
    const closeControls = infoRows([["Total cierre", money(c.totalClose), true], ["Falta / sobra de caja", money(c.difference)], ["Control reparto", money(c.distributionControl)], ["Caja mañana", money(c.tomorrowCash)], ["Pasa a caja fuerte", money(c.safeDeposit)], ["Saldo caja fuerte", money(c.safeBalance)], ["Caja + caja fuerte", money(c.physicalCash), true]]);
    const identification = infoRows([["Identificación de la funda", c.bagId], ["Estado", c.state], ["Depósito a caja fuerte", c.depositMade ? "Sí" : "No"], ["Cierre", c.closeMessage, true]]);
    const banks = infoRows([["La Caixa", money(c.bank1)], ["Bankinter", money(c.bank2)], ["Total bancos", money(c.totalBanks), true]]);
    root.innerHTML = `<div class="period-banner"><div><span>Cierre diario</span><strong>${escapeHtml(c.date)} · Cajero/a: ${escapeHtml(c.cashier)}</strong></div><span class="status-badge success">${escapeHtml(c.state)}</span></div><div class="cash-head-grid"><div class="cash-head-card"><span>Total facturado</span><strong>${money(c.billed)}</strong></div><div class="cash-head-card"><span>Fondo inicial</span><strong>${money(c.opening)}</strong></div><div class="cash-head-card"><span>Total bancos</span><strong>${money(c.totalBanks)}</strong></div><div class="cash-head-card highlight"><span>Saldo total</span><strong>${money(c.totalBalance)}</strong><small>Bancos + efectivo físico</small></div></div><div class="cash-main-grid">${panel("Facturación del día", "Desglose histórico almacenado en BASECAJA", `<div class="table-scroll"><table class="data-table matrix-table"><thead><tr><th>Concepto</th><th>JJB</th><th>FZ</th><th>Total</th></tr></thead><tbody>${professionalRows}</tbody></table></div><p class="footnote">Se muestran las columnas históricas existentes en el libro, sin inventar equivalencias entre profesionales.</p>`)}${panel("Arqueo de efectivo", "Monedas y billetes del cierre", `<div class="table-scroll"><table class="data-table matrix-table"><thead><tr><th>Valor</th><th>Cantidad</th><th>Importe</th></tr></thead><tbody>${denominationRows}</tbody></table></div><p class="footnote">El destino del efectivo se resume en caja de mañana y caja fuerte.</p>`)}</div><div class="cash-main-grid">${panel("Cuadre de caja", "Todos los movimientos disponibles del cierre", `<div class="reconciliation-list">${reconciliationRows}</div>`)}<div class="stacked-panels">${panel("Cierre y destino del efectivo", "Resultado del arqueo", closeControls)}${panel("Identificación del cierre", "Trazabilidad del cierre diario", identification, c.state)}${panel("Saldo bancos", "Saldos informados en el libro", banks)}</div></div>`;
  }

  function render() {
    const [title, subtitle] = viewMeta[state.view];
    document.querySelector("#pageTitle").textContent = title;
    document.querySelector("#pageSubtitle").textContent = subtitle;
    state.currentPeriod = getPeriodLabel();
    if (!state.data) return renderLocked();
    if (state.view === "resumen") renderSummary();
    if (state.view === "facturacion") renderFacturacion();
    if (state.view === "gastos") renderGastos();
    if (state.view === "caja") renderCaja();
  }

  function showToast(message) { toast.textContent = message; toast.classList.add("is-visible"); window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200); }
  function setConnectedUi(connected) {
    document.querySelector("#connectionText").textContent = connected ? "Libro CAJA conectado" : "Acceso a Google pendiente";
    document.querySelector("#accountStatus").textContent = connected ? "Acceso autorizado" : "Acceso pendiente";
    document.querySelector("#accountLabel").textContent = connected ? "Cuenta con permiso de lectura" : "Conecta una cuenta autorizada";
    authButton.textContent = connected ? "Cerrar sesión" : "Acceder con Google";
    document.querySelector("#accessNotice").hidden = connected;
  }
  function useLatestDate(key) {
    if (!key) return;
    document.querySelector("#dayInput").value = key;
    document.querySelector("#rangeEndInput").value = key;
    document.querySelector("#rangeStartInput").value = `${key.slice(0, 8)}01`;
    document.querySelector("#monthInput").value = key.slice(0, 7);
  }

  async function queryData() {
    const button = document.querySelector("#refreshButton");
    button.disabled = true; authButton.disabled = true; button.textContent = "Consultando…";
    try {
      await source.load(true);
      if (state.firstLoad) { const provisional = source.build(getPeriod()); useLatestDate(provisional.latestAvailableKey); state.firstLoad = false; }
      state.data = source.build(getPeriod());
      setConnectedUi(true); render();
      document.querySelector("#lastUpdate").textContent = `Última consulta: ${new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(new Date())}`;
      showToast("Datos reales actualizados desde CAJA");
    } catch (error) {
      setConnectedUi(source.connected); showToast(error.message || "No se pudo actualizar la consulta"); if (!state.data) renderLocked();
    } finally {
      button.disabled = false; authButton.disabled = false; button.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6v5h-5M4 18v-5h5M6.1 9A7 7 0 0 1 18.5 6.5L20 11M4 13l1.5 4.5A7 7 0 0 0 17.9 15"/></svg>Consultar`;
    }
  }

  function exportRows() {
    if (!state.data) return [];
    if (state.view === "facturacion") return [["P", "Fecha", "N.º factura", "N.º paciente", "Seguros", "Profesional", "Subtotal", "IGIC", "Total", "Cobrado", "Efectivo", "Datáfono", "Transferencia", "FZ", "JJB", "Observaciones"], ...state.data.invoices.map(r => [r.p, r.fecha, r.factura, r.paciente, r.seguro, r.profesional, r.subtotal, r.igic, r.total, r.cobrado, r.efectivo, r.datafono, r.transferencia, r.fz, r.jjb, r.observaciones])];
    if (state.view === "gastos") return [["Fecha", "N.º factura", "Descripción", "Efectivo", "Visa", "Transferencia", "Ingresos", "Observaciones"], ...state.data.expenses.map(r => [r.fecha, r.factura, r.concepto, r.efectivo, r.tarjeta, r.transferencia, r.ingresos, r.observaciones])];
    if (state.view === "caja") return [["Concepto", "Importe"], ...state.data.cash.reconciliation.map(r => [r.label, r.value]), ["Total cierre", state.data.cash.totalClose], ["Caja fuerte", state.data.cash.safeBalance], ["Total bancos", state.data.cash.totalBanks], ["Saldo total", state.data.cash.totalBalance]];
    const s = state.data.summary;
    return [["Indicador", "Valor"], ["Facturación del día", s.activity.day], ["Facturación del mes", s.activity.month], ["Facturación del semestre", s.activity.semester], ["Facturación del año", s.activity.year], ["Caja fuerte", s.treasury.safe], ["Caja operativa", s.treasury.operatingCash], ["Efectivo físico", s.treasury.physicalCash], ["Banco sincronizado", s.treasury.syncedBank], ["Bankinter", s.treasury.bankinter], ["Liquidez total", s.treasury.liquidity], ["Gastos del mes", s.control.monthExpenses]];
  }

  function safeCell(value) { const text = String(value ?? ""); return /^[=+\-@]/.test(text) ? `'${text}` : text; }
  function download(blob, extension) {
    const safePeriod = state.currentPeriod.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = `visor-caja-${state.view}-${safePeriod}.${extension}`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }
  function exportCsv() { const content = exportRows().map(row => row.map(value => `"${safeCell(value).replace(/"/g, '""')}"`).join(";")).join("\r\n"); download(new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" }), "csv"); }
  function exportExcel() {
    const rows = exportRows().map(row => `<Row>${row.map(value => { const isNumber = typeof value === "number"; return `<Cell><Data ss:Type="${isNumber ? "Number" : "String"}">${escapeHtml(safeCell(value))}</Data></Cell>`; }).join("")}</Row>`).join("");
    const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="${state.view}"><Table>${rows}</Table></Worksheet></Workbook>`;
    download(new Blob(["\ufeff", xml], { type: "application/vnd.ms-excel;charset=utf-8" }), "xls");
  }

  document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => {
    state.view = button.dataset.view;
    document.querySelectorAll(".nav-item").forEach(item => { item.classList.toggle("is-active", item === button); item.removeAttribute("aria-current"); });
    button.setAttribute("aria-current", "page"); render(); window.scrollTo({ top: 0, behavior: "smooth" });
  }));
  document.querySelectorAll(".mode-button").forEach(button => button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    document.querySelectorAll(".mode-button").forEach(item => item.classList.toggle("is-active", item === button));
    document.querySelectorAll("[data-date-field]").forEach(field => field.classList.add("is-hidden"));
    if (state.mode === "day") document.querySelector('[data-date-field="day"]').classList.remove("is-hidden");
    if (state.mode === "range") { document.querySelector('[data-date-field="range-start"]').classList.remove("is-hidden"); document.querySelector('[data-date-field="range-end"]').classList.remove("is-hidden"); }
    if (state.mode === "month") document.querySelector('[data-date-field="month"]').classList.remove("is-hidden");
    if (state.data) state.data = source.build(getPeriod()); render();
  }));
  document.querySelector("#refreshButton").addEventListener("click", queryData);
  authButton.addEventListener("click", () => {
    if (!source.connected) return queryData();
    source.disconnect(); state.data = null; state.firstLoad = true; setConnectedUi(false); render(); showToast("Sesión de consulta cerrada");
  });
  const exportButton = document.querySelector("#exportMenuButton"), exportMenu = document.querySelector("#exportMenu");
  exportButton.addEventListener("click", () => { if (!state.data) return showToast("Primero debes acceder a los datos"); const open = exportButton.getAttribute("aria-expanded") === "true"; exportButton.setAttribute("aria-expanded", String(!open)); exportMenu.hidden = open; });
  exportMenu.querySelectorAll("button").forEach(button => button.addEventListener("click", () => { button.dataset.export === "csv" ? exportCsv() : exportExcel(); exportMenu.hidden = true; exportButton.setAttribute("aria-expanded", "false"); showToast("Archivo preparado para descargar"); }));
  document.addEventListener("click", event => { if (!event.target.closest(".filter-actions")) { exportMenu.hidden = true; exportButton.setAttribute("aria-expanded", "false"); } });

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: config.timeZone }).format(new Date());
  useLatestDate(today); setConnectedUi(false); render();
})();
