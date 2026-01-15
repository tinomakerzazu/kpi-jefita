const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
const { body, validationResult } = require("express-validator");
const { google } = require("googleapis");

require("dotenv").config({ path: path.join(__dirname, ".env") });

// ============================================
// CONFIGURACIÓN Y VARIABLES DE ENTORNO
// ============================================
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.error("⚠️  JWT_SECRET no configurado. Genera uno seguro en .env");
  return "CHANGE_THIS_SECRET_IN_PRODUCTION";
})();
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || "86400000", 10); // 24 horas

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("⚠️  SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar en .env");
}

// Google Sheets Configuration
const SHEET_ID = process.env.SHEET_ID || "";
const SHEET_NAME = process.env.SHEET_NAME || "";
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS || path.join(__dirname, "credentials.json");
const TOKEN_PATH = process.env.GOOGLE_TOKEN || path.join(__dirname, "token.json");
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// CORS Configuration
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000").split(",");

// ============================================
// INICIALIZACIÓN
// ============================================
const app = express();

// Inicializar Supabase con service role key (solo para backend)
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

// ============================================
// MIDDLEWARE DE SEGURIDAD
// ============================================

// Helmet - Headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", SUPABASE_URL].filter(Boolean),
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: "deny" },
  noSniff: true,
  xssFilter: true,
}));

// CORS con origen específico
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origen (mobile apps, curl, etc) solo en desarrollo
    if (!origin && NODE_ENV === "development") {
      return callback(null, true);
    }
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  message: "Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: "Demasiados intentos de autenticación, intenta de nuevo más tarde.",
  skipSuccessfulRequests: true,
});

app.use("/api/", limiter);
app.use("/api/auth/", authLimiter);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ============================================
// LOGGING Y MONITOREO
// ============================================
const logOperation = (req, operation, success = true, details = {}) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const user = req.user?.email || "anonymous";
  const logEntry = {
    timestamp,
    ip,
    user,
    operation,
    success,
    method: req.method,
    path: req.path,
    ...details
  };
  
  // En producción, usar un sistema de logging apropiado
  if (NODE_ENV === "production") {
    console.log(JSON.stringify(logEntry));
  } else {
    console.log(`[${timestamp}] ${operation} - ${user} - ${success ? "✓" : "✗"}`);
  }
};

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
const authenticateToken = async (req, res, next) => {
  try {
    // Intentar obtener token de cookie primero (más seguro)
    let token = req.cookies?.authToken;
    
    // Si no hay en cookie, intentar del header Authorization
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      logOperation(req, "AUTH_FAILED", false, { reason: "No token provided" });
      return res.status(401).json({ error: "Token de autenticación requerido" });
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verificar sesión en Supabase
    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(decoded.userId);
      if (error || !user) {
        logOperation(req, "AUTH_FAILED", false, { reason: "Invalid Supabase session" });
        return res.status(401).json({ error: "Sesión inválida" });
      }
      req.user = user;
    } else {
      req.user = { id: decoded.userId, email: decoded.email };
    }

    next();
  } catch (error) {
    logOperation(req, "AUTH_FAILED", false, { reason: error.message });
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }
    return res.status(403).json({ error: "Token inválido" });
  }
};

// ============================================
// FUNCIONES DE GOOGLE SHEETS
// ============================================
function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error("Missing credentials.json");
  }
  const raw = fs.readFileSync(CREDENTIALS_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return parsed.installed || parsed.web || null;
}

function buildOAuthClient() {
  const creds = loadCredentials();
  if (!creds) {
    throw new Error("Invalid credentials.json format");
  }
  const redirectUri = (creds.redirect_uris && creds.redirect_uris[0]) || `http://localhost:${PORT}/oauth2callback`;
  return new google.auth.OAuth2(creds.client_id, creds.client_secret, redirectUri);
}

function loadToken() {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  const raw = fs.readFileSync(TOKEN_PATH, "utf8");
  return JSON.parse(raw);
}

function saveToken(token) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
}

function getAuthorizedClient() {
  const oAuth2Client = buildOAuthClient();
  const token = loadToken();
  if (token) {
    oAuth2Client.setCredentials(token);
  }
  return oAuth2Client;
}

