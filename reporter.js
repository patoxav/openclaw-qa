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
    }
  }

  onEnd() {
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
      timestamp: new Date().toISOString(),
      total: this.total,
      passed: this.passed,
      failed: this.failed,
      status: this.failed > 0 ? 'failed' : 'passed',
      failures: this.failures
    });

    try {
      fs.writeFileSync(qaResultsPath, JSON.stringify(history, null, 2));
      console.log(`📝 qa-results.json actualizado (${history.length} ejecuciones)`);
    } catch (e) {
      console.error('Error escribiendo qa-results.json:', e.message);
    }
  }
}

module.exports = GitHubIssueReporter;
