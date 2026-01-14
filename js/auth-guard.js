(() => {
  const guard = async () => {
    // Verificar sessionStorage primero (método rápido)
    const hasSession = sessionStorage.getItem("auth") === "1";
    
    if (!hasSession) {
      window.location.href = "index.html";
      return;
    }

    // Verificar también con Supabase si está disponible
    if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
      try {
        const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error || !session) {
          // No hay sesión válida en Supabase, limpiar y redirigir
          sessionStorage.removeItem("auth");
          sessionStorage.removeItem("userEmail");
          sessionStorage.removeItem("userId");
          window.location.href = "index.html";
          return;
        }
        
        // Sesión válida, actualizar sessionStorage
        sessionStorage.setItem("auth", "1");
        if (session.user.email) {
          sessionStorage.setItem("userEmail", session.user.email);
        }
        if (session.user.id) {
          sessionStorage.setItem("userId", session.user.id);
        }
      } catch (err) {
        console.error("Error verificando sesión:", err);
        // Si hay error, permitir continuar si hay sessionStorage
      }
    }
  };

  guard();
})();
