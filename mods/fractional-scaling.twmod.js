'use strict';
/* Fractional display scaling: the Mutter experimental feature that gives you
 * 125 %/150 % instead of being stuck at 100 % or 200 %.
 *
 * Applied as a *merge* into the existing experimental-features array, never an
 * overwrite, and the journal restores the previous array exactly. */

const FEATURE = 'scale-monitor-framebuffer';

function parseArray(raw) {
  const out = [];
  const re = /'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(String(raw || '')))) out.push(m[1]);
  return out;
}

module.exports = {
  meta: {
    id: 'fractional-scaling',
    name: 'Fractional Display Scaling',
    description: 'Enable 125% or 150% scaling on HiDPI screens — the setting GNOME hides behind a flag.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Displays',
    icon: 'scaling',
    license: 'MIT',
    tags: ['hidpi', 'scaling', '4k', 'mutter'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [['org.gnome.mutter', 'experimental-features']],
    },
  },

  settings: [
    {
      key: 'enabled',
      name: 'Fractional scaling',
      description: 'After enabling, choose 125% or 150% in Settings → Displays. You may need to log out and back in.',
      type: 'bool',
      default: true,
    },
  ],

  apply(ctx) {
    return (async () => {
      const current = await ctx.get('org.gnome.mutter', 'experimental-features');
      if (!current.ok) throw new Error(`cannot read experimental-features: ${current.error}`);
      const features = parseArray(current.raw);
      const wanted = ctx.settings.enabled
        ? [...new Set([...features, FEATURE])]
        : features.filter((f) => f !== FEATURE);
      if (wanted.length === features.length && wanted.every((f, i) => f === features[i])) {
        ctx.log('Fractional scaling is already set the way you asked.');
        return;
      }
      return ctx.gsettings('org.gnome.mutter', 'experimental-features', wanted);
    })();
  },
};
