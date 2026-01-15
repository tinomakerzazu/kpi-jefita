(() => {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const errorEl = document.getElementById("loginError");

  if (!form) return;

  const API_BASE = window.API_BASE_URL || "http://localhost:3001";

  const setError = (message) => {
    if (!errorEl) return;
    errorEl.textContent = message || "";
    errorEl.style.display = message ? "block" : "none";
  };

  // Función para obtener token almacenado
  function getAuthToken() {
    // Intentar obtener de cookie (más seguro, pero solo funciona si está en mismo dominio)
    // Si no, usar localStorage como fallback
    return localStorage.getItem("authToken");
  }

  // Función para guardar token
  function saveAuthToken(token) {
    localStorage.setItem("authToken", token);
  }

  // Función para limpiar token
  function clearAuthToken() {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("auth");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userId");
  }

  // Función para verificar autenticación con el backend
  async function verifyAuth() {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE}/api/auth/verify`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include", // Incluir cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          sessionStorage.setItem("auth", "1");
          sessionStorage.setItem("userEmail", data.user.email);
          sessionStorage.setItem("userId", data.user.id);
          return true;
        }
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error);
    }

    clearAuthToken();
    return false;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setError("");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      setError("Completa correo y contraseña.");
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    // Mostrar estado de carga
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Verificando...</span>';

    try {
      // Autenticar con el backend
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Incluir cookies
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Credenciales incorrectas o usuario no registrado.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
      }

      if (data.success && data.user) {
        // Guardar token
        if (data.token) {
          saveAuthToken(data.token);
        }

        // Guardar información de sesión
        sessionStorage.setItem("auth", "1");
        sessionStorage.setItem("userEmail", data.user.email);
        sessionStorage.setItem("userId", data.user.id);

        // Redirigir a la página principal
        window.location.href = "kpi.html";
      } else {
        setError("Error al iniciar sesión. Intenta nuevamente.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    } catch (err) {
      console.error("Error en login:", err);
      setError("Error inesperado al iniciar sesión. Verifica tu conexión y que el servidor esté corriendo.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  // Verificar si ya hay una sesión activa al cargar la página
  window.addEventListener("DOMContentLoaded", async () => {
    const isAuthenticated = await verifyAuth();
    if (isAuthenticated) {
      // Ya hay una sesión activa, redirigir
      window.location.href = "kpi.html";
    }
  });
})();
