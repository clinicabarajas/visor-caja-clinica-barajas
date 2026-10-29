window.VISOR_DEMO_DATA = {
  summary: {
    activity: {
      day: 1284.50,
      month: 22452.41,
      semester: 76886.10,
      year: 213904.91,
      orlDay: 405.00,
      audioDay: 879.50
    },
    treasury: {
      safe: 1600.00,
      operatingCash: 515.70,
      physicalCash: 2115.70,
      syncedBank: 39027.45,
      bankinter: 6132.97,
      liquidity: 47276.12
    },
    control: {
      lastClose: "28/10/2026",
      treasuryCutoff: "28/10/2026",
      difference: 0,
      monthExpenses: 4205.30,
      bankMonthNet: 1820.45
    },
    monthActivity: { tests: 268, private: 159, insurance: 109, incidents: 14 },
    monthProfessionals: { barajas: 4658.17, sammarco: 1372.27, lemes: 1779.94, audio: 14642.03 },
    clinicContribution: { sammarco: 240.94, lemes: 691.99, total: 932.93 },
    audioMonth: {
      hearingAids: 4,
      hearingAidSales: 5137.25,
      repairs: 425.00,
      tests: 323.00,
      customerCards: 665.00,
      smallMaterials: 376.00,
      total: 6926.25
    },
    audioMargins: [
      { category: "Audífonos", billing: 5137.25, margin: null, status: "Pendiente de costes" },
      { category: "Reparaciones", billing: 425.00, margin: null, status: "Pendiente de costes" },
      { category: "Mercadería / pequeño material", billing: 574.00, margin: null, status: "Pendiente de costes" }
    ]
  },
  billingTotals: {
    base: 1241.00,
    igic: 43.50,
    total: 1284.50,
    cash: 425.00,
    card: 799.50,
    transfer: 60.00,
    cashAndCard: 1224.50,
    orlInsurance: 245.00,
    orlPrivate: 160.00,
    orlTotal: 405.00,
    prostheses: 879.50
  },
  invoices: [
    { p: "FZ", fecha: "28/10/2026", factura: "F26-0237", paciente: "38163", seguro: "PRIVADO", profesional: "FZ", subtotal: 90, igic: 2.70, total: 92.70, cobrado: 92.70, efectivo: 0, datafono: 92.70, transferencia: 0, fz: 92.70, jjb: 0, observaciones: "" },
    { p: "FZ", fecha: "28/10/2026", factura: "F26-0238", paciente: "38665", seguro: "PRIVADO", profesional: "FZ", subtotal: 120, igic: 8.40, total: 128.40, cobrado: 128.40, efectivo: 0, datafono: 128.40, transferencia: 0, fz: 128.40, jjb: 0, observaciones: "" },
    { p: "ALR", fecha: "28/10/2026", factura: "F26-0239", paciente: "42073", seguro: "ADESLAS", profesional: "ALR", subtotal: 245, igic: 0, total: 245, cobrado: 0, efectivo: 0, datafono: 0, transferencia: 0, fz: 0, jjb: 245, observaciones: "Pendiente aseguradora" },
    { p: "JJB", fecha: "28/10/2026", factura: "F26-0240", paciente: "3987", seguro: "PRIVADO", profesional: "JJB", subtotal: 65.90, igic: 0, total: 65.90, cobrado: 65.90, efectivo: 65.90, datafono: 0, transferencia: 0, fz: 0, jjb: 65.90, observaciones: "" },
    { p: "FZ", fecha: "28/10/2026", factura: "F26-0241", paciente: "34914", seguro: "PRIVADO", profesional: "FZ", subtotal: 720.10, igic: 32.40, total: 752.50, cobrado: 752.50, efectivo: 359.10, datafono: 378.40, transferencia: 15, fz: 752.50, jjb: 0, observaciones: "" }
  ],
  expenseTotals: { cash: 29.30, card: 221.10, transfer: 0, bankIncome: 0 },
  expenses: [
    { fecha: "28/10/2026", factura: "F26-0237", concepto: "Paciente n.º 38163", efectivo: 0, tarjeta: 92.70, transferencia: 0, ingresos: 0, observaciones: "" },
    { fecha: "28/10/2026", factura: "F26-0238", concepto: "Paciente n.º 38665", efectivo: 0, tarjeta: 128.40, transferencia: 0, ingresos: 0, observaciones: "" },
    { fecha: "28/10/2026", factura: "G-1048", concepto: "Material de consulta", efectivo: 29.30, tarjeta: 0, transferencia: 0, ingresos: 0, observaciones: "Justificado" }
  ],
  cash: {
    date: "28/10/2026",
    cashier: "Beatriz",
    billed: 1284.50,
    opening: 365.00,
    bank1: 39027.45,
    bank2: 6132.97,
    totalBanks: 45160.42,
    totalBalance: 47276.12,
    professionalRows: [
      { concept: "Privados", barajas: 0, sammarco: 0, lemes: 160, audio: 879.50, total: 1039.50 },
      { concept: "ADESLAS", barajas: 0, sammarco: 0, lemes: 245, audio: 0, total: 245 },
      { concept: "CASER", barajas: 0, sammarco: 0, lemes: 0, audio: 0, total: 0 },
      { concept: "DKV", barajas: 0, sammarco: 0, lemes: 0, audio: 0, total: 0 },
      { concept: "HNA", barajas: 0, sammarco: 0, lemes: 0, audio: 0, total: 0 },
      { concept: "Santa Lucía", barajas: 0, sammarco: 0, lemes: 0, audio: 0, total: 0 },
      { concept: "OTROS", barajas: 0, sammarco: 0, lemes: 0, audio: 0, total: 0 },
      { concept: "Total facturado", barajas: 0, sammarco: 0, lemes: 405, audio: 879.50, total: 1284.50, emphasis: true },
      { concept: "Margen clínica", barajas: null, sammarco: 0, lemes: 90, audio: null, total: 90 },
      { concept: "Neto profesional", barajas: null, sammarco: 0, lemes: 315, audio: null, total: 315 },
      { concept: "N.º facturas", barajas: 0, sammarco: 0, lemes: 3, audio: 5, total: 8, integer: true }
    ],
    denominations: [
      { value: "0,01 €", count: 0, stays: 0, safe: 0 },
      { value: "0,02 €", count: 0, stays: 0, safe: 0 },
      { value: "0,05 €", count: 0, stays: 0, safe: 0 },
      { value: "0,10 €", count: 2, stays: 2, safe: 0 },
      { value: "0,20 €", count: 10, stays: 10, safe: 0 },
      { value: "0,50 €", count: 11, stays: 11, safe: 0 },
      { value: "1,00 €", count: 6, stays: 6, safe: 0 },
      { value: "2,00 €", count: 4, stays: 4, safe: 0 },
      { value: "Total monedas", amount: 15.70, staysAmount: 15.70, safeAmount: 0, total: true },
      { value: "5,00 €", count: 6, stays: 6, safe: 0 },
      { value: "10,00 €", count: 7, stays: 7, safe: 0 },
      { value: "20,00 €", count: 5, stays: 5, safe: 0 },
      { value: "50,00 €", count: 6, stays: 6, safe: 0 },
      { value: "100,00 €", count: 0, stays: 0, safe: 0 },
      { value: "200,00 €", count: 0, stays: 0, safe: 0 },
      { value: "500,00 €", count: 0, stays: 0, safe: 0 },
      { value: "Total billetes", amount: 500, staysAmount: 500, safeAmount: 0, total: true }
    ],
    reconciliation: [
      { sign: "", label: "Saldo anterior de caja", value: 365.00 },
      { sign: "+", label: "Entrada desde caja fuerte", value: 0 },
      { sign: "+", label: "Total facturado en el día", value: 1284.50 },
      { sign: "−", label: "Total facturado datáfono clínica", value: -799.50 },
      { sign: "−", label: "Total facturado a crédito aseguradoras", value: -245.00 },
      { sign: "−", label: "Total facturado prótesis privados crédito", value: 0 },
      { sign: "+", label: "Total cobros prótesis privados crédito", value: 0 },
      { sign: "−", label: "Total facturado privados crédito", value: 0 },
      { sign: "+", label: "Total cobros privados crédito", value: 0 },
      { sign: "−", label: "Transferencias de pacientes", value: -60.00 },
      { sign: "−", label: "Total gastos y pagos del día", value: -29.30 },
      { sign: "+", label: "Entregas a cuenta para compra de audífonos", value: 0 },
      { sign: "−", label: "Ingresos de efectivo de caja a bancos", value: 0 },
      { sign: "+", label: "Depósitos por audífonos a prueba", value: 0 },
      { sign: "−", label: "Devolución a pacientes privados", value: 0 },
      { sign: "+", label: "Otros ingresos en caja", value: 0 },
      { sign: "", label: "Esperado antes de retirada", value: 515.70, emphasis: true }
    ],
    totalClose: 515.70,
    difference: 0,
    distributionControl: 0,
    tomorrowCash: 515.70,
    safeDeposit: 0,
    safeBalance: 1600.00,
    physicalCash: 2115.70,
    bagId: "20261028",
    state: "CAJA CUADRADA",
    depositMade: false,
    closeMessage: "Cierre guardado correctamente"
  }
};
