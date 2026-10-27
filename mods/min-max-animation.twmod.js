'use strict';
/* Minimize/restore and maximize animation *styles* — the Linux answer to
 * Windhawk's "macOS Minimize Animation" (genie), "Classic Minimize/Maximize
 * Animations" and "Mobile Open Animation", which were all judged Partial
 * because GNOME exposes no style choice on its own.
 *
 * Zorin ships two extensions that do exactly this — Magic Lamp (genie/sine
 * minimise) and Window Move Effect (springy maximize/resize) — but ships them
 * *disabled* in `org.gnome.shell disabled-extensions`. This mod turns them on
 * by merging their ids into enabled-extensions and out of disabled-extensions
 * (verified live on GNOME 46: both go ACTIVE without a logout), then tunes
 * them. Reverting restores both arrays byte-for-byte from the journal.
 *
 * It deliberately never touches `enable-animations`: UI Animations owns that
 * key, and two mods writing one key is exactly the contradiction the bundle
 * forbids (see the collision test in tests/mods.test.js). */

const LAMP = 'org.gnome.shell.extensions.zorin-magic-lamp-effect';
const MOVE = 'org.gnome.shell.extensions.zorin-window-move-effect';
const SHELL = 'org.gnome.shell';
const EXTS = ['zorin-magic-lamp-effect@zorinos.com', 'zorin-window-move-effect@zorinos.com'];

const SPRINGS = {
  snappy: { mass: 30, friction: 9, k: 13 },
  balanced: { mass: 55, friction: 5, k: 8.5 },
  bouncy: { mass: 75, friction: 2.5, k: 5.5 },
};

function parseArray(raw) {
  const out = [];
  const re = /'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(String(raw || '')))) out.push(m[1]);
  return out;
}

function minus(list, drop) {
  return list.filter((x) => !drop.includes(x));
}

module.exports = {
  meta: {
    id: 'min-max-animation',
    name: 'Minimize & Maximize Animation',
    description: 'Genie or sine-wave minimize, springy maximize and resize, with duration, smoothness and spring feel — and it switches Zorin\'s two effect extensions on for you.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Windows',
    icon: 'bolt',
    license: 'MIT',
    tags: ['animation', 'minimize', 'maximize', 'genie', 'magic lamp', 'spring', 'zorin'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        [LAMP, 'effect'],
        [LAMP, 'duration'],
        [LAMP, 'x-tiles'],
        [MOVE, 'maximize-effect'],
        [MOVE, 'resize-effect'],
        [MOVE, 'mass'],
        [SHELL, 'enabled-extensions'],
        [SHELL, 'disabled-extensions'],
      ],
    },
  },

  settings: [
    {
      key: 'style',
      name: 'Minimize style',
      description: 'How the window travels down to the taskbar. Classic lamp is the macOS-style genie funnel; sine is a softer wave.',
      type: 'select',
      default: 'default',
      options: [
        { value: 'default', label: 'Classic lamp (genie)' },
        { value: 'sine', label: 'Sine wave' },
      ],
    },
    {
      key: 'duration',
      name: 'Minimize duration',
      description: 'How long the minimise trip takes. The Zorin default is 275 ms.',
      type: 'int',
      default: 275,
      min: 100,
      max: 1000,
      step: 25,
      suffix: 'ms',
    },
    {
      key: 'smoothness',
      name: 'Curve smoothness',
      description: 'How finely the lamp is sliced while it bends. Higher is smoother and slightly heavier.',
      type: 'int',
      default: 10,
      min: 4,
      max: 32,
      step: 2,
      suffix: 'tiles',
    },
    {
      key: 'maximize',
      name: 'Springy maximize',
      description: 'Maximise and restore with a spring instead of a linear zoom.',
      type: 'bool',
      default: true,
    },
    {
      key: 'resize',
      name: 'Springy resize',
      description: 'Resizing wobbles slightly like Compiz. Subtle, but not for everyone.',
      type: 'bool',
      default: false,
    },
    {
      key: 'spring',
      name: 'Spring feel',
      description: 'How the spring settles. Only matters while a spring effect above is on.',
      type: 'select',
      default: 'balanced',
      options: [
        { value: 'snappy', label: 'Snappy — settles fast' },
        { value: 'balanced', label: 'Balanced (Zorin default)' },
        { value: 'bouncy', label: 'Bouncy — overshoots a little' },
      ],
    },
  ],

  async apply(ctx) {
    const s = ctx.settings;
    const sp = SPRINGS[s.spring] || SPRINGS.balanced;

    const ops = [
      ctx.gsettings(LAMP, 'effect', s.style),
      ctx.gsettings(LAMP, 'duration', Number(s.duration)),
      ctx.gsettings(LAMP, 'x-tiles', Number(s.smoothness)),
      ctx.gsettings(LAMP, 'y-tiles', Number(s.smoothness)),
      ctx.gsettings(MOVE, 'maximize-effect', !!s.maximize),
      ctx.gsettings(MOVE, 'resize-effect', !!s.resize),
      ctx.gsettings(MOVE, 'mass', sp.mass),
      ctx.gsettings(MOVE, 'friction', sp.friction),
      ctx.gsettings(MOVE, 'spring-k', sp.k),
    ];

    /* Switch the two effect extensions on — merged into the enabled list and
     * out of Zorin's shipped disabled list, never overwriting what is there. */
    const enabled = await ctx.get(SHELL, 'enabled-extensions');
    if (!enabled.ok) throw new Error(`cannot read enabled-extensions: ${enabled.error}`);
    const disabled = await ctx.get(SHELL, 'disabled-extensions');
    if (!disabled.ok) throw new Error(`cannot read disabled-extensions: ${disabled.error}`);

    const on = parseArray(enabled.raw);
    const off = parseArray(disabled.raw);
    const wantedOn = [...new Set([...on, ...EXTS])];
    const wantedOff = minus(off, EXTS);

    ops.push(ctx.gsettings(SHELL, 'enabled-extensions', wantedOn));
    ops.push(ctx.gsettings(SHELL, 'disabled-extensions', wantedOff));

    ctx.log(`Animation styles applied — effects extensions ${EXTS.length} switched on`);
    return Promise.all(ops);
  },
};
