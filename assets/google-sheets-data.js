(() => {
  "use strict";

  const EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";

  const CASH_PROFESSIONALS = [
    { key: "jjb", label: "JJB · José Juan Barajas de Prat" },
    { key: "fz", label: "FZ · Franz Zenker" },
    { key: "ayoslm", label: "AYOSLM" },
    { key: "sanmarcos", label: "San Marcos" }
  ];

  const CASH_CONCEPTS = ["Privados", "ADESLAS", "CASER", "DKV", "HNA", "Santa Lucía / FDB", "OTROS"];

  const blank = value => value === undefined || value === null || String(value).trim() === "";

  function number(value) {
    if (typeof value === "number") return value;
    if (blank(value)) return 0;
    const cleaned = String(value).trim().replace(/\s/g, "").replace(/€/g, "").replace(/[()]/g, "");
    if (!cleaned || cleaned === "—" || cleaned === "-") return 0;
    const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
    const parsed = Number.parseFloat(normalized.replace(/[^0-9+\-.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizedText(value) {
    return String(value || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  }

  function cashProfessionalKey(value) {
    const code = normalizedText(value).replace(/[^A-Z0-9]/g, "");
    if (code === "JJB" || code.includes("JOSEJUANBARAJAS") || code === "BARAJAS") return "jjb";
    if (code === "FZ" || code.includes("FRANZZENKER") || code.includes("AUDIOPROTESIS")) return "fz";
    if (code === "ALR" || code === "AYOSLM" || code.includes("LEMES")) return "ayoslm";
    if (code === "FGS" || code.includes("SAMMARCO") || code.includes("SANMARCO")) return "sanmarcos";
    return "unassigned";
  }

  function cashConcept(value) {
    const insurance = normalizedText(value);
    if (insurance.includes("PRIV")) return "Privados";
    if (insurance.includes("ADESLAS")) return "ADESLAS";
    if (insurance.includes("CASER")) return "CASER";
    if (insurance.includes("DKV")) return "DKV";
    if (insurance.includes("HNA")) return "HNA";
    if (insurance.includes("SANTA") || insurance.includes("FDB") || insurance.includes("FUNDACION")) return "Santa Lucía / FDB";
    return "OTROS";
  }

  function dateKey(value) {
    const match = String(value || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return "";
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }

  function displayDate(key) {
    if (!key) return "—";
    const [year, month, day] = key.split("-");
    return `${day}/${month}/${year}`;
  }

  function sum(rows, index) {
    return rows.reduce((total, row) => total + number(row[index]), 0);
  }

  function latest(rows) {
    return [...rows].filter(row => row.key).sort((a, b) => a.key.localeCompare(b.key)).at(-1) || null;
  }

  function inPeriod(key, period) {
    if (!key) return false;
    if (period.mode === "day") return key === period.day;
    if (period.mode === "month") return key.startsWith(`${period.month}-`);
    return key >= period.start && key <= period.end;
  }

  function referenceKey(period, rows) {
    const last = latest(rows);
    if (period.mode === "day") return period.day;
    if (period.mode === "month") return `${period.month}-31`;
    return period.end || last?.key || "";
  }

  function readRange(valueRanges, name) {
    return valueRanges.find(item => String(item.range || "").startsWith(`${name}!`))?.values || [];
  }

  function dashboardCurrent(rows) {
    const amount = (row, col) => number(rows[row]?.[col]);
    return {
      latestKey: dateKey(rows[2]?.[1]),
      contribution: { sammarco: amount(11, 7), lemes: amount(12, 7), total: amount(13, 7) },
      audioMonth: {
        hearingAids: number(rows[22]?.[0]), hearingAidSales: amount(22, 2), repairs: amount(22, 4),
        tests: amount(22, 6), customerCards: amount(23, 2), smallMaterials: amount(23, 6), total: amount(24, 6)
      },
      audioMargins: [
        { category: rows[28]?.[0] || "Audífonos", billing: amount(28, 1), margin: null, status: rows[28]?.[5] || "PENDIENTE" },
        { category: rows[29]?.[0] || "Reparaciones", billing: amount(29, 1), margin: null, status: rows[29]?.[5] || "PENDIENTE" },
        { category: rows[30]?.[0] || "Mercadería / pequeño material", billing: amount(30, 1), margin: null, status: rows[30]?.[5] || "PENDIENTE" }
      ]
    };
  }

  class GoogleSheetsDataSource {
    constructor(config) {
      this.config = config;
      this.accessToken = "";
      this.expiresAt = 0;
      this.tokenClient = null;
      this.consentGranted = false;
      this.raw = null;
      this.email = "";
    }

    get configured() { return Boolean(this.config.googleClientId && this.config.backendUrl); }
    get connected() { return Boolean(this.accessToken && Date.now() < this.expiresAt); }

    async waitForGoogle() {
      for (let attempt = 0; attempt < 80; attempt += 1) {
        if (window.google?.accounts?.oauth2) return;
        await new Promise(resolve => window.setTimeout(resolve, 100));
      }
      throw new Error("No se ha podido cargar el acceso seguro de Google");
    }

    async connect(forceConsent = false) {
      if (!this.configured) throw new Error("Falta terminar la autorización de Google para este visor");
      if (this.connected && !forceConsent) return;
      await this.waitForGoogle();
      await new Promise((resolve, reject) => {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.config.googleClientId,
          scope: EMAIL_SCOPE,
          callback: response => {
            if (response.error) return reject(new Error("Google no autorizó el acceso al visor"));
            this.accessToken = response.access_token;
            this.expiresAt = Date.now() + Math.max(60, Number(response.expires_in || 3600) - 60) * 1000;
            this.consentGranted = true;
            resolve();
          },
          error_callback: () => reject(new Error("Se cerró o bloqueó la ventana de acceso a Google"))
        });
        this.tokenClient.requestAccessToken({ prompt: forceConsent || !this.consentGranted ? "select_account" : "" });
      });
    }

    disconnect() {
      if (this.accessToken && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(this.accessToken, () => {});
      this.accessToken = "";
      this.expiresAt = 0;
      this.consentGranted = false;
      this.raw = null;
      this.email = "";
    }

    async load(force = false) {
      await this.connect(false);
      if (this.raw && !force) return this.raw;
      const payload = await this.requestPrivateData();
      this.email = payload.email || "";
      this.raw = this.parse(payload.valueRanges || []);
      return this.raw;
    }

    requestPrivateData() {
      return new Promise((resolve, reject) => {
        const nonceBytes = new Uint8Array(24);
        window.crypto.getRandomValues(nonceBytes);
        const nonce = Array.from(nonceBytes, byte => byte.toString(16).padStart(2, "0")).join("");
        const frameName = `visor-caja-bridge-${nonce}`;
        const iframe = document.createElement("iframe");
        iframe.name = frameName;
        iframe.hidden = true;
        iframe.setAttribute("aria-hidden", "true");
        const form = document.createElement("form");
        form.method = "POST";
        form.action = this.config.backendUrl;
        form.target = frameName;
        form.hidden = true;
        const addField = (name, value) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        };
        addField("access_token", this.accessToken);
        addField("nonce", nonce);

        const cleanup = () => {
          window.removeEventListener("message", onMessage);
          window.clearTimeout(timer);
          form.remove();
          iframe.remove();
        };
        const onMessage = event => {
          const message = event.data;
          if (message?.type !== "visor-caja-response" || message.nonce !== nonce) return;
          cleanup();
          if (!message.ok) return reject(new Error(message.error || "No se pudo completar la consulta privada"));
          resolve(message);
        };
        const timer = window.setTimeout(() => {
          cleanup();
          reject(new Error("El servicio privado tardó demasiado en responder"));
        }, 45000);
        window.addEventListener("message", onMessage);
        document.body.append(iframe, form);
        form.submit();
      });
    }

    parse(valueRanges) {
      const daily = readRange(valueRanges, "DASHBOARD_DIARIO").slice(1).map(values => ({ key: dateKey(values[0]), values })).filter(row => row.key);
      const monthly = readRange(valueRanges, "DASHBOARD_MENSUAL").slice(1).map(values => ({ key: String(values[2] || ""), values })).filter(row => row.key);
      const summary = dashboardCurrent(readRange(valueRanges, "DASHBOARD_RESUMEN"));
      const pAB = readRange(valueRanges, "BASEP").slice(1);
      const allBasePRanges = valueRanges.filter(item => String(item.range || "").startsWith("BASEP!"));
      const pDE = allBasePRanges[1]?.values?.slice(1) || [];
      const pJU = allBasePRanges[2]?.values?.slice(1) || [];
      const invoiceCount = Math.max(pAB.length, pDE.length, pJU.length);
      const invoices = [];
      for (let index = 0; index < invoiceCount; index += 1) {
        const ab = pAB[index] || [], de = pDE[index] || [], ju = pJU[index] || [];
        const key = dateKey(ab[1]);
        if (!key || (!de[0] && !de[1] && !ju.some(value => !blank(value)))) continue;
        invoices.push({
          key, p: ab[0] || "", fecha: ab[1] || displayDate(key), factura: de[0] || "", paciente: de[1] || "",
          seguro: ju[0] || "", profesional: ju[1] || "", subtotal: number(ju[2]), igic: number(ju[3]), total: number(ju[4]),
          cobrado: number(ju[5]), efectivo: number(ju[6]), datafono: number(ju[7]), transferencia: number(ju[8]),
          fz: number(ju[9]), jjb: number(ju[10]), observaciones: ju[11] || ""
        });
      }
      const expenses = readRange(valueRanges, "BASEGASTOS").slice(1).map(row => ({
        key: dateKey(row[0]), fecha: row[0] || "", factura: row[1] || "", concepto: row[2] || "",
        efectivo: number(row[3]), tarjeta: number(row[4]), transferencia: number(row[5]), ingresos: number(row[6]), observaciones: row[7] || ""
      })).filter(row => row.key);
      const cashRows = readRange(valueRanges, "BASECAJA").slice(1).map(values => ({ key: dateKey(values[0]), values })).filter(row => row.key);
      return { daily, monthly, summary, invoices, expenses, cashRows };
    }

    build(period) {
      if (!this.raw) throw new Error("Todavía no se han cargado los datos");
      const dailyRows = this.raw.daily.filter(row => inPeriod(row.key, period));
      const selectedDaily = latest(dailyRows);
      const refKey = referenceKey(period, this.raw.daily);
      const refYear = Number(refKey.slice(0, 4));
      const refMonth = Number(refKey.slice(5, 7));
      const monthKey = `${refYear}-${String(refMonth).padStart(2, "0")}`;
      const monthRow = this.raw.monthly.find(row => row.key === monthKey)?.values || [];
      const halfStart = refMonth <= 6 ? 1 : 7;
      const halfEnd = refMonth <= 6 ? 6 : 12;
      const semesterRows = this.raw.monthly.filter(row => Number(row.values[0]) === refYear && Number(row.values[1]) >= halfStart && Number(row.values[1]) <= halfEnd);
      const yearRows = this.raw.monthly.filter(row => Number(row.values[0]) === refYear);
      const periodInvoices = this.raw.invoices.filter(row => inPeriod(row.key, period));
      const periodExpenses = this.raw.expenses.filter(row => inPeriod(row.key, period));
      const daily = selectedDaily?.values || [];
      const currentSelected = this.raw.summary.latestKey && inPeriod(this.raw.summary.latestKey, period);

      const billingTotals = {
        base: periodInvoices.reduce((t, r) => t + r.subtotal, 0), igic: periodInvoices.reduce((t, r) => t + r.igic, 0),
        total: periodInvoices.reduce((t, r) => t + r.total, 0), cash: periodInvoices.reduce((t, r) => t + r.efectivo, 0),
        card: periodInvoices.reduce((t, r) => t + r.datafono, 0), transfer: periodInvoices.reduce((t, r) => t + r.transferencia, 0),
        cashAndCard: periodInvoices.reduce((t, r) => t + r.efectivo + r.datafono, 0),
        orlInsurance: sum(dailyRows.map(row => row.values), 27), orlPrivate: sum(dailyRows.map(row => row.values), 28),
        orlTotal: sum(dailyRows.map(row => row.values), 29), prostheses: sum(dailyRows.map(row => row.values), 30)
      };
      const expenseTotals = {
        cash: periodExpenses.reduce((t, r) => t + r.efectivo, 0), card: periodExpenses.reduce((t, r) => t + r.tarjeta, 0),
        transfer: periodExpenses.reduce((t, r) => t + r.transferencia, 0), bankIncome: periodExpenses.reduce((t, r) => t + r.ingresos, 0)
      };
      const summary = {
        activity: {
          day: number(daily[5]), month: number(monthRow[5]), semester: sum(semesterRows.map(row => row.values), 5), year: sum(yearRows.map(row => row.values), 5),
          orlDay: number(daily[29]), audioDay: number(daily[30])
        },
        treasury: { safe: number(daily[16]), operatingCash: number(daily[15]), physicalCash: number(daily[14]), syncedBank: number(daily[19]), bankinter: number(daily[21]), liquidity: number(daily[23]) },
        control: { lastClose: displayDate(selectedDaily?.key), treasuryCutoff: displayDate(selectedDaily?.key), difference: number(daily[18]), monthExpenses: number(monthRow[6]), bankMonthNet: number(daily[26]) },
        monthActivity: { tests: number(daily[31]), private: number(daily[32]), insurance: number(daily[33]), incidents: number(daily[34]) },
        monthProfessionals: { barajas: number(daily[35]), sammarco: number(daily[36]), lemes: number(daily[37]), audio: number(daily[38]) },
        clinicContribution: currentSelected ? this.raw.summary.contribution : { sammarco: null, lemes: null, total: null },
        audioMonth: currentSelected ? this.raw.summary.audioMonth : { hearingAids: null, hearingAidSales: null, repairs: null, tests: null, customerCards: null, smallMaterials: null, total: null },
        audioMargins: currentSelected ? this.raw.summary.audioMargins : []
      };
      return {
        summary, billingTotals, invoices: periodInvoices, expenseTotals, expenses: periodExpenses,
        cash: this.buildCash(selectedDaily, this.raw.invoices.filter(row => row.key === selectedDaily?.key)), selectedKey: selectedDaily?.key || "", latestAvailableKey: latest(this.raw.daily)?.key || ""
      };
    }

    buildCash(selectedDaily, dailyInvoices = []) {
      const key = selectedDaily?.key || "";
      const sameDate = this.raw.cashRows.filter(row => row.key === key);
      const detail = [...sameDate].sort((a, b) => b.values.slice(4, 14).filter(value => !blank(value)).length - a.values.slice(4, 14).filter(value => !blank(value)).length)[0]?.values || [];
      const close = [...sameDate].sort((a, b) => Number(!blank(b.values[28])) - Number(!blank(a.values[28])) || b.values.slice(29, 63).filter(value => !blank(value)).length - a.values.slice(29, 63).filter(value => !blank(value)).length)[0]?.values || detail;
      const daily = selectedDaily?.values || [];
      const professionalColumns = CASH_PROFESSIONALS.map(column => ({ ...column }));
      const professionalAmounts = Object.fromEntries(CASH_CONCEPTS.map(concept => [concept, Object.fromEntries(CASH_PROFESSIONALS.map(column => [column.key, 0]))]));
      let unassignedTotal = 0;
      dailyInvoices.forEach(invoice => {
        const concept = cashConcept(invoice.seguro);
        const professional = cashProfessionalKey(invoice.profesional);
        if (professional === "unassigned") {
          unassignedTotal += invoice.total;
          professionalAmounts[concept].unassigned = number(professionalAmounts[concept].unassigned) + invoice.total;
          return;
        }
        professionalAmounts[concept][professional] += invoice.total;
      });
      if (unassignedTotal !== 0) professionalColumns.push({ key: "unassigned", label: "Sin profesional asignado" });

      const useInvoiceBreakdown = dailyInvoices.length > 0;
      const legacyBreakdown = {
        "Privados": { jjb: number(detail[4]), fz: number(detail[12]) }, "ADESLAS": { jjb: number(detail[5]), fz: 0 },
        "CASER": { jjb: number(detail[6]), fz: 0 }, "DKV": { jjb: number(detail[7]), fz: 0 }, "HNA": { jjb: number(detail[8]), fz: 0 },
        "Santa Lucía / FDB": { jjb: number(detail[9]), fz: 0 }, "OTROS": { jjb: number(detail[10]), fz: 0 }
      };
      const professionalRows = CASH_CONCEPTS.map(concept => {
        const amounts = professionalColumns.map(column => {
          if (column.key === "unassigned") return number(professionalAmounts[concept].unassigned);
          return useInvoiceBreakdown ? number(professionalAmounts[concept][column.key]) : number(legacyBreakdown[concept]?.[column.key]);
        });
        return { concept, amounts, total: amounts.reduce((total, value) => total + value, 0), emphasis: false };
      });
      const professionalTotals = professionalColumns.map((column, index) => professionalRows.reduce((total, row) => total + number(row.amounts[index]), 0));
      professionalRows.push({ concept: "Total facturado", amounts: professionalTotals, total: professionalTotals.reduce((total, value) => total + value, 0), emphasis: true });
      const denominations = [
        ["0,01 €", 29, 30], ["0,02 €", 31, 32], ["0,05 €", 33, 34], ["0,10 €", 35, 36], ["0,20 €", 37, 38], ["0,50 €", 39, 40],
        ["1 €", 41, 42], ["2 €", 43, 44], ["5 €", 47, 48], ["10 €", 49, 50], ["20 €", 51, 52], ["50 €", 53, 54],
        ["100 €", 55, 56], ["200 €", 57, 58], ["500 €", 59, 60]
      ].map(([value, countIndex, amountIndex]) => ({ value, count: number(close[countIndex]), amount: number(close[amountIndex]) }));
      denominations.push({ value: "Total", count: number(close[45]) + number(close[61]), amount: number(close[46]) + number(close[62]), total: true });
      const movement = (label, index, sign) => ({ label, value: Math.abs(number(close[index])), sign });
      const reconciliation = [
        { label: "Saldo anterior de caja", value: number(close[3]), sign: "" }, movement("Total facturado en el día", 15, "+"),
        movement("Facturado por datáfono", 16, "−"), movement("Crédito de aseguradoras", 17, "−"), movement("Facturado prótesis privados a crédito", 18, "−"),
        movement("Cobros de prótesis privados a crédito", 19, "+"), movement("Facturado privados a crédito", 20, "−"), movement("Cobros privados a crédito", 21, "+"),
        movement("Transferencias de pacientes", 22, "−"), movement("Gastos y pagos del día", 23, "−"), movement("Entregas a cuenta para audífonos", 24, "+"),
        movement("Ingreso de efectivo de caja a banco", 25, "−"), movement("Depósitos por audífonos a prueba", 26, "+"), movement("Devolución a pacientes privados", 27, "−"),
        { label: "Saldo final", value: number(close[28]), sign: "=", emphasis: true }
      ].filter(row => row.emphasis || row.label === "Saldo anterior de caja" || row.value !== 0);
      const difference = number(daily[18]);
      return {
        available: Boolean(key && sameDate.length), date: displayDate(key), cashier: close[1] || detail[1] || "—", state: Math.abs(difference) < 0.005 ? "CAJA CUADRADA" : "REVISAR CUADRE",
        billed: number(daily[5]) || number(detail[2]), opening: number(close[3]), professionalColumns, professionalRows, denominations, reconciliation,
        totalClose: number(close[28]), difference, distributionControl: difference, tomorrowCash: number(daily[15]), safeDeposit: number(close[64]),
        safeBalance: number(daily[16]), physicalCash: number(daily[14]), bagId: key.replaceAll("-", ""),
        depositMade: String(close[63] || "").trim().toUpperCase() === "SI" || String(close[63] || "").trim().toUpperCase() === "SÍ",
        closeMessage: sameDate.length ? `Cierre guardado: ${key}` : "Sin cierre guardado",
        bank1: number(daily[19]), bank2: number(daily[21]), totalBanks: number(daily[19]) + number(daily[21]), totalBalance: number(daily[23])
      };
    }
  }

  window.GoogleSheetsDataSource = GoogleSheetsDataSource;
})();
