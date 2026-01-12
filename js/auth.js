(() => {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const errorEl = document.getElementById("loginError");

  if (!form || !window.supabase) return;

  const client = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );

  const setError = (message) => {
    if (!errorEl) return;
    errorEl.textContent = message || "";
  };

  const redirectIfSession = async () => {
    const { data } = await client.auth.getSession();
    if (data?.session) {
      window.location.href = "kpi.html";
    }
  };

  redirectIfSession();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setError("");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      setError("Completa correo y contrase\u00f1a.");
      return;
    }

    const { error } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setError("Credenciales incorrectas o usuario no registrado.");
      return;
    }

    window.location.href = "kpi.html";
  });
})();
