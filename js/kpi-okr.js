// URL para obtener TODAS las filas del Google Sheets
// El formato gviz/tq?tqx=out:csv exporta todas las filas sin límites
const CSV_URL = "https://docs.google.com/spreadsheets/d/1H2FfTK-aDkY6icnG4zwGYjjBDuQ5W_--Kk9RqIuszec/gviz/tq?tqx=out:csv&gid=1335971072";

const SUPABASE_TABLE = "kpi_respuestas";

const LABELS = {
  timestamp: "Timestamp",
  name: "1. NOMBRES COMPLETOS:",
  role: "2. CARGO O ROL",
  area: "3. AREA O CANAL",
  evalDate: "4.FECHA DE EVALUACI\u00d3N",
  q4: "5. Canal principal de ventas",
  q5: "6. A\u00f1os o meses de experiencia en ventas",
  q6: "7. \u00bfCu\u00e1nto tiempo tardas en promedio en cerrar una venta?",
  q7: "9. \u00bfCierras la venta en el primer contacto con el cliente?",
  q8: "10. \u00bfSueles ofrecer m\u00e1s de un producto por venta?",
  q9: "11. \u00bfAplic\u00e1s cross-selling (combos, productos complementarios)?",
  q10: "12. Cuando un cliente no compra, \u00bfhaces seguimiento posterior?",
  q11: "13. \u00bfCuantas veces haces Retargeting?",
  q12: "14. \u00bfTienes un speech de ventas estructurado?",
  q13: "15. \u00bfQu\u00e9 tan seguro(a) te sientes al vender?",
  q14: "16. \u00bfCu\u00e1l consideras que es tu mayor dificultad al vender?",
  q15: "19. \u00bfQu\u00e9 esperas mejorar en esta capacitaci\u00f3n?",
  q8new: "8. \u00bfCuantas ventas cierras en una horas?",
  q17: "17. Conoces el m\u00e9todo Upselling?",
  q18: "18. Con que continuidad realizas Upselling?"
};

const HEADER_CANDIDATES = {
  timestamp: ["timestamp"],
  name: ["1. nombres completos", "nombres completos"],
  role: ["2. cargo o rol", "cargo o rol"],
  area: ["3. area o canal", "area o canal"],
  evalDate: ["4.fecha de evaluacion", "4 fecha de evaluacion", "fecha de evaluacion", "fecha evaluacion"],
  q4: ["5. canal principal de ventas", "canal principal de ventas"],
  q5: ["6. anos o meses de experiencia en ventas", "anos o meses de experiencia en ventas"],
  q6: ["7. cuanto tiempo tardas en promedio en cerrar una venta", "cuanto tiempo tardas en promedio en cerrar una venta"],
  q7: ["9. cierras la venta en el primer contacto con el cliente", "cierras la venta en el primer contacto con el cliente"],
  q8: ["10. sueles ofrecer mas de un producto por venta", "sueles ofrecer mas de un producto por venta"],
  q9: ["11. aplicas cross-selling", "aplicas cross-selling"],
  q10: ["12. cuando un cliente no compra, haces seguimiento posterior", "cuando un cliente no compra, haces seguimiento posterior"],
  q11: ["13. cuantas veces haces retargeting", "cuantas veces haces retargeting"],
  q12: ["14. tienes un speech de ventas estructurado", "tienes un speech de ventas estructurado"],
  q13: ["15. que tan seguro(a) te sientes al vender", "que tan seguro(a) te sientes al vender"],
  q14: ["16. cual consideras que es tu mayor dificultad al vender", "cual consideras que es tu mayor dificultad al vender"],
  q15: ["19. que esperas mejorar en esta capacitacion", "que esperas mejorar en esta capacitacion"],
  q8new: ["8. cuantas ventas cierras en una horas", "cuantas ventas cierras en una horas", "cuantas ventas cierras"],
  q17: ["17. conoces el metodo upselling", "conoces el metodo upselling", "conoces upselling"],
  q18: ["18. con que continuidad realizas upselling", "con que continuidad realizas upselling", "continuidad upselling"]
};

const OPTION_QUESTIONS = [
  { key: "role", label: LABELS.role, options: ["SUPERVISOR", "JEFE DE AREA", "VENDEDOR", "APRENDIZ"], includeScore: false, includeOkr: false }, // Pregunta 2
  { key: "area", label: LABELS.area, options: ["WHATSAPP", "TIKTOK", "LIVE", "MESSENGER", "MESENGER"], includeScore: false, includeOkr: false }, // Pregunta 3
  { key: "q4", label: LABELS.q4, options: ["WhatsApp", "Llamadas telef\u00f3nicas", "Ambos"], includeScore: false, includeOkr: false }, // Pregunta 5
  { key: "q5", label: LABELS.q5, options: ["Entre 1-3 meses", "Entre 3-6 meses", "Entre 6-12 meses", "M\u00e1s de un a\u00f1o"], includeScore: false, includeOkr: false }, // Pregunta 6
  { key: "q6", label: LABELS.q6, options: ["Generalmente no cierro en el primer contacto", "M\u00e1s de 20 minutos", "Entre 15 y 20 minutos", "Entre 10 y 15 minutos", "Menos de 10 minutos"] }, // Pregunta 7 - Incluida en score
  { key: "q7", label: LABELS.q7, options: ["No", "S\u00ed"] },
  { key: "q8", label: LABELS.q8, options: ["Nunca", "A veces", "Siempre"] },
  { key: "q9", label: LABELS.q9, options: ["No", "A veces", "S\u00ed"] },
  { key: "q10", label: LABELS.q10, options: ["No", "S\u00ed"] },
  { key: "q11", label: LABELS.q11, options: ["No hago seguimiento", "1 vez", "2 a 3 veces", "M\u00e1s de 3 veces"] },
  { key: "q12", label: LABELS.q12, options: ["No", "M\u00e1s o menos", "S\u00ed"] },
  { key: "q13", label: LABELS.q13, options: ["1", "2", "3", "4", "5"] },
  { key: "q8new", label: LABELS.q8new, options: ["No", "1", "2", "3", "4", "5", "M\u00e1s de 5"], includeScore: true, includeOkr: true }, // Pregunta 8 - Incluida en score y OKR
  { key: "q17", label: LABELS.q17, options: ["Si", "S\u00ed", "No"] }, // Pregunta 17 - Incluida en score
  { key: "q18", label: LABELS.q18, options: ["1 vez", "2 veces", "3 veces", "M\u00e1s de 3 veces", "Nunca"] } // Pregunta 18 - Incluida en score
];

const TEXT_FIELDS = [
  { key: "name", label: LABELS.name, type: "text" },
  { key: "evalDate", label: LABELS.evalDate, type: "date" },
  { key: "q14", label: LABELS.q14, type: "text" },
  { key: "q15", label: LABELS.q15, type: "text" }
];

const FORM_ORDER = [
  { type: "text", key: "name" },
  { type: "option", key: "role" },
  { type: "option", key: "area" },
  { type: "text", key: "evalDate" },
  { type: "option", key: "q4" },
  { type: "option", key: "q5" },
  { type: "option", key: "q6" },
  { type: "option", key: "q8new" },
  { type: "option", key: "q7" },
  { type: "option", key: "q8" },
  { type: "option", key: "q9" },
  { type: "option", key: "q10" },
  { type: "option", key: "q11" },
  { type: "option", key: "q12" },
  { type: "option", key: "q13" },
  { type: "text", key: "q14" },
  { type: "option", key: "q17" },
  { type: "option", key: "q18" },
  { type: "text", key: "q15" }
];

// ============================================
// CONFIGURACIÓN DE NUEVAS COLUMNAS
// ============================================
// Añade aquí las nuevas columnas del Sheets
// Formato:
// {
//   key: "q16",                    // Clave interna única (ej: q16, q17, etc.)
//   headerVariants: ["16. pregunta", "pregunta"],  // Variantes del nombre en el CSV (normalizadas)
//   label: "16. Pregunta completa", // Etiqueta para mostrar
//   type: "option",                 // "option" | "text" | "date"
//   options: ["Opción 1", "Opción 2"], // Solo si type === "option"
//   includeScore: false,            // true si afecta el score KPI, false si no
//   includeOkr: false,             // true si aparece en OKR, false si no
//   formOrder: { type: "option", key: "q16" } // Añadir a FORM_ORDER si debe aparecer en formularios
// }
const NEW_COLUMNS_CONFIG = [
  // Ejemplo de cómo añadir una nueva columna:
  // {
  //   key: "q16",
  //   headerVariants: ["16. nueva pregunta", "nueva pregunta"],
  //   label: "16. Nueva pregunta",
  //   type: "option",
  //   options: ["Sí", "No", "A veces"],
  //   includeScore: false,  // Cambiar a true si debe afectar el score
  //   includeOkr: false,
  //   formOrder: { type: "option", key: "q16" }
  // }
  // Añade aquí tus nuevas columnas siguiendo este formato
];

