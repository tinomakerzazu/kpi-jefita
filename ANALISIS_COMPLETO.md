# 📊 ANÁLISIS COMPLETO DE LA APLICACIÓN - Panel de Control KPI/OKR

## 🏗️ ARQUITECTURA GENERAL

### Estructura de Páginas HTML
1. **index.html** - Página de login/autenticación
2. **kpi.html** - Dashboard principal de KPI con formularios y visualizaciones
3. **okr.html** - Dashboard de OKR (Objetivos y Resultados Clave)
4. **datos.html** - Visualización de datos CSV con búsqueda y navegación
5. **comparar.html** - Comparación entre vendedores (CSV y Supabase)
6. **nuevo.html** - Formulario para crear nuevos registros en Supabase

### Estructura de JavaScript
1. **js/kpi-okr.js** - Lógica principal de KPI/OKR (1421 líneas)
2. **js/app.js** - Sistema de gestión de vendedores con scoring
3. **js/sheets.js** - Integración con Google Sheets (CRUD)
4. **js/sheets-public.js** - Visualización pública de datos de Sheets
5. **js/auth-config.js** - Configuración de autenticación
6. **js/auth-guard.js** - Protección de rutas
7. **js/auth.js** - Lógica de autenticación
8. **js/logout.js** - Cierre de sesión

---

## 🔄 FLUJO DE DATOS PRINCIPAL

### 1. Fuentes de Datos

#### A. Google Sheets (CSV)
- **URL**: `https://docs.google.com/spreadsheets/d/10S0GBW_TqlmBi4ushSho3X9_H47YYgsptEUB101KrC8/gviz/tq?tqx=out:csv&gid=670243679`
- **Función**: `fetchCsv()` en `kpi-okr.js`
- **Proceso**:
  1. Fetch del CSV desde Google Sheets
  2. Parse del texto CSV
  3. Corrección de encoding (mojibake)
  4. Mapeo de headers a keys internas (`resolveHeaders()`)
  5. Almacenamiento en `csvRows[]` y `csvHeaders[]`

#### B. Supabase
- **Tabla**: `kpi_respuestas`
- **Función**: `refreshSupabase()` en `kpi-okr.js`
- **Proceso**:
  1. Conexión con cliente Supabase
  2. Query: `SELECT * FROM kpi_respuestas ORDER BY created_at DESC`
  3. Almacenamiento en `supabaseRows[]`
  4. Construcción de opciones para dropdowns

### 2. Mapeo de Datos

#### Headers CSV → Keys Internas
```javascript
HEADER_CANDIDATES = {
  timestamp: ["timestamp"],
  name: ["1. nombres completos", "nombres completos"],
  role: ["2. cargo o rol", "cargo o rol"],
  // ... más mapeos
}
```

#### Función `resolveHeaders()`
- Busca coincidencias flexibles entre headers CSV y keys esperadas
- Normaliza nombres (lowercase, sin acentos)
- Crea `headerKeys{}` para lookup rápido

### 3. Transformación de Datos

#### CSV Row → Objeto Normalizado
```javascript
mapCsvRow(row) {
  // Extrae valores usando headerKeys
  // Normaliza fechas, opciones, etc.
  // Retorna objeto con estructura estándar
}
```

#### Supabase Row → Objeto Normalizado
```javascript
mapSupabaseRow(row) {
  // Mapea campos de Supabase a estructura interna
  // Aplica transformaciones necesarias
}
```

---

## 📋 ESTRUCTURA DE PREGUNTAS Y CAMPOS

### Tipos de Campos

#### 1. Campos de Opción (`OPTION_QUESTIONS`)
```javascript
{
  key: "q7",
  label: "¿Cierras la venta en el primer contacto?",
  options: ["No", "Sí"],
  includeScore: true,  // Se incluye en cálculo KPI
  includeOkr: true     // Se incluye en cálculo OKR
}
```

