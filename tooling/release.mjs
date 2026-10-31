// Builds a release and tags it: node tooling/release.mjs 1.2.0 [--no-push]
// The built files only exist in the tagged commit, never on main, so that Composer installs them.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const version = process.argv[2];
const push = !process.argv.includes('--no-push');

const run = (command, ...args) => execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(version ?? '')) fail('Usage: node tooling/release.mjs <X.Y.Z[-pre]> [--no-push]');
if (run('git', 'status', '--porcelain')) fail('The working tree is not clean.');
if (!readFileSync('CHANGELOG.md', 'utf8').includes(`## [${version}]`)) fail(`CHANGELOG.md has no section for ${version}.`);
if (run('git', 'tag', '--list', `v${version}`)) fail(`The tag v${version} already exists.`);

const start = run('git', 'symbolic-ref', '--short', 'HEAD');

run('pnpm', '--filter', '@synapse-medical/design', 'build');
run('git', 'checkout', '--detach');
try {
  const file = 'packages/design/package.json';
  writeFileSync(file, readFileSync(file, 'utf8').replace(/"version": "[^"]+"/, `"version": "${version}"`));
  run('git', 'add', file);
  run('git', 'add', '--force', 'dist', 'twig', 'meta');
  run('git', 'commit', '--message', `release: v${version}`);
  run('git', 'tag', '--annotate', `v${version}`, '--message', `v${version}`);
  if (push) run('git', 'push', 'origin', `v${version}`);
} finally {
  run('git', 'checkout', start);
}

console.log(`Released v${version}${push ? '' : ' (not pushed)'}.`);