const els = {
  tabs: document.querySelectorAll(".nav-link"),
  panels: document.querySelectorAll(".tab-panel"),
  kpiForm: document.getElementById("kpiForm"),
  kpiScore: document.getElementById("kpiScore"),
  kpiStatus: document.getElementById("kpiStatus"),
  kpiMeterFill: document.getElementById("kpiMeterFill"),
  kpiBreakdown: document.getElementById("kpiBreakdown"),
  okrBody: document.getElementById("okrBody"),
  okrStatus: document.getElementById("okrStatus"),
  okrConfigBody: document.getElementById("okrConfigBody"),
  btnResetAll: document.getElementById("btnResetAll"),
  csvName: document.getElementById("csvName"),
  csvPick: document.getElementById("csvPick"),
  sbName: document.getElementById("sbName"),
  btnLoadSupabase: document.getElementById("btnLoadSupabase"),
  sbStatus: document.getElementById("sbStatus"),
  btnExportKpiPdf: document.getElementById("btnExportKpiPdf"),
  btnExportKpiXls: document.getElementById("btnExportKpiXls"),
  btnExportOkrPdf: document.getElementById("btnExportOkrPdf"),
  btnExportOkrXls: document.getElementById("btnExportOkrXls"),
  btnLoadCsv: document.getElementById("btnLoadCsv"),
  btnRefreshCsv: document.getElementById("btnRefreshCsv"),
  csvStatus: document.getElementById("csvStatus"),
  csvTableHead: document.querySelector("#csvTable thead"),
  csvTableBody: document.querySelector("#csvTable tbody"),
  recordSearch: document.getElementById("recordSearch"),
  clearSearch: document.getElementById("clearSearch"),
  prevRecord: document.getElementById("prevRecord"),
  nextRecord: document.getElementById("nextRecord"),
  recordIndex: document.getElementById("recordIndex"),
  totalRecords: document.getElementById("totalRecords"),
  dataSource: document.getElementById("dataSource"),
  compareA: document.getElementById("compareA"),
  compareB: document.getElementById("compareB"),
  comparePick: document.getElementById("comparePick"),
  compareCards: document.getElementById("compareCards"),
  sbCompareA: document.getElementById("sbCompareA"),
  sbCompareB: document.getElementById("sbCompareB"),
  compareSupabaseCards: document.getElementById("compareSupabaseCards"),
  btnExportComparePdf: document.getElementById("btnExportComparePdf"),
  btnExportCompareXls: document.getElementById("btnExportCompareXls"),
  btnExportCompareSbPdf: document.getElementById("btnExportCompareSbPdf"),
  btnExportCompareSbXls: document.getElementById("btnExportCompareSbXls"),
  scoreboard: document.getElementById("scoreboard"),
  changesBoard: document.getElementById("changesBoard"),
  charts: document.getElementById("charts"),
  supabaseForm: document.getElementById("supabaseForm"),
  btnSaveSupabase: document.getElementById("btnSaveSupabase"),
  supabaseStatus: document.getElementById("supabaseStatus")
};

let csvRows = [];
let csvHeaders = [];
let headerKeys = {};
const okrBest = {};
let supabaseRows = [];
let logoDataUrl = null;

// Función deprecada - Ahora usamos SecureAPI
// Mantenida para compatibilidad pero no debería usarse
function getSupabaseClient() {
  console.warn("getSupabaseClient() está deprecado. Usa window.SecureAPI en su lugar.");
  return null; // Ya no se usa directamente
}

function scoreQuestions() {
  return OPTION_QUESTIONS.filter((q) => q.includeScore !== false);
}

function okrQuestions() {
  return OPTION_QUESTIONS.filter((q) => q.includeOkr !== false);
}
let lastRow = null;

function fixMojibake(text) {
  if (!text) return text;
  let out = String(text);

  if (/[\u00c3\u00c2]/.test(out)) {
    try {
      out = decodeURIComponent(escape(out));
    } catch (err) {
      // ignore decode errors
    }
  }

  const replacements = {
    "\u00c3\u00a1": "\u00e1",
    "\u00c3\u00a9": "\u00e9",
    "\u00c3\u00ad": "\u00ed",
    "\u00c3\u00b3": "\u00f3",
    "\u00c3\u00ba": "\u00fa",
    "\u00c3\u00b1": "\u00f1",
    "\u00c3\u0081": "\u00c1",
    "\u00c3\u0089": "\u00c9",
    "\u00c3\u008d": "\u00cd",
    "\u00c3\u0093": "\u00d3",
    "\u00c3\u009a": "\u00da",
    "\u00c3\u0091": "\u00d1",
    "\u00c3\u00bc": "\u00fc",
    "\u00c3\u009c": "\u00dc",
    "\u00c2\u00bf": "\u00bf",
    "\u00c2\u00a1": "\u00a1",
    "\u00c2\u00ba": "\u00ba",
    "\u00c2\u00aa": "\u00aa",
    "\u00c2\u00b4": "\u00b4",
    "\u00c2\u00a8": "\u00a8",
    "\u00e2\u0080\u0093": "\u2013",
    "\u00e2\u0080\u0094": "\u2014",
    "\u00e2\u0080\u009c": "\u201c",
    "\u00e2\u0080\u009d": "\u201d",
    "\u00e2\u0080\u0099": "\u2019"
  };

  Object.entries(replacements).forEach(([bad, good]) => {
    out = out.split(bad).join(good);
  });

  return out.replace(/\u00a0/g, " ");
}

function cleanDisplay(value) {
  let text = String(value || "");
  text = fixMojibake(text);
  text = text.replace(/\uFFFD/g, "");
  return text;
}

function cleanCellValue(value) {
  return cleanDisplay(value).replace(/\s+/g, " ").trim();
}

function normalize(value) {
  let text = cleanDisplay(value);
  text = text.trim().toLowerCase();
  text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return text.replace(/\s+/g, " ");
}

let customSelectsReady = false;
const customSelects = new Map();

function updateSelectToggle(select, toggle) {
  const selected = select.selectedOptions[0];
  const label = selected ? selected.textContent : "Selecciona...";
  toggle.textContent = cleanDisplay(label);
  toggle.classList.toggle("is-placeholder", !select.value);
  toggle.setAttribute("aria-expanded", "false");
}

function buildSelectMenu(select, menu) {
  menu.innerHTML = "";
  Array.from(select.options).forEach((opt) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "select-option";
    option.textContent = cleanDisplay(opt.textContent);
    option.dataset.value = opt.value;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", opt.selected ? "true" : "false");
    if (opt.disabled) option.disabled = true;
    if (opt.selected) option.classList.add("is-selected");
    menu.appendChild(option);
  });
}

function closeAllCustomSelects(except) {
  document.querySelectorAll(".select-wrap.open").forEach((wrap) => {
    if (wrap !== except) wrap.classList.remove("open");
  });
}

function createCustomSelect(select) {
  if (!select || select.dataset.customized === "true") return;
  select.dataset.customized = "true";

  const wrap = document.createElement("div");
  wrap.className = "select-wrap";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "select-toggle";
  toggle.setAttribute("aria-haspopup", "listbox");
  toggle.setAttribute("aria-expanded", "false");
  const menu = document.createElement("div");
  menu.className = "select-menu";
  menu.setAttribute("role", "listbox");

  buildSelectMenu(select, menu);
  updateSelectToggle(select, toggle);

  wrap.appendChild(toggle);
  wrap.appendChild(menu);
  select.classList.add("native-select");
  select.tabIndex = -1;
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);

  toggle.addEventListener("click", () => {
    closeAllCustomSelects(wrap);
    wrap.classList.toggle("open");
    toggle.setAttribute("aria-expanded", wrap.classList.contains("open") ? "true" : "false");
    if (wrap.classList.contains("open")) {
      const options = Array.from(menu.querySelectorAll(".select-option:not([disabled])"));
      const selected = menu.querySelector(".select-option.is-selected") || options[0];
      if (selected) selected.focus();
    }
  });

  menu.addEventListener("click", (event) => {
    const option = event.target.closest(".select-option");
    if (!option || option.disabled) return;
    select.value = option.dataset.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    buildSelectMenu(select, menu);
    updateSelectToggle(select, toggle);
    wrap.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  });

  toggle.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    wrap.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    const options = Array.from(menu.querySelectorAll(".select-option:not([disabled])"));
    const selected = menu.querySelector(".select-option.is-selected") || options[0];
    if (selected) selected.focus();
  });

  menu.addEventListener("keydown", (event) => {
    const options = Array.from(menu.querySelectorAll(".select-option:not([disabled])"));
    if (!options.length) return;
    const current = document.activeElement.closest(".select-option");
    let idx = options.indexOf(current);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      idx = (idx + 1) % options.length;
      options[idx].focus();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      idx = (idx - 1 + options.length) % options.length;
      options[idx].focus();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      wrap.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (current) current.click();
    }
  });

  select.addEventListener("change", () => {
    buildSelectMenu(select, menu);
    updateSelectToggle(select, toggle);
  });

  customSelects.set(select, { wrap, toggle, menu });
}

