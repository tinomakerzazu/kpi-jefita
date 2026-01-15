// Tabla de Supabase para ventas diarias
const VENTAS_TABLE = "ventas_diarias";

// Variable global para almacenar los datos del historial
let ventasHistorialData = [];

// Elementos del DOM
const ventasEls = {
  ventasForm: document.getElementById("ventasDiariasForm"),
  ventasVendedor: document.getElementById("ventasVendedor"),
  ventasFecha: document.getElementById("ventasFecha"),
  ventasNormales: document.getElementById("ventasNormales"),
  ventasPromocion: document.getElementById("ventasPromocion"),
  promocionesCombinadasContainer: document.getElementById("promocionesCombinadasContainer"),
  ventasPromocion1: document.getElementById("ventasPromocion1"),
  ventasPromocion2: document.getElementById("ventasPromocion2"),
  ventasPromocion3: document.getElementById("ventasPromocion3"),
  ventasCrossSelling: document.getElementById("ventasCrossSelling"),
  ventasUpselling: document.getElementById("ventasUpselling"),
  ventasRetargeting: document.getElementById("ventasRetargeting"),
  ventasNotas: document.getElementById("ventasNotas"),
  ventasNotasCounter: document.getElementById("ventasNotasCounter"),
  btnGuardarVentas: document.getElementById("btnGuardarVentas"),
  btnLimpiarVentas: document.getElementById("btnLimpiarVentas"),
  btnExportVentasPdf: document.getElementById("btnExportVentasPdf"),
  btnExportVentasXls: document.getElementById("btnExportVentasXls"),
  ventasStatus: document.getElementById("ventasStatus"),
  historialStatus: document.getElementById("historialStatus"),
  ventasTableBody: document.getElementById("ventasTableBody")
};

// Inicializar fecha con la fecha actual
if (ventasEls.ventasFecha) {
  const today = new Date().toISOString().split("T")[0];
  ventasEls.ventasFecha.value = today;
}

// Función deprecada - Ahora usamos SecureAPI
function getSupabaseClient() {
  console.warn("getSupabaseClient() está deprecado. Usa window.SecureAPI en su lugar.");
  return null;
}

function cleanDisplay(text) {
  if (!text) return "-";
  return String(text).trim() || "-";
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return dateStr;
  }
}

async function guardarVentasDiarias() {
  if (!window.SecureAPI) {
    if (ventasEls.ventasStatus) ventasEls.ventasStatus.textContent = "API no disponible";
    return;
  }

  // Validar campos requeridos
  if (!ventasEls.ventasVendedor?.value?.trim()) {
    alert("Por favor ingresa el nombre del vendedor");
    ventasEls.ventasVendedor?.focus();
    return;
  }

  if (!ventasEls.ventasFecha?.value) {
    alert("Por favor selecciona una fecha");
    ventasEls.ventasFecha?.focus();
    return;
  }

  if (!ventasEls.ventasPromocion?.value) {
    alert("Por favor selecciona una promoción");
    ventasEls.ventasPromocion?.focus();
    return;
  }

  // Validar promociones combinadas si está seleccionada esa opción
  let promocionFinal = ventasEls.ventasPromocion.value;
  if (promocionFinal === "PROMOCIONES COMBINADAS") {
    const prom1 = ventasEls.ventasPromocion1?.value || "";
    const prom2 = ventasEls.ventasPromocion2?.value || "";
    const prom3 = ventasEls.ventasPromocion3?.value || "";
    
    const promocionesSeleccionadas = [prom1, prom2, prom3].filter(p => p && p.trim() !== "");
    
    if (promocionesSeleccionadas.length === 0) {
      alert("Por favor selecciona al menos una promoción en Promociones Combinadas");
      ventasEls.ventasPromocion1?.focus();
      return;
    }
    
    // Guardar como string separado por " + "
    promocionFinal = promocionesSeleccionadas.join(" + ");
  }

  const ventasNormales = parseInt(ventasEls.ventasNormales?.value || "0", 10);
  const crossSelling = parseInt(ventasEls.ventasCrossSelling?.value || "0", 10);
  const upselling = parseInt(ventasEls.ventasUpselling?.value || "0", 10);
  const retargeting = parseInt(ventasEls.ventasRetargeting?.value || "0", 10);

  if (crossSelling < 0 || upselling < 0 || retargeting < 0 || ventasNormales < 0) {
    alert("Las cantidades no pueden ser negativas");
    return;
  }

  const payload = {
    vendedor: ventasEls.ventasVendedor.value.trim(),
    fecha: ventasEls.ventasFecha.value,
    ventas_normales: ventasNormales,
    promocion: promocionFinal,
    cross_selling: crossSelling,
    upselling: upselling,
    retargeting: retargeting,
    total: crossSelling + upselling + retargeting + ventasNormales,
    notas: ventasEls.ventasNotas?.value?.trim() || null
  };

  if (ventasEls.ventasStatus) ventasEls.ventasStatus.textContent = "Guardando...";
  
  try {
    await window.SecureAPI.saveVentaDiaria(payload);

    if (ventasEls.ventasStatus) ventasEls.ventasStatus.textContent = "Guardado exitosamente";
    
    // Limpiar formulario
    limpiarFormulario();
    
    // Recargar historial
    await cargarHistorial();
    
    // Mensaje de exito
    setTimeout(() => {
      if (ventasEls.ventasStatus) ventasEls.ventasStatus.textContent = "Listo";
    }, 3000);
    
  } catch (err) {
    console.error("Error inesperado:", err);
    if (ventasEls.ventasStatus) ventasEls.ventasStatus.textContent = "Error inesperado";
    alert("Ocurrio un error inesperado al guardar");
  }
}

