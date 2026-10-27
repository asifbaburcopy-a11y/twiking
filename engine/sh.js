'use strict';
/* Process helper. Never uses a shell: every argument is passed as an argv entry,
 * so user/mod supplied values can't turn into shell injection. */
const { execFile } = require('child_process');

const TIMEOUT = 15000;

function run(cmd, args = [], opts = {}) {
  return new Promise((resolve) => {
    execFile(
      cmd,
      args,
      {
        timeout: opts.timeout || TIMEOUT,
        maxBuffer: 4 * 1024 * 1024,
        env: opts.env || process.env,
        cwd: opts.cwd,
        windowsHide: true,
      },
      (err, stdout, stderr) => {
        resolve({
          ok: !err,
          code: err && typeof err.code === 'number' ? err.code : err ? 1 : 0,
          stdout: String(stdout || ''),
          stderr: String(stderr || ''),
          error: err ? String(err.message || err) : null,
        });
      }
    );
  });
}

async function which(bin) {
  const r = await run('sh', ['-c', 'command -v "$1"', 'sh', bin]);
  const out = r.stdout.trim();
  return r.ok && out ? out.split('\n')[0] : null;
}

module.exports = { run, which };
