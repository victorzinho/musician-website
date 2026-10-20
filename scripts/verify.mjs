// `npm run verify`: checks the sources, builds, then checks the built site; stops at the first step that fails. Ready
// to deploy when it passes.
import { execFileSync } from 'node:child_process';

const phases = {
  'Before the build': [
    ['Stand-in content', 'node', ['scripts/check-fake.mjs']],
    ['Contrast of the palettes', 'node', ['scripts/check-contrast.mjs']],
    ['Types', 'npx', ['astro', 'check']],
  ],
  Build: [['Build', 'npx', ['astro', 'build']]],
  'After the build': [
    ['Search and link previews', 'node', ['scripts/check-seo.mjs']],
    ['Generated files', 'node', ['scripts/check-generated.mjs']],
    ['File metadata', 'node', ['scripts/check-metadata.mjs']],
    ['HTML', 'npx', ['html-validate', 'dist/**/*.html']],
    // Local links and fragments only: other sites are not checked.
    ['Links', 'npx', ['linkinator', 'dist', '--recurse', '--check-fragments', '--skip', '^https?://(?!(localhost|127\\.0\\.0\\.1|\\[::1\\])[:/])']],
  ],
};

for (const [phase, steps] of Object.entries(phases)) {
  console.log(`\n━━ ${phase}`);
  for (const [name, command, args] of steps) {
    console.log(`\n▶ ${name}`);
    try {
      execFileSync(command, args, { stdio: 'inherit' });
    } catch {
      console.error(`\n✖ ${name} failed`);
      process.exit(1);
    }
  }
}
console.log('\n✔ Verified: ready to deploy');