function ensureSheetConfig(res) {
  if (!SHEET_ID || !SHEET_NAME) {
    res.status(400).json({
      error: "Missing SHEET_ID or SHEET_NAME. Set them in server/.env",
    });
    return false;
  }
  return true;
}

function ensureAuthorized(res) {
  if (!fs.existsSync(TOKEN_PATH)) {
    res.status(401).json({
      error: "Not authorized. Visit /auth to connect Google Sheets.",
    });
    return false;
  }
  return true;
}

function columnToLetter(n) {
  let s = "";
  let num = n;
  while (num > 0) {
    const mod = (num - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s || "A";
}

async function getSheetData() {
  const auth = getAuthorizedClient();
  const sheets = google.sheets({ version: "v4", auth });
  const range = `${SHEET_NAME}!A1:ZZ`;
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });
  const values = result.data.values || [];
  const headers = values[0] || [];
  const rows = values.slice(1).map((row, index) => {
    const data = {};
    headers.forEach((h, i) => {
      data[h] = row[i] !== undefined ? row[i] : "";
    });
    return { rowNumber: index + 2, data };
  });
  return { headers, rows };
}

// ============================================
// VALIDADORES DE ENTRADA
// ============================================
const validateRowData = [
  body("data").isObject().withMessage("data debe ser un objeto"),
  body("data.*").optional().isString().isLength({ max: 1000 }).withMessage("Cada campo debe ser string y máximo 1000 caracteres"),
];

const validateRowNumber = [
  body().custom((value, { req }) => {
    const rowNumber = parseInt(req.params.rowNumber, 10);
    if (!Number.isFinite(rowNumber) || rowNumber < 2) {
      throw new Error("rowNumber inválido");
    }
    return true;
  }),
];

// ============================================
// RUTAS PÚBLICAS
// ============================================
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "KPI Sheets API server running",
    version: "2.0.0",
    secure: true,
  });
});

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================
app.post("/api/auth/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password debe tener al menos 6 caracteres"),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logOperation(req, "LOGIN_ATTEMPT", false, { errors: errors.array() });
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase no configurado" });
    }

    // Autenticar con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      logOperation(req, "LOGIN_FAILED", false, { email });
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar JWT token
    const token = jwt.sign(
      {
        userId: data.user.id,
        email: data.user.email,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Enviar token en cookie httpOnly (más seguro)
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_MAX_AGE,
    });

    logOperation(req, "LOGIN_SUCCESS", true, { email: data.user.email });

    res.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      token, // También enviar en respuesta para compatibilidad
    });
  } catch (error) {
    logOperation(req, "LOGIN_ERROR", false, { error: error.message });
    res.status(500).json({ error: "Error en autenticación" });
  }
});

app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  try {
    // Invalidar sesión en Supabase
    if (supabase && req.user) {
      await supabase.auth.signOut();
    }

    // Limpiar cookie
    res.clearCookie("authToken");

    logOperation(req, "LOGOUT", true);

    res.json({ success: true });
  } catch (error) {
    logOperation(req, "LOGOUT_ERROR", false, { error: error.message });
    res.status(500).json({ error: "Error al cerrar sesión" });
  }
});

app.get("/api/auth/verify", authenticateToken, (req, res) => {
  res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      email: req.user.email,
    },
  });
});

// ============================================
// RUTAS DE SUPABASE (PROXY SEGURO)
// ============================================
app.get("/api/supabase/kpi-respuestas", authenticateToken, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase no configurado" });
    }

    const { data, error } = await supabase
      .from("kpi_respuestas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logOperation(req, "SUPABASE_QUERY", false, { error: error.message });
      return res.status(500).json({ error: "Error al consultar datos" });
    }

    logOperation(req, "SUPABASE_QUERY", true, { count: data?.length || 0 });
    res.json({ data: data || [] });
  } catch (error) {
    logOperation(req, "SUPABASE_QUERY_ERROR", false, { error: error.message });
    res.status(500).json({ error: "Error en consulta" });
  }
});

