# 📖 Guía Completa — OpenClaw QA System

---

## 🗺️ ¿Qué construimos?

Un sistema completo de automatización de pruebas que conecta **Slack → Playwright → GitHub → Dashboard**, donde un gerente de calidad puede ver en tiempo real el estado de la calidad del software sin saber nada de código.

---

## 📁 Mapa completo del proyecto

```
openclaw-qa/
│
├── 📊 dashboard.html        ← El dashboard ejecutivo (lo ve el gerente)
├── 📋 presentation.html     ← Presentación de 15 slides del proyecto
├── 📄 qa-results.json       ← Base de datos de resultados (se auto-actualiza)
├── 🎭 reporter.js           ← El cerebro: procesa resultados y los guarda
├── ⚙️  playwright.config.js  ← Configuración de los tests
├── 📖 setup.md              ← Esta guía
│
├── tests/
│   ├── login.spec.js        ← Tests de login (the-internet.herokuapp.com)
│   └── example.spec.js      ← Tests de navegación (playwright.dev)
│
└── bot/
    └── slack-listener.js    ← Bot que escucha Slack y dispara los tests
```

---

## 🔄 Cómo funciona todo junto — el flujo completo

```
┌──────���──────────────────────────────────────────────────────────┐
│                                                                 │
│  1. SLACK           2. BOT           3. PLAYWRIGHT              │
│  ─────────          ─────────        ───────────────            │
│  "corre los   →    escucha el   →   abre Chromium y            │
│   tests de QA"     mensaje          corre los tests             │
│                                           ↓                     │
│  6. DASHBOARD       5. JSON         4. REPORTER.JS              │
│  ─────────────      ─────────       ──────────────              │
│  se actualiza  ←   se escribe  ←   procesa resultados          │
│  solo (30s)        en disco        crea GitHub Issues           │
│                                    si hay fallos                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📄 Archivos importantes — qué hace cada uno

### 🎭 `reporter.js` — El cerebro del sistema
Es un **reporter personalizado de Playwright** — Playwright lo llama automáticamente al terminar cada test. Hace 3 cosas:

```javascript
// 1. Cuenta resultados en tiempo real
onTestEnd(test, result) {
  if (result.status === 'failed') this.failed++
  if (result.status === 'passed') this.passed++
}

// 2. Al terminar TODOS los tests:
onEnd() {
  // Crea GitHub Issue por cada fallo
  execSync(`gh issue create --title "❌ Test fallido: ${title}"`)

  // Escribe el resultado en qa-results.json
  history.push({ passed, failed, passRate, duration, failures... })
  fs.writeFileSync('qa-results.json', JSON.stringify(history))
}
```

**¿Dónde modificar?**
- Cambiar formato del Issue → línea `execSync gh issue create`
- Agregar más campos al JSON → dentro del objeto `history.push({...})`
- Cambiar cuántos runs guardar → busca el `.slice(-10)`

---

### 📄 `qa-results.json` — La base de datos
Array JSON con el historial de ejecuciones. Cada run tiene:

```json
{
  "id": "run-1746951234",
  "timestamp": "2026-05-11T09:00:00.000Z",
  "date": "11 May 2026",
  "passed": 4,
  "failed": 0,
  "skipped": 0,
  "total": 4,
  "passRate": 100,
  "duration": 8.6,
  "failures": []
}
```

- **Máximo 10 runs** — el más viejo se elimina automáticamente
- **reporter.js lo actualiza** cada vez que corren los tests
- **dashboard.html lo lee** cada 30 segundos

**¿Dónde modificar?**
- Si quieres más historial: cambia el `slice(-10)` a `slice(-20)` en `reporter.js`
- Si quieres resetear el historial: borra el contenido y pon `[]`

---

### 📊 `dashboard.html` — Lo que ve el gerente
Archivo HTML standalone con todo incluido. Lee `qa-results.json` y renderiza:

| Sección | Qué muestra |
|---|---|
| 🚦 Semáforo | ESTABLE / ATENCIÓN / CRÍTICO |
| 📊 KPI Cards | Pass Rate, Total, Pasados, Fallidos, Duración |
| 🍩 Donut Chart | Distribución visual del último run |
| 📈 Línea tendencia | Evolución del pass rate histórico |
| 📋 Tabla historial | Todos los runs con estado |
| 🔴 Tabla fallos | Últimos tests fallidos con link a GitHub |

**Lógica del semáforo:**
```
passRate >= 90%  →  🟢 ESTABLE
passRate >= 70%  →  🟡 ATENCIÓN
passRate < 70%   →  🔴 CRÍTICO
```

**¿Dónde modificar?**
- Cambiar umbrales del semáforo → busca `>= 90` y `>= 70` en el JS del dashboard
- Cambiar colores → variables CSS al inicio: `#3fb950` (verde), `#f85149` (rojo), `#58a6ff` (azul)
- Agregar nueva sección → dentro del `<body>`, después de la tabla de fallos

