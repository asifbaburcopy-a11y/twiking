'use strict';
/* Window corner radius through GTK user CSS — the closest Linux equivalent of
 * Windhawk's rounded-corner DWM mods. Only GTK apps are affected; Qt and
 * Electron apps draw their own frames.
 *
 * Coexists with Compact GTK Layout because each mod writes its own marked block
 * in the same stylesheet. Turning both on with square corners wins by CSS order,
 * which the description warns about. */

module.exports = {
  meta: {
    id: 'rounded-corners',
    name: 'Rounded Window Corners',
    description: 'Set how round GTK window corners are, from square to very round.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Appearance',
    icon: 'corner',
    license: 'MIT',
    tags: ['corners', 'gtk', 'css', 'radius'],
    capabilities: ['files'],
    requires: { desktops: ['GNOME'] },
  },

  settings: [
    {
      key: 'radius',
      name: 'Corner radius',
      description: '0 is square. Adwaita uses 12 px; anything above 24 px starts clipping content.',
      type: 'int',
      default: 12,
      min: 0,
      max: 32,
      step: 1,
      suffix: 'px',
    },
    {
      key: 'gtk3',
      name: 'Also apply to GTK3 apps',
      description: 'GTK3 draws its frame with a decoration node instead.',
      type: 'bool',
      default: true,
    },
  ],

  apply(ctx) {
    const r = Number(ctx.settings.radius);
    const gtk4 = [
      `window.csd, window.csd > decoration { border-radius: ${r}px; }`,
      r === 0 ? 'window.csd { box-shadow: none; }' : '',
    ].filter(Boolean).join('\n');

    const ops = [ctx.css(4, gtk4)];
    if (ctx.settings.gtk3) ops.push(ctx.css(3, `decoration { border-radius: ${r}px; }`));
    ctx.log(`GTK window corners: ${r}px`);
    return Promise.all(ops);
  },
};
