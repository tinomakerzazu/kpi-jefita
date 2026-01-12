(() => {
  if (!window.supabase) return;

  const client = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );

  const guard = async () => {
    const { data } = await client.auth.getSession();
    if (!data?.session) {
      window.location.href = "index.html";
    }
  };

  guard();
})();
