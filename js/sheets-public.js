const SHEET_ID = "10S0GBW_TqlmBi4ushSho3X9_H47YYgsptEUB101KrC8";
const SHEET_NAME = "Respuestas de Forms";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

const NAME_HEADER = "1. NOMBRES COMPLETOS:";
const HIDE_PREFIXES = ["14.", "15."];

const els = {
  tableHead: document.querySelector("#dataTable thead"),
  tableBody: document.querySelector("#dataTable tbody"),
  statusText: document.getElementById("statusText"),
  btnRefresh: document.getElementById("btnRefresh"),
  filterNameA: document.getElementById("filterNameA"),
  filterNameB: document.getElementById("filterNameB"),
  btnClearFilters: document.getElementById("btnClearFilters"),
};

let headers = [];
let rows = [];
let visibleHeaders = [];

function isForcedHidden(header) {
  const text = String(header || "").trim();
  return HIDE_PREFIXES.some((prefix) => text.startsWith(prefix));
}

function isEmptyColumn(header) {
  return rows.every((row) => String(row[header] || "").trim() === "");
}

function computeVisibleHeaders() {
  visibleHeaders = headers.filter((header) => {
    if (header === NAME_HEADER) return true;
    if (isForcedHidden(header)) return false;
    if (isEmptyColumn(header)) return false;
    return true;
  });
}

function setStatus(text, isError = false) {
  if (!els.statusText) return;
  els.statusText.textContent = `Estado: ${text}`;
  els.statusText.style.borderColor = isError ? "rgba(208,32,128,0.65)" : "var(--border)";
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

function buildTable(filteredRows) {
  if (!headers.length) return;
  if (!visibleHeaders.length) {
    els.tableHead.innerHTML = "";
    els.tableBody.innerHTML = `<tr><td>No hay columnas para mostrar.</td></tr>`;
    return;
  }
  els.tableHead.innerHTML = `<tr>${visibleHeaders.map((h) => `<th>${h}</th>`).join("")}</tr>`;
  if (!filteredRows.length) {
    els.tableBody.innerHTML = `<tr><td colspan="${visibleHeaders.length}">Sin resultados con esos filtros.</td></tr>`;
    return;
  }
  els.tableBody.innerHTML = filteredRows
    .map((row) => `<tr>${visibleHeaders.map((h) => `<td>${row[h] || ""}</td>`).join("")}</tr>`)
    .join("");
}

function getUniqueValues(header) {
  const set = new Set();
  rows.forEach((row) => {
    if (row[header]) set.add(row[header]);
  });
  return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
}

function populateFilters() {
  const nameValues = headers.includes(NAME_HEADER) ? getUniqueValues(NAME_HEADER) : ["Todos"];

  els.filterNameA.innerHTML = nameValues.map((v) => `<option value="${v}">${v}</option>`).join("");
  els.filterNameB.innerHTML = nameValues.map((v) => `<option value="${v}">${v}</option>`).join("");
}

function applyFilters() {
  const nameA = els.filterNameA.value;
  const nameB = els.filterNameB.value;
  const pickA = nameA && nameA !== "Todos";
  const pickB = nameB && nameB !== "Todos";
  if (!pickA && !pickB) {
    buildTable(rows);
    return;
  }

  const filtered = [];
  if (pickA) {
    const oldest = rows.find((row) => (row[NAME_HEADER] || "") === nameA);
    if (oldest) filtered.push(oldest);
  }
  if (pickB) {
    const newest = [...rows].reverse().find((row) => (row[NAME_HEADER] || "") === nameB);
    if (newest) filtered.push(newest);
  }

  buildTable(filtered);
}

async function fetchSheet() {
  try {
    setStatus("Cargando...");
    const res = await fetch(CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("fetch");
    const text = await res.text();
    const data = parseCSV(text);
    if (!data.length) throw new Error("empty");

    headers = data[0];
    rows = data.slice(1).map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] || "";
      });
      return obj;
    });

    populateFilters();
    computeVisibleHeaders();
    applyFilters();
    setStatus("Listo");
  } catch (err) {
    setStatus("Error al cargar CSV", true);
  }
}

if (els.btnRefresh) els.btnRefresh.addEventListener("click", fetchSheet);
if (els.filterNameA) els.filterNameA.addEventListener("change", applyFilters);
if (els.filterNameB) els.filterNameB.addEventListener("change", applyFilters);
if (els.btnClearFilters) {
  els.btnClearFilters.addEventListener("click", () => {
    els.filterNameA.value = "Todos";
    els.filterNameB.value = "Todos";
    applyFilters();
  });
}

fetchSheet();