function enhanceSelects(root = document) {
  root.querySelectorAll("select").forEach((select) => createCustomSelect(select));
  if (!customSelectsReady) {
    document.addEventListener("click", (event) => {
      const wrap = event.target.closest(".select-wrap");
      if (!wrap) closeAllCustomSelects();
    });
    customSelectsReady = true;
  }
}

function refreshCustomSelect(select) {
  const data = customSelects.get(select);
  if (!data) {
    createCustomSelect(select);
    return;
  }
  buildSelectMenu(select, data.menu);
  updateSelectToggle(select, data.toggle);
}

function parseCSV(text) {
  const input = text.replace(/^\uFEFF/, "");
  const data = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(current);
      // Incluir todas las filas, incluso si están parcialmente vacías
      // El filtrado se hará después en fetchCsv()
      data.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  // Incluir la última fila si tiene contenido
  if (row.length > 0) data.push(row);
  return data;
}

// Función para integrar automáticamente las nuevas columnas configuradas
function integrateNewColumns() {
  NEW_COLUMNS_CONFIG.forEach((config) => {
    // Añadir a LABELS
    LABELS[config.key] = config.label;
    
    // Añadir a HEADER_CANDIDATES
    HEADER_CANDIDATES[config.key] = config.headerVariants;
    
    // Añadir a OPTION_QUESTIONS o TEXT_FIELDS según el tipo
    if (config.type === "option") {
      OPTION_QUESTIONS.push({
        key: config.key,
        label: config.label,
        options: config.options || [],
        includeScore: config.includeScore !== false, // Por defecto true si no se especifica
        includeOkr: config.includeOkr !== false
      });
    } else if (config.type === "text" || config.type === "date") {
      TEXT_FIELDS.push({
        key: config.key,
        label: config.label,
        type: config.type
      });
    }
    
    // Añadir a FORM_ORDER si se especifica
    if (config.formOrder) {
      FORM_ORDER.push(config.formOrder);
    }
  });
}

// Integrar nuevas columnas al cargar el script
integrateNewColumns();

function resolveHeaders() {
  headerKeys = {};
  const normalizedHeaders = csvHeaders.map((h) => ({ raw: h, norm: normalize(h) }));

  // Resolver headers conocidos originales
  Object.entries(HEADER_CANDIDATES).forEach(([key, candidates]) => {
    const normalizedCandidates = candidates.map(normalize);
    const match = normalizedHeaders.find((header) =>
      normalizedCandidates.some((candidate) =>
        header.norm === candidate ||
        header.norm.startsWith(candidate) ||
        candidate.startsWith(header.norm) ||
        header.norm.includes(candidate)
      )
    );
    if (match) headerKeys[key] = match.raw;
  });
}

function getRowValue(row, key, label) {
  if (row[label] !== undefined) return row[label] || "";
  const header = headerKeys[key];
  if (header && row[header] !== undefined) return row[header] || "";
  if (row[key] !== undefined) return row[key] || "";
  return "";
}

function getNameHeader() {
  if (headerKeys.name) return headerKeys.name;
  const candidate = csvHeaders.find((h) => {
    const norm = normalize(h);
    return norm.includes("nombres") || norm.includes("nombre") || norm.includes("vendedor");
  });
  if (candidate) return candidate;
  return csvHeaders[1] || csvHeaders[0] || "";
}

function mapSupabaseRow(row) {
  return {
    [LABELS.name]: row.nombre || "",
    [LABELS.evalDate]: row.fecha_evaluacion || "",
    [LABELS.role]: row.cargo || "",
    [LABELS.area]: row.area_canal || "",
    [LABELS.q4]: row.canal_principal || "",
    [LABELS.q5]: row.experiencia || "",
    [LABELS.q6]: row.tiempo_cierre || "",
    [LABELS.q8new]: row.ventas_por_hora || "",
    [LABELS.q7]: row.cierra_primer_contacto || "",
    [LABELS.q8]: row.upsell || "",
    [LABELS.q9]: row.cross_selling || "",
    [LABELS.q10]: row.seguimiento || "",
    [LABELS.q11]: row.retargeting || "",
    [LABELS.q12]: row.speech || "",
    [LABELS.q13]: row.confianza || "",
    [LABELS.q14]: row.dificultad || "",
    [LABELS.q17]: row.conoce_upselling || "",
    [LABELS.q18]: row.continuidad_upselling || "",
    [LABELS.q15]: row.mejora || ""
  };
}

async function getLogoDataUrl() {
  if (logoDataUrl) return logoDataUrl;
  try {
    const res = await fetch("Jefita icono.jpeg");
    if (!res.ok) return null;
    const blob = await res.blob();
    const reader = new FileReader();
    const dataUrl = await new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    logoDataUrl = dataUrl;
    return dataUrl;
  } catch (err) {
    return null;
  }
}

function collectKpiExportRows(row) {
  return FORM_ORDER.map((entry) => {
    if (entry.type === "text") {
      const field = fieldByKey(entry.key);
      return [cleanDisplay(field.label), cleanDisplay(getRowValue(row, entry.key, field.label))];
    }
    const question = questionByKey(entry.key);
    return [cleanDisplay(question.label), cleanDisplay(getRowValue(row, entry.key, question.label))];
  });
}

function collectOkrExportRows(row) {
  const source = row || lastRow || csvRows[0] || {};
  const { scores } = computeScore(source);
  return scores.map((score) => {
    const state = getOkrState(score.score);
    return [cleanDisplay(score.label), "100%", formatPercentage(score.score), formatPercentage(score.score), state.label];
  });
}

// Función helper para crear header profesional en PDFs
function addPdfHeader(doc, title, logo, subtitle = null) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  
  // Fondo de header con color
  doc.setFillColor(242, 68, 85);
  doc.rect(0, 0, pageWidth, 100, "F");
  
  // Logo
  if (logo) {
    doc.addImage(logo, "JPEG", margin, 15, 50, 50);
  }
  
  // Título principal
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  const titleX = logo ? margin + 60 : margin;
  doc.text(title, titleX, 45);
  
  // Subtítulo si existe
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, titleX, 60);
  }
  
  // Fecha y hora
  doc.setFontSize(10);
  const dateStr = new Date().toLocaleString("es-PE", { 
    year: "numeric", 
    month: "long", 
    day: "numeric", 
    hour: "2-digit", 
    minute: "2-digit" 
  });
  doc.text(`Generado: ${dateStr}`, titleX, 75);
  
  // Línea decorativa
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1);
  doc.line(titleX, 80, pageWidth - margin, 80);
  
  // Resetear color de texto
  doc.setTextColor(0, 0, 0);
}

// Función helper para crear footer profesional
function addPdfFooter(doc, pageNumber, totalPages) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  
  // Información de la empresa
  doc.text("La Jefita - Sistema de Gestión de Ventas", margin, pageHeight - 30);
  
  // Número de página
  const pageText = `Página ${pageNumber} de ${totalPages}`;
  const pageTextWidth = doc.getTextWidth(pageText);
  doc.text(pageText, pageWidth - margin - pageTextWidth, pageHeight - 30);
  
  // Resetear color
  doc.setTextColor(0, 0, 0);
}

async function exportKpiPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.jsPDF.API || !window.jspdf.jsPDF.API.autoTable) return;
  const source = lastRow || getFormRow("kpi-");
  const rows = collectKpiExportRows(source);
  const { avg } = computeScore(source);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const logo = await getLogoDataUrl();
  
  // Header profesional
  addPdfHeader(doc, "Reporte KPI", logo, "Indicadores de Rendimiento");
  
  // Información del score
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(242, 68, 85);
  doc.text(`Score General: ${formatPercentage(avg)}`, 40, 130);
  doc.setTextColor(0, 0, 0);
  
  // Tabla mejorada
  doc.autoTable({
    startY: 150,
    head: [["Campo", "Respuesta"]],
    body: rows,
    theme: "striped",
    styles: { 
      font: "helvetica", 
      fontSize: 10,
      cellPadding: 8,
      overflow: "linebreak",
      cellWidth: "wrap"
    },
    headStyles: { 
      fillColor: [242, 68, 85],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 11,
      halign: "left"
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 180, fontStyle: "bold" },
      1: { cellWidth: "auto" }
    },
    margin: { top: 150, left: 40, right: 40 },
    didDrawPage: function(data) {
      addPdfFooter(doc, data.pageNumber, data.pageCount);
    }
  });
  
  doc.save("kpi-reporte.pdf");
}

