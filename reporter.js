const { execSync } = require('child_process');

class GitHubIssueReporter {
  constructor() {
    this.failures = [];
  }

  onTestEnd(test, result) {
    if (result.status === 'failed') {
      this.failures.push({
        title: test.title,
        error: result.error?.message || 'Sin mensaje'
      });
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
  }
}

module.exports = GitHubIssueReporter;