function limpiarFormulario() {
  if (ventasEls.ventasVendedor) ventasEls.ventasVendedor.value = "";
  if (ventasEls.ventasFecha) {
    const today = new Date().toISOString().split("T")[0];
    ventasEls.ventasFecha.value = today;
  }
  if (ventasEls.ventasNormales) ventasEls.ventasNormales.value = "";
  if (ventasEls.ventasPromocion) {
    ventasEls.ventasPromocion.value = "";
    if (typeof refreshCustomSelect === "function") {
      refreshCustomSelect(ventasEls.ventasPromocion);
    }
  }
  if (ventasEls.promocionesCombinadasContainer) {
    ventasEls.promocionesCombinadasContainer.style.display = "none";
  }
  if (ventasEls.ventasPromocion1) ventasEls.ventasPromocion1.value = "";
  if (ventasEls.ventasPromocion2) ventasEls.ventasPromocion2.value = "";
  if (ventasEls.ventasPromocion3) ventasEls.ventasPromocion3.value = "";
  if (typeof refreshCustomSelect === "function") {
    if (ventasEls.ventasPromocion1) refreshCustomSelect(ventasEls.ventasPromocion1);
    if (ventasEls.ventasPromocion2) refreshCustomSelect(ventasEls.ventasPromocion2);
    if (ventasEls.ventasPromocion3) refreshCustomSelect(ventasEls.ventasPromocion3);
  }
  if (ventasEls.ventasCrossSelling) ventasEls.ventasCrossSelling.value = "";
  if (ventasEls.ventasUpselling) ventasEls.ventasUpselling.value = "";
  if (ventasEls.ventasRetargeting) ventasEls.ventasRetargeting.value = "";
  if (ventasEls.ventasNotas) ventasEls.ventasNotas.value = "";
}

