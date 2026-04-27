# OpenClaw QA — Setup y Arquitectura

## Lo que se construyó

Un sistema completo de QA automatizado con:
- Tests de Playwright corriendo en Chromium
- Creación automática de Issues en GitHub si fallan tests
- Notificación a Slack si fallan tests
- Bot de Slack para correr los tests desde Slack escribiendo un mensaje

---

## Archivos clave

### 1. Script principal de tests
**Ruta:** `/Users/xavier/.nvm/versions/node/v24.14.1/lib/node_modules/openclaw/skills/playwright-qa/scripts/run-playwright.sh`

- Corre `npx playwright test --project=chromium --headed`
- Si hay fallos: crea Issue en GitHub y notifica a Slack
- Si todo pasa: mensaje de éxito

### 2. Slack Bot Listener
**Ruta:** `/Users/xavier/.nvm/versions/node/v24.14.1/lib/node_modules/openclaw/skills/playwright-qa/bot/slack-listener.js`

- Usa `@slack/bolt` con Socket Mode
- Escucha mensajes que contengan "corre los tests de QA"
- Ejecuta `run-playwright.sh` y responde en Slack con el resultado

---

## Tokens y credenciales

| Variable | Valor |
|----------|-------|
| Slack App Token | `xapp-1-A0ASU3E74A3-...` (Socket Mode) |
| Slack Bot Token | `xoxb-10925485173318-...` |
| Slack App ID | `A0ASU3E74A3` |
| Workspace | Prueba OpenClaw |
| GitHub Repo | `patoxav/openclaw-qa` |

---

## Scopes del Bot de Slack

- `app_mentions:read`
- `channels:history`
- `chat:write`
- `incoming-webhook`

**Eventos suscritos:**
- `message.channels`
- `app_mention`

---

## Cómo arrancar el bot

```bash
node /Users/xavier/.nvm/versions/node/v24.14.1/lib/node_modules/openclaw/skills/playwright-qa/bot/slack-listener.js
```

Cuando veas `⚡ Slack bot escuchando...` ya está listo.

## Cómo usar desde Slack

1. Arranca el bot con el comando de arriba
2. En el canal donde está **@OpenClaw QA** escribe:

```
@OpenClaw QA corre los tests de QA
```

3. El bot responde, corre los tests, crea Issue si hay fallos y notifica.

---

## Flujo completo

```
Slack mensaje → Bot Listener → run-playwright.sh → Playwright Tests
                                                          ↓ fallo
                                                   gh issue create
                                                          ↓
                                                   notify-slack.sh
```

---

## Dependencias

```bash
# En el directorio del bot:
cd /Users/xavier/.nvm/versions/node/v24.14.1/lib/node_modules/openclaw/skills/playwright-qa/bot
npm install @slack/bolt
```
