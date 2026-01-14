(() => {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const errorEl = document.getElementById("loginError");

  if (!form) return;

  const setError = (message) => {
    if (!errorEl) return;
    errorEl.textContent = message || "";
    errorEl.style.display = message ? "block" : "none";
  };

  // Función para obtener cliente de Supabase
  function getSupabaseClient() {
    if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      return null;
    }
    return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
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

    const client = getSupabaseClient();
    if (!client) {
      setError("Error: Supabase no está configurado correctamente.");
      return;
    }

    // Mostrar estado de carga
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Verificando...</span>';

    try {
      // Intentar hacer login con Supabase
      const { data, error } = await client.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        setError(error.message || "Credenciales incorrectas o usuario no registrado.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
      }

      if (data && data.user) {
        // Login exitoso - guardar sesión
        sessionStorage.setItem("auth", "1");
        sessionStorage.setItem("userEmail", email);
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
      setError("Error inesperado al iniciar sesión. Verifica tu conexión.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  // Verificar si ya hay una sesión activa
  window.addEventListener("DOMContentLoaded", async () => {
    const client = getSupabaseClient();
    if (client) {
      const { data: { session } } = await client.auth.getSession();
      if (session) {
        // Ya hay una sesión activa, redirigir
        sessionStorage.setItem("auth", "1");
        sessionStorage.setItem("userEmail", session.user.email);
        sessionStorage.setItem("userId", session.user.id);
        window.location.href = "kpi.html";
      }
    }
  });
})();
