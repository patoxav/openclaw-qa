cat > ~/openclaw-qa/scripts/run-playwright.sh << 'EOF'
#!/bin/bash

REPO_DIR=~/openclaw-qa
SLACK_SCRIPT=$(find ~/.nvm/versions/node -name "notify-slack.sh" 2>/dev/null | head -1)

cd "$REPO_DIR"

echo "🎭 Corriendo tests de Playwright..."

set +e
npx playwright test --project=chromium --headed 2>&1
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Hay tests fallidos."

  ISSUE_URL=$(gh issue list --repo patoxav/openclaw-qa --state open --limit 1 --json url --jq '.[0].url' 2>/dev/null || echo "")

  if [ -n "$SLACK_SCRIPT" ] && [ -f "$SLACK_SCRIPT" ]; then
    bash "$SLACK_SCRIPT" "❌ QA Tests fallaron en openclaw-qa. Issue: $ISSUE_URL"
    echo "📨 Notificación enviada a Slack"
  else
    echo "⚠️  Script de Slack no encontrado: $SLACK_SCRIPT"
  fi

  exit $EXIT_CODE
else
  echo "✅ Todos los tests pasaron correctamente"
fi
EOF
