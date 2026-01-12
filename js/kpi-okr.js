const CSV_URL = "https://docs.google.com/spreadsheets/d/10S0GBW_TqlmBi4ushSho3X9_H47YYgsptEUB101KrC8/gviz/tq?tqx=out:csv&gid=670243679";

const SUPABASE_URL = "https://bcqmrshqfcjqoeeqmhby.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_I1NhHflv8MVPr7qYNQ6izQ_v-5b493n";
const SUPABASE_TABLE = "kpi_respuestas";

const LABELS = {
  timestamp: "Timestamp",
  name: "1. NOMBRES COMPLETOS:",
  role: "2. CARGO O ROL",
  area: "3. AREA O CANAL",
  evalDate: "FECHA DE EVALUACI\u00d3N",
  q4: "4. Canal principal de ventas",
  q5: "5. A\u00f1os o meses de experiencia en ventas",
  q6: "6. \u00bfCu\u00e1nto tiempo tardas en promedio en cerrar una venta?",
  q7: "7. \u00bfCierras la venta en el primer contacto con el cliente?",
  q8: "8. \u00bfSueles ofrecer m\u00e1s de un producto por venta?",
  q9: "9. \u00bfAplic\u00e1s cross-selling (combos, productos complementarios)?",
  q10: "10. Cuando un cliente no compra, \u00bfhaces seguimiento posterior?",
  q11: "11. \u00bfCu\u00e1ntas veces haces Retargeting?",
  q12: "12. \u00bfTienes un speech de ventas estructurado?",
  q13: "13. \u00bfQu\u00e9 tan seguro(a) te sientes al vender?",
  q14: "14. \u00bfCu\u00e1l consideras que es tu mayor dificultad al vender?",
  q15: "15. \u00bfQu\u00e9 esperas mejorar en esta capacitaci\u00f3n?"
};

const HEADER_CANDIDATES = {
  timestamp: ["timestamp"],
  name: ["1. nombres completos", "nombres completos"],
  role: ["2. cargo o rol", "cargo o rol"],
  area: ["3. area o canal", "area o canal"],
  evalDate: ["fecha de evaluacion", "fecha evaluacion"],
  q4: ["4. canal principal de ventas", "canal principal de ventas"],
  q5: ["5. anos o meses de experiencia en ventas", "anos o meses de experiencia en ventas"],
  q6: ["6. cuanto tiempo tardas en promedio en cerrar una venta", "cuanto tiempo tardas en promedio en cerrar una venta"],
  q7: ["7. cierras la venta en el primer contacto con el cliente", "cierras la venta en el primer contacto con el cliente"],
  q8: ["8. sueles ofrecer mas de un producto por venta", "sueles ofrecer mas de un producto por venta"],
  q9: ["9. aplicas cross-selling", "aplicas cross-selling"],
  q10: ["10. cuando un cliente no compra, haces seguimiento posterior", "cuando un cliente no compra, haces seguimiento posterior"],
  q11: ["11. cuantas veces haces retargeting", "cuantas veces haces retargeting"],
  q12: ["12. tienes un speech de ventas estructurado", "tienes un speech de ventas estructurado"],
  q13: ["13. que tan seguro(a) te sientes al vender", "que tan seguro(a) te sientes al vender"],
  q14: ["14. cual consideras que es tu mayor dificultad al vender", "cual consideras que es tu mayor dificultad al vender"],
  q15: ["15. que esperas mejorar en esta capacitacion", "que esperas mejorar en esta capacitacion"]
};

const OPTION_QUESTIONS = [
  { key: "role", label: LABELS.role, options: ["SUPERVISOR", "JEFE DE AREA", "VENDEDOR", "APRENDIZ"], includeScore: false, includeOkr: false },
  { key: "q4", label: LABELS.q4, options: ["WhatsApp", "Llamadas telef\u00f3nicas", "Ambos"] },
  { key: "q5", label: LABELS.q5, options: ["Entre 1-3 meses", "Entre 3-6 meses", "Entre 6-12 meses", "M\u00e1s de un a\u00f1o"] },
  { key: "q6", label: LABELS.q6, options: ["Generalmente no cierro en el primer contacto", "M\u00e1s de 20 minutos", "Entre 15 y 20 minutos", "Entre 10 y 15 minutos", "Menos de 10 minutos"] },
  { key: "q7", label: LABELS.q7, options: ["No", "S\u00ed"] },
  { key: "q8", label: LABELS.q8, options: ["Nunca", "A veces", "Siempre"] },
  { key: "q9", label: LABELS.q9, options: ["No", "A veces", "S\u00ed"] },
  { key: "q10", label: LABELS.q10, options: ["No", "S\u00ed"] },
  { key: "q11", label: LABELS.q11, options: ["No hago seguimiento", "1 vez", "2 a 3 veces", "M\u00e1s de 3 veces"] },
  { key: "q12", label: LABELS.q12, options: ["No", "M\u00e1s o menos", "S\u00ed"] },
  { key: "q13", label: LABELS.q13, options: ["1", "2", "3", "4", "5"] }
];

