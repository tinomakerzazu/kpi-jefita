(() => {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  
  // Función para obtener cliente de Supabase
  function getSupabaseClient() {
    if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      return null;
    }
    return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }

  btn.addEventListener("click", async () => {
    const client = getSupabaseClient();
    
    // Cerrar sesión en Supabase si está disponible
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.error("Error al cerrar sesión en Supabase:", err);
      }
    }
    
    // Limpiar sessionStorage
    sessionStorage.removeItem("auth");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userId");
    
    // Redirigir al login
    window.location.href = "index.html";
  });
})();
