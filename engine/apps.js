'use strict';
/* Customization-app catalog.
 *
 * The Apps tab is deliberately not a software centre: it only lists programs
 * whose entire purpose is changing how the desktop looks or behaves. That rule
 * is enforced here rather than left to whoever edits the JSON — an entry
 * without purpose="customization", or with a category outside the allowlist,
 * is dropped and reported as a catalog error.
 *
 * `projects` are the owner's own applications. They are not customization apps,
 * so they are validated separately, labelled in the UI, and never mixed into
 * the catalogue grid.
 */
const fs = require('fs');
const path = require('path');
const { which, run } = require('./sh');

const CATALOG = path.join(__dirname, '..', 'catalog', 'apps.json');

const PACKAGE_RE = /^[a-z0-9][a-z0-9+.-]{1,80}$/;
const FLATPAK_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{1,120}$/;

function readCatalog() {
  return JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
}

function validate(entry, allowed) {
  const problems = [];
  if (!entry || !entry.id || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(entry.id)) problems.push('id must be kebab-case');
  if (!entry || !entry.name) problems.push('missing name');
  if (!entry || entry.purpose !== 'customization') problems.push('purpose must be "customization"');
  const cats = Array.isArray(entry && entry.categories) ? entry.categories : [];
  if (!cats.length) problems.push('needs at least one category');
  for (const c of cats) if (!allowed.includes(c)) problems.push(`category "${c}" is not allowed`);
  if (!entry.package && !entry.flatpak) problems.push('needs a package or flatpak id to install with');
  if (entry.package && !PACKAGE_RE.test(entry.package)) problems.push('package name looks invalid');
  if (!entry.package && entry.flatpak && !FLATPAK_RE.test(entry.flatpak)) problems.push('flatpak id looks invalid');
  return problems;
}

function validateProject(entry) {
  const problems = [];
  if (!entry || !entry.id) problems.push('missing id');
  if (!entry || !entry.name) problems.push('missing name');
  if (!entry || entry.kind !== 'project') problems.push('kind must be "project"');
  if (!entry || !/^https:\/\/github\.com\//.test(entry.repo || '')) problems.push('needs a github repo url');
  if (!entry.command && !entry.desktopId) problems.push('needs a command or desktop id to launch');
  return problems;
}

async function packageInstalled(pkg) {
  if (!pkg) return false;
  const r = await run('dpkg-query', ['-W', '-f=${Status}', pkg]);
  return r.ok && /\binstalled$/.test(r.stdout.trim());
}

async function detectOne(entry) {
  const commands = [entry.command, ...(entry.alternateCommands || [])].filter(Boolean);
  let commandPath = null;
  for (const c of commands) {
    const p = await which(c);
    if (p) { commandPath = p; break; }
  }
  let installed = !!commandPath;
  let via = commandPath ? 'command' : null;
  if (!installed && entry.package) {
    installed = await packageInstalled(entry.package);
    if (installed) via = 'package';
  }
  return { installed, commandPath, via };
}

async function detectProject(entry) {
  const desktop = require('./desktop');
  let commandPath = entry.command ? await which(entry.command) : null;
  const desktopFile = entry.desktopId ? desktop.findDesktopFile(entry.desktopId) : null;
  const installed = !!(commandPath || desktopFile);
  return { installed, commandPath, desktopFile, via: desktopFile ? 'desktop' : commandPath ? 'command' : null };
}

/* Install commands are built from validated package ids only, never from
 * free-form user input, and are run with pkexec/apt or flatpak. */
function installPlan(entry) {
  if (entry.package) {
    if (!PACKAGE_RE.test(entry.package)) throw new Error(`unsafe package name: ${entry.package}`);
    return {
      kind: 'apt',
      cmd: 'pkexec',
      args: ['env', 'DEBIAN_FRONTEND=noninteractive', 'apt-get', 'install', '-y', entry.package],
      display: `sudo apt install ${entry.package}`,
      needsAuth: true,
    };
  }
  if (entry.flatpak) {
    if (!FLATPAK_RE.test(entry.flatpak)) throw new Error(`unsafe flatpak id: ${entry.flatpak}`);
    return {
      kind: 'flatpak',
      cmd: 'flatpak',
      args: ['install', '-y', '--noninteractive', 'flathub', entry.flatpak],
      display: `flatpak install flathub ${entry.flatpak}`,
      needsAuth: false,
    };
  }
  throw new Error(`${entry.name} has no install source`);
}

/* How to start an installed app. Desktop entries are preferred because they
 * handle DBus activation and arguments the .desktop author intended. */
function launchPlan(entry) {
  const desktop = require('./desktop');
  if (entry.desktopId) {
    const file = desktop.findDesktopFile(entry.desktopId);
    if (file) return { cmd: 'gtk-launch', args: [entry.desktopId], via: 'desktop' };
  }
  if (entry.command) return { cmd: entry.command, args: [], via: 'command' };
  throw new Error(`${entry.name} has no launcher`);
}

async function loadApps() {
  const catalog = readCatalog();
  const allowed = catalog.allowedCategories || [];
  const errors = [];
  const apps = [];
  const checks = [];

  /* Detect in parallel: each miss runs dpkg-query, and 30 of those serially is
   * the difference between a snappy first paint and a visible stall. */
  for (const entry of catalog.apps || []) {
    const problems = validate(entry, allowed);
    if (problems.length) {
      errors.push({ id: entry && entry.id, problems });
      continue;
    }
    checks.push(detectOne(entry).then((detected) => {
      const plan = installPlan(entry);
      apps.push({
        ...entry,
        kind: 'app',
        categories: entry.categories.filter((c) => allowed.includes(c)),
        installed: detected.installed,
        commandPath: detected.commandPath,
        detectedVia: detected.via,
        launchable: !!(detected.commandPath || entry.desktopId),
        installCommand: plan.display,
        installKind: plan.kind,
        installable: true,
      });
    }));
  }
  await Promise.all(checks);
  apps.sort((a, b) => a.name.localeCompare(b.name));

  const projects = [];
  for (const entry of catalog.projects || []) {
    const problems = validateProject(entry);
    if (problems.length) {
      errors.push({ id: entry && entry.id, problems });
      continue;
    }
    const detected = await detectProject(entry);
    projects.push({
      ...entry,
      installed: detected.installed,
      commandPath: detected.commandPath,
      desktopFile: detected.desktopFile,
      detectedVia: detected.via,
    });
  }

  return { allowedCategories: allowed, apps, projects, errors };
}

module.exports = {
  readCatalog, validate, validateProject, loadApps, packageInstalled,
  installPlan, launchPlan, PACKAGE_RE, FLATPAK_RE,
};