---

### 🧪 `tests/` — Los tests reales

**`login.spec.js`** — Prueba el login de una app web:
```javascript
test('Login exitoso')   // usuario + contraseña correcta → debe ver mensaje verde
test('Login fallido')   // usuario + contraseña incorrecta → debe ver mensaje rojo
```

**`example.spec.js`** — Prueba el sitio de Playwright:
```javascript
test('has title')         // verifica que el título diga "Playwright"
test('get started link')  // verifica que el link "Get started" funcione
```

**¿Dónde modificar?**
- Agregar nuevos tests → crear archivo `tests/nuevo.spec.js`
- Cambiar la URL que se prueba → cambiar la constante `URL` al inicio de cada archivo
- Cambiar credenciales → cambiar los `page.fill('#password', ...)`

---

### ⚙️ `playwright.config.js` — Configuración global
Define cómo corren los tests:
- **Reporter:** qué usar para procesar resultados (`reporter.js`)
- **Browser:** Chromium por defecto
- **Timeouts:** cuánto esperar por cada acción
- **Screenshots:** si guardar capturas en fallos

---

## 🚀 Comandos para correr en vivo

### Terminal 1 — Levantar el dashboard
```bash
cd ~/openclaw-qa
git pull origin main          # siempre bajar lo último
python3 -m http.server 8080   # servidor local
```
Luego abre: **`http://localhost:8080/dashboard.html`**

### Terminal 2 — Levantar el bot de Slack
```bash
node /Users/xavier/.nvm/versions/node/v24.14.1/lib/node_modules/openclaw/skills/playwright-qa/bot/slack-listener.js
```
Cuando veas `⚡ Slack bot escuchando...` → listo ✅

### Terminal 3 — Abrir el TUI (opcional)
```bash
openclaw
# Si no responde: nvm use 24 && openclaw
```

### Terminal 4 — Ver el JSON actualizarse (opcional)
```bash
tail -f ~/openclaw-qa/qa-results.json
```

---

## 💬 Comandos en lenguaje natural (TUI o Slack)

| Lo que escribes | Lo que hace |
|---|---|
| `"corre los tests de QA"` | Ejecuta Playwright, actualiza JSON, crea issues si hay fallos |
| `"run QA tests"` | Lo mismo en inglés |
| `"muéstrame los últimos fallos"` | Resume los issues creados en GitHub |
| `"crea un skill nuevo llamado X"` | Define una nueva habilidad |
| `"qué skills tengo instalados"` | Lista los skills disponibles |

---

## 🌐 Por qué necesitas el servidor local — explicado simple

Cuando abres un HTML normal haciendo doble clic, el browser usa el protocolo **`file://`**. Por seguridad, los browsers **bloquean** que un archivo HTML lea otros archivos locales (como `qa-results.json`).

```
❌ SIN servidor (file://):
   dashboard.html intenta leer qa-results.json
   Browser dice: "BLOQUEADO — no puedo leer archivos locales"
   Resultado: "No se pudo leer qa-results.json"

✅ CON servidor (http://localhost):
   dashboard.html pide qa-results.json al servidor
   Servidor responde: "aquí está el archivo"
   Resultado: Dashboard con datos reales ✅
```