function exportKpiXls() {
  if (!window.XLSX) return;
  const source = lastRow || getFormRow("kpi-");
  const rows = collectKpiExportRows(source);
  const sheetData = [
    ["Reporte KPI - La Jefita"],
    ["Generado", new Date().toLocaleString("es-PE")],
    [],
    ["Campo", "Respuesta"],
    ...rows
  ];
  const ws = window.XLSX.utils.aoa_to_sheet(sheetData);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "KPI");
  window.XLSX.writeFile(wb, "kpi-reporte.xlsx");
}

async function exportOkrPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.jsPDF.API || !window.jspdf.jsPDF.API.autoTable) return;
  const source = lastRow || getFormRow("kpi-");
  const rows = collectOkrExportRows(source);
  const { avg } = computeScore(source);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const logo = await getLogoDataUrl();
  
  // Header profesional
  addPdfHeader(doc, "Reporte OKR", logo, "Objetivos y Resultados Clave");
  
  // Información del avance
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(242, 68, 85);
  doc.text(`Avance General: ${formatPercentage(avg)}`, 40, 130);
  doc.setTextColor(0, 0, 0);
  
  // Tabla mejorada
  doc.autoTable({
    startY: 150,
    head: [["Objetivo", "KR (Meta)", "Actual", "% Avance", "Estado"]],
    body: rows,
    theme: "striped",
    styles: { 
      font: "helvetica", 
      fontSize: 9,
      cellPadding: 6,
      overflow: "linebreak",
      cellWidth: "wrap"
    },
    headStyles: { 
      fillColor: [242, 68, 85],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      halign: "center"
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 120, halign: "left" },
      1: { cellWidth: 80, halign: "center" },
      2: { cellWidth: 80, halign: "center" },
      3: { cellWidth: 70, halign: "center", fontStyle: "bold" },
      4: { cellWidth: 70, halign: "center" }
    },
    margin: { top: 150, left: 40, right: 40 },
    didDrawPage: function(data) {
      addPdfFooter(doc, data.pageNumber, data.pageCount);
    }
  });
  
  doc.save("okr-reporte.pdf");
}

function exportOkrXls() {
  if (!window.XLSX) return;
  const rows = collectOkrExportRows();
  const sheetData = [
    ["Reporte OKR - La Jefita"],
    ["Generado", new Date().toLocaleString("es-PE")],
    [],
    ["Objetivo", "KR (Meta)", "Actual", "% Avance", "Estado"],
    ...rows
  ];
  const ws = window.XLSX.utils.aoa_to_sheet(sheetData);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "OKR");
  window.XLSX.writeFile(wb, "okr-reporte.xlsx");
}

function collectCompareRows(label, row) {
  const base = collectKpiExportRows(row);
  return [[label, ""], ...base, ["", ""]];
}

async function exportComparePdf(getRows, filename) {
  if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.jsPDF.API || !window.jspdf.jsPDF.API.autoTable) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const logo = await getLogoDataUrl();
  
  // Header profesional
  addPdfHeader(doc, "Comparativo KPI", logo, "Análisis Comparativo de Vendedores");
  
  // Tabla mejorada
  doc.autoTable({
    startY: 130,
    head: [["Campo", "Respuesta"]],
    body: getRows(),
    theme: "striped",
    styles: { 
      font: "helvetica", 
      fontSize: 10,
      cellPadding: 8,
      overflow: "linebreak",
      cellWidth: "wrap"
    },
    headStyles: { 
      fillColor: [242, 68, 85],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 11,
      halign: "left"
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 180, fontStyle: "bold" },
      1: { cellWidth: "auto" }
    },
    margin: { top: 130, left: 40, right: 40 },
    didDrawPage: function(data) {
      addPdfFooter(doc, data.pageNumber, data.pageCount);
    }
  });
  
  doc.save(filename);
}

function exportCompareXls(getRows, filename) {
  if (!window.XLSX) return;
  const rows = getRows();
  const sheetData = [
    ["Comparativo KPI - La Jefita"],
    ["Generado", new Date().toLocaleString("es-PE")],
    [],
    ["Campo", "Respuesta"],
    ...rows
  ];
  const ws = window.XLSX.utils.aoa_to_sheet(sheetData);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Comparativo");
  window.XLSX.writeFile(wb, filename);
}

function formatSupabaseLabel(row) {
  const name = row.nombre || "Sin nombre";
  const created = row.created_at ? new Date(row.created_at) : null;
  if (!created || Number.isNaN(created.getTime())) return name;
  const date = created.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const time = created.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit"
  });
  return `${name} · ${date} ${time}`;
}

// Configuración de scoring: mejor respuesta y porcentajes para cada pregunta
const SCORING_CONFIG = {
  // Pregunta 7: ¿Cuánto tiempo tardas en promedio en cerrar una venta?
  q6: {
    best: "Menos de 10 minutos",
    scores: {
      "Menos de 10 minutos": 100,
      "Entre 10 y 15 minutos": 80,
      "Entre 15 y 20 minutos": 60,
      "Más de 20 minutos": 30,
      "Generalmente no cierro en el primer contacto": 0
    }
  },
  // Pregunta 8: ¿Cuantas ventas cierras en una horas?
  q8new: {
    best: "Más de 5",
    scores: {
      "Más de 5": 100,
      "5": 85,
      "4": 70,
      "3": 55,
      "2": 40,
      "1": 25,
      "No": 0
    }
  },
  // Pregunta 9: ¿Cierras la venta en el primer contacto con el cliente?
  q7: {
    best: "Sí",
    scores: {
      "Sí": 100,
      "No": 0
    }
  },
  // Pregunta 10: ¿Sueles ofrecer más de un producto por venta?
  q8: {
    best: "Siempre",
    scores: {
      "Siempre": 100,
      "A veces": 50,
      "Nunca": 0
    }
  },
  // Pregunta 11: ¿Aplicás cross-selling?
  q9: {
    best: "Sí",
    scores: {
      "Sí": 100,
      "A veces": 50,
      "No": 0
    }
  },
  // Pregunta 12: Cuando un cliente no compra, ¿haces seguimiento posterior?
  q10: {
    best: "Sí",
    scores: {
      "Sí": 100,
      "No": 0
    }
  },
  // Pregunta 13: ¿Cuantas veces haces Retargeting?
  q11: {
    best: "Más de 3 veces",
    scores: {
      "Más de 3 veces": 100,
      "2 a 3 veces": 75,
      "1 vez": 50,
      "No hago seguimiento": 0
    }
  },
  // Pregunta 14: ¿Tienes un speech de ventas estructurado?
  q12: {
    best: "Sí",
    scores: {
      "Sí": 100,
      "Más o menos": 50,
      "No": 0
    }
  },
  // Pregunta 15: ¿Qué tan seguro(a) te sientes al vender?
  q13: {
    best: "5",
    scores: {
      "5": 100,
      "4": 75,
      "3": 50,
      "2": 25,
      "1": 0
    }
  },
  // Pregunta 17: Conoces el método Upselling?
  q17: {
    best: "Sí",
    scores: {
      "Sí": 100,
      "Si": 100, // Variante
      "No": 0
    }
  },
  // Pregunta 18: Con que continuidad realizas Upselling?
  q18: {
    best: "Más de 3 veces",
    scores: {
      "Más de 3 veces": 100,
      "3 veces": 75,
      "2 veces": 50,
      "1 vez": 25,
      "Nunca": 0
    }
  }
};

function orderedOptions(question) {
  const best = okrBest[question.key] || (SCORING_CONFIG[question.key]?.best) || question.options[question.options.length - 1];
  const rest = question.options.filter((opt) => opt !== best);
  return [...rest, best];
}

function optionScore(question, value) {
  // Si hay configuración específica de scoring, usarla
  const config = SCORING_CONFIG[question.key];
  if (config && config.scores) {
    const normalizedValue = normalize(value);
    // Buscar coincidencia exacta o parcial
    for (const [option, score] of Object.entries(config.scores)) {
      if (normalize(option) === normalizedValue) {
        return score;
      }
    }
    // Si no hay coincidencia exacta, retornar 0
    return 0;
  }
  
  // Sistema de scoring por defecto (basado en posición, más gradual)
  const normalized = normalize(value);
  const options = orderedOptions(question).map((opt) => normalize(opt));
  const idx = options.indexOf(normalized);
  if (idx === -1) return 0;
  if (options.length === 1) return 100;
  
  // Cálculo más realista: distribución más gradual
  // La mejor opción (última) = 100%, la peor (primera) = 0%
  // Distribución más suave para opciones intermedias
  const totalOptions = options.length;
  if (totalOptions === 2) {
    // Solo 2 opciones: 0% o 100%
    return idx === totalOptions - 1 ? 100 : 0;
  }
  
  // Para 3+ opciones: distribución más gradual
  // Usar una curva más suave (cuadrática) para mejor distribución
  const progress = idx / (totalOptions - 1);
  // Aplicar curva suave: progresión más gradual al inicio, más rápida al final
  const smoothProgress = progress * progress;
  return Math.round(smoothProgress * 100);
}

