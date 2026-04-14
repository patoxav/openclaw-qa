const { execSync } = require('child_process');

class GitHubIssueReporter {
  onEnd(result) {
    for (const suite of result.suites || []) {
      for (const test of suite.tests || []) {
        for (const spec of test.results || []) {
          if (spec.status === 'failed') {
            const title = `❌ Test fallido: ${test.title}`;
            const body = `**Suite:** ${suite.title}\n**Error:** ${spec.error?.message || 'Sin mensaje'}\n**Duración:** ${spec.duration}ms`;
            try {
              execSync(`gh issue create --repo patoxav/openclaw-qa --title "${title}" --body "${body}"`);
              console.log(`Issue creado: ${title}`);
            } catch (e) {
              console.error('Error creando issue:', e.message);
            }
          }
        }
      }
    }
  }
}

module.exports = GitHubIssueReporter;