---

## 🔄 El auto-refresh — cómo funciona técnicamente

```javascript
// Cada segundo baja el contador
let countdown = 30;
setInterval(() => {
  countdown--;
  // Muestra "Actualizando en: 29s"

  if (countdown <= 0) {
    countdown = 30;
    // Hace fetch del JSON actualizado
    fetch('qa-results.json?t=' + Date.now())
      .then(r => r.json())
      .then(data => renderDashboard(data))  // re-dibuja todo
  }
}, 1000);
```

El `?t=Date.now()` al final del fetch evita que el browser use caché — fuerza siempre leer el archivo más reciente.

---

## 🔧 Cómo arreglar el test roto a propósito

En `tests/login.spec.js` la contraseña correcta está comentada. Para que pase:

**Antes (roto):**
```javascript
// await page.fill('#password', 'SuperSecretPassword!');
await page.fill('#password', 'contrasenaincorrecta');
```

**Después (correcto):**
```javascript
await page.fill('#password', 'SuperSecretPassword!');
// await page.fill('#password', 'contrasenaincorrecta');
```

---

## 🔧 Si algo no funciona

| Problema | Solución |
|---|---|
| `openclaw: command not found` | `nvm use 24` primero |
| Dashboard no se actualiza | Verifica que `python3 -m http.server` esté corriendo |
| Bot no responde en Slack | Reinicia la Terminal 2 |
| `qa-results.json` no se actualiza | Verifica que hiciste `git pull origin main` |
| `undefined%` en el dashboard | Haz `git pull` — el fix ya está en main |

---

## 🤔 Preguntas frecuentes de un Gerente de Calidad

**"¿Cada cuánto se actualizan los datos?"**
> Cada 30 segundos automáticamente. También se actualiza inmediatamente después de correr los tests desde Slack.

**"¿Dónde se guardan los resultados históricos?"**
> En `qa-results.json` dentro del repositorio. Guarda los últimos 10 runs.

**"¿Qué pasa si un test falla? ¿A quién le llega la alerta?"**
> Se crea automáticamente un Issue en GitHub con el título del test y el error exacto. Cualquier persona con acceso al repositorio puede verlo.

**"¿Se puede ver desde cualquier computadora?"**
> Actualmente necesita correr localmente. El siguiente paso sería publicarlo en GitHub Pages para acceso sin instalar nada.

**"¿Cuántos tests tenemos y qué cubren?"**
> Actualmente 4 tests: 2 de login (flujo exitoso y fallido) y 2 de navegación. Se pueden agregar más en la carpeta `tests/`.

**"¿Qué significa el semáforo rojo?"**
> Que el pass rate del último run fue menor al 70% — más de 1 de cada 3 tests está fallando. Requiere atención inmediata.

**"¿Puedo ver quién corrió los tests?"**
> Actualmente no está en el dashboard, pero sí en GitHub Issues (los crea el usuario dueño del token).

**"¿Los tests corren solos o alguien los dispara?"**
> Actualmente se disparan manualmente desde Slack. El siguiente paso sería automatizarlos con GitHub Actions para que corran solos en cada deploy.

---

## 🗺️ Qué sigue — próximos pasos naturales

| Paso | Qué agrega | Dificultad |
|---|---|---|
| **GitHub Actions** | Tests corren solos en cada push, sin necesidad de Slack | Media |
| **GitHub Pages** | Dashboard accesible desde internet, sin servidor local | Baja |
| **Jira + Xray** | Resultados van directo a Jira como Test Executions | Media |
| **Más tests** | Cubrir checkout, carrito, búsqueda del XSP project | Alta |
| **Notificación Slack automática** | Bot avisa en Slack cuando hay fallos sin que nadie lo pida | Media |

---

*Última actualización: Mayo 2026 — patoxav/openclaw-qa*