function computeScore(row) {
  const scores = scoreQuestions().map((q) => {
    const value = getRowValue(row, q.key, q.label);
    return {
      key: q.key,
      label: q.label,
      score: optionScore(q, value),
      value
    };
  });
  const total = scores.reduce((sum, s) => sum + s.score, 0);
  // Calcular promedio con más precisión (1 decimal)
  const avg = scores.length ? Math.round((total / scores.length) * 10) / 10 : 0;
  return { avg, scores };
}

function getOkrState(score) {
  if (score >= 80) return { label: "Alto", className: "high" };
  if (score >= 50) return { label: "Medio", className: "med" };
  return { label: "Bajo", className: "low" };
}

function fieldByKey(key) {
  return TEXT_FIELDS.find((f) => f.key === key);
}

function questionByKey(key) {
  return OPTION_QUESTIONS.find((q) => q.key === key);
}

function buildForms() {
  const buildField = (prefix, entry) => {
    if (entry.type === "text") {
      const field = fieldByKey(entry.key);
      if (!field) return ""; // Si no se encuentra el campo, retornar vacío
      return `
        <div class="field">
          <label for="${prefix}${field.key}">${cleanDisplay(field.label)}</label>
          <input type="${field.type}" id="${prefix}${field.key}" />
        </div>
      `;
    }
    const question = questionByKey(entry.key);
    if (!question) {
      console.warn(`⚠️ Pregunta no encontrada: ${entry.key}`);
      return ""; // Si no se encuentra la pregunta, retornar vacío
    }
    const options = question.options
      .map((opt) => `<option value="${opt}">${cleanDisplay(opt)}</option>`)
      .join("");
    return `
      <div class="field">
        <label for="${prefix}${question.key}">${cleanDisplay(question.label)}</label>
        <select id="${prefix}${question.key}" data-qkey="${question.key}">
          <option value="">Selecciona...</option>
          ${options}
        </select>
      </div>
    `;
  };

  if (els.kpiForm) {
    els.kpiForm.innerHTML = FORM_ORDER.map((entry) => buildField("kpi-", entry)).join("");
  }
  if (els.supabaseForm) {
    els.supabaseForm.innerHTML = FORM_ORDER.map((entry) => buildField("sb-", entry)).join("");
  }
  enhanceSelects();
}

function buildOkrConfig() {
  if (!els.okrConfigBody) return;
  els.okrConfigBody.innerHTML = okrQuestions().map((q) => {
    // Usar la mejor respuesta de SCORING_CONFIG si está disponible, sino usar okrBest o la última opción
    const bestOption = okrBest[q.key] || SCORING_CONFIG[q.key]?.best || q.options[q.options.length - 1];
    const options = q.options.map((opt) => {
      const selected = bestOption === opt ? "selected" : "";
      return `<option value="${opt}" ${selected}>${cleanDisplay(opt)}</option>`;
    }).join("");
    return `
      <tr>
        <td>${cleanDisplay(q.label)}</td>
        <td>
          <select class="okr-best" data-qkey="${q.key}">
            ${options}
          </select>
        </td>
      </tr>
    `;
  }).join("");
  enhanceSelects();
  
  // Inicializar okrBest con las mejores respuestas de SCORING_CONFIG
  okrQuestions().forEach((q) => {
    if (SCORING_CONFIG[q.key]?.best && !okrBest[q.key]) {
      okrBest[q.key] = SCORING_CONFIG[q.key].best;
    }
  });
}

function getFormRow(prefix) {
  const row = {};
  OPTION_QUESTIONS.forEach((q) => {
    const el = document.getElementById(`${prefix}${q.key}`);
    row[q.label] = el ? el.value : "";
  });
  TEXT_FIELDS.forEach((field) => {
    const el = document.getElementById(`${prefix}${field.key}`);
    row[field.label] = el ? el.value : "";
  });
  return row;
}

function applyRowToForm(row) {
  OPTION_QUESTIONS.forEach((q) => {
    const el = document.getElementById(`kpi-${q.key}`);
    if (!el) return;
    const raw = getRowValue(row, q.key, q.label);
    const match = q.options.find((opt) => normalize(opt) === normalize(raw));
    el.value = match || "";
    refreshCustomSelect(el);
  });
  TEXT_FIELDS.forEach((field) => {
    const el = document.getElementById(`kpi-${field.key}`);
    if (el) el.value = cleanDisplay(getRowValue(row, field.key, field.label));
  });
}

function formatPercentage(value, decimals = 1) {
  if (value === 0) return "0%";
  if (value === 100) return "100%";
  // Mostrar decimales solo si es necesario (no es entero)
  const rounded = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return rounded % 1 === 0 ? `${Math.round(rounded)}%` : `${rounded.toFixed(decimals)}%`;
}

function renderKPI(row) {
  const data = row || getFormRow("kpi-");
  const { avg, scores } = computeScore(data);
  lastRow = data;

  const avgFormatted = formatPercentage(avg);
  if (els.kpiScore) els.kpiScore.textContent = avgFormatted;
  if (els.kpiStatus) els.kpiStatus.textContent = `Score: ${avgFormatted}`;
  if (els.kpiMeterFill) els.kpiMeterFill.style.width = `${avg}%`;
  if (els.kpiBreakdown) {
    els.kpiBreakdown.innerHTML = scores.map((s) => `
      <li>
        <span>${cleanDisplay(s.label)}</span>
        <strong>${formatPercentage(s.score)}</strong>
      </li>
    `).join("");
  }

  if (els.okrStatus) els.okrStatus.textContent = `Avance: ${avgFormatted}`;
  if (els.okrBody) renderOKR(scores);
}

function renderOKR(scores) {
  if (!els.okrBody) return;
  els.okrBody.innerHTML = scores.map((s) => {
    // El porcentaje de avance es simplemente el score (ya está en 0-100)
    const pct = s.score;
    const state = getOkrState(s.score);
    return `
      <tr>
        <td>${cleanDisplay(s.label)}</td>
        <td><span class="okr-pill">100%</span></td>
        <td>${formatPercentage(s.score)}</td>
        <td>${formatPercentage(pct)}</td>
        <td><span class="okr-state ${state.className}">${state.label}</span></td>
      </tr>
    `;
  }).join("");
}