async function cargarHistorial() {
  if (!window.SecureAPI) {
    if (ventasEls.historialStatus) ventasEls.historialStatus.textContent = "API no disponible";
    if (ventasEls.ventasTableBody) {
      ventasEls.ventasTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
            API no disponible
          </td>
        </tr>
      `;
    }
    return;
  }

  if (ventasEls.historialStatus) ventasEls.historialStatus.textContent = "Cargando...";

  try {
    const data = await window.SecureAPI.getVentasDiarias(100);

    if (ventasEls.historialStatus) {
      const count = data?.length || 0;
      ventasEls.historialStatus.textContent = `${count} registros`;
    }

    if (!ventasEls.ventasTableBody) return;

    // Guardar datos para exportación
    ventasHistorialData = data || [];

    if (!data || data.length === 0) {
      ventasEls.ventasTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No hay registros de ventas diarias aún
          </td>
        </tr>
      `;
      return;
    }

    ventasEls.ventasTableBody.innerHTML = data.map((row) => {
      const total = (row.cross_selling || 0) + (row.upselling || 0) + (row.retargeting || 0) + (row.ventas_normales || 0);
      return `
        <tr>
          <td>${formatDate(row.fecha)}</td>
          <td><strong>${cleanDisplay(row.vendedor)}</strong></td>
          <td>${row.ventas_normales || 0}</td>
          <td>${cleanDisplay(row.promocion)}</td>
          <td>${row.cross_selling || 0}</td>
          <td>${row.upselling || 0}</td>
          <td>${row.retargeting || 0}</td>
          <td><strong>${total}</strong></td>
          <td>${cleanDisplay(row.notas)}</td>
          <td>
            <button class="btn ghost btn-delete-venta" type="button" data-id="${row.id}">
              Eliminar
            </button>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error("Error inesperado al cargar historial:", err);
    if (ventasEls.historialStatus) ventasEls.historialStatus.textContent = "Error";
    if (ventasEls.ventasTableBody) {
      ventasEls.ventasTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
            Error inesperado al cargar registros
          </td>
        </tr>
      `;
    }
  }
}

async function eliminarVenta(id) {
  if (!window.SecureAPI) {
    if (ventasEls.ventasStatus) ventasEls.ventasStatus.textContent = "API no disponible";
    return;
  }
  if (!id) return;
  if (!confirm("¿Eliminar este registro?")) return;

  if (ventasEls.ventasStatus) ventasEls.ventasStatus.textContent = "Eliminando...";
  try {
    await window.SecureAPI.deleteVentaDiaria(id);
    await cargarHistorial();
    if (ventasEls.ventasStatus) ventasEls.ventasStatus.textContent = "Registro eliminado";
    setTimeout(() => {
      if (ventasEls.ventasStatus) ventasEls.ventasStatus.textContent = "Listo";
    }, 2000);
  } catch (error) {
    console.error("Error al eliminar:", error);
    if (ventasEls.ventasStatus) ventasEls.ventasStatus.textContent = `Error: ${error.message || "Error al eliminar"}`;
    alert(`Error al eliminar: ${error.message || "Error desconocido"}`);
  }
}

// Función helper para obtener logo como DataURL
let ventasLogoDataUrl = null;
async function getVentasLogoDataUrl() {
  if (ventasLogoDataUrl) return ventasLogoDataUrl;
  try {
    const res = await fetch("Jefita icono.jpeg");
    if (!res.ok) return null;
    const blob = await res.blob();
    const reader = new FileReader();
    const dataUrl = await new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    ventasLogoDataUrl = dataUrl;
    return dataUrl;
  } catch (err) {
    return null;
  }
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

// Exportar ventas a PDF
async function exportVentasPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.jsPDF.API || !window.jspdf.jsPDF.API.autoTable) {
    alert("Librería de PDF no está cargada");
    return;
  }
  
  if (!ventasHistorialData || ventasHistorialData.length === 0) {
    alert("No hay datos para exportar");
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const logo = await getVentasLogoDataUrl();
  
  // Header profesional
  addPdfHeader(doc, "Reporte de Ventas Diarias", logo, "Historial de Ventas");
  
  // Preparar datos para la tabla
  const tableData = ventasHistorialData.map((row) => {
    const total = (row.cross_selling || 0) + (row.upselling || 0) + (row.retargeting || 0) + (row.ventas_normales || 0);
    return [
      formatDate(row.fecha),
      cleanDisplay(row.vendedor),
      String(row.ventas_normales || 0),
      cleanDisplay(row.promocion),
      String(row.cross_selling || 0),
      String(row.upselling || 0),
      String(row.retargeting || 0),
      String(total),
      cleanDisplay(row.notas)
    ];
  });
  
  // Calcular totales
  const totalVentasNormales = ventasHistorialData.reduce((sum, row) => sum + (row.ventas_normales || 0), 0);
  const totalCrossSelling = ventasHistorialData.reduce((sum, row) => sum + (row.cross_selling || 0), 0);
  const totalUpselling = ventasHistorialData.reduce((sum, row) => sum + (row.upselling || 0), 0);
  const totalRetargeting = ventasHistorialData.reduce((sum, row) => sum + (row.retargeting || 0), 0);
  const granTotal = totalVentasNormales + totalCrossSelling + totalUpselling + totalRetargeting;
  
  // Tabla mejorada
  doc.autoTable({
    startY: 130,
    head: [["Fecha", "Vendedor", "Ventas Normales", "Promoción", "Cross-selling", "Upselling", "Retargeting", "Total", "Notas"]],
    body: tableData,
    foot: [[
      "TOTALES",
      "",
      String(totalVentasNormales),
      "",
      String(totalCrossSelling),
      String(totalUpselling),
      String(totalRetargeting),
      String(granTotal),
      ""
    ]],
    theme: "striped",
    styles: { 
      font: "helvetica", 
      fontSize: 8,
      cellPadding: 4,
      overflow: "linebreak",
      cellWidth: "wrap"
    },
    headStyles: { 
      fillColor: [242, 68, 85],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center"
    },
    footStyles: {
      fillColor: [250, 250, 250],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center"
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 70, halign: "left" },
      1: { cellWidth: 80, halign: "left" },
      2: { cellWidth: 50, halign: "center" },
      3: { cellWidth: 100, halign: "left" },
      4: { cellWidth: 50, halign: "center" },
      5: { cellWidth: 50, halign: "center" },
      6: { cellWidth: 50, halign: "center" },
      7: { cellWidth: 50, halign: "center", fontStyle: "bold" },
      8: { cellWidth: 100, halign: "left" }
    },
    margin: { top: 130, left: 40, right: 40 },
    didDrawPage: function(data) {
      addPdfFooter(doc, data.pageNumber, data.pageCount);
    }
  });
  
  doc.save("ventas-diarias-reporte.pdf");
}

