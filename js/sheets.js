const API_BASE = "http://localhost:3001";

const FALLBACK_HEADERS = [
  "Timestamp",
  "1. NOMBRES COMPLETOS:",
  "2. CARGO O ROL",
  "3. AREA O CANAL",
  "FECHA DE EVALUACIÓN",
  "4. Canal principal de ventas",
  "5. Años o meses de experiencia en ventas",
  "6. ¿Cuánto tiempo tardas en promedio en cerrar una venta?",
  "7. ¿Cierras la venta en el primer contacto con el cliente?",
  "8. ¿Sueles ofrecer más de un producto por venta?",
  "9. ¿Aplicás cross-selling (combos, productos complementarios)?",
  "10. Cuando un cliente no compra, ¿haces seguimiento posterior?",
  "11. ¿Cuantas veces haces Retargeting?",
  "12. ¿Tienes un speech de ventas estructurado?",
  "13. ¿Qué tan seguro(a) te sientes al vender?",
  "14. ¿Cuál consideras que es tu mayor dificultad al vender?",
  "15. ¿Qué esperas mejorar en esta capacitación?"
];

const els = {
  rowForm: document.getElementById("rowForm"),
  tableHead: document.querySelector("#dataTable thead"),
  tableBody: document.querySelector("#dataTable tbody"),
  statusText: document.getElementById("statusText"),
  btnAuthorize: document.getElementById("btnAuthorize"),
  btnRefresh: document.getElementById("btnRefresh"),
  btnCreate: document.getElementById("btnCreate"),
  btnUpdate: document.getElementById("btnUpdate"),
  btnClear: document.getElementById("btnClear"),
};

let headers = [];
let rows = [];
let currentRowNumber = null;

function setStatus(text, isError = false) {
  if (!els.statusText) return;
  els.statusText.textContent = `Estado: ${text}`;
  els.statusText.style.borderColor = isError ? "rgba(208,32,128,0.65)" : "var(--border)";
}

function nowStr() {
  return new Date().toLocaleString("es-PE");
}

function buildForm(currentHeaders) {
  const list = currentHeaders.length ? currentHeaders : FALLBACK_HEADERS;
  headers = list.slice();
  els.rowForm.innerHTML = headers
    .map((h) => {
      const id = `field-${btoa(unescape(encodeURIComponent(h))).replace(/=+/g, "")}`;
      const isTimestamp = h.toLowerCase().includes("timestamp");
      return `
        <div class="field">
          <label for="${id}">${h}</label>
          <input type="text" id="${id}" data-header="${h}" ${isTimestamp ? "readonly" : ""} />
        </div>
      `;
    })
    .join("");
}

function getFormData() {
  const data = {};
  const inputs = els.rowForm.querySelectorAll("input[data-header]");
  inputs.forEach((input) => {
    data[input.dataset.header] = input.value || "";
  });
  return data;
}

function setFormData(data) {
  const inputs = els.rowForm.querySelectorAll("input[data-header]");
  inputs.forEach((input) => {
    input.value = data[input.dataset.header] || "";
  });
}

function clearForm() {
  const inputs = els.rowForm.querySelectorAll("input[data-header]");
  inputs.forEach((input) => {
    input.value = "";
  });
  currentRowNumber = null;
  if (els.btnUpdate) els.btnUpdate.disabled = true;
}

function renderTable() {
  if (!headers.length) return;
  const headerCells = ["Fila", ...headers, "Acciones"]
    .map((h) => `<th>${h}</th>`)
    .join("");
  els.tableHead.innerHTML = `<tr>${headerCells}</tr>`;

  els.tableBody.innerHTML = rows
    .map((row) => {
      const cells = headers
        .map((h) => `<td>${row.data[h] !== undefined ? row.data[h] : ""}</td>`)
        .join("");
      return `
        <tr>
          <td>${row.rowNumber}</td>
          ${cells}
          <td>
            <div class="row-actions">
              <button class="btn-small" data-action="edit" data-row="${row.rowNumber}">Editar</button>
              <button class="btn-small danger" data-action="delete" data-row="${row.rowNumber}">Borrar</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function fetchStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/status`);
    if (!res.ok) throw new Error("status");
    const data = await res.json();
    setStatus(data.authorized ? "Autorizado" : "No autorizado", !data.authorized);
  } catch (err) {
    setStatus("Servidor no disponible", true);
  }
}

async function fetchRows() {
  try {
    setStatus("Cargando...");
    const res = await fetch(`${API_BASE}/api/rows`);
    if (res.status === 401) {
      setStatus("No autorizado", true);
      return;
    }
    if (!res.ok) throw new Error("fetch");
    const data = await res.json();
    headers = (data.headers && data.headers.length) ? data.headers : FALLBACK_HEADERS;
    rows = data.rows || [];
    buildForm(headers);
    renderTable();
    setStatus("Listo");
  } catch (err) {
    setStatus("Error al cargar", true);
  }
}

async function createRow() {
  const payload = getFormData();
  if (headers.includes("Timestamp") && !payload["Timestamp"]) {
    payload["Timestamp"] = nowStr();
  }

  try {
    const res = await fetch(`${API_BASE}/api/rows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: payload }),
    });
    if (!res.ok) throw new Error("create");
    await fetchRows();
    clearForm();
  } catch (err) {
    setStatus("Error al guardar", true);
  }
}

async function updateRow() {
  if (!currentRowNumber) return;
  const payload = getFormData();
  try {
    const res = await fetch(`${API_BASE}/api/rows/${currentRowNumber}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: payload }),
    });
    if (!res.ok) throw new Error("update");
    await fetchRows();
    clearForm();
  } catch (err) {
    setStatus("Error al actualizar", true);
  }
}

async function deleteRow(rowNumber) {
  const ok = confirm(`¿Borrar la fila ${rowNumber}?`);
  if (!ok) return;
  try {
    const res = await fetch(`${API_BASE}/api/rows/${rowNumber}`, { method: "DELETE" });
    if (!res.ok) throw new Error("delete");
    await fetchRows();
    clearForm();
  } catch (err) {
    setStatus("Error al borrar", true);
  }
}

function handleTableClick(event) {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const rowNumber = parseInt(btn.dataset.row, 10);
  const row = rows.find((r) => r.rowNumber === rowNumber);
  if (!row) return;

  if (action === "edit") {
    setFormData(row.data);
    currentRowNumber = rowNumber;
    if (els.btnUpdate) els.btnUpdate.disabled = false;
  }
  if (action === "delete") {
    deleteRow(rowNumber);
  }
}

if (els.btnAuthorize) {
  els.btnAuthorize.addEventListener("click", () => {
    window.open(`${API_BASE}/auth`, "_blank");
  });
}
if (els.btnRefresh) els.btnRefresh.addEventListener("click", fetchRows);
if (els.btnCreate) els.btnCreate.addEventListener("click", createRow);
if (els.btnUpdate) els.btnUpdate.addEventListener("click", updateRow);
if (els.btnClear) els.btnClear.addEventListener("click", clearForm);
if (els.tableBody) els.tableBody.addEventListener("click", handleTableClick);

buildForm(FALLBACK_HEADERS);
fetchStatus();
fetchRows();