function setTab(tabId) {
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  els.panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${tabId}`);
  });
}

function resetAll() {
  FORM_ORDER.forEach((entry) => {
    const kpiEl = document.getElementById(`kpi-${entry.key}`);
    const sbEl = document.getElementById(`sb-${entry.key}`);
    if (kpiEl) {
      kpiEl.value = "";
      if (kpiEl.tagName === "SELECT") refreshCustomSelect(kpiEl);
    }
    if (sbEl) {
      sbEl.value = "";
      if (sbEl.tagName === "SELECT") refreshCustomSelect(sbEl);
    }
  });
  renderKPI();
}

function parseDate(value) {
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date.getTime();
  return null;
}

function getRowTime(row, fallbackIdx) {
  const timestamp = getRowValue(row, "timestamp", LABELS.timestamp) || getRowValue(row, "evalDate", LABELS.evalDate);
  const parsed = parseDate(timestamp);
  return parsed !== null ? parsed : fallbackIdx;
}

function buildNameOptions() {
  const nameHeader = getNameHeader();
  const names = Array.from(
    new Set(csvRows.map((row) => cleanCellValue(row[nameHeader])).filter(Boolean))
  );
  const options = ["Selecciona..."]
    .concat(names.sort((a, b) => cleanDisplay(a).localeCompare(cleanDisplay(b), "es")))
    .map((name) => `<option value="${name}">${cleanDisplay(name)}</option>`)
    .join("");
  if (els.csvName) els.csvName.innerHTML = options;
  if (els.compareA) els.compareA.innerHTML = options;
  if (els.compareB) els.compareB.innerHTML = options;
  if (els.csvName) refreshCustomSelect(els.csvName);
  if (els.compareA) refreshCustomSelect(els.compareA);
  if (els.compareB) refreshCustomSelect(els.compareB);
}

function buildSupabaseOptions() {
  if (!els.sbName) return;
  const base = supabaseRows
    .map((row) => ({
      id: row.id,
      label: formatSupabaseLabel(row)
    }))
    .filter((row) => row.id);
  const options = base.length
    ? [{ id: "", label: "Selecciona...", disabled: true }].concat(base)
    : [{ id: "", label: "Sin registros", disabled: true }];
  const html = options
    .map((item, idx) => {
      const disabled = item.disabled || idx === 0;
      return `<option value="${disabled ? "" : item.id}" ${disabled ? "disabled" : ""}>${cleanDisplay(item.label)}</option>`;
    })
    .join("");
  els.sbName.innerHTML = html;
  
  // No seleccionar ningún valor automáticamente - siempre mostrar "Selecciona..."
  els.sbName.value = "";
  
  refreshCustomSelect(els.sbName);
}

function buildSupabaseCompareOptions() {
  if (!els.sbCompareA || !els.sbCompareB) return;
  const base = supabaseRows
    .map((row) => ({
      id: row.id,
      label: formatSupabaseLabel(row)
    }))
    .filter((row) => row.id);
  const options = base.length
    ? [{ id: "", label: "Selecciona...", disabled: true }].concat(base)
    : [{ id: "", label: "Sin registros", disabled: true }];
  const html = options
    .map((item, idx) => {
      const disabled = item.disabled || idx === 0;
      return `<option value="${disabled ? "" : item.id}" ${disabled ? "disabled" : ""}>${cleanDisplay(item.label)}</option>`;
    })
    .join("");
  els.sbCompareA.innerHTML = html;
  els.sbCompareB.innerHTML = html;
  refreshCustomSelect(els.sbCompareA);
  refreshCustomSelect(els.sbCompareB);
}

function loadCsvSelection() {
  if (!els.csvName || !els.csvPick) return;
  const nameHeader = getNameHeader();
  const name = els.csvName.value;
  if (!name || name === "Selecciona...") return;
  const target = normalize(name);
  const matches = csvRows
    .map((row, idx) => ({ row, idx, name: cleanCellValue(row[nameHeader]) }))
    .filter((item) => normalize(item.name) === target);
  if (!matches.length) return;
  const sorted = matches.slice().sort((a, b) => getRowTime(a.row, a.idx) - getRowTime(b.row, b.idx));
  const pick = els.csvPick.value === "newest" ? sorted[sorted.length - 1] : sorted[0];
  applyRowToForm(pick.row);
  renderKPI(pick.row);
}

function loadSupabaseSelection() {
  if (!els.sbName) return;
  const id = els.sbName.value;
  if (!id) return;
  const match = supabaseRows.find((row) => row.id === id);
  if (!match) return;
  const mapped = mapSupabaseRow(match);
  applyRowToForm(mapped);
  renderKPI(mapped);
  
  // Regresar el dropdown a "Selecciona..." después de cargar
  els.sbName.value = "";
  refreshCustomSelect(els.sbName);
}

function getCompareRow(name, pick) {
  if (!name || name === "Selecciona...") return null;
  const nameHeader = getNameHeader();
  const target = normalize(name);
  const matches = csvRows
    .map((row, idx) => ({ row, idx, name: cleanCellValue(row[nameHeader]) }))
    .filter((item) => normalize(item.name) === target);
  if (!matches.length) return null;
  const sorted = matches.slice().sort((a, b) => getRowTime(a.row, a.idx) - getRowTime(b.row, b.idx));
  return pick === "newest" ? sorted[sorted.length - 1].row : sorted[0].row;
}

function renderCompare() {
  if (!els.compareCards || !els.compareA || !els.compareB || !els.comparePick) return;
  const rowA = getCompareRow(els.compareA.value, els.comparePick.value);
  const rowB = getCompareRow(els.compareB.value, els.comparePick.value);
  const cards = [];

  if (rowA) {
    const scoreA = computeScore(rowA);
    cards.push(`
      <div class="compare-card">
        <h3>${cleanDisplay(els.compareA.value)}</h3>
        <div class="compare-meta">Score: ${formatPercentage(scoreA.avg)}</div>
        <ul class="kpi-list">
          ${scoreA.scores.map((s) => `<li><span>${cleanDisplay(s.label)}</span><strong>${formatPercentage(s.score)}</strong></li>`).join("")}
        </ul>
      </div>
    `);
  }
  if (rowB) {
    const scoreB = computeScore(rowB);
    cards.push(`
      <div class="compare-card">
        <h3>${cleanDisplay(els.compareB.value)}</h3>
        <div class="compare-meta">Score: ${formatPercentage(scoreB.avg)}</div>
        <ul class="kpi-list">
          ${scoreB.scores.map((s) => `<li><span>${cleanDisplay(s.label)}</span><strong>${formatPercentage(s.score)}</strong></li>`).join("")}
        </ul>
      </div>
    `);
  }

  els.compareCards.innerHTML = cards.length ? cards.join("") : "<div class=\"muted\">Selecciona dos vendedores.</div>";
}

function renderCompareSupabase() {
  if (!els.compareSupabaseCards || !els.sbCompareA || !els.sbCompareB) return;
  const rowA = supabaseRows.find((row) => row.id === els.sbCompareA.value);
  const rowB = supabaseRows.find((row) => row.id === els.sbCompareB.value);
  const cards = [];

  if (rowA) {
    const mapped = mapSupabaseRow(rowA);
    const scoreA = computeScore(mapped);
    cards.push(`
      <div class="compare-card">
        <h3>${cleanDisplay(formatSupabaseLabel(rowA))}</h3>
        <div class="compare-meta">Score: ${formatPercentage(scoreA.avg)}</div>
        <ul class="kpi-list">
          ${scoreA.scores.map((s) => `<li><span>${cleanDisplay(s.label)}</span><strong>${formatPercentage(s.score)}</strong></li>`).join("")}
        </ul>
      </div>
    `);
  }

  if (rowB) {
    const mapped = mapSupabaseRow(rowB);
    const scoreB = computeScore(mapped);
    cards.push(`
      <div class="compare-card">
        <h3>${cleanDisplay(formatSupabaseLabel(rowB))}</h3>
        <div class="compare-meta">Score: ${formatPercentage(scoreB.avg)}</div>
        <ul class="kpi-list">
          ${scoreB.scores.map((s) => `<li><span>${cleanDisplay(s.label)}</span><strong>${formatPercentage(s.score)}</strong></li>`).join("")}
        </ul>
      </div>
    `);
  }

  els.compareSupabaseCards.innerHTML = cards.length
    ? cards.join("")
    : "<div class=\"muted\">Selecciona dos registros de Supabase.</div>";
}

function renderScoreboard() {
  if (!els.scoreboard) return;
  const nameHeader = getNameHeader();
  const byName = new Map();
  csvRows.forEach((row) => {
    const name = row[nameHeader];
    if (!name) return;
    const { avg } = computeScore(row);
    const current = byName.get(name) || { best: 0 };
    if (avg > current.best) byName.set(name, { best: avg });
  });
  const top = Array.from(byName.entries())
    .map(([name, data]) => ({ name, score: data.best }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  els.scoreboard.innerHTML = top.length
    ? top.map((item, idx) => `
        <li>
          <span>${cleanDisplay(item.name)}</span>
          <span class="score-badge">${formatPercentage(item.score)}</span>
        </li>
      `).join("")
    : "<li>Sin datos</li>";
}

function renderChanges() {
  if (!els.changesBoard) return;
  const nameHeader = getNameHeader();
  const grouped = new Map();
  csvRows.forEach((row, idx) => {
    const name = row[nameHeader];
    if (!name) return;
    const list = grouped.get(name) || [];
    list.push({ row, idx });
    grouped.set(name, list);
  });

  const changes = [];
  grouped.forEach((list, name) => {
    const sorted = list.slice().sort((a, b) => getRowTime(a.row, a.idx) - getRowTime(b.row, b.idx));
    const oldest = computeScore(sorted[0].row).avg;
    const newest = computeScore(sorted[sorted.length - 1].row).avg;
    changes.push({ name, delta: newest - oldest });
  });

  const top = changes.sort((a, b) => b.delta - a.delta).slice(0, 10);
  els.changesBoard.innerHTML = top.length
    ? top.map((item) => `
        <li>
          <span>${cleanDisplay(item.name)}</span>
          <span class="score-badge">${item.delta >= 0 ? "+" : ""}${item.delta}%</span>
        </li>
      `).join("")
    : "<li>Sin datos</li>";
}

function renderCharts() {
  const container = els.charts;
  if (!container) return;
  container.innerHTML = OPTION_QUESTIONS.map((q) => {
    const counts = {};
    q.options.forEach((opt) => { counts[opt] = 0; });
    csvRows.forEach((row) => {
      const value = getRowValue(row, q.key, q.label);
      if (counts[value] !== undefined) counts[value] += 1;
    });
    const total = Object.values(counts).reduce((sum, v) => sum + v, 0) || 1;
    const bars = q.options.map((opt) => {
      const value = counts[opt] || 0;
      const pct = Math.round((value / total) * 100);
      return `
        <div class="chart-bar">
          <span>${cleanDisplay(opt)}</span>
          <div class="bar"><span style="width:${pct}%"></span></div>
          <strong>${pct}%</strong>
        </div>
      `;
    }).join("");
    return `
      <div class="chart">
        <h4>${cleanDisplay(q.label)}</h4>
        ${bars}
      </div>
    `;
  }).join("");
}

let filteredRows = [];
let currentIndex = 0;
let currentDataSource = "csv"; // "csv" o "supabase"

function filterRows(searchTerm = "") {
  const source = currentDataSource === "supabase" ? supabaseRows : csvRows;
  
  if (!searchTerm.trim()) {
    filteredRows = source;
  } else {
    const term = searchTerm.toLowerCase().trim();
    filteredRows = source.filter((row) => {
      // Si es Supabase, mapear primero a formato estándar
      const rowToSearch = currentDataSource === "supabase" ? mapSupabaseRow(row) : row;
      return Object.values(rowToSearch).some((value) => {
        const str = String(cleanCellValue(value)).toLowerCase();
        return str.includes(term);
      });
    });
  }
  currentIndex = 0;
  updateNavigation();
  renderDataTable();
}

function switchDataSource(source) {
  currentDataSource = source;
  if (source === "supabase" && supabaseRows.length === 0) {
    refreshSupabase();
  }
  filterRows(els.recordSearch?.value || "");
  updateStatus();
}

function updateStatus() {
  if (!els.csvStatus) return;
  const count = currentDataSource === "supabase" ? supabaseRows.length : csvRows.length;
  const sourceLabel = currentDataSource === "supabase" ? "Supabase" : "CSV";
  els.csvStatus.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
    ${sourceLabel}: ${count} filas
  `;
  
  // Actualizar título del panel
  const dataTitle = document.getElementById("dataTitle");
  if (dataTitle) {
    dataTitle.textContent = currentDataSource === "supabase" ? "Datos de Supabase" : "Datos del CSV";
  }
}

