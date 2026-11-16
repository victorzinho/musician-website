// `npm run test-build`: checks the built site in dist/; stops at the first step that fails.
import { execFileSync } from 'node:child_process';

const steps = [
  ['Search and link previews', 'node', ['scripts/check-seo.mjs']],
  ['Generated files', 'node', ['scripts/check-generated.mjs']],
  ['File metadata', 'node', ['scripts/check-metadata.mjs']],
  ['HTML', 'npx', ['html-validate', 'dist/**/*.html']],
  // Local links and fragments only: other sites are not checked.
  ['Links', 'npx', ['linkinator', 'dist', '--recurse', '--check-fragments', '--skip', '^https?://(?!(localhost|127\\.0\\.0\\.1|\\[::1\\])[:/])']],
];

for (const [name, command, args] of steps) {
  console.log(`\n▶ ${name}`);
  try {
    execFileSync(command, args, { stdio: 'inherit' });
  } catch {
    console.error(`\n✖ ${name} failed`);
    process.exit(1);
  }
}