const TEXT_FIELDS = [
  { key: "name", label: LABELS.name, type: "text" },
  { key: "area", label: LABELS.area, type: "text" },
  { key: "evalDate", label: LABELS.evalDate, type: "date" },
  { key: "q14", label: LABELS.q14, type: "text" },
  { key: "q15", label: LABELS.q15, type: "text" }
];

const FORM_ORDER = [
  { type: "text", key: "name" },
  { type: "option", key: "role" },
  { type: "text", key: "area" },
  { type: "text", key: "evalDate" },
  { type: "option", key: "q4" },
  { type: "option", key: "q5" },
  { type: "option", key: "q6" },
  { type: "option", key: "q7" },
  { type: "option", key: "q8" },
  { type: "option", key: "q9" },
  { type: "option", key: "q10" },
  { type: "option", key: "q11" },
  { type: "option", key: "q12" },
  { type: "option", key: "q13" },
  { type: "text", key: "q14" },
  { type: "text", key: "q15" }
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
  btnLoadCsv: document.getElementById("btnLoadCsv"),
  btnRefreshCsv: document.getElementById("btnRefreshCsv"),
  csvStatus: document.getElementById("csvStatus"),
  csvTableHead: document.querySelector("#csvTable thead"),
  csvTableBody: document.querySelector("#csvTable tbody"),
  compareA: document.getElementById("compareA"),
  compareB: document.getElementById("compareB"),
  comparePick: document.getElementById("comparePick"),
  compareCards: document.getElementById("compareCards"),
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
}

function buildSelectMenu(select, menu) {
  menu.innerHTML = "";
  Array.from(select.options).forEach((opt) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "select-option";
    option.textContent = cleanDisplay(opt.textContent);
    option.dataset.value = opt.value;
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
  const menu = document.createElement("div");
  menu.className = "select-menu";

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
  });

  menu.addEventListener("click", (event) => {
    const option = event.target.closest(".select-option");
    if (!option || option.disabled) return;
    select.value = option.dataset.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    buildSelectMenu(select, menu);
    updateSelectToggle(select, toggle);
    wrap.classList.remove("open");
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
      if (row.some((cell) => cell.trim() !== "")) data.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((cell) => cell.trim() !== "")) data.push(row);
  return data;
}

function resolveHeaders() {
  headerKeys = {};
  const normalizedHeaders = csvHeaders.map((h) => ({ raw: h, norm: normalize(h) }));

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
  return "";
}

function getNameHeader() {
  if (headerKeys.name) return headerKeys.name;
  const candidate = csvHeaders.find((h) => normalize(h).includes("nombres"));
  if (candidate) return candidate;
  return csvHeaders[1] || csvHeaders[0] || "";
}

function orderedOptions(question) {
  const best = okrBest[question.key];
  if (!best) return question.options;
  const rest = question.options.filter((opt) => opt !== best);
  return [...rest, best];
}

function optionScore(question, value) {
  const normalized = normalize(value);
  const options = orderedOptions(question).map((opt) => normalize(opt));
  const idx = options.indexOf(normalized);
  if (idx === -1) return 0;
  if (options.length === 1) return 100;
  return Math.round((idx / (options.length - 1)) * 100);
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
  const avg = scores.length ? Math.round(total / scores.length) : 0;
  return { avg, scores };
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
      return `
        <div class="field">
          <label for="${prefix}${field.key}">${cleanDisplay(field.label)}</label>
          <input type="${field.type}" id="${prefix}${field.key}" />
        </div>
      `;
    }
    const question = questionByKey(entry.key);
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
    const options = q.options.map((opt) => {
      const selected = okrBest[q.key] === opt ? "selected" : "";
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
  });
  TEXT_FIELDS.forEach((field) => {
    const el = document.getElementById(`kpi-${field.key}`);
    if (el) el.value = cleanDisplay(getRowValue(row, field.key, field.label));
  });
}

function renderKPI(row) {
  const data = row || getFormRow("kpi-");
  const { avg, scores } = computeScore(data);
  lastRow = data;

  if (els.kpiScore) els.kpiScore.textContent = `${avg}%`;
  if (els.kpiStatus) els.kpiStatus.textContent = `Score: ${avg}%`;
  if (els.kpiMeterFill) els.kpiMeterFill.style.width = `${avg}%`;
  if (els.kpiBreakdown) {
    els.kpiBreakdown.innerHTML = scores.map((s) => `
      <li>
        <span>${cleanDisplay(s.label)}</span>
        <strong>${s.score}%</strong>
      </li>
    `).join("");
  }

  if (els.okrStatus) els.okrStatus.textContent = `Avance: ${avg}%`;
  if (els.okrBody) renderOKR(scores);
}