**Preguntas con opciones:**
- q4: Canal principal de ventas
- q5: Experiencia en ventas
- q6: Tiempo promedio para cerrar
- q7: Cierre en primer contacto
- q8: Ofrecer más de un producto
- q9: Cross-selling
- q10: Seguimiento posterior
- q11: Frecuencia de retargeting
- q12: Speech estructurado
- q13: Nivel de confianza (1-5)

#### 2. Campos de Texto (`TEXT_FIELDS`)
```javascript
{
  key: "name",
  label: "1. NOMBRES COMPLETOS:",
  type: "text"
}
```

**Campos de texto:**
- name: Nombres completos
- evalDate: Fecha de evaluación
- q14: Mayor dificultad al vender
- q15: Qué espera mejorar

#### 3. Campos Especiales
- **role**: Cargo/Rol (SUPERVISOR, JEFE DE AREA, VENDEDOR, APRENDIZ)
- **area**: Área/Canal (WHATSAPP, TIKTOK, LIVE, MESSENGER)
- **timestamp**: Fecha/hora de registro

---

## 🧮 SISTEMA DE SCORING KPI

### Ponderaciones (WEIGHTS)
```javascript
WEIGHTS = {
  conv: 0.18,        // P7 - Cierre en primer contacto
  conf: 0.16,        // P13 - Nivel de confianza
  upsell: 0.12,      // P8 - Ofrecer más productos
  cross: 0.12,       // P9 - Cross-selling
  follow: 0.12,      // P10 - Seguimiento posterior
  followTimes: 0.10, // P11 - Frecuencia retargeting
  pitch: 0.10,       // P12 - Speech estructurado
  exp: 0.10,         // P5 - Experiencia
}
```

### Función `computeScore(row)`
1. **Normaliza valores** según tipo de pregunta
2. **Calcula scores individuales** para cada métrica
3. **Aplica ponderaciones** (WEIGHTS)
4. **Retorna**:
   - `score`: Score final (0-100)
   - `breakdown`: Desglose por pregunta
   - `avg`: Promedio ponderado

### Cálculo por Métrica

#### Conversión (conv) - P7
- "Sí" = 100%
- "No" = 0%

#### Confianza (conf) - P13
- Escala 1-5 → 0-100%
- 1 = 0%, 2 = 25%, 3 = 50%, 4 = 75%, 5 = 100%

#### Upsell (upsell) - P8
- "Siempre" = 100%
- "A veces" = 50%
- "Nunca" = 0%

#### Cross-selling (cross) - P9
- "Sí" = 100%
- "A veces" = 50%
- "No" = 0%

#### Seguimiento (follow) - P10
- "Sí" = 100%
- "No" = 0%

#### Frecuencia Seguimiento (followTimes) - P11
- "Más de 3 veces" = 100%
- "2 a 3 veces" = 75%
- "1 vez" = 50%
- "No hago seguimiento" = 0%

#### Speech (pitch) - P12
- "Sí" = 100%
- "Más o menos" = 50%
- "No" = 0%

#### Experiencia (exp) - P5
- "Más de un año" = 100%
- "Entre 6-12 meses" = 75%
- "Entre 3-6 meses" = 50%
- "Entre 1-3 meses" = 25%

---

## 🎯 SISTEMA OKR (Objetivos y Resultados Clave)

### Estructura OKR
```javascript
{
  objetivo: "Pregunta X",
  meta: "Mejor opción configurada",
  actual: "Respuesta del vendedor",
  avance: "% de cumplimiento",
  estado: "En riesgo" | "En progreso" | "Completado"
}
```

### Función `renderOKR(row)`
1. Filtra preguntas con `includeOkr: true`
2. Compara respuesta actual vs. mejor opción (`okrBest{}`)
3. Calcula % de avance
4. Determina estado según avance

### Configuración de "Mejor Opción"
- Se configura en `okrConfigBody`
- Almacenado en `okrBest{}`
- Usado como referencia para calcular avance

---

## 📊 VISUALIZACIONES Y DASHBOARDS

### 1. Scoreboard (Mejores Vendedores)
- **Función**: `renderScoreboard()`
- **Datos**: Todos los registros CSV
- **Cálculo**: Score KPI por vendedor
- **Orden**: Descendente por score
- **Display**: Top vendedores con scores