function updateNavigation() {
  const total = filteredRows.length;
  if (els.totalRecords) els.totalRecords.textContent = total;
  if (els.recordIndex) els.recordIndex.textContent = total > 0 ? currentIndex + 1 : 0;
  if (els.prevRecord) els.prevRecord.disabled = currentIndex === 0 || total === 0;
  if (els.nextRecord) els.nextRecord.disabled = currentIndex >= total - 1 || total === 0;
}

function showRecord(index) {
  if (index < 0 || index >= filteredRows.length) return;
  currentIndex = index;
  updateNavigation();
  renderDataTable();
}

function renderDataTable() {
  if (!els.csvTableHead || !els.csvTableBody) return;
  if (filteredRows.length === 0) {
    els.csvTableHead.innerHTML = "";
    els.csvTableBody.innerHTML = `<tr><td colspan="100" style="text-align:center;padding:40px;color:var(--text-muted);">No se encontraron registros</td></tr>`;
    return;
  }
  
  let headersToShow = [];
  let currentRow = null;
  
  if (currentDataSource === "supabase") {
    // Para Supabase, usar las labels estándar
    const mappedRow = mapSupabaseRow(filteredRows[currentIndex] || {});
    headersToShow = Object.keys(mappedRow).filter((key) => {
      const value = cleanCellValue(mappedRow[key]);
      return value && value.trim() !== "";
    });
    currentRow = mappedRow;
  } else {
    // Para CSV, usar las columnas del CSV
    const visibleHeaders = csvHeaders.filter((h) => {
      return filteredRows.some((row) => {
        const value = cleanCellValue(row[h]);
        return value && value.trim() !== "";
      });
    });
    headersToShow = visibleHeaders.length > 0 ? visibleHeaders : csvHeaders;
    currentRow = filteredRows[currentIndex];
  }
  
  const head = headersToShow.map((h) => `<th>${cleanDisplay(h)}</th>`).join("");
  els.csvTableHead.innerHTML = `<tr>${head}</tr>`;
  
  // Mostrar solo el registro actual
  const cells = headersToShow
    .map((h) => `<td data-label="${cleanDisplay(h)}"><div class="cell-clamp">${cleanCellValue(currentRow[h])}</div></td>`)
    .join("");
  els.csvTableBody.innerHTML = `<tr>${cells}</tr>`;
}

// Mantener compatibilidad con nombre anterior
function renderCsvTable() {
  renderDataTable();
}

async function fetchCsv() {
  const res = await fetch(CSV_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("csv");
  const buffer = await res.arrayBuffer();
  let text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  if (/[\uFFFD\u00c3\u00c2]/.test(text)) {
    text = new TextDecoder("windows-1252").decode(buffer);
  }
  text = fixMojibake(text);
  const data = parseCSV(text);
  csvHeaders = data[0] || [];
  
  // Procesar TODAS las filas del CSV, incluyendo filas con datos parciales
  csvRows = data.slice(1)
    .map((row) => {
      const obj = {};
      csvHeaders.forEach((h, i) => {
        obj[h] = row[i] !== undefined ? String(row[i]).trim() : "";
      });
      return obj;
    })
    // Filtrar solo filas completamente vacías, mantener todas las que tengan al menos un dato
    .filter((row) => {
      return Object.values(row).some((val) => val && String(val).trim() !== "");
    });
  
  console.log(`✅ CSV cargado: ${csvHeaders.length} columnas, ${csvRows.length} filas procesadas`);
  console.log(`📋 Columnas detectadas:`, csvHeaders);
  
  // Resolver headers conocidos
  resolveHeaders();
  
  // Detectar y analizar columnas nuevas no mapeadas
  const mappedHeaders = Object.values(headerKeys);
  const unmappedHeaders = csvHeaders.filter(h => h && !mappedHeaders.includes(h));
  if (unmappedHeaders.length > 0) {
    console.log(`🆕 Columnas nuevas detectadas (${unmappedHeaders.length}):`, unmappedHeaders);
    console.log(`💡 Estas columnas se mostrarán en la tabla pero no están mapeadas para cálculos KPI/OKR`);
    
    // Analizar valores de las nuevas columnas para sugerir tipo
    analyzeNewColumns(unmappedHeaders);
  }
}

// Función para analizar nuevas columnas y sugerir su configuración
function analyzeNewColumns(columnHeaders) {
  if (!csvRows || csvRows.length === 0) return;
  
  console.log(`\n📊 Análisis de nuevas columnas:`);
  columnHeaders.forEach((header, idx) => {
    // Obtener valores únicos de esta columna
    const values = csvRows
      .map(row => cleanCellValue(row[header]))
      .filter(v => v && v.trim() !== "")
      .slice(0, 20); // Limitar a primeros 20 para análisis
    
    const uniqueValues = Array.from(new Set(values));
    const isNumeric = values.some(v => !isNaN(parseFloat(v)) && isFinite(v));
    const isDate = values.some(v => {
      const d = new Date(v);
      return !isNaN(d.getTime());
    });
    const isOption = uniqueValues.length <= 10 && uniqueValues.length > 0;
    
    let suggestedType = "text";
    if (isDate) suggestedType = "date";
    else if (isOption) suggestedType = "option";
    
    console.log(`\n${idx + 1}. "${header}"`);
    console.log(`   Tipo sugerido: ${suggestedType}`);
    console.log(`   Valores únicos encontrados (${uniqueValues.length}):`, uniqueValues.slice(0, 10));
    if (uniqueValues.length > 10) console.log(`   ... y ${uniqueValues.length - 10} más`);
  });
  
  console.log(`\n💡 Para integrar estas columnas, necesito saber:`);
  console.log(`   1. Qué tipo de campo es cada una (text/option/date)`);
  console.log(`   2. Si es opción, cuáles son las opciones válidas`);
  console.log(`   3. Si afecta el score KPI (includeScore: true/false)`);
  console.log(`   4. Si debe aparecer en OKR (includeOkr: true/false)`);
}

async function refreshCsv() {
  try {
    if (els.csvStatus) els.csvStatus.textContent = "CSV: cargando...";
    await fetchCsv();
    buildNameOptions();
    renderScoreboard();
    if (currentDataSource === "csv") {
      filterRows(els.recordSearch?.value || "");
      updateStatus();
    }
    renderChanges();
    renderCharts();
    filterRows(els.recordSearch ? els.recordSearch.value : "");
    renderCompare();
    buildOkrConfig();
    if (els.csvStatus) els.csvStatus.textContent = `CSV: ${csvRows.length} filas`;
    if (els.okrBody && !els.kpiForm && csvRows.length) {
      const newest = csvRows
        .map((row, idx) => ({ row, idx }))
        .sort((a, b) => getRowTime(a.row, a.idx) - getRowTime(b.row, b.idx))
        .at(-1);
      if (newest) renderKPI(newest.row);
    }
  } catch (err) {
    if (els.csvStatus) els.csvStatus.textContent = "CSV: error";
    if (els.scoreboard) els.scoreboard.innerHTML = "<li>Error al cargar CSV</li>";
  }
}

async function refreshSupabase() {
  if (!window.SecureAPI) {
    if (els.sbStatus) els.sbStatus.textContent = "API no disponible";
    return;
  }
  try {
    if (els.sbStatus) els.sbStatus.textContent = "Supabase: cargando...";
    const data = await window.SecureAPI.getKpiRespuestas();
    supabaseRows = data || [];
    buildSupabaseOptions();
    buildSupabaseCompareOptions();
    if (els.sbStatus) els.sbStatus.textContent = `Supabase: ${supabaseRows.length} registros`;
    if (currentDataSource === "supabase") {
      filterRows(els.recordSearch?.value || "");
      updateStatus();
    }
  } catch (err) {
    console.error("Error cargando Supabase:", err);
    if (els.sbStatus) els.sbStatus.textContent = `Supabase: ${err.message || "error"}`;
  }
}

function getSupabasePayload() {
  const row = getFormRow("sb-");
  const { avg } = computeScore(row);
  return {
    nombre: row[LABELS.name] || null,
    fecha_evaluacion: row[LABELS.evalDate] || null,
    cargo: row[LABELS.role] || null,
    area_canal: row[LABELS.area] || null,
    canal_principal: row[LABELS.q4] || null,
    experiencia: row[LABELS.q5] || null,
    tiempo_cierre: row[LABELS.q6] || null,
    cierra_primer_contacto: row[LABELS.q7] || null,
    upsell: row[LABELS.q8] || null,
    cross_selling: row[LABELS.q9] || null,
    seguimiento: row[LABELS.q10] || null,
    retargeting: row[LABELS.q11] || null,
    speech: row[LABELS.q12] || null,
    confianza: row[LABELS.q13] || null,
    dificultad: row[LABELS.q14] || null,
    mejora: row[LABELS.q15] || null,
    score: avg
  };
}

async function saveToSupabase() {
  if (!window.SecureAPI) {
    if (els.supabaseStatus) els.supabaseStatus.textContent = "API no disponible";
    return;
  }
  const payload = getSupabasePayload();
  if (els.supabaseStatus) els.supabaseStatus.textContent = "Guardando...";
  try {
    await window.SecureAPI.saveKpiRespuesta(payload);
    if (els.supabaseStatus) els.supabaseStatus.textContent = "Guardado en Supabase";
    refreshSupabase();
  } catch (error) {
    console.error("Error guardando en Supabase:", error);
    if (els.supabaseStatus) els.supabaseStatus.textContent = `Error: ${error.message || "Error al guardar"}`;
  }
}

buildForms();
enhanceSelects();
renderKPI();
const needsCsv = [
  els.csvTableHead,
  els.csvTableBody,
  els.csvName,
  els.compareA,
  els.compareB,
  els.scoreboard,
  els.changesBoard,
  els.charts
].some(Boolean);
if (needsCsv) refreshCsv();
if (els.sbName || els.dataSource) refreshSupabase();

if (els.kpiForm) els.kpiForm.addEventListener("change", () => renderKPI());
if (els.okrConfigBody) {
  els.okrConfigBody.addEventListener("change", (event) => {
    const select = event.target.closest("select.okr-best");
    if (!select) return;
    const key = select.dataset.qkey;
    okrBest[key] = select.value;
    if (lastRow) {
      renderKPI(lastRow);
      return;
    }
    if (csvRows.length) {
      renderKPI(csvRows[0]);
      return;
    }
    renderKPI();
  });
}

els.tabs.forEach((btn) => {
  btn.addEventListener("click", () => setTab(btn.dataset.tab));
});

if (els.btnResetAll) els.btnResetAll.addEventListener("click", resetAll);
if (els.btnRefreshCsv) els.btnRefreshCsv.addEventListener("click", refreshCsv);
if (els.btnLoadCsv) els.btnLoadCsv.addEventListener("click", loadCsvSelection);
if (els.csvName) els.csvName.addEventListener("change", loadCsvSelection);

// Event listeners para búsqueda y navegación de registros
if (els.recordSearch) {
  els.recordSearch.addEventListener("input", (e) => {
    filterRows(e.target.value);
    if (els.clearSearch) els.clearSearch.style.display = e.target.value ? "flex" : "none";
  });
  els.recordSearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.preventDefault();
  });
}

