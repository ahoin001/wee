#!/usr/bin/env node
/**
 * Post-publish verification for electron-updater GitHub Releases.
 * Fails if draft, missing latest.yml, or version/tag mismatch.
 *
 * Usage:
 *   node scripts/verify-github-release.cjs [--tag v2.12.3] [--skip-http]
 *
 * Env:
 *   GITHUB_REF_NAME / VERIFY_RELEASE_TAG — tag to verify (e.g. v2.12.3)
 *   GH_TOKEN / GITHUB_TOKEN — for gh CLI
 *   VERIFY_OWNER / VERIFY_REPO — defaults from package.json build.publish
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

function fail(message) {
  console.error(`[verify-github-release] FAIL: ${message}`);
  process.exit(1);
}

function info(message) {
  console.log(`[verify-github-release] ${message}`);
}

function readPackageJson() {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

function parseArgs(argv) {
  const out = { tag: null, skipHttp: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--skip-http') out.skipHttp = true;
    else if (arg === '--tag' && argv[i + 1]) {
      out.tag = argv[++i];
    }
  }
  return out;
}

function runGh(args) {
  const result = spawnSync('gh', args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (result.error) {
    fail(`gh failed to start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`gh ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  }
  return (result.stdout || '').trim();
}

function parseLatestYml(text) {
  const versionMatch = text.match(/^version:\s*['"]?([^\s'"]+)/m);
  const pathMatch = text.match(/^path:\s*['"]?([^\s'"]+)/m);
  const shaMatch = text.match(/^sha512:\s*['"]?([^\s'"]+)/m);
  return {
    version: versionMatch?.[1] || null,
    path: pathMatch?.[1] || null,
    sha512: shaMatch?.[1] || null,
  };
}

function httpGet(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'wee-verify-github-release' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
          httpGet(res.headers.location, redirectsLeft - 1).then(resolve, reject);
          res.resume();
          return;
        }
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode, body }));
      })
      .on('error', reject);
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const pkg = readPackageJson();
  const publish = Array.isArray(pkg.build?.publish) ? pkg.build.publish[0] : null;
  const owner = process.env.VERIFY_OWNER || publish?.owner || 'ahoin001';
  const repo = process.env.VERIFY_REPO || publish?.repo || 'wee';
  const pkgVersion = String(pkg.version || '').trim();
  if (!pkgVersion) fail('package.json version is empty');

  const tag =
    args.tag ||
    process.env.VERIFY_RELEASE_TAG ||
    process.env.GITHUB_REF_NAME ||
    '';
  if (!tag) fail('No release tag. Pass --tag vX.Y.Z or set GITHUB_REF_NAME.');
  if (!tag.startsWith('v')) fail(`Tag must start with v (got ${tag})`);

  const expectedTag = `v${pkgVersion}`;
  if (tag !== expectedTag) {
    fail(`Tag/version mismatch: tag=${tag} package.json=${pkgVersion} (expected ${expectedTag})`);
  }

  info(`Verifying ${owner}/${repo} release ${tag} (package ${pkgVersion})`);

  const metaJson = runGh([
    'release',
    'view',
    tag,
    '--repo',
    `${owner}/${repo}`,
    '--json',
    'tagName,isDraft,isPrerelease,assets,url',
  ]);
  let meta;
  try {
    meta = JSON.parse(metaJson);
  } catch {
    fail(`Could not parse gh release view JSON:\n${metaJson}`);
  }

  if (meta.isDraft) fail(`Release ${tag} is still a draft — electron-updater cannot use it`);

  const assetNames = (meta.assets || []).map((a) => a.name || '');
  info(`Assets: ${assetNames.join(', ') || '(none)'}`);

  const hasSetup = assetNames.some((n) => /^WeeDesktopLauncher-Setup-.*\.exe$/i.test(n));
  const hasLatestYml = assetNames.some((n) => n.toLowerCase() === 'latest.yml');
  const hasBlockmap = assetNames.some((n) => /\.exe\.blockmap$/i.test(n));

  if (!hasSetup) fail('Missing WeeDesktopLauncher-Setup-*.exe asset');
  if (!hasLatestYml) fail('Missing latest.yml (required by electron-updater)');
  if (!hasBlockmap) {
    info('WARN: No .exe.blockmap asset (recommended for differential updates)');
  }

  const taggedYmlUrl = `https://github.com/${owner}/${repo}/releases/download/${tag}/latest.yml`;
  info(`Fetching ${taggedYmlUrl}`);
  const taggedRes = await httpGet(taggedYmlUrl);
  if (taggedRes.status !== 200) {
    fail(`Could not download latest.yml for ${tag} (HTTP ${taggedRes.status})`);
  }
  const parsed = parseLatestYml(taggedRes.body);
  info(`latest.yml version=${parsed.version} path=${parsed.path}`);

  if (!parsed.version) fail('latest.yml missing version');
  if (parsed.version !== pkgVersion) {
    fail(`latest.yml version ${parsed.version} !== package.json ${pkgVersion}`);
  }
  if (!parsed.path) fail('latest.yml missing path');
  if (!parsed.sha512) fail('latest.yml missing sha512');

  const isPrereleaseTag = tag.includes('-');
  if (isPrereleaseTag && !meta.isPrerelease) {
    fail(`Tag ${tag} contains '-' but release is not marked prerelease`);
  }
  if (!isPrereleaseTag && meta.isPrerelease) {
    fail(`Stable tag ${tag} is incorrectly marked prerelease`);
  }

  if (!args.skipHttp && !isPrereleaseTag) {
    const url = `https://github.com/${owner}/${repo}/releases/latest/download/latest.yml`;
    info(`HTTP smoke: GET ${url}`);
    const res = await httpGet(url);
    if (res.status !== 200) fail(`latest.yml HTTP status ${res.status} from ${url}`);
    const httpParsed = parseLatestYml(res.body);
    if (httpParsed.version !== pkgVersion) {
      fail(`releases/latest latest.yml version ${httpParsed.version} !== ${pkgVersion}`);
    }
    info('HTTP smoke OK');
  } else if (isPrereleaseTag) {
    info('Skipping /releases/latest HTTP smoke for prerelease tag');
  }

  info(`OK — ${tag} is publishable for in-app updates (${meta.url})`);
}

main().catch((err) => {
  fail(err?.message || String(err));
});
