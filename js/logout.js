(() => {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;

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

  btn.addEventListener("click", async () => {
    const token = getAuthToken();

    // Cerrar sesión en el backend si hay token
    if (token) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      } catch (err) {
        console.error("Error al cerrar sesión en el servidor:", err);
        // Continuar con limpieza local aunque falle el servidor
      }
    }

    // Limpiar sesión local
    clearSession();

    // Redirigir al login
    window.location.href = "index.html";
  });
})();