// Exportar ventas a Excel
function exportVentasXls() {
  if (!window.XLSX) {
    alert("Librería de Excel no está cargada");
    return;
  }
  
  if (!ventasHistorialData || ventasHistorialData.length === 0) {
    alert("No hay datos para exportar");
    return;
  }
  
  // Preparar datos para Excel
  const headers = [
    "Fecha",
    "Vendedor",
    "Ventas Normales",
    "Promoción",
    "Cross-selling",
    "Upselling",
    "Retargeting",
    "Total",
    "Notas"
  ];
  
  const rows = ventasHistorialData.map((row) => {
    const total = (row.cross_selling || 0) + (row.upselling || 0) + (row.retargeting || 0) + (row.ventas_normales || 0);
    return [
      formatDate(row.fecha),
      cleanDisplay(row.vendedor),
      row.ventas_normales || 0,
      cleanDisplay(row.promocion),
      row.cross_selling || 0,
      row.upselling || 0,
      row.retargeting || 0,
      total,
      cleanDisplay(row.notas)
    ];
  });
  
  // Calcular totales
  const totalVentasNormales = ventasHistorialData.reduce((sum, row) => sum + (row.ventas_normales || 0), 0);
  const totalCrossSelling = ventasHistorialData.reduce((sum, row) => sum + (row.cross_selling || 0), 0);
  const totalUpselling = ventasHistorialData.reduce((sum, row) => sum + (row.upselling || 0), 0);
  const totalRetargeting = ventasHistorialData.reduce((sum, row) => sum + (row.retargeting || 0), 0);
  const granTotal = totalVentasNormales + totalCrossSelling + totalUpselling + totalRetargeting;
  
  const sheetData = [
    ["Reporte de Ventas Diarias - La Jefita"],
    ["Generado", new Date().toLocaleString("es-PE")],
    [],
    headers,
    ...rows,
    [],
    ["TOTALES", "", totalVentasNormales, "", totalCrossSelling, totalUpselling, totalRetargeting, granTotal, ""]
  ];
  
  const ws = window.XLSX.utils.aoa_to_sheet(sheetData);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Ventas Diarias");
  window.XLSX.writeFile(wb, "ventas-diarias-reporte.xlsx");
}

// Event listeners
if (ventasEls.btnGuardarVentas) {
  ventasEls.btnGuardarVentas.addEventListener("click", guardarVentasDiarias);
}

if (ventasEls.btnLimpiarVentas) {
  ventasEls.btnLimpiarVentas.addEventListener("click", limpiarFormulario);
}

if (ventasEls.ventasForm) {
  ventasEls.ventasForm.addEventListener("submit", (e) => {
    e.preventDefault();
    guardarVentasDiarias();
  });
}

if (ventasEls.ventasTableBody) {
  ventasEls.ventasTableBody.addEventListener("click", (event) => {
    const btn = event.target.closest(".btn-delete-venta");
    if (!btn) return;
    eliminarVenta(btn.dataset.id);
  });
}

if (ventasEls.btnExportVentasPdf) {
  ventasEls.btnExportVentasPdf.addEventListener("click", exportVentasPdf);
}

if (ventasEls.btnExportVentasXls) {
  ventasEls.btnExportVentasXls.addEventListener("click", exportVentasXls);
}