if (els.clearSearch) {
  els.clearSearch.addEventListener("click", () => {
    if (els.recordSearch) {
      els.recordSearch.value = "";
      els.recordSearch.focus();
      filterRows("");
      els.clearSearch.style.display = "none";
    }
  });
}

if (els.prevRecord) {
  els.prevRecord.addEventListener("click", () => {
    if (currentIndex > 0) showRecord(currentIndex - 1);
  });
}

if (els.nextRecord) {
  els.nextRecord.addEventListener("click", () => {
    if (currentIndex < filteredRows.length - 1) showRecord(currentIndex + 1);
  });
}

// Navegación con teclado
document.addEventListener("keydown", (e) => {
  if (document.activeElement === els.recordSearch) return;
  if (e.key === "ArrowLeft" && els.prevRecord && !els.prevRecord.disabled) {
    e.preventDefault();
    els.prevRecord.click();
  } else if (e.key === "ArrowRight" && els.nextRecord && !els.nextRecord.disabled) {
    e.preventDefault();
    els.nextRecord.click();
  }
});
if (els.csvPick) els.csvPick.addEventListener("change", loadCsvSelection);
if (els.btnLoadSupabase) els.btnLoadSupabase.addEventListener("click", loadSupabaseSelection);
if (els.sbName) els.sbName.addEventListener("change", loadSupabaseSelection);
if (els.sbCompareA) els.sbCompareA.addEventListener("change", renderCompareSupabase);
if (els.sbCompareB) els.sbCompareB.addEventListener("change", renderCompareSupabase);
if (els.compareA) els.compareA.addEventListener("change", renderCompare);
if (els.compareB) els.compareB.addEventListener("change", renderCompare);
if (els.comparePick) els.comparePick.addEventListener("change", renderCompare);
if (els.btnSaveSupabase) els.btnSaveSupabase.addEventListener("click", saveToSupabase);
if (els.sbCompareA || els.sbCompareB) renderCompareSupabase();
if (els.btnExportKpiPdf) els.btnExportKpiPdf.addEventListener("click", exportKpiPdf);
if (els.btnExportKpiXls) els.btnExportKpiXls.addEventListener("click", exportKpiXls);
if (els.btnExportOkrPdf) els.btnExportOkrPdf.addEventListener("click", exportOkrPdf);
if (els.btnExportOkrXls) els.btnExportOkrXls.addEventListener("click", exportOkrXls);
if (els.btnExportComparePdf) {
  els.btnExportComparePdf.addEventListener("click", () => {
    const rowA = getCompareRow(els.compareA?.value, els.comparePick?.value);
    const rowB = getCompareRow(els.compareB?.value, els.comparePick?.value);
    const rows = () => [
      ...collectCompareRows("Vendedor A", rowA || {}),
      ...collectCompareRows("Vendedor B", rowB || {})
    ];
    exportComparePdf(rows, "comparativo-kpi.csv.pdf");
  });
}
if (els.btnExportCompareXls) {
  els.btnExportCompareXls.addEventListener("click", () => {
    const rowA = getCompareRow(els.compareA?.value, els.comparePick?.value);
    const rowB = getCompareRow(els.compareB?.value, els.comparePick?.value);
    const rows = () => [
      ...collectCompareRows("Vendedor A", rowA || {}),
      ...collectCompareRows("Vendedor B", rowB || {})
    ];
    exportCompareXls(rows, "comparativo-kpi.xlsx");
  });
}
if (els.btnExportCompareSbPdf) {
  els.btnExportCompareSbPdf.addEventListener("click", () => {
    const rowA = supabaseRows.find((row) => row.id === els.sbCompareA?.value);
    const rowB = supabaseRows.find((row) => row.id === els.sbCompareB?.value);
    const rows = () => [
      ...collectCompareRows("Registro A", mapSupabaseRow(rowA || {})),
      ...collectCompareRows("Registro B", mapSupabaseRow(rowB || {}))
    ];
    exportComparePdf(rows, "comparativo-supabase.pdf");
  });
}
if (els.btnExportCompareSbXls) {
  els.btnExportCompareSbXls.addEventListener("click", () => {
    const rowA = supabaseRows.find((row) => row.id === els.sbCompareA?.value);
    const rowB = supabaseRows.find((row) => row.id === els.sbCompareB?.value);
    const rows = () => [
      ...collectCompareRows("Registro A", mapSupabaseRow(rowA || {})),
      ...collectCompareRows("Registro B", mapSupabaseRow(rowB || {}))
    ];
    exportCompareXls(rows, "comparativo-supabase.xlsx");
  });
}

// Event listener para cambiar entre CSV y Supabase en la página de datos
if (els.dataSource) {
  els.dataSource.addEventListener("change", (e) => {
    switchDataSource(e.target.value);
  });
  // Inicializar con el valor por defecto
  if (els.dataSource.value) {
    currentDataSource = els.dataSource.value;
    switchDataSource(els.dataSource.value);
  }
}