### 2. Mejores Cambios
- **Función**: `renderChanges()`
- **Lógica**: Compara registros del mismo vendedor
- **Cálculo**: Diferencia entre registros más antiguo y más nuevo
- **Display**: Vendedores con mayor mejora

### 3. Distribución por Pregunta
- **Función**: `renderCharts()`
- **Visualización**: Gráficos de barras por pregunta
- **Datos**: Distribución de respuestas en todas las filas CSV

### 4. Tabla de Datos CSV
- **Página**: `datos.html`
- **Función**: `renderCsvTable()`
- **Características**:
  - Búsqueda en tiempo real (`filterRows()`)
  - Navegación registro por registro
  - Visualización tipo tarjeta (grid 3 columnas)
  - Cada registro muestra todas las preguntas/respuestas

---

## 🔍 FUNCIONALIDADES DE BÚSQUEDA Y FILTRADO

### Búsqueda en `datos.html`
```javascript
filterRows(searchTerm) {
  // Filtra csvRows[] por término de búsqueda
  // Busca en TODOS los valores de cada registro
  // Actualiza filteredRows[]
  // Resetea currentIndex a 0
  // Renderiza tabla
}
```

### Navegación de Registros
- **Estado**: `currentIndex` (índice actual en `filteredRows[]`)
- **Controles**: Botones Anterior/Siguiente
- **Contador**: "X de Y" registros
- **Teclado**: Flechas izquierda/derecha

---

## 🔄 FLUJOS DE CARGA DE DATOS

### Carga desde CSV
1. Usuario selecciona vendedor en `csvName`
2. Usuario selecciona "Más antigua" o "Más nueva" en `csvPick`
3. Click en "CARGAR CSV"
4. `loadCsvSelection()`:
   - Busca registros del vendedor seleccionado
   - Filtra por criterio (oldest/newest)
   - Mapea registro a formato interno
   - Aplica datos al formulario (`applyRowToForm()`)
   - Calcula y muestra KPI (`renderKPI()`)

### Carga desde Supabase
1. Usuario selecciona registro en `sbName`
2. Click en "CARGAR SUPABASE"
3. `loadSupabaseSelection()`:
   - Busca registro por ID en `supabaseRows[]`
   - Mapea a formato interno
   - Aplica al formulario
   - Calcula KPI
   - **IMPORTANTE**: Resetea dropdown a "Selecciona..."

---

## 💾 PERSISTENCIA DE DATOS

### Guardado en Supabase
```javascript
saveToSupabase() {
  // Obtiene datos del formulario (getSupabasePayload())
  // Calcula score KPI
  // Inserta en tabla kpi_respuestas
  // Actualiza lista de registros (refreshSupabase())
}
```

### Estructura de Payload Supabase
```javascript
{
  name: string,
  role: string,
  area: string,
  evalDate: string,
  q4: string,
  q5: string,
  // ... todas las preguntas
  score: number,  // Score KPI calculado
  created_at: timestamp
}
```

---

## 🎨 SISTEMA DE DISEÑO

### Paleta de Colores
```css
--primary: #F24455 (Rojo/Rosa principal)
--primary-2: #E5203A (Rojo más oscuro)
--accent: #FF94B2 (Rosa claro)
--accent-2: #FFDBE8 (Rosa muy claro)
--bg: #FFDBE8 (Fondo)
--text: #2B0013 (Texto oscuro)
```

### Componentes Principales
1. **Sidebar**: Navegación con secciones colapsables
2. **Panels**: Contenedores principales con headers
3. **Forms**: Grid de campos con labels
4. **Tables**: Tablas con diseño tipo tarjeta
5. **Cards**: Tarjetas para métricas y resúmenes

---

## 🔐 AUTENTICACIÓN

### Flujo de Auth
1. **index.html**: Login con email/password
2. **auth.js**: Maneja login/logout
3. **auth-guard.js**: Protege rutas (verifica sesión)
4. **auth-config.js**: Configuración de Supabase Auth