// Contador de caracteres para el textarea
if (ventasEls.ventasNotas && ventasEls.ventasNotasCounter) {
  ventasEls.ventasNotas.addEventListener("input", () => {
    const length = ventasEls.ventasNotas.value.length;
    const maxLength = ventasEls.ventasNotas.maxLength || 500;
    ventasEls.ventasNotasCounter.textContent = `${length} / ${maxLength}`;
    
    // Cambiar color cuando se acerca al límite
    if (length > maxLength * 0.9) {
      ventasEls.ventasNotasCounter.style.color = "var(--primary)";
      ventasEls.ventasNotasCounter.style.fontWeight = "700";
    } else if (length > maxLength * 0.75) {
      ventasEls.ventasNotasCounter.style.color = "rgba(242, 68, 85, 0.8)";
      ventasEls.ventasNotasCounter.style.fontWeight = "600";
    } else {
      ventasEls.ventasNotasCounter.style.color = "var(--muted)";
      ventasEls.ventasNotasCounter.style.fontWeight = "600";
    }
  });
  
  // Inicializar contador
  ventasEls.ventasNotas.dispatchEvent(new Event("input"));
}

// Manejar cambio en el select de promoción
function handlePromocionChange() {
  // Re-buscar elementos por si acaso no están disponibles
  const promocionSelect = document.getElementById("ventasPromocion");
  const container = document.getElementById("promocionesCombinadasContainer");
  
  if (!promocionSelect || !container) {
    return;
  }
  
  // Obtener el valor directamente del select (el custom select actualiza el valor del select original)
  let selectedValue = promocionSelect.value || "";
  
  // Si no hay valor en el select, intentar obtenerlo del custom select
  if (!selectedValue) {
    const selectWrap = promocionSelect.closest(".select-wrap");
    if (selectWrap) {
      const selectedOption = selectWrap.querySelector(".select-option.is-selected");
      if (selectedOption) {
        selectedValue = selectedOption.dataset.value || selectedOption.textContent.trim();
      }
    }
  }
  
  const isCombinadas = selectedValue === "PROMOCIONES COMBINADAS";
  
  // Mostrar u ocultar el contenedor
  if (isCombinadas) {
    container.style.display = "grid";
    container.style.visibility = "visible";
    container.style.opacity = "1";
  } else {
    container.style.display = "none";
    
    // Limpiar los selects de combinadas
    const prom1 = document.getElementById("ventasPromocion1");
    const prom2 = document.getElementById("ventasPromocion2");
    const prom3 = document.getElementById("ventasPromocion3");
    
    if (prom1) {
      prom1.value = "";
      if (typeof refreshCustomSelect === "function") {
        refreshCustomSelect(prom1);
      }
    }
    if (prom2) {
      prom2.value = "";
      if (typeof refreshCustomSelect === "function") {
        refreshCustomSelect(prom2);
      }
    }
    if (prom3) {
      prom3.value = "";
      if (typeof refreshCustomSelect === "function") {
        refreshCustomSelect(prom3);
      }
    }
  }
}

// Mejorar el select de promoción con estilos personalizados
function enhancePromocionSelect() {
  const promocionSelect = document.getElementById("ventasPromocion");
  if (!promocionSelect) {
    return;
  }
  
  // Listener directo en el select original
  promocionSelect.addEventListener("change", handlePromocionChange);
  
  // Usar evento delegado global para capturar clics en opciones del custom select
  // Esto captura cuando se hace clic en una opción del menú desplegable
  document.addEventListener("click", (e) => {
    const option = e.target.closest(".select-option");
    if (option && !option.disabled) {
      const selectWrap = option.closest(".select-wrap");
      if (selectWrap) {
        const select = selectWrap.querySelector("select#ventasPromocion");
        if (select) {
          // Esperar a que el custom select actualice el valor del select original
          setTimeout(() => {
            handlePromocionChange();
          }, 100);
        }
      }
    }
  });
  
  // Verificar si existe la función enhanceSelects de kpi-okr.js
  if (typeof enhanceSelects === "function") {
    // Aplicar estilos personalizados a todos los selects
    enhanceSelects();
    
    // Después de mejorar, verificar estado inicial
    setTimeout(() => {
      handlePromocionChange();
    }, 400);
  } else {
    // Si no hay enhanceSelects, verificar estado inicial
    setTimeout(() => {
      handlePromocionChange();
    }, 100);
  }
}

// Cargar historial al iniciar
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    enhancePromocionSelect();
    cargarHistorial();
  });
} else {
  enhancePromocionSelect();
  cargarHistorial();
}
