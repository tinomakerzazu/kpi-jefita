// Cliente API seguro - Todas las comunicaciones con Supabase pasan por el backend
(() => {
  const API_BASE = window.API_BASE_URL || "http://localhost:3001";

  // Función para obtener token de autenticación
  function getAuthToken() {
    return localStorage.getItem("authToken");
  }

  // Función para hacer peticiones autenticadas
  async function authenticatedFetch(endpoint, options = {}) {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error("No autenticado. Por favor inicia sesión.");
    }

    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      credentials: "include",
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {}),
      },
    };

    const response = await fetch(`${API_BASE}${endpoint}`, mergedOptions);

    if (response.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("auth");
      sessionStorage.removeItem("userEmail");
      sessionStorage.removeItem("userId");
      window.location.href = "index.html";
      throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Error desconocido" }));
      throw new Error(error.error || `Error ${response.status}`);
    }

    return response;
  }

  // API para KPI Respuestas
  window.SecureAPI = {
    // Obtener todas las respuestas KPI
    async getKpiRespuestas() {
      const response = await authenticatedFetch("/api/supabase/kpi-respuestas");
      const data = await response.json();
      return data.data || [];
    },

    // Guardar nueva respuesta KPI
    async saveKpiRespuesta(payload) {
      const response = await authenticatedFetch("/api/supabase/kpi-respuestas", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return data.data || data;
    },

    // Obtener ventas diarias
    async getVentasDiarias(limit = 100) {
      const response = await authenticatedFetch(`/api/supabase/ventas-diarias?limit=${limit}`);
      const data = await response.json();
      return data.data || [];
    },

    // Guardar venta diaria
    async saveVentaDiaria(payload) {
      const response = await authenticatedFetch("/api/supabase/ventas-diarias", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return data.data || data;
    },

    // Eliminar venta diaria
    async deleteVentaDiaria(id) {
      const response = await authenticatedFetch(`/api/supabase/ventas-diarias/${id}`, {
        method: "DELETE",
      });
      return await response.json();
    },

    // Verificar autenticación
    async verifyAuth() {
      try {
        const response = await authenticatedFetch("/api/auth/verify");
        return await response.json();
      } catch (error) {
        return { authenticated: false };
      }
    },
  };
})();
