(() => {
  const btn = document.getElementById("logoutBtn");
  if (!btn || !window.supabase) return;

  const client = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );

  btn.addEventListener("click", async () => {
    await client.auth.signOut();
    window.location.href = "index.html";
  });
})();