function renderOKR(scores) {
  if (!els.okrBody) return;
  els.okrBody.innerHTML = scores.map((s) => {
    const pct = Math.round((s.score / 100) * 100) || 0;
    return `
      <tr>
        <td>${cleanDisplay(s.label)}</td>
        <td><span class="okr-pill">100%</span></td>
        <td>${s.score}%</td>
        <td>${pct}%</td>
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
    if (kpiEl) kpiEl.value = "";
    if (sbEl) sbEl.value = "";
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
  const names = Array.from(new Set(csvRows.map((row) => row[nameHeader]).filter(Boolean)));
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

function loadCsvSelection() {
  if (!els.csvName || !els.csvPick) return;
  const nameHeader = getNameHeader();
  const name = els.csvName.value;
  if (!name || name === "Selecciona...") return;
  const target = normalize(name);
  const matches = csvRows
    .map((row, idx) => ({ row, idx, name: row[nameHeader] }))
    .filter((item) => normalize(item.name) === target);
  if (!matches.length) return;
  const sorted = matches.slice().sort((a, b) => getRowTime(a.row, a.idx) - getRowTime(b.row, b.idx));
  const pick = els.csvPick.value === "newest" ? sorted[sorted.length - 1] : sorted[0];
  applyRowToForm(pick.row);
  renderKPI(pick.row);
}

function getCompareRow(name, pick) {
  if (!name || name === "Selecciona...") return null;
  const nameHeader = getNameHeader();
  const target = normalize(name);
  const matches = csvRows
    .map((row, idx) => ({ row, idx, name: row[nameHeader] }))
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
        <div class="compare-meta">Score: ${scoreA.avg}%</div>
        <ul class="kpi-list">
          ${scoreA.scores.map((s) => `<li><span>${cleanDisplay(s.label)}</span><strong>${s.score}%</strong></li>`).join("")}
        </ul>
      </div>
    `);
  }
  if (rowB) {
    const scoreB = computeScore(rowB);
    cards.push(`
      <div class="compare-card">
        <h3>${cleanDisplay(els.compareB.value)}</h3>
        <div class="compare-meta">Score: ${scoreB.avg}%</div>
        <ul class="kpi-list">
          ${scoreB.scores.map((s) => `<li><span>${cleanDisplay(s.label)}</span><strong>${s.score}%</strong></li>`).join("")}
        </ul>
      </div>
    `);
  }

  els.compareCards.innerHTML = cards.length ? cards.join("") : "<div class=\"muted\">Selecciona dos vendedores.</div>";
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
          <span class="score-badge">${item.score}%</span>
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

function renderCsvTable() {
  if (!els.csvTableHead || !els.csvTableBody) return;
  const visibleHeaders = csvHeaders.filter((h) =>
    csvRows.some((row) => cleanCellValue(row[h]))
  );
  const head = visibleHeaders.map((h) => `<th>${cleanDisplay(h)}</th>`).join("");
  els.csvTableHead.innerHTML = `<tr>${head}</tr>`;
  els.csvTableBody.innerHTML = csvRows.map((row) => {
    const cells = visibleHeaders
      .map((h) => `<td><div class="cell-clamp">${cleanCellValue(row[h])}</div></td>`)
      .join("");
    return `<tr>${cells}</tr>`;
  }).join("");
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
  csvRows = data.slice(1).map((row) => {
    const obj = {};
    csvHeaders.forEach((h, i) => {
      obj[h] = row[i] || "";
    });
    return obj;
  });
  resolveHeaders();
}

async function refreshCsv() {
  try {
    if (els.csvStatus) els.csvStatus.textContent = "CSV: cargando...";
    await fetchCsv();
    buildNameOptions();
    renderScoreboard();
    renderChanges();
    renderCharts();
    renderCsvTable();
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
  if (!window.supabase) return;
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const payload = getSupabasePayload();
  if (els.supabaseStatus) els.supabaseStatus.textContent = "Guardando...";
  const { error } = await client.from(SUPABASE_TABLE).insert(payload);
  if (error) {
    if (els.supabaseStatus) els.supabaseStatus.textContent = `Error: ${error.message}`;
    return;
  }
  if (els.supabaseStatus) els.supabaseStatus.textContent = "Guardado en Supabase";
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
if (els.csvPick) els.csvPick.addEventListener("change", loadCsvSelection);
if (els.compareA) els.compareA.addEventListener("change", renderCompare);
if (els.compareB) els.compareB.addEventListener("change", renderCompare);
if (els.comparePick) els.comparePick.addEventListener("change", renderCompare);
if (els.btnSaveSupabase) els.btnSaveSupabase.addEventListener("click", saveToSupabase);