### Protección de Rutas
- Todas las páginas excepto `index.html` requieren autenticación
- `auth-guard.js` redirige a login si no hay sesión

---

## 📤 EXPORTACIÓN

### PDF (jsPDF + autoTable)
- **Funciones**: `exportKpiPdf()`, `exportOkrPdf()`, `exportComparePdf()`
- **Incluye**: Logo, datos del formulario, scores, tablas

### XLS (SheetJS/XLSX)
- **Funciones**: `exportKpiXls()`, `exportOkrXls()`, `exportCompareXls()`
- **Formato**: Excel con múltiples hojas si es necesario

---

## 🔧 FUNCIONES UTILITARIAS CLAVE

### Limpieza de Datos
```javascript
cleanCellValue(value) {
  // Limpia valores vacíos, null, undefined
  // Retorna string vacío si no hay valor
}

fixMojibake(text) {
  // Corrige problemas de encoding
  // Reemplaza caracteres mal codificados
}
```

### Formateo
```javascript
cleanDisplay(text) {
  // Limpia y formatea texto para display
  // Maneja valores vacíos
}

formatSupabaseLabel(row) {
  // Formatea label para dropdowns Supabase
  // "NOMBRE - FECHA HORA"
}
```

### Manejo de Tiempo
```javascript
getRowTime(row, idx) {
  // Extrae timestamp de registro
  // Usa headerKeys para encontrar campo timestamp
  // Parsea fecha/hora
  // Retorna timestamp numérico para ordenamiento
}
```

---

## 🎯 PUNTOS CRÍTICOS DE LA ARQUITECTURA

### 1. Mapeo Flexible de Headers
- **Problema**: Headers CSV pueden variar en formato
- **Solución**: `HEADER_CANDIDATES` con múltiples variantes
- **Función**: `resolveHeaders()` busca coincidencias flexibles

### 2. Normalización de Datos
- CSV y Supabase tienen estructuras diferentes
- Funciones `mapCsvRow()` y `mapSupabaseRow()` unifican formato
- Permite usar misma lógica para ambos orígenes

### 3. Estado Global
- Variables globales: `csvRows[]`, `supabaseRows[]`, `headerKeys{}`
- Se actualizan con `refreshCsv()` y `refreshSupabase()`
- Todas las funciones acceden a estos estados

### 4. Renderizado Reactivo
- Cambios en formulario → `renderKPI()`
- Cambios en CSV → Actualiza dropdowns y visualizaciones
- Cambios en Supabase → Actualiza opciones

---

## 🚀 MEJORAS POTENCIALES IDENTIFICADAS

### 1. Gestión de Estado
- Considerar un sistema de estado más estructurado
- Evitar dependencias globales excesivas

### 2. Manejo de Errores
- Mejorar feedback de errores al usuario
- Validación más robusta de datos

### 3. Performance
- Lazy loading de visualizaciones pesadas
- Debounce en búsquedas
- Caché de datos CSV

### 4. Accesibilidad
- Mejorar ARIA labels
- Navegación por teclado más completa
- Contraste de colores

---

## 📝 NOTAS IMPORTANTES

1. **Encoding**: El sistema maneja múltiples encodings (UTF-8, Windows-1252)
2. **Fechas**: Se normalizan a formato estándar para comparaciones
3. **Opciones**: Se validan contra listas predefinidas
4. **Scores**: Siempre se recalculan, no se almacenan (excepto en Supabase)
5. **Formularios**: Se generan dinámicamente desde `FORM_ORDER`

---

## 🔗 DEPENDENCIAS EXTERNAS

- **Supabase JS**: Autenticación y base de datos
- **jsPDF + autoTable**: Exportación PDF
- **SheetJS/XLSX**: Exportación Excel
- **Google Sheets API**: Fuente de datos CSV

---

Este análisis cubre la estructura completa de la aplicación. Cualquier cambio debe considerar estos flujos y dependencias para mantener la integridad del sistema.