app.post("/api/supabase/kpi-respuestas", authenticateToken, [
  body("nombre").optional().isString().isLength({ max: 200 }),
  body("fecha_evaluacion").optional().isString(),
  body("cargo").optional().isString().isLength({ max: 100 }),
  body("area_canal").optional().isString().isLength({ max: 100 }),
  body("score").optional().isNumeric(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase no configurado" });
    }

    const { data, error } = await supabase
      .from("kpi_respuestas")
      .insert(req.body)
      .select()
      .single();

    if (error) {
      logOperation(req, "SUPABASE_INSERT", false, { error: error.message });
      return res.status(500).json({ error: "Error al guardar datos" });
    }

    logOperation(req, "SUPABASE_INSERT", true, { id: data?.id });
    res.json({ success: true, data });
  } catch (error) {
    logOperation(req, "SUPABASE_INSERT_ERROR", false, { error: error.message });
    res.status(500).json({ error: "Error en inserción" });
  }
});

app.get("/api/supabase/ventas-diarias", authenticateToken, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase no configurado" });
    }

    const limit = parseInt(req.query.limit || "100", 10);
    const { data, error } = await supabase
      .from("ventas_diarias")
      .select("*")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(Math.min(limit, 1000));

    if (error) {
      logOperation(req, "SUPABASE_VENTAS_QUERY", false, { error: error.message });
      return res.status(500).json({ error: "Error al consultar ventas" });
    }

    logOperation(req, "SUPABASE_VENTAS_QUERY", true, { count: data?.length || 0 });
    res.json({ data: data || [] });
  } catch (error) {
    logOperation(req, "SUPABASE_VENTAS_QUERY_ERROR", false, { error: error.message });
    res.status(500).json({ error: "Error en consulta" });
  }
});

app.post("/api/supabase/ventas-diarias", authenticateToken, [
  body("vendedor").isString().isLength({ min: 1, max: 200 }),
  body("fecha").isISO8601(),
  body("ventas_normales").optional().isInt({ min: 0 }),
  body("cross_selling").optional().isInt({ min: 0 }),
  body("upselling").optional().isInt({ min: 0 }),
  body("retargeting").optional().isInt({ min: 0 }),
  body("promocion").optional().isString().isLength({ max: 500 }),
  body("notas").optional().isString().isLength({ max: 1000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase no configurado" });
    }

    const payload = {
      ...req.body,
      total: (req.body.ventas_normales || 0) + 
             (req.body.cross_selling || 0) + 
             (req.body.upselling || 0) + 
             (req.body.retargeting || 0),
    };

    const { data, error } = await supabase
      .from("ventas_diarias")
      .insert(payload)
      .select()
      .single();

    if (error) {
      logOperation(req, "SUPABASE_VENTAS_INSERT", false, { error: error.message });
      return res.status(500).json({ error: "Error al guardar venta" });
    }

    logOperation(req, "SUPABASE_VENTAS_INSERT", true, { id: data?.id });
    res.json({ success: true, data });
  } catch (error) {
    logOperation(req, "SUPABASE_VENTAS_INSERT_ERROR", false, { error: error.message });
    res.status(500).json({ error: "Error en inserción" });
  }
});

app.delete("/api/supabase/ventas-diarias/:id", authenticateToken, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase no configurado" });
    }

    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "ID requerido" });
    }

    const { error } = await supabase
      .from("ventas_diarias")
      .delete()
      .eq("id", id);

    if (error) {
      logOperation(req, "SUPABASE_VENTAS_DELETE", false, { error: error.message });
      return res.status(500).json({ error: "Error al eliminar venta" });
    }

    logOperation(req, "SUPABASE_VENTAS_DELETE", true, { id });
    res.json({ success: true });
  } catch (error) {
    logOperation(req, "SUPABASE_VENTAS_DELETE_ERROR", false, { error: error.message });
    res.status(500).json({ error: "Error en eliminación" });
  }
});

// ============================================
// RUTAS DE GOOGLE SHEETS (PROTEGIDAS)
// ============================================
app.get("/auth", (req, res) => {
  let authUrl = "";
  try {
    const oAuth2Client = buildOAuthClient();
    authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
    return;
  }
  res.redirect(authUrl);
});

app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    res.status(400).send("Missing code");
    return;
  }

  try {
    const oAuth2Client = buildOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    saveToken(tokens);
    res.send("Authorized. You can close this window.");
  } catch (err) {
    res.status(500).send(`Auth error: ${err.message}`);
  }
});

app.get("/api/status", authenticateToken, (req, res) => {
  res.json({ authorized: fs.existsSync(TOKEN_PATH) });
});

