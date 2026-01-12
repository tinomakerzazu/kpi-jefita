# Sheets OAuth server

## Setup
1) Create a Google Cloud project and enable Google Sheets API.
2) Configure OAuth consent screen.
3) Create OAuth client (Web application).
4) Add redirect URI: http://localhost:3001/oauth2callback
5) Download the client JSON and save it as server/credentials.json

## Configure
Copy server/.env.example to server/.env and set:
- SHEET_ID=10S0GBW_TqlmBi4ushSho3X9_H47YYgsptEUB101KrC8
- SHEET_NAME=DIAGNOSTICO INICIAL DE HABILIDADES COMERCIALES

## Run
cd server
npm install
npm run start

## Authorize
Open http://localhost:3001/auth in your browser and complete the Google login.

## API
- GET /api/status
- GET /api/rows
- POST /api/rows  { data: { "Header 1": "value", ... } }
- PUT /api/rows/:rowNumber  { data: { "Header 1": "value", ... } }
- DELETE /api/rows/:rowNumber

Note: DELETE clears the row but does not remove it. If you need true row deletion, say so and I add batchUpdate.
