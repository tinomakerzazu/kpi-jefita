const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const PORT = process.env.PORT || 3001;
const SHEET_ID = process.env.SHEET_ID || "";
const SHEET_NAME = process.env.SHEET_NAME || "";
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS || path.join(__dirname, "credentials.json");
const TOKEN_PATH = process.env.GOOGLE_TOKEN || path.join(__dirname, "token.json");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

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

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Sheets API server running",
  });
});

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

app.get("/api/status", (req, res) => {
  res.json({ authorized: fs.existsSync(TOKEN_PATH) });
});

app.get("/api/rows", async (req, res) => {
  if (!ensureSheetConfig(res) || !ensureAuthorized(res)) return;
  try {
    const data = await getSheetData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/rows", async (req, res) => {
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

    const row = headers.map((h) => (payload[h] !== undefined ? payload[h] : ""));
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/rows/:rowNumber", async (req, res) => {
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
    const row = headers.map((h) => (payload[h] !== undefined ? payload[h] : ""));

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/rows/:rowNumber", async (req, res) => {
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

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Sheets server listening on http://localhost:${PORT}`);
});
