#!/bin/bash

# ─────────────────────────────────────────
# run-playwright.sh
# Corre los tests de Playwright, crea issues
# en GitHub y notifica a Slack si hay fallos.
# ─────────────────────────────────────────

set -e

REPO_DIR=~/openclaw-qa
SLACK_SCRIPT=$(find ~/.nvm/versions/node -name "notify-slack.sh" 2>/dev/null | head -1)

cd "$REPO_DIR"

echo "🎭 Corriendo tests de Playwright..."

# Correr tests y capturar el código de salida sin abortar el script
set +e
npx playwright test --project=chromium --headed 2>&1
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Hay tests fallidos. Revisando resultados..."

  # Obtener el último issue creado por el reporter
  ISSUE_URL=$(gh issue list --repo patoxav/openclaw-qa --state open --limit 1 --json url --jq '.[0].url' 2>/dev/null || echo "")

  # Notificar a Slack
  if [ -n "$SLACK_SCRIPT" ] && [ -f "$SLACK_SCRIPT" ]; then
    MESSAGE="❌ *QA Tests fallaron* en \`openclaw-qa\`
    if [ -n "$ISSUE_URL" ]; then
      MESSAGE="$MESSAGE\n🐙 Issue creado: $ISSUE_URL"
    fi
    bash "$SLACK_SCRIPT" "$MESSAGE"
    echo "📨 Notificación enviada a Slack"
  else
    echo "⚠️  Script de Slack no encontrado, saltando notificación"
  fi

  exit $EXIT_CODE
else
  echo ""
  echo "✅ Todos los tests pasaron correctamente"
fi
