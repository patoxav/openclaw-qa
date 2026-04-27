require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { App } = require('@slack/bolt');
const { exec } = require('child_process');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

app.message(/corre|run|ejecuta|lanza|tests?|qa|pruebas?/i, async ({ message, say }) => {
  await say('🎭 Corriendo tests de QA... te aviso cuando terminen.');
  exec('bash /Users/xavier/.nvm/versions/node/v24.14.1/lib/node_modules/openclaw/skills/playwright-qa/scripts/run-playwright.sh', (error, stdout, stderr) => {
    if (error) {
      say(`❌ Tests fallaron:\n\`\`${stdout}\`\`);\n    } else {\n      say(`✅ Todos los tests pasaron correctamente.`);\n    }\n  });\n});\n\n(async () => {\n  await app.start();\n  console.log('⚡ Slack bot escuchando...');\n})();
