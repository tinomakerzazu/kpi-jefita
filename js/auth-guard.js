(() => {
  const guard = async () => {
    const API_BASE = window.API_BASE_URL || "http://localhost:3001";

    // Función para obtener token
    function getAuthToken() {
      return localStorage.getItem("authToken");
    }

    // Función para limpiar sesión
    function clearSession() {
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("auth");
      sessionStorage.removeItem("userEmail");
      sessionStorage.removeItem("userId");
    }

    // Verificar sessionStorage primero (método rápido)
    const hasSession = sessionStorage.getItem("auth") === "1";
    const token = getAuthToken();

    if (!hasSession || !token) {
      clearSession();
      window.location.href = "index.html";
      return;
    }

    // Verificar token con el backend (validación real)
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        // Token inválido o expirado
        clearSession();
        window.location.href = "index.html";
        return;
      }

      const data = await response.json();
      if (data.authenticated && data.user) {
        // Sesión válida, actualizar sessionStorage
        sessionStorage.setItem("auth", "1");
        if (data.user.email) {
          sessionStorage.setItem("userEmail", data.user.email);
        }
        if (data.user.id) {
          sessionStorage.setItem("userId", data.user.id);
        }
      } else {
        // No autenticado
        clearSession();
        window.location.href = "index.html";
      }
    } catch (err) {
      console.error("Error verificando sesión:", err);
      // En caso de error de red, permitir continuar si hay sessionStorage
      // pero esto es menos seguro - en producción debería fallar
      if (!hasSession) {
        clearSession();
        window.location.href = "index.html";
      }
    }
  };

  guard();
})();
