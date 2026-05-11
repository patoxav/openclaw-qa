const { execSync } = require('child_process');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

class GitHubIssueReporter {
  constructor() {
    this.failures = [];
    this.total = 0;
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.startTime = Date.now();
  }

  onBegin() {
    this.startTime = Date.now();
  }

  onTestEnd(test, result) {
    this.total += 1;

    if (result.status === 'failed') {
      this.failed += 1;
      this.failures.push({
        title: test.title,
        error: result.error?.message || 'Sin mensaje'
      });
    } else if (result.status === 'passed') {
      this.passed += 1;
    } else if (result.status === 'skipped') {
      this.skipped += 1;
    }
  }

  onEnd() {
    const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const passRate = this.total > 0 ? Math.round((this.passed / this.total) * 100) : 0;
    const now = new Date();
    const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Crear GitHub Issues por cada fallo (comportamiento original intacto)
    for (const failure of this.failures) {
      const title = `❌ Test fallido: ${failure.title}`;
      const body = `**Error:** ${failure.error}`;
      try {
        execSync(`gh issue create --repo patoxav/openclaw-qa --title "${title}" --body "${body}"`);
        console.log(`✅ Issue creado: ${title}`);
      } catch (e) {
        console.error('Error creando issue:', e.message);
      }
    }

    // Escribir qa-results.json con todos los campos que necesita el dashboard
    const qaResultsPath = path.resolve(__dirname, 'qa-results.json');
    let history = [];

    if (fs.existsSync(qaResultsPath)) {
      try {
        const content = fs.readFileSync(qaResultsPath, 'utf8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          history = parsed;
        }
      } catch (e) {
        console.error('Error leyendo qa-results.json:', e.message);
      }
    }

    history.push({
      id: `run-${Date.now()}-${randomUUID()}`,
      timestamp: now.toISOString(),
      date: date,
      total: this.total,
      passed: this.passed,
      failed: this.failed,
      skipped: this.skipped,
      passRate: passRate,
      duration: parseFloat(durationSec),
      status: this.failed > 0 ? 'failed' : 'passed',
      failures: this.failures
    });

    // Mantener solo los últimos 10 runs
    if (history.length > 10) {
      history = history.slice(history.length - 10);
    }

    try {
      fs.writeFileSync(qaResultsPath, JSON.stringify(history, null, 2));
      console.log(`📝 qa-results.json actualizado (${history.length} ejecuciones)`);
    } catch (e) {
      console.error('Error escribiendo qa-results.json:', e.message);
    }
  }
}

module.exports = GitHubIssueReporter;