app.get("/api/rows", authenticateToken, async (req, res) => {
  if (!ensureSheetConfig(res) || !ensureAuthorized(res)) return;
  try {
    const data = await getSheetData();
    logOperation(req, "SHEETS_READ", true, { rows: data.rows?.length || 0 });
    res.json(data);
  } catch (err) {
    logOperation(req, "SHEETS_READ", false, { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/rows", authenticateToken, validateRowData, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (!ensureSheetConfig(res) || !ensureAuthorized(res)) return;
  const payload = req.body && req.body.data;
  if (!payload || typeof payload !== "object") {
    res.status(400).json({ error: "Missing data object" });
    return;
  }

  try {
    const auth = getAuthorizedClient();
    const sheets = google.sheets({ version: "v4", auth });
    const { headers } = await getSheetData();
    if (!headers.length) {
      res.status(400).json({ error: "Sheet has no headers in row 1" });
      return;
    }

    const row = headers.map((h) => (payload[h] !== undefined ? String(payload[h]).substring(0, 1000) : ""));
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    logOperation(req, "SHEETS_CREATE", true);
    res.json({ ok: true });
  } catch (err) {
    logOperation(req, "SHEETS_CREATE", false, { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/rows/:rowNumber", authenticateToken, validateRowData, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (!ensureSheetConfig(res) || !ensureAuthorized(res)) return;
  const rowNumber = parseInt(req.params.rowNumber, 10);
  if (!Number.isFinite(rowNumber) || rowNumber < 2) {
    res.status(400).json({ error: "Invalid rowNumber" });
    return;
  }

  const payload = req.body && req.body.data;
  if (!payload || typeof payload !== "object") {
    res.status(400).json({ error: "Missing data object" });
    return;
  }

  try {
    const auth = getAuthorizedClient();
    const sheets = google.sheets({ version: "v4", auth });
    const { headers } = await getSheetData();
    if (!headers.length) {
      res.status(400).json({ error: "Sheet has no headers in row 1" });
      return;
    }

    const lastCol = columnToLetter(headers.length);
    const range = `${SHEET_NAME}!A${rowNumber}:${lastCol}${rowNumber}`;
    const row = headers.map((h) => (payload[h] !== undefined ? String(payload[h]).substring(0, 1000) : ""));

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    logOperation(req, "SHEETS_UPDATE", true, { rowNumber });
    res.json({ ok: true });
  } catch (err) {
    logOperation(req, "SHEETS_UPDATE", false, { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/rows/:rowNumber", authenticateToken, async (req, res) => {
  if (!ensureSheetConfig(res) || !ensureAuthorized(res)) return;
  const rowNumber = parseInt(req.params.rowNumber, 10);
  if (!Number.isFinite(rowNumber) || rowNumber < 2) {
    res.status(400).json({ error: "Invalid rowNumber" });
    return;
  }

  try {
    const auth = getAuthorizedClient();
    const sheets = google.sheets({ version: "v4", auth });
    const { headers } = await getSheetData();
    if (!headers.length) {
      res.status(400).json({ error: "Sheet has no headers in row 1" });
      return;
    }

    const lastCol = columnToLetter(headers.length);
    const range = `${SHEET_NAME}!A${rowNumber}:${lastCol}${rowNumber}`;
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range,
    });

    logOperation(req, "SHEETS_DELETE", true, { rowNumber });
    res.json({ ok: true });
  } catch (err) {
    logOperation(req, "SHEETS_DELETE", false, { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// MANEJO DE ERRORES
// ============================================
app.use((err, req, res, next) => {
  logOperation(req, "ERROR", false, { error: err.message, stack: NODE_ENV === "development" ? err.stack : undefined });
  
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: "Error de validación", details: err.message });
  }
  
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "No autorizado" });
  }

  res.status(err.status || 500).json({
    error: NODE_ENV === "production" ? "Error interno del servidor" : err.message,
  });
});

// ============================================
// INICIO DEL SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 KPI Sheets API server listening on http://localhost:${PORT}`);
  console.log(`🔒 Modo: ${NODE_ENV}`);
  console.log(`✅ Seguridad habilitada: Helmet, Rate Limiting, JWT Auth`);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn("⚠️  Supabase no configurado completamente");
  }
  if (!JWT_SECRET || JWT_SECRET.includes("CHANGE")) {
    console.warn("⚠️  JWT_SECRET debe ser cambiado en producción");
  }
});
