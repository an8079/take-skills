#!/usr/bin/env node
/**
 * Release Automation Script
 *
 * Automates version bumping, changelog generation, and release notes creation.
 * Uses conventional commits to categorize changes automatically.
 *
 * Usage:
 *   npm run release -- patch              # Bump patch version
 *   npm run release -- minor              # Bump minor version
 *   npm run release -- major              # Bump major version
 *   npm run release -- 3.0.0              # Set explicit version
 *   npm run release -- patch --dry-run    # Preview without writing
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ── Colors ──────────────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function clr(text, code) {
  return `${code}${text}${c.reset}`;
}

// ── Version helpers ─────────────────────────────────────────────────────────

function getCurrentVersion() {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  return pkg.version;
}

function getLatestTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function bumpVersion(current, bump) {
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump;

  const [major, minor, patch] = current.split('.').map(Number);
  switch (bump) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    default: throw new Error(`Invalid bump type: ${bump}. Use patch, minor, major, or X.Y.Z`);
  }
}

// ── Git helpers ─────────────────────────────────────────────────────────────

function getCommitsSinceTag(tag) {
  const range = tag ? `${tag}..HEAD` : 'HEAD';
  const raw = execSync(
    `git log ${range} --format="%H|%s" --no-merges`,
    { cwd: ROOT, encoding: 'utf-8' }
  ).trim();
  return raw ? raw.split('\n') : [];
}

function getMergeCommitsSinceTag(tag) {
  const range = tag ? `${tag}..HEAD` : 'HEAD';
  const raw = execSync(
    `git log ${range} --format="%s" --merges`,
    { cwd: ROOT, encoding: 'utf-8' }
  ).trim();
  return raw ? raw.split('\n') : [];
}

function getContributors(tag) {
  const merges = getMergeCommitsSinceTag(tag);
  const contributors = new Set();

  for (const msg of merges) {
    const match = msg.match(/from\s+([^/]+)\//);
    if (match && match[1]) {
      const user = match[1].trim();
      if (user && !user.startsWith('#')) {
        contributors.add(user);
      }
    }
  }

  return [...contributors].sort();
}

function getPRCount(tag) {
  const merges = getMergeCommitsSinceTag(tag);
  return merges.filter(m => m.startsWith('Merge pull request')).length;
}

// ── Commit parsing ──────────────────────────────────────────────────────────

const CONVENTIONAL_RE = /^(?<type>[a-z]+)(?:\((?<scope>[^)]*)\))?:\s*(?<desc>.+)$/;

function parseCommit(line) {
  const [hash, ...rest] = line.split('|');
  const raw = rest.join('|');

  if (!raw) return null;

  if (raw.startsWith('Merge ')) return null;
  if (raw.match(/^chore\(release\)/i)) return null;

  const match = raw.match(CONVENTIONAL_RE);
  if (!match?.groups) return null;

  const prMatch = raw.match(/\(#(\d+)\)/);

  return {
    hash: hash.trim(),
    type: match.groups.type,
    scope: match.groups.scope || '',
    description: match.groups.desc.replace(/\s*\(#\d+\)$/, '').trim(),
    prNumber: prMatch ? prMatch[1] : null,
    raw,
  };
}

// ── Categorization ──────────────────────────────────────────────────────────

function categorize(commits) {
  const categories = new Map();

  for (const commit of commits) {
    let category;

    if (commit.type === 'feat') {
      category = 'features';
    } else if (commit.type === 'fix' && /^(security|deps)$/.test(commit.scope)) {
      category = 'security';
    } else if (commit.type === 'fix') {
      category = 'fixes';
    } else if (commit.type === 'refactor') {
      category = 'refactoring';
    } else if (commit.type === 'docs') {
      category = 'docs';
    } else if (commit.type === 'chore' && commit.scope === 'deps') {
      category = 'security';
    } else if (commit.type === 'perf') {
      category = 'features';
    } else {
      continue;
    }

    if (!categories.has(category)) categories.set(category, []);
    categories.get(category).push(commit);
  }

  return categories;
}

// ── Changelog generation ────────────────────────────────────────────────────

function formatEntry(commit) {
  const scope = commit.scope ? `(${commit.scope})` : '';
  const pr = commit.prNumber ? ` (#${commit.prNumber})` : '';
  return `- **${commit.type}${scope}: ${commit.description}**${pr}`;
}

function generateTitle(categories) {
  const parts = [];

  if (categories.has('features')) {
    const feats = categories.get('features');
    const keywords = feats
      .slice(0, 3)
      .map(f => {
        const words = f.description.split(/\s+/);
        return words.slice(0, 3).join(' ');
      });
    parts.push(...keywords);
  }
  if (categories.has('security')) parts.push('Security Hardening');
  if (categories.has('fixes') && !parts.length) parts.push('Bug Fixes');

  if (parts.length === 0) return 'Maintenance Release';
  if (parts.length <= 3) return parts.join(', ');
  return parts.slice(0, 3).join(', ');
}

function generateSummary(categories, prCount) {
  const parts = [];
  if (categories.has('features')) parts.push(`**${categories.get('features').length} new features**`);
  if (categories.has('security')) parts.push(`**security hardening**`);
  if (categories.has('fixes')) parts.push(`**${categories.get('fixes').length} bug fixes**`);

  if (parts.length === 0) return 'Maintenance release with internal improvements.';
  return `Release with ${parts.join(', ')} across ${prCount}+ merged PRs.`;
}

function generateChangelog(version, categories, prCount) {
  const title = generateTitle(categories);
  const summary = generateSummary(categories, prCount);

  const sections = [];

  const highlights = [];
  if (categories.has('features')) {
    for (const f of categories.get('features').slice(0, 5)) {
      highlights.push(formatEntry(f));
    }
  }
  if (categories.has('security')) {
    for (const s of categories.get('security').slice(0, 3)) {
      highlights.push(formatEntry(s));
    }
  }
  if (highlights.length) sections.push({ title: 'Highlights', entries: highlights });

  if (categories.has('features')) {
    sections.push({ title: 'New Features', entries: categories.get('features').map(formatEntry) });
  }
  if (categories.has('security')) {
    sections.push({ title: 'Security & Hardening', entries: categories.get('security').map(formatEntry) });
  }
  if (categories.has('fixes')) {
    sections.push({ title: 'Bug Fixes', entries: categories.get('fixes').map(formatEntry) });
  }
  if (categories.has('refactoring')) {
    sections.push({ title: 'Refactoring', entries: categories.get('refactoring').map(formatEntry) });
  }
  if (categories.has('docs')) {
    sections.push({ title: 'Documentation', entries: categories.get('docs').map(formatEntry) });
  }

  const featCount = categories.get('features')?.length ?? 0;
  const fixCount = categories.get('fixes')?.length ?? 0;
  const secCount = categories.get('security')?.length ?? 0;
  const statsLine = `- **${prCount}+ PRs merged** | **${featCount} new features** | **${fixCount} bug fixes** | **${secCount} security/hardening improvements**`;

  let md = `# claude-studio v${version}: ${title}\n\n`;
  md += `## Release Notes\n\n${summary}\n`;

  for (const section of sections) {
    md += `\n### ${section.title}\n\n`;
    md += section.entries.join('\n') + '\n';
  }

  md += `\n### Stats\n\n${statsLine}\n`;

  return md;
}

function generateReleaseBody(version, changelog, contributors, prevTag) {
  let body = changelog;

  body += `\n### Install / Update\n\n`;
  body += '```bash\n';
  body += `npm install -g claude-studio@${version}\n`;
  body += '```\n\n';

  if (prevTag) {
    body += `\n**Full Changelog**: https://github.com/your-username/claude-studio/compare/${prevTag}...v${version}\n`;
  }

  if (contributors.length > 0) {
    body += `\n## Contributors\n\nThank you to all contributors who made this release possible!\n\n`;
    body += contributors.map(u => `@${u}`).join(' ') + '\n';
  }

  return body;
}

// ── Version file bumping ────────────────────────────────────────────────────

function bumpVersionFiles(newVersion, dryRun) {
  const changes = [];

  const pkgPath = join(ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  if (pkg.version !== newVersion) {
    pkg.version = newVersion;
    if (!dryRun) writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    changes.push(`package.json: ${pkg.version} → ${newVersion}`);
  }

  if (!dryRun) {
    try {
      execSync('npm install --package-lock-only --ignore-scripts 2>/dev/null', { cwd: ROOT });
      changes.push('package-lock.json: regenerated');
    } catch {
      changes.push('package-lock.json: FAILED to regenerate');
    }
  } else {
    changes.push('package-lock.json: would regenerate');
  }

  return changes;
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const help = args.includes('--help') || args.includes('-h');
  const bumpArg = args.find(a => !a.startsWith('-'));

  if (help || !bumpArg) {
    console.log(`
${clr('Release Automation', c.bold)}

${clr('Usage:', c.cyan)}
  npm run release -- <patch|minor|major|X.Y.Z> [--dry-run]

${clr('Examples:', c.cyan)}
  npm run release -- patch              # 3.0.0 → 3.0.1
  npm run release -- minor              # 3.0.0 → 3.1.0
  npm run release -- 5.0.0              # Set explicit version
  npm run release -- patch --dry-run    # Preview without writing

${clr('What it does:', c.cyan)}
  1. Bumps version in package.json and regenerates package-lock.json
  2. Generates CHANGELOG.md from conventional commits
  3. Generates .github/release-body.md with contributor @mentions

${clr('After running:', c.cyan)}
  git add -A && git commit -m "chore(release): bump version to vX.Y.Z"
  git push origin main
  # Wait for CI green, then:
  git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin vX.Y.Z
  # release.yml handles npm publish + GitHub release
`);
    return;
  }

  const currentVersion = getCurrentVersion();
  const newVersion = bumpVersion(currentVersion, bumpArg);
  const prevTag = getLatestTag();

  console.log(clr('\n🚀 Release Automation', c.bold));
  console.log(clr('═══════════════════════\n', c.dim));
  console.log(`  Current version: ${clr(currentVersion, c.yellow)}`);
  console.log(`  New version:     ${clr(newVersion, c.green)}`);
  console.log(`  Previous tag:    ${clr(prevTag || '(none)', c.dim)}`);
  if (dryRun) console.log(clr('\n  DRY RUN — no files will be modified\n', c.yellow));

  const rawCommits = getCommitsSinceTag(prevTag);
  const parsed = rawCommits.map(parseCommit).filter((c) => c !== null);
  const categories = categorize(parsed);
  const prCount = getPRCount(prevTag);
  const contributors = getContributors(prevTag);

  console.log(clr('\n📊 Commit Analysis', c.cyan));
  console.log(`  Total commits: ${rawCommits.length}`);
  console.log(`  Parsed conventional: ${parsed.length}`);
  console.log(`  PRs merged: ${prCount}`);
  console.log(`  Contributors: ${contributors.join(', ') || '(none)'}`);

  for (const [cat, commits] of categories) {
    console.log(`  ${cat}: ${commits.length}`);
  }

  console.log(clr('\n📦 Version Bump', c.cyan));
  const versionChanges = bumpVersionFiles(newVersion, dryRun);
  for (const change of versionChanges) {
    console.log(`  ${clr('✓', c.green)} ${change}`);
  }

  console.log(clr('\n📝 Changelog', c.cyan));
  const changelog = generateChangelog(newVersion, categories, prCount);
  if (!dryRun) {
    writeFileSync(join(ROOT, 'CHANGELOG.md'), changelog, 'utf-8');
    console.log(`  ${clr('✓', c.green)} Written to CHANGELOG.md`);
  } else {
    console.log(`  ${clr('→', c.yellow)} Would write CHANGELOG.md`);
    console.log(clr('\n--- CHANGELOG Preview ---\n', c.dim));
    console.log(changelog);
    console.log(clr('--- End Preview ---\n', c.dim));
  }

  console.log(clr('\n📋 Release Body', c.cyan));
  const releaseBody = generateReleaseBody(newVersion, changelog, contributors, prevTag);
  const releaseBodyPath = join(ROOT, '.github/release-body.md');
  if (!dryRun) {
    writeFileSync(releaseBodyPath, releaseBody, 'utf-8');
    console.log(`  ${clr('✓', c.green)} Written to .github/release-body.md`);
  } else {
    console.log(`  ${clr('→', c.yellow)} Would write .github/release-body.md`);
  }

  console.log(clr('\n✅ Done!', c.green));
  if (!dryRun) {
    console.log(clr('\nNext steps:', c.bold));
    console.log(`  1. ${clr(`git add -A && git commit -m "chore(release): bump version to v${newVersion}"`, c.cyan)}`);
    console.log(`  2. ${clr(`git push origin main`, c.cyan)}`);
    console.log(`  3. Wait for CI green`);
    console.log(`  4. ${clr(`git tag -a v${newVersion} -m "v${newVersion}" && git push origin v${newVersion}`, c.cyan)}`);
    console.log(`  5. release.yml handles npm publish + GitHub release automatically`);
  }
}

main();
