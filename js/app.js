const STORAGE_KEY  = "kpi_form_vendedores_v1";
  const BASELINE_KEY = "kpi_form_vendedores_baseline_v1";
  const TARGETS_VERSION = 2;
  const TARGET_DEFAULTS = {
    conv: 100,
    conf: 5,
    upsell: 100,
    cross: 100,
    follow: 100,
    avgFU: 4,
    pitch: 100,
    exp: 14,
    closeMin: 8,
  };
  const TARGET_OPTIONS = {
    conf: [1,2,3,4,5],
    avgFU: [0,1,2.5,4],
    exp: [2,4.5,9,14],
    closeMin: [8,12.5,17.5,25,40],
  };
  const SUPABASE_URL = "https://qjnetcsbbicqmxhsumxt.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_I0Dv3cAGncK01TOg8R74tA_e2PulPR-";
  const SUPABASE_TABLE = "kpi_state";
  const SUPABASE_ROW_ID = 1;

  // Ponderaciones del Score (suma ~1.0)
  const WEIGHTS = {
    conv: 0.18,        // P7
    conf: 0.16,        // P13
    upsell: 0.12,      // P8
    cross: 0.12,       // P9
    follow: 0.12,      // P10
    followTimes: 0.10, // P11
    pitch: 0.10,       // P12
    exp: 0.10,         // P5
  };

  const els = {
    teamBody: document.getElementById("teamBody"),
    kpiCards: document.getElementById("kpiCards"),
    chipTeam: document.getElementById("chipTeam"),
    beforeAfterBody: document.getElementById("beforeAfterBody"),
    vendorContainer: document.getElementById("vendorContainer"),
    lastSaved: document.getElementById("lastSaved"),
    compareA: document.getElementById("compareA"),
    compareB: document.getElementById("compareB"),
    compareSummary: document.getElementById("compareSummary"),
    btnShare: document.getElementById("btnShare"),
    btnClearLink: document.getElementById("btnClearLink"),

    fName: document.getElementById("fName"),

    t: {
      conv: document.getElementById("tConv"),
      conf: document.getElementById("tConf"),
      upsell: document.getElementById("tUpsell"),
      cross: document.getElementById("tCross"),
      follow: document.getElementById("tFollow"),
      avgFU: document.getElementById("tAvgFU"),
      pitch: document.getElementById("tPitch"),
      exp: document.getElementById("tExp"),
      closeMin: document.getElementById("tCloseMin"),
    }
  };

  let state = {
    targets: getTargetsFromUI(),
    team: []
  };

  function nowStr(){ return new Date().toLocaleString("es-PE"); }
  function num(x){ const n = parseFloat(x); return Number.isFinite(n) ? n : 0; }
  function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
  function round2(x){ return (Math.round(num(x)*100)/100).toFixed(2); }
  function pct(x){ return `${Math.round(num(x))}%`; }
  function safeDiv(a,b){ return b ? (a/b) : 0; }
  function escapeHtml(s){
    return String(s ?? "")
      .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll("\"","&quot;").replaceAll("'","&#039;");
  }

  function utf8ToBase64(str){
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    ));
  }
  function base64ToUtf8(str){
    return decodeURIComponent(atob(str).split("").map(c =>
      `%${c.charCodeAt(0).toString(16).padStart(2,"0")}`
    ).join(""));
  }

  let supabaseClient = null;
  let remoteSaveT = null;

  function initSupabase(){
    if(!window.supabase) return null;
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
  }

  async function loadRemoteState(){
    if(!supabaseClient) return null;
    const { data, error } = await supabaseClient
      .from(SUPABASE_TABLE)
      .select("id, payload, updated_at")
      .eq("id", SUPABASE_ROW_ID)
      .single();
    if(error) return null;
    return data?.payload || null;
  }

  async function saveRemoteState(payload){
    if(!supabaseClient) return;
    const row = { id: SUPABASE_ROW_ID, payload, updated_at: new Date().toISOString() };
    const { error } = await supabaseClient.from(SUPABASE_TABLE).upsert(row);
    if(error) console.warn("Supabase save error", error.message || error);
  }

  function saveRemoteDebounced(payload){
    clearTimeout(remoteSaveT);
    remoteSaveT = setTimeout(() => saveRemoteState(payload), 500);
  }

  function getTargetsFromUI(){
    return {
      conv: num(els.t.conv.value),
      conf: num(els.t.conf.value),
      upsell: num(els.t.upsell.value),
      cross: num(els.t.cross.value),
      follow: num(els.t.follow.value),
      avgFU: num(els.t.avgFU.value),
      pitch: num(els.t.pitch.value),
      exp: num(els.t.exp.value),
      closeMin: num(els.t.closeMin.value),
    };
  }

  function normalizeOption(value, options, fallback){
    if(value === undefined || value === null || value === "") return fallback;
    const v = num(value);
    return options.some(o => o === v) ? v : fallback;
  }

  function pickNumber(value, fallback){
    return (value === undefined || value === null || value === "") ? fallback : num(value);
  }

  function normalizeTargets(input){
    const t = input || {};
    return {
      conv: clamp(pickNumber(t.conv, TARGET_DEFAULTS.conv), 0, 100),
      conf: normalizeOption(t.conf, TARGET_OPTIONS.conf, TARGET_DEFAULTS.conf),
      upsell: clamp(pickNumber(t.upsell, TARGET_DEFAULTS.upsell), 0, 100),
      cross: clamp(pickNumber(t.cross, TARGET_DEFAULTS.cross), 0, 100),
      follow: clamp(pickNumber(t.follow, TARGET_DEFAULTS.follow), 0, 100),
      avgFU: normalizeOption(t.avgFU, TARGET_OPTIONS.avgFU, TARGET_DEFAULTS.avgFU),
      pitch: clamp(pickNumber(t.pitch, TARGET_DEFAULTS.pitch), 0, 100),
      exp: normalizeOption(t.exp, TARGET_OPTIONS.exp, TARGET_DEFAULTS.exp),
      closeMin: normalizeOption(t.closeMin, TARGET_OPTIONS.closeMin, TARGET_DEFAULTS.closeMin),
    };
  }

  function applyTargetsToUI(t){
    els.t.conv.value = t.conv;
    els.t.conf.value = t.conf;
    els.t.upsell.value = t.upsell;
    els.t.cross.value = t.cross;
    els.t.follow.value = t.follow;
    els.t.avgFU.value = t.avgFU;
    els.t.pitch.value = t.pitch;
    els.t.exp.value = t.exp;
    els.t.closeMin.value = t.closeMin;
  }

  function statusChip(actual, target, mode="higher-better"){
    if(!target || target === 0) return { cls:"chip info", text:"INFO" };

    let ach = 0;
    if(mode === "lower-better"){
      ach = (actual === 0) ? 1 : (target / actual);
    }else{
      ach = actual / target;
    }

    if(ach >= 1) return { cls:"chip ok", text:"OK" };
    if(ach >= 0.9) return { cls:"chip med", text:"MED" };
    if(ach >= 0.7) return { cls:"chip high", text:"HIGH" };
    return { cls:"chip crit", text:"CRIT" };
  }

  // Helpers formulario
  function getCheckedValues(containerId){
    const box = document.getElementById(containerId);
    return Array.from(box.querySelectorAll('input[type="checkbox"]:checked')).map(x => x.value);
  }
  function getRadioValue(name){
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : "";
  }

  // Mapas a números
  function expToMonths(label){
    switch(label){
      case "Entre 1-3 meses": return 2;
      case "Entre 3-6 meses": return 4.5;
      case "Entre 6-12 meses": return 9;
      case "Más de un año": return 14;
      default: return 0;
    }
  }
  function closeTimeToMinutes(label){
    switch(label){
      case "Menos de 10 minutos": return 8;
      case "Entre 10 y 15 minutos": return 12.5;
      case "Entre 15 y 20 minutos": return 17.5;
      case "Más de 20 minutos": return 25;
      case "Generalmente no cierro en el primer contacto": return 40;
      default: return 0;
    }
  }
  function followTimesToNumber(label){
    switch(label){
      case "No hago seguimiento": return 0;
      case "1 vez": return 1;
      case "2 a 3 veces": return 2.5;
      case "Más de 3 veces": return 4;
      default: return 0;
    }
  }
  function triTo01(label){
    if(label === "Sí") return 1;
    if(label === "A veces" || label === "Más o menos") return 0.5;
    return 0;
  }
  function upsellTo01(label){
    if(label === "Siempre") return 1;
    if(label === "A veces") return 0.5;
    return 0;
  }

  function activeTeam(){
    return state.team.filter(r => String(r.name).trim().length > 0);
  }

  function computeTeamKPIs(){
    const rows = activeTeam();
    const n = rows.length;

    const conv = safeDiv(rows.filter(r => r.close1st === "Sí").length, n) * 100;
    const conf = safeDiv(rows.reduce((a,r)=>a+num(r.confidence),0), n);

    const upsell = safeDiv(rows.filter(r => r.upsell === "Siempre").length, n) * 100;
    const cross  = safeDiv(rows.filter(r => r.cross === "Sí").length, n) * 100;
    const follow = safeDiv(rows.filter(r => r.follow === "Sí").length, n) * 100;

    const avgFU = safeDiv(rows.reduce((a,r)=>a+num(r.followTimesN),0), n);
    const pitch = safeDiv(rows.filter(r => r.pitch === "Sí").length, n) * 100;

    const exp = safeDiv(rows.reduce((a,r)=>a+num(r.expMonths),0), n);
    const closeMin = safeDiv(rows.reduce((a,r)=>a+num(r.closeMin),0), n);

    return { n, conv, conf, upsell, cross, follow, avgFU, pitch, exp, closeMin };
  }

  // Score individual (0..100)
  function computeVendorScore(v, t){
    const conv01 = (v.close1st === "Sí") ? 1 : 0;
    const conf01 = clamp(num(v.confidence) / 5, 0, 1);

    const upsell01 = upsellTo01(v.upsell);
    const cross01  = triTo01(v.cross);
    const follow01 = (v.follow === "Sí") ? 1 : 0;

    const followTimesNorm = t.avgFU > 0 ? clamp(num(v.followTimesN) / t.avgFU, 0, 1.2) : 0;
    const followTimes01 = clamp(followTimesNorm / 1.2, 0, 1);

    const pitch01 = triTo01(v.pitch);

    const expNorm = t.exp > 0 ? clamp(num(v.expMonths) / t.exp, 0, 1.2) : 0;
    const exp01 = clamp(expNorm / 1.2, 0, 1);

    const score01 =
      conv01 * WEIGHTS.conv +
      conf01 * WEIGHTS.conf +
      upsell01 * WEIGHTS.upsell +
      cross01 * WEIGHTS.cross +
      follow01 * WEIGHTS.follow +
      followTimes01 * WEIGHTS.followTimes +
      pitch01 * WEIGHTS.pitch +
      exp01 * WEIGHTS.exp;

    const score = clamp(score01 * 100, 0, 100);

    return {
      score: Math.round(score),
      conv01, conf01, upsell01, cross01, follow01, followTimes01, pitch01, exp01
    };
  }

  function renderKPIs(){
    state.targets = getTargetsFromUI();
    const k = computeTeamKPIs();

    els.chipTeam.textContent = `EQUIPO ${k.n} ${k.n === 1 ? "vendedor" : "vendedores"}`;
    const cards = [
      { label:"Conversión 1er contacto", value:pct(k.conv), target:`Meta: ${state.targets.conv}%`, chip: statusChip(k.conv, state.targets.conv) },
      { label:"Confianza Promedio", value:round2(k.conf), target:`Meta: ${state.targets.conf}`, chip: statusChip(k.conf, state.targets.conf) },
      { label:"Upsell (P8)", value:pct(k.upsell), target:`Meta: ${state.targets.upsell}%`, chip: statusChip(k.upsell, state.targets.upsell) },
      { label:"Cross-selling (P9)", value:pct(k.cross), target:`Meta: ${state.targets.cross}%`, chip: statusChip(k.cross, state.targets.cross) },
      { label:"Seguimiento (P10)", value:pct(k.follow), target:`Meta: ${state.targets.follow}%`, chip: statusChip(k.follow, state.targets.follow) },
      { label:"Prom. # Seguimientos", value:round2(k.avgFU), target:`Meta: ${state.targets.avgFU}`, chip: statusChip(k.avgFU, state.targets.avgFU) },
      { label:"Pitch estructurado (P12)", value:pct(k.pitch), target:`Meta: ${state.targets.pitch}%`, chip: statusChip(k.pitch, state.targets.pitch) },
      { label:"Experiencia Promedio (meses)", value:round2(k.exp), target:`Meta: ${state.targets.exp}`, chip: statusChip(k.exp, state.targets.exp) },
      { label:"Tiempo cierre prom. (min)", value:round2(k.closeMin), target:`Meta: ≤ ${state.targets.closeMin}`, chip: statusChip(k.closeMin, state.targets.closeMin, "lower-better") },
    ];

    els.kpiCards.innerHTML = cards.map(c => `
      <div class="card">
        <div class="label">${c.label}</div>
        <div class="value">${c.value}</div>
        <div class="meta">
          <div class="muted">${c.target}</div>
          <span class="${c.chip.cls}">${c.chip.text}</span>
        </div>
      </div>
    `).join("");

    renderBeforeAfter(k);
    renderVendorCards();
    renderCompare();
    saveStateDebounced();
  }

  function loadBaseline(){
    try{
      const raw = localStorage.getItem(BASELINE_KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(e){
      return null;
    }
  }

  function saveBaseline(){
    const k = computeTeamKPIs();
    const payload = { ...k, savedAt: nowStr() };
    localStorage.setItem(BASELINE_KEY, JSON.stringify(payload));
    renderKPIs();
    alert(`Baseline guardado: ${payload.savedAt}`);
  }

  function renderBeforeAfter(k){
    const b = loadBaseline();
    const rows = [
      { name:"Conversión 1er contacto", base:b?.conv, curr:k.conv, fmt:v=>pct(v) },
      { name:"Confianza", base:b?.conf, curr:k.conf, fmt:v=>round2(v) },
      { name:"Upsell (P8)", base:b?.upsell, curr:k.upsell, fmt:v=>pct(v) },
      { name:"Cross-selling (P9)", base:b?.cross, curr:k.cross, fmt:v=>pct(v) },
      { name:"Seguimiento (P10)", base:b?.follow, curr:k.follow, fmt:v=>pct(v) },
      { name:"Prom. # Seguimientos", base:b?.avgFU, curr:k.avgFU, fmt:v=>round2(v) },
      { name:"Pitch estructurado", base:b?.pitch, curr:k.pitch, fmt:v=>pct(v) },
      { name:"Experiencia (meses)", base:b?.exp, curr:k.exp, fmt:v=>round2(v) },
      { name:"Tiempo cierre (min)", base:b?.closeMin, curr:k.closeMin, fmt:v=>round2(v) },
    ];

    els.beforeAfterBody.innerHTML = rows.map(r => {
      const hasBase = typeof r.base === "number";
      const delta = hasBase ? (r.curr - r.base) : 0;

      // Para tiempo de cierre, mejora = bajar minutos
      const isCloseTime = r.name.includes("Tiempo cierre");
      const adjDelta = isCloseTime ? -delta : delta;

      const pctCh = hasBase && r.base !== 0 ? (adjDelta / r.base) * 100 : 0;

      const deltaStr = hasBase
        ? (Math.abs(adjDelta) < 0.0001 ? "0" : (adjDelta > 0 ? `+${round2(adjDelta)}` : `${round2(adjDelta)}`))
        : "—";

      const pctStr = hasBase
        ? (Math.abs(pctCh) < 0.0001 ? "0%" : (pctCh > 0 ? `+${Math.round(pctCh)}%` : `${Math.round(pctCh)}%`))
        : "—";

      const cls =
        !hasBase ? "" :
        pctCh > 0 ? "success" :
        pctCh < 0 ? "danger" : "";

      return `
        <tr>
          <td><strong>${r.name}</strong></td>
          <td class="muted">${hasBase ? r.fmt(r.base) : "—"}</td>
          <td>${r.fmt(r.curr)}</td>
          <td>${deltaStr}</td>
          <td>${hasBase ? `<span class="badge ${cls}">${pctStr}</span>` : "—"}</td>
        </tr>
      `;
    }).join("");
  }

  function renderVendorCards(){
    const vendors = activeTeam();
    if(!vendors.length){
      els.vendorContainer.innerHTML = `<div class="alert" style="grid-column:1/-1">Guarda una respuesta para ver el análisis individual.</div>`;
      return;
    }

    const t = getTargetsFromUI();
    const computed = vendors.map(v => {
      const s = computeVendorScore(v, t);

      const b1 = (v.close1st === "Sí") ? ["✓ Cierra 1er contacto","success"] : ["✗ No cierra 1er contacto","danger"];
      const b2 = (num(v.confidence) >= t.conf) ? ["✓ Confianza","success"] : ["⚠ Confianza","warning"];
      const b3 = (v.follow === "Sí") ? ["✓ Seguimiento","success"] : ["✗ Seguimiento","danger"];
      const b4 = (v.pitch === "Sí" || v.pitch === "Más o menos") ? ["✓ Speech","success"] : ["✗ Speech","danger"];

      return { v, s, badges:[b1,b2,b3,b4] };
    }).sort((a,b) => b.s.score - a.s.score);

    els.vendorContainer.innerHTML = computed.map((item, idx) => {
      const v = item.v, s = item.s;
      const scoreChip = statusChip(s.score, 85); // meta interna score
      const progress = clamp(s.score, 0, 100);

      return `
        <div class="vendor-card">
          <div class="vendor-header">
            <div class="vendor-title">
              <h3>${escapeHtml(v.name)}</h3>
              <span class="role">${escapeHtml(v.mainChannel)} • Ranking #${idx+1}</span>
            </div>
            <span class="vendor-chip">#${v.id}</span>
          </div>

          <div class="vendor-metrics">
            <div class="vendor-metric">
              <div class="label">Score</div>
              <div class="value">${s.score}/100</div>
              <div class="status"><span class="${scoreChip.cls}">${scoreChip.text}</span></div>
            </div>
            <div class="vendor-metric">
              <div class="label">Confianza</div>
              <div class="value">${round2(v.confidence)}/5</div>
              <div class="status">Meta: ${t.conf}</div>
            </div>
            <div class="vendor-metric">
              <div class="label">Experiencia</div>
              <div class="value">${round2(v.expMonths)} meses</div>
              <div class="status">${escapeHtml(v.expLabel)}</div>
            </div>
            <div class="vendor-metric">
              <div class="label">Tiempo cierre</div>
              <div class="value">${round2(v.closeMin)} min</div>
              <div class="status">${escapeHtml(v.closeTime)}</div>
            </div>
          </div>

          <div class="progress" aria-label="Progreso score"><div style="width:${progress}%"></div></div>

          <div class="vendor-footer">
            ${item.badges.map(b => `<span class="badge ${b[1]}">${b[0]}</span>`).join("")}
          </div>
        </div>
      `;
    }).join("");
  }

  function renderCompare(){
    if(!els.compareA || !els.compareB || !els.compareSummary) return;
    const vendors = activeTeam();

    if(vendors.length < 2){
      els.compareA.innerHTML = "";
      els.compareB.innerHTML = "";
      els.compareSummary.innerHTML = `<div class="alert">Agrega al menos 2 vendedores para comparar.</div>`;
      return;
    }

    const prevA = els.compareA.value;
    const prevB = els.compareB.value;
    const optionsHtml = vendors
      .map(v => `<option value="${v.id}">${escapeHtml(v.name)} (#${v.id})</option>`)
      .join("");

    els.compareA.innerHTML = optionsHtml;
    els.compareB.innerHTML = optionsHtml;

    if(prevA && vendors.some(v => String(v.id) === prevA)) els.compareA.value = prevA;
    if(prevB && vendors.some(v => String(v.id) === prevB)) els.compareB.value = prevB;

    if(!els.compareA.value) els.compareA.value = String(vendors[0].id);
    if(!els.compareB.value || els.compareB.value === els.compareA.value){
      els.compareB.value = String(vendors[1].id);
    }

    const a = vendors.find(v => String(v.id) === els.compareA.value);
    const b = vendors.find(v => String(v.id) === els.compareB.value);

    if(!a || !b){
      els.compareSummary.innerHTML = `<div class="alert">Selecciona dos vendedores distintos.</div>`;
      return;
    }

    const t = getTargetsFromUI();
    const sA = computeVendorScore(a, t);
    const sB = computeVendorScore(b, t);

    const rows = [
      { label:"Score", a:`${sA.score}/100`, b:`${sB.score}/100` },
      { label:"Confianza", a:round2(a.confidence), b:round2(b.confidence) },
      { label:"Experiencia (meses)", a:round2(a.expMonths), b:round2(b.expMonths) },
      { label:"Tiempo cierre (min)", a:round2(a.closeMin), b:round2(b.closeMin) },
      { label:"Cierra 1er contacto", a:a.close1st || "-", b:b.close1st || "-" },
      { label:"Upsell", a:a.upsell || "-", b:b.upsell || "-" },
      { label:"Cross-selling", a:a.cross || "-", b:b.cross || "-" },
      { label:"Seguimiento", a:a.follow || "-", b:b.follow || "-" },
      { label:"# Seguimientos", a:a.followTimesLabel || "-", b:b.followTimesLabel || "-" },
      { label:"Speech", a:a.pitch || "-", b:b.pitch || "-" },
    ];

    els.compareSummary.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Metrica</th>
            <th>${escapeHtml(a.name)}</th>
            <th>${escapeHtml(b.name)}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td class="muted"><strong>${r.label}</strong></td>
              <td>${escapeHtml(r.a)}</td>
              <td>${escapeHtml(r.b)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  function addOrUpdateVendorFromForm(){
    const name = String(els.fName.value || "").trim();
    if(!name){
      alert("Ingresa el nombre del vendedor.");
      return;
    }

    const role = getCheckedValues("qRole");
    const area = getCheckedValues("qArea");

    const mainChannel = getRadioValue("mainChannel");
    const expLabel = getRadioValue("exp");
    const closeTime = getRadioValue("closeTime");
    const close1st = getRadioValue("close1st");
    const upsell = getRadioValue("upsell");
    const cross = getRadioValue("cross");
    const follow = getRadioValue("follow");
    const followTimesLabel = getRadioValue("followTimes");
    const pitch = getRadioValue("pitch");
    const conf = getRadioValue("conf");

    const required = [mainChannel, expLabel, closeTime, close1st, upsell, cross, follow, followTimesLabel, pitch, conf];
    if(required.some(x => !x)){
      alert("Completa todas las preguntas requeridas (2–13).");
      return;
    }

    const expMonths = expToMonths(expLabel);
    const closeMin = closeTimeToMinutes(closeTime);
    const followTimesN = followTimesToNumber(followTimesLabel);
    const confidence = num(conf);

    const existingIdx = state.team.findIndex(v => String(v.name).trim().toLowerCase() === name.toLowerCase());
    const nextId = Math.max(0, ...state.team.map(v => num(v.id))) + 1;

    const vendor = {
      id: existingIdx >= 0 ? state.team[existingIdx].id : nextId,
      name,
      role: role.join(" | "),
      area: area.join(" | "),
      mainChannel,
      expLabel,
      expMonths,
      closeTime,
      closeMin,
      close1st,
      upsell,
      cross,
      follow,
      followTimesLabel,
      followTimesN,
      pitch,
      confidence,
      score: 0,
    };

    const s = computeVendorScore(vendor, getTargetsFromUI());
    vendor.score = s.score;

    if(existingIdx >= 0) state.team[existingIdx] = vendor;
    else state.team.push(vendor);

    renderTable();
    renderKPIs();
    alert("Respuesta guardada.");
  }

  function renderTable(){
    const t = getTargetsFromUI();
    els.teamBody.innerHTML = state.team.map((v, idx) => {
      const s = computeVendorScore(v, t);
      v.score = s.score;

      return `
        <tr>
          <td><input type="number" min="1" step="1" value="${num(v.id)}" data-k="id" data-i="${idx}"></td>
          <td><input type="text" value="${escapeHtml(v.name)}" data-k="name" data-i="${idx}"></td>
          <td><input type="text" value="${escapeHtml(v.role)}" data-k="role" data-i="${idx}"></td>
          <td><input type="text" value="${escapeHtml(v.area)}" data-k="area" data-i="${idx}"></td>
          <td><input type="text" value="${escapeHtml(v.mainChannel)}" data-k="mainChannel" data-i="${idx}"></td>
          <td><input type="text" value="${escapeHtml(v.expLabel)}" data-k="expLabel" data-i="${idx}"></td>
          <td><input type="text" value="${escapeHtml(v.closeTime)}" data-k="closeTime" data-i="${idx}"></td>
          <td>
            <select data-k="close1st" data-i="${idx}">
              <option value="Sí" ${v.close1st==="Sí"?"selected":""}>Sí</option>
              <option value="No" ${v.close1st==="No"?"selected":""}>No</option>
            </select>
          </td>
          <td>
            <select data-k="upsell" data-i="${idx}">
              <option value="Siempre" ${v.upsell==="Siempre"?"selected":""}>Siempre</option>
              <option value="A veces" ${v.upsell==="A veces"?"selected":""}>A veces</option>
              <option value="Nunca" ${v.upsell==="Nunca"?"selected":""}>Nunca</option>
            </select>
          </td>
          <td>
            <select data-k="cross" data-i="${idx}">
              <option value="Sí" ${v.cross==="Sí"?"selected":""}>Sí</option>
              <option value="A veces" ${v.cross==="A veces"?"selected":""}>A veces</option>
              <option value="No" ${v.cross==="No"?"selected":""}>No</option>
            </select>
          </td>
          <td>
            <select data-k="follow" data-i="${idx}">
              <option value="Sí" ${v.follow==="Sí"?"selected":""}>Sí</option>
              <option value="No" ${v.follow==="No"?"selected":""}>No</option>
            </select>
          </td>
          <td>
            <select data-k="followTimesLabel" data-i="${idx}">
              <option value="No hago seguimiento" ${v.followTimesLabel==="No hago seguimiento"?"selected":""}>No hago seguimiento</option>
              <option value="1 vez" ${v.followTimesLabel==="1 vez"?"selected":""}>1 vez</option>
              <option value="2 a 3 veces" ${v.followTimesLabel==="2 a 3 veces"?"selected":""}>2 a 3 veces</option>
              <option value="Más de 3 veces" ${v.followTimesLabel==="Más de 3 veces"?"selected":""}>Más de 3 veces</option>
            </select>
          </td>
          <td>
            <select data-k="pitch" data-i="${idx}">
              <option value="Sí" ${v.pitch==="Sí"?"selected":""}>Sí</option>
              <option value="Más o menos" ${v.pitch==="Más o menos"?"selected":""}>Más o menos</option>
              <option value="No" ${v.pitch==="No"?"selected":""}>No</option>
            </select>
          </td>
          <td>
            <select data-k="confidence" data-i="${idx}">
              ${[1,2,3,4,5].map(n => `<option value="${n}" ${num(v.confidence)===n?"selected":""}>${n}</option>`).join("")}
            </select>
          </td>
          <td><strong>${s.score}</strong></td>
          <td style="text-align:right">
            <div class="row-actions">
              <button class="btn-small danger" data-action="del" data-i="${idx}">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function recomputeDerivedFields(v){
    v.expMonths = expToMonths(v.expLabel || "");
    v.closeMin = closeTimeToMinutes(v.closeTime || "");
    v.followTimesN = followTimesToNumber(v.followTimesLabel || "");
    return v;
  }

  function delRow(i){
    state.team.splice(i, 1);
    renderTable();
    renderKPIs();
  }

  let saveT = null;
  function saveStateDebounced(){
    clearTimeout(saveT);
    saveT = setTimeout(saveState, 250);
  }

  function saveState(){
    try{
      const payload = { targets: getTargetsFromUI(), team: state.team, targetsVersion: TARGETS_VERSION };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      els.lastSaved.textContent = `Guardado: ${nowStr()}`;
      saveRemoteDebounced(payload);
    }catch(e){
      els.lastSaved.textContent = "Error al guardar";
    }
  }

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(e){
      return null;
    }
  }

  function makeShareLink(){
    const payload = { targets: getTargetsFromUI(), team: state.team, targetsVersion: TARGETS_VERSION };
    const encoded = utf8ToBase64(JSON.stringify(payload));
    return `${location.origin}${location.pathname}#s=${encoded}`;
  }

  function applySharedState(encoded){
    try{
      const data = JSON.parse(base64ToUtf8(encoded));
      const normalizedTargets = (data?.targetsVersion === TARGETS_VERSION)
        ? normalizeTargets(data?.targets)
        : normalizeTargets(TARGET_DEFAULTS);
      applyTargetsToUI(normalizedTargets);
      state.targets = normalizedTargets;
      if(Array.isArray(data?.team)){
        state.team = data.team.map(v => recomputeDerivedFields(v));
      }
      renderTable();
      renderKPIs();
      saveState();
      return true;
    }catch(e){
      return false;
    }
  }

  function tryLoadFromShare(){
    const hash = location.hash || "";
    if(!hash.startsWith("#s=")) return false;
    const encoded = hash.slice(3);
    if(!encoded) return false;
    return applySharedState(encoded);
  }

  function resetAll(){
    if(!confirm("Esto borrará datos, metas y baseline. ¿Continuar?")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BASELINE_KEY);
    state = { targets: getTargetsFromUI(), team: [] };
    renderTable();
    renderKPIs();
    els.lastSaved.textContent = "Sistema reiniciado";
  }

  function exportCSV(){
    const headers = [
      "ID","Nombre","Rol","Área/Canal","Canal principal","Experiencia","Meses experiencia",
      "Tiempo cierre","Min cierre","Cierra 1er contacto","Upsell","Cross-selling",
      "Seguimiento","# Seguimientos","Speech","Confianza (1-5)","Score"
    ];

    const t = getTargetsFromUI();
    const rows = state.team.map(v => {
      recomputeDerivedFields(v);
      const s = computeVendorScore(v, t);
      return [
        v.id, v.name, v.role, v.area, v.mainChannel, v.expLabel, v.expMonths,
        v.closeTime, v.closeMin, v.close1st, v.upsell, v.cross,
        v.follow, v.followTimesLabel, v.pitch, v.confidence, s.score
      ];
    });

    const csv = [headers, ...rows]
      .map(arr => arr.map(x => `"${String(x ?? "").replaceAll('"','""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kpi_form_vendedores_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Eventos
  document.getElementById("btnSaveForm").addEventListener("click", addOrUpdateVendorFromForm);
  document.getElementById("btnBaseline").addEventListener("click", saveBaseline);
  document.getElementById("btnExport").addEventListener("click", exportCSV);
  document.getElementById("btnReset").addEventListener("click", resetAll);
  if(els.btnShare){
    els.btnShare.addEventListener("click", () => {
      const link = makeShareLink();
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(link)
          .then(() => alert("Enlace copiado. Abrelo en otro dispositivo para ver los mismos datos."))
          .catch(() => prompt("Copia este enlace:", link));
      }else{
        prompt("Copia este enlace:", link);
      }
    });
  }
  if(els.btnClearLink){
    els.btnClearLink.addEventListener("click", () => {
      history.replaceState(null, "", location.pathname + location.search);
      alert("Enlace compartido eliminado.");
    });
  }

  if(els.compareA) els.compareA.addEventListener("change", renderCompare);
  if(els.compareB) els.compareB.addEventListener("change", renderCompare);

  els.teamBody.addEventListener("input", (e) => {
    const el = e.target;
    const i = parseInt(el.dataset.i, 10);
    const k = el.dataset.k;
    if(Number.isNaN(i) || !k) return;

    state.team[i][k] = el.value;

    if(k === "expLabel" || k === "closeTime" || k === "followTimesLabel"){
      recomputeDerivedFields(state.team[i]);
    }
    if(k === "confidence"){
      state.team[i][k] = num(el.value);
    }
    renderKPIs();
  });

  els.teamBody.addEventListener("change", (e) => {
    const el = e.target;
    const i = parseInt(el.dataset.i, 10);
    const k = el.dataset.k;
    if(Number.isNaN(i) || !k) return;

    state.team[i][k] = el.value;

    if(k === "expLabel" || k === "closeTime" || k === "followTimesLabel"){
      recomputeDerivedFields(state.team[i]);
    }
    if(k === "confidence"){
      state.team[i][k] = num(el.value);
    }
    renderKPIs();
  });

  els.teamBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if(!btn) return;
    const action = btn.dataset.action;
    const i = parseInt(btn.dataset.i, 10);
    if(action === "del") delRow(i);
  });

  Object.values(els.t).forEach(inp => {
    inp.addEventListener("input", renderKPIs);
    inp.addEventListener("change", renderKPIs);
  });

  // Init
  (async function init(){
    initSupabase();
    const loadedFromShare = tryLoadFromShare();
    if(!loadedFromShare){
      let loadedRemote = null;
      if(supabaseClient){
        loadedRemote = await loadRemoteState();
      }

      const source = loadedRemote || loadState();
      const normalizedTargets = (source?.targetsVersion === TARGETS_VERSION)
        ? normalizeTargets(source?.targets)
        : normalizeTargets(TARGET_DEFAULTS);
      applyTargetsToUI(normalizedTargets);
      state.targets = normalizedTargets;

      if(Array.isArray(source?.team)){
        state.team = source.team.map(v => recomputeDerivedFields(v));
      }

      renderTable();
      renderKPIs();

      if(loadedRemote){
        const payload = { targets: normalizedTargets, team: state.team, targetsVersion: TARGETS_VERSION };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    }

    const base = loadBaseline();
    if(base?.savedAt) els.lastSaved.textContent = `Baseline: ${base.savedAt}`;
  })();




