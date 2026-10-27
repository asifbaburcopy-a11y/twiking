# Twiking

**Windhawk for Linux.** A mod platform for the Linux desktop: browse small, focused tweaks, turn them on, adjust their settings, and switch them off again — with every change written down first so it can be put back exactly. Plus a curated catalogue of customization-only apps you can install with one click.

![Twiking Explore page](screenshots/explore.png)

Twiking is not a fork of Windhawk. It takes Windhawk's idea — a browsable catalogue of small mods with per-mod settings, usable by people who don't want to hand-edit registry keys — and rebuilds it for how Linux actually works.

---

## Table of contents

- [The Windhawk study](#the-windhawk-study)
- [The Linux mapping](#the-linux-mapping)
- [Catalogue coverage](#catalogue-coverage)
- [Quick start](#quick-start)
- [The safety model](#the-safety-model)
- [Trust model](#trust-model-read-this-before-enabling-a-downloaded-mod)
- [The 47 bundled mods](#the-47-bundled-mods)
- [The Apps tab](#the-apps-tab)
- [One-click installs](#one-click-installs)
- [Your projects](#your-projects)
- [Writing your own mod](#writing-your-own-mod)
- [Mod API reference](#mod-api-reference)
- [How it works internally](#how-it-works-internally)
- [Verification](#verification)
- [Limits and honest caveats](#limits-and-honest-caveats)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Credits and licence](#credits-and-licence)

---

## The Windhawk study

I downloaded the full [ramensoftware/windhawk-mods](https://github.com/ramensoftware/windhawk-mods) catalogue and parsed the headers of all **819 mods** to see what they actually are before designing anything.

### How Windhawk works

From the project's own write-up, [*Implementing Global Injection and Hooking in Windows*](https://m417z.com/Implementing-Global-Injection-and-Hooking-in-Windows/), and the mod sources:

1. **A mod is a C++ source file with metadata in comment headers** — `@id`, `@name`, `@version`, `@author`, `@include <target.exe>`, and a `WindhawkModSettings` block that becomes the settings UI. It is compiled locally into a DLL.
2. **Injection.** A mod-manager DLL is loaded into every process, and into new processes as they spawn (enumerate, inject, then hook `CreateProcessInternalW` in each injected process so children inherit it).
3. **Hooking.** Mods use MinHook-style function hooks (`Wh_SetFunctionHook`) to change another program's behaviour in memory, reading settings with `Wh_GetIntSetting` from `Wh_ModInit`.
4. **Trust by review.** Mods ship as source, not binaries, and each mod page shows that source.

### The numbers

Where the 819 mods attach, by `@include` target (first target per mod):

| Target | Mods | What that means |
| --- | ---: | --- |
| `explorer.exe` | 377 | Windows Explorer internals: taskbar, start menu, details pane, ribbon, breadcrumbs, tray |
| `windhawk.exe` | 127 | Runs inside Windhawk's own process (background/overlay-style effects) |
| `*` (all processes) | 120 | Genuine system-wide behaviour changes |
| `dwm.exe` | 17 | Desktop Window Manager: blur, acrylic, window chrome |
| `StartMenuExperienceHost.exe` | 12 | Start menu |
| `chrome.exe`, `msedge.exe` | 14 | Browser-specific |
| Everything else | 136 | One-off app targets (winword, regedit, mspaint, taskmgr, …) |
| No `@include` declared | 16 | Effect-only mods with no injected target |

86 distinct targets in total. The shape is lopsided: the single largest block is *one program's internals* — Windows Explorer, 46 % of the catalogue — and that program does not exist on Linux.

### Why injection doesn't port

Linux has no equivalent of "load my DLL into that closed-source process from a background daemon". The workarounds are worse than the problem:

- **ptrace-based code injection** needs the target to be attachable, breaks under Yama/Flatpak/seccomp, and looks exactly like malware.
- **`LD_PRELOAD`** only works when *we* start the program, only affects dynamically linked binaries, and still has to guess internal symbols.
- **A kernel module** means root, DKMS rebuilds on every kernel update, and a whole new class of ways to break boot.

None of that is acceptable for a tool aimed at "an intermediate user should be able to make their desktop theirs". So Twiking does not inject anything. It takes the part of Windhawk that *is* portable — small mods with typed settings, a catalogue, and source you can read — and applies it to the mechanisms Linux actually exposes.

The key insight that makes this more than a compromise: **most Linux customization is declarative**. A setting is a gsettings key. A restyle is a CSS file. An app tweak is an environment variable. That means a mod platform can be built on *recording and restoring configuration*, which is auditable, previewable, and exactly reversible — properties Windhawk's in-memory patching can never offer.

## The Linux mapping

| Windhawk (Windows) | Twiking (Linux) |
| --- | --- |
| Mod = C++ source with `@id`, `@include`, settings block | Mod = one `.twmod.js` file with `meta`, `settings[]`, `apply(ctx)` |
| Settings block → generated settings UI | `settings[]` schema → generated UI (bool, int, select, text, app picker, file picker) |
| `@include explorer.exe` | `requires.desktops`, `requires.keys`, `requires.extensions` — and per-app mods that target one `.desktop` entry |
| Compile to DLL, inject into process | No compilation, no injection. Changes go through journalled operations |
| `Wh_SetFunctionHook` | Not available — replaced by the five mechanisms below |
| `Wh_GetIntSetting` | `ctx.settings` |
| `Wh_ModInit` / `Wh_ModUninit` | `apply(ctx)` / automatic journal replay (no unapply to write) |
| Auto-update from windhawk.net | Bundled catalogue + import a mod file; no network calls at all |
| Antivirus flags the injection | Nothing to flag: no injection, no root, no kernel module |

A mod can act through five mechanisms:

1. **GSettings/dconf** — theme, fonts, clock, touchpad, window buttons, focus policy, workspaces, panel position. Live-updating, no logout.
2. **Managed user CSS** — `~/.config/gtk-4.0/gtk.css` and `gtk-3.0/gtk.css`, written inside id-marked blocks. This is the real equivalent of restyling another program, because every GTK app reads that file.
3. **Managed config files** — e.g. `~/.config/environment.d/*.conf` for session-wide environment.
4. **Per-application launcher wrappers** — the honest analogue of "inject into this one process": a wrapper script exporting environment variables plus a `.desktop` override pointing at it. Only the chosen app changes.
5. **Commands** (`ctx.exec`) — for mods that genuinely need a tool. Requires declaring the `exec` capability, is shown in the preview, and is explicitly *not* undoable.

## Catalogue coverage

Every Windhawk *category* that has a Linux equivalent is implemented. The full, mod-by-mod
verdict for **every Windhawk mod rated 4.0★+ with 15+ votes (304 of 820)** lives in
[docs/windhawk-4-5-star-audit.md](docs/windhawk-4-5-star-audit.md): 48 covered by a Twiking
mod, 23 partial (Linux exposes a thinner mechanism), 12 already native on Linux, and 221
not portable with the reason recorded for each. Representative mappings:

| Windhawk family (examples) | Twiking mod |
| --- | --- |
| Taskbar Clock Customization, Taskbar height and icon size, Taskbar labels | Top Bar Clock, Dock & Panel |
| Start menu / taskbar layout, taskbar autohide, tray | Dock & Panel, Desktop Icons, AppIndicator app |
| Window corner radius, rounded corners, window shadows | Rounded Window Corners, Compact GTK Layout |
| Titlebar button mods | Window Buttons |
| Focus-follows-mouse, raise on click, Alt+Tab delayer / per-monitor / mouse focus | Window Focus Behaviour, Alt-Tab Scope |
| Mouse acceleration, scroll direction, cursor mods | Mouse Feel, Touchpad Feel, Cursor Theme |
| Keyboard repeat, numlock mods, caret blinking | Keyboard Repeat, Text Cursor |
| Volume step / audio feedback mods | Sound Effects |
| Font mods, font smoothing | System Fonts, Text & UI Scaling |
| Icon mods, icon theme packs | Icon Theme |
| Wallpaper mods | Wallpaper |
| Notification mods, volume/brightness flyouts | Notifications, Sound Effects |
| Taskbar/tray theming, shell theme, accent colour | Shell Theme, GTK Theme & Colour Scheme |
| Desktop icon mods | Desktop Icons |
| Animation mods | UI Animations |
| Per-app mods (`@include chrome.exe`, `notepad.exe`, …) | Per-App Environment |
| DPI / scaling mods | Fractional Display Scaling |
| Explorer click/thumbnail behaviour | Files Behaviour, Show Hidden Files |
| AltDrag, invisible window borders (resize edge) | Mouse Window Control |
| Center New Windows | Window Placement |
| Taskbar auto-hide when maximized, instant show | Taskbar Auto-Hide Behaviour |
| Taskbar button click, middle-click close on previews | Taskbar Clicks, Taskbar Content |
| Virtual desktop / workspace mods | Workspaces (dynamic, fixed count, names) |
| Auto-raise / focus-follows-mouse extras | Window Focus Behaviour |
| Desktop icon text, volumes on the desktop | Desktop Icons |

**What cannot be ported, and why** — this is 60 %+ of the Windows catalogue, so it deserves to be stated plainly:

- **Explorer internals (377 mods).** There is no Explorer on Linux. The equivalent surface is the file manager (Nautilus), which exposes a few settings, and GNOME Shell, which exposes theme + extension preferences. You cannot rewrite Nautilus' sidebar or breadcrumb rendering from outside it.
- **DWM compositor effects (17 + many `*`).** Mutter does not accept runtime blur/acrylic/transparency parameters. Windhawk's translucent-window and Flip3D mods have no Linux counterpart short of replacing the compositor.
- **Arbitrary function hooking in closed-source apps.** Not possible without injection; only the app's own extension points exist.
- **Windows-only app targets** (winword, mspaint, regedit, StartMenuExperienceHost, UWP). No such processes exist here.

Twiking surfaces that honestly instead of shipping dead entries.

## Quick start

Requires Node 22+ and a GNOME-based desktop (built and tested on Zorin OS 18.1 / GNOME 46 / Wayland).

```sh
cd twiking
npm install
npm start
```

Then **Explore** → pick a mod → **Enable mod**. Open **Changes** to see the exact diff that was applied. Turn it off and every value goes back.

Add a per-user launcher (no root, no system files):

```sh
./scripts/install.sh            # ~/.local/share/applications/twiking.desktop
./scripts/install.sh --uninstall
```

## The safety model

- **Nothing is written before it is recorded.** Every operation stores the prior value first: the raw GVariant string for a gsettings key, the full previous file contents for a file, or "did not exist" for a file Twiking creates. The journal lives in `~/.local/share/twiking/state.json`.
- **Exact restore, not "reset to default".** The journal keeps the *raw* prior value, so a value you set yourself — say `text-scaling-factor 1.15` — comes back as `1.15`, not `1.0`. The test suite checks exactly this.
- **Transactional apply.** If a mod throws halfway through, everything it already wrote is rolled back and the mod is left disabled with the error shown. The desktop is never left half-modded.
- **Preview before apply.** The **Changes** tab runs the mod in dry-run mode and lists every intended operation with `from → to`. It writes nothing.
- **Capabilities are declared and enforced.** A mod declares `settings`, `files`, `apps`, `exec`. Calling `ctx.file()` without `files` throws and the apply is rolled back.
- **No root, ever** (except the separate, user-initiated app installer, which uses the system's normal polkit prompt). Twiking never edits system directories.
- **One writer.** A second copy refuses to start, because two processes owning the journal would corrupt the undo data.

Everything is visible from Settings — journal, backups, paths, history:

![Settings and diagnostics](screenshots/settings.png)

## Trust model (read this before enabling a downloaded mod)

A mod is JavaScript running with your user privileges. Capabilities stop a mod from *accidentally* writing files it didn't declare; they are not a security sandbox. This is the same trade-off Windhawk makes — its mods are C++ compiled into other processes — and the mitigation is the same: **mods are source, and the full source is one click away** in the Source tab. Bundled mods live in [`mods/`](mods) and are short enough to read in a minute. Only import mods from people you trust.

## The 47 bundled mods

Mods are grouped into eleven categories, so a card's colour tells you what it touches before you read it.

| Mod | Category | Mechanism | What it changes |
| --- | --- | --- | --- |
| GTK Theme & Colour Scheme | Appearance | gsettings | Installed GTK themes, light/dark |
| Icon Theme | Appearance | gsettings | Icon theme from installed sets |
| Cursor Theme | Appearance | gsettings | Cursor theme and cursor size |
| System Fonts | Appearance | gsettings | UI/document/mono fonts, anti-aliasing, hinting |
| Wallpaper | Appearance | gsettings | Light/dark images, fit mode, file picker |
| Compact GTK Layout | Appearance | user CSS | Slimmer header bars, denser buttons, square corners |
| Rounded Window Corners | Appearance | user CSS | Corner radius 0–32 px for GTK apps |
| Qt App Styling | Appearance | config file | Qt platform theme via `environment.d` |
| Shell Theme | Appearance | gsettings | Top bar/overview theme via user-theme extension |
| Titlebar Colour | Appearance | user CSS | Paint every GTK titlebar one of eight colours, light or dark text |
| Fractional Display Scaling | Displays | gsettings | 125 %/150 % scaling (Mutter experimental feature, merged safely) |
| Night Light | Displays | gsettings | Colour temperature and manual or sun-following schedule |
| Dock & Panel | Taskbar | gsettings | Zorin taskbar edge, thickness, intellihide on/off, per-workspace isolation |
| Taskbar Auto-Hide Behaviour | Taskbar | gsettings | Hide for any/focused/maximised window; edge hover, hover-to-stay, fullscreen, notifications |
| Taskbar Clicks | Taskbar | gsettings | Click, Shift-click, middle-click and scroll actions |
| Taskbar Content | Taskbar | gsettings | Pinned/running apps, grouping, labels, tooltips, previews, per-monitor |
| Taskbar Indicators | Taskbar | gsettings | Running-app marker style, corner radius, progress badges |
| Taskbar Transparency | Taskbar | gsettings | Opacity, dynamic fade, border width and colour |
| Taskbar Extras | Taskbar | gsettings | Super+number app switching, number-row/keypad, Show Desktop button |
| Taskbar on Multiple Monitors | Taskbar | gsettings | Taskbar on every screen, pinned apps carried across, position sync, hide secondary only |
| Window Buttons | Windows | gsettings | Button layout (Windows/macOS/close-only/none) |
| Window Focus Behaviour | Windows | gsettings | Click/sloppy/strict focus, raise-on-click, titlebar double-click, auto-raise, focus-new-windows |
| Window Placement | Windows | gsettings | Centre new windows, open maximised, keep dialogs attached |
| Mouse Window Control | Windows | gsettings | Modifier-drag, right-drag resize, resize edge width, middle/right titlebar actions |
| Minimize & Maximize Animation | Windows | gsettings | Genie or sine minimize, springy maximize/resize, duration, smoothness, spring feel — enables Zorin's two effect extensions |
| Window Tiling & Snap | Windows | gsettings | Tiling engine, auto-tile, snap assist, screen edges, gaps, edge offset, border |
| Alt-Tab Scope | Windows | gsettings | Current-workspace-only app and window switching |
| Top Bar Clock | Shell | gsettings | Seconds, date, weekday, 12/24 h, ISO week numbers |
| Activities Hot Corner | Shell | gsettings | The top-left hot corner |
| Workspaces | Shell | gsettings | Dynamic vs fixed count, and names shown in the overview |
| Notifications | Shell | gsettings | Banners, lock-screen notifications |
| Power & Lid | Power | gsettings | Idle timeouts and actions on mains/battery, lid close, power button, dimming |
| Battery Percentage | Power | gsettings | Exact charge in the top bar |
| Touchpad Feel | Input | gsettings | Tap-to-click, natural scroll, palm rejection, two-finger vs edge scrolling |
| Mouse Feel | Input | gsettings | Acceleration, speed, natural scroll, handedness |
| Keyboard Repeat | Input | gsettings | Repeat on/off, delay, repeat rate |
| Text Cursor | Input | gsettings | Solid or blinking caret, blink interval |
| Num Lock at Login | Input | gsettings | Keep the numeric keypad in number mode |
| Scrollbars & Middle-Click Paste | Input | gsettings | Overlay scrollbars, primary-selection paste |
| Sound Effects | Input | gsettings | Event sounds, feedback sounds, >100 % volume, volume-key step |
| Screen Magnifier | Accessibility | gsettings | Zoom factor, pointer tracking, split position, crosshairs, invert |
| Text & UI Scaling | Accessibility | gsettings | Text scale 85–200 % |
| Show Hidden Files | Files | gsettings | Dotfiles in Files and file choosers |
| Files Behaviour | Files | gsettings | Single-click open, thumbnails, folder item counts, view icon size |
| Desktop Icons | Files | gsettings | Icon size, Home and trash icons, grid arrange, label colour, volumes |
| UI Animations | Performance | gsettings | Shell animations off for perceived speed |
| Per-App Environment | Applications | launcher wrapper | Env vars + `.desktop` override for one app |

Each mod declares what it needs (`requires.desktops`, `.binaries`, `.keys`, `.extensions`). Where a requirement is missing the card says **Not compatible**, the page lists exactly what is missing, and Enable is disabled instead of failing later.

![A mod's settings page](screenshots/mod-detail.png)

Enabling is explicit and previewable:

![Applied changes and their journal](screenshots/mod-applied.png)

Per-file changes show up the same way, including which config file and which block:

![A CSS mod's recorded changes](screenshots/css-diff.png)

Everything active, and the one button that undoes all of it:

![Installed mods](screenshots/installed.png)

## The Apps tab

The second half of the brief: an extra tab for *apps*, restricted to applications whose entire purpose is customization. That restriction is code, not a convention — [`engine/apps.js`](engine/apps.js) rejects any catalogue entry whose `purpose` is not `"customization"` or whose categories fall outside the allowlist, and the Settings page reports rejected entries.

**36 apps**, covering themes, icons, cursors, fonts, wallpapers, docks, effects, shell extensions and Qt/GTK bridges: GNOME Tweaks, Zorin Appearance, Extension Manager, dconf Editor, GNOME Shell Extensions, AppIndicator Support, Ubuntu Dock, Kvantum, qt6ct, Adwaita for Qt, Gradience, Papirus, Numix Circle, elementary, Humanity, Yaru icons/GTK, Arc, Numix GTK, Breeze cursors, Inter, JetBrains Mono, Fira Code, Cantarell, Noto Emoji, Font Manager, GNOME Backgrounds, Ubuntu Wallpapers, Variety, Nitrogen, Plank, Cairo-Dock, Latte Dock, Picom, Conky, LXAppearance.

![Customization apps](screenshots/apps.png)

## One-click installs

Every app card installs with one press. Twiking builds the command from the validated catalogue (`pkexec` + `apt-get install -y <package>`, or `flatpak install` for flatpak-only apps), never from free-form input, and streams the real output into a dialog so you can see what is happening:

![Installing an app](screenshots/install.png)

- Debian/Ubuntu/Zorin packages go through **polkit**, so the system shows its normal authentication prompt; Twiking never sees or stores a password.
- Flatpak-only apps (Gradience) use the user-level **flatpak** install, no elevation.
- Cancelled authentication, lock contention from another package manager, and other failures are reported with the installer's own output.
- Nothing is ever installed silently or as a side effect of enabling a mod.

## Your projects

Your two repositories are listed under **Your projects**, kept out of the customization catalogue and labelled as yours:

- [Windows 11 File Explorer for Linux](https://github.com/asifbaburcopy-a11y/windows-11-file-explorer-linux) — detected as installed, opens from Twiking.
- [Windows 11 Task Manager for Linux](https://github.com/asifbaburcopy-a11y/windows-11-task-manager-linux) — launched through its installed `.desktop` entry; GitHub link when it isn't installed.

![Your projects](screenshots/projects.png)

## Writing your own mod

Create one file in your mods folder (Settings → **Create mod**, or `~/.local/share/twiking/mods/`), then press **Rescan**. The id must match the file name: `my-thing.twmod.js` → `meta.id: 'my-thing'`.

```js
'use strict';

module.exports = {
  meta: {
    id: 'my-thing',
    name: 'My Thing',
    description: 'What it does, in one sentence.',
    version: '1.0.0',
    author: 'your name',
    category: 'Appearance',      // Shell | Windows | Input | Appearance | Files
                                 // Performance | Applications | Experimental
    icon: 'palette',             // see the icon list in src/renderer.js
    capabilities: ['settings'],  // settings | files | apps | exec
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [['org.gnome.desktop.interface', 'clock-show-seconds']],
      extensions: ['user-theme@gnome-shell-extensions.gcampax.github.com'],
    },
  },

  settings: [
    { key: 'on', name: 'Enable it', type: 'bool', default: true },
    { key: 'size', name: 'Size', type: 'int', default: 24, min: 16, max: 64, step: 2, suffix: 'px' },
    { key: 'mode', name: 'Mode', type: 'select', default: 'a',
      options: [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }] },
    { key: 'theme', name: 'Theme', type: 'select', optionsFrom: 'themes', default: 'Adwaita' },
    { key: 'app', name: 'App', type: 'app', default: '' },
    { key: 'image', name: 'Image', type: 'file', default: '' },
    { key: 'extra', name: 'Extra', type: 'text', default: '', advanced: true },
  ],

  // No undo function: every ctx call is journalled and replayed backwards.
  apply(ctx) {
    if (!ctx.settings.on) return;
    return ctx.gsettings('org.gnome.desktop.interface', 'cursor-size', Number(ctx.settings.size));
  },
};
```

That is the whole contract. Disabling the mod puts `cursor-size` back to whatever it was, even if you had set it by hand in dconf Editor.

Sharing: the file *is* the mod. Send it, and the recipient uses Settings → **Import mod file**; Twiking validates metadata, categories and the settings schema before writing it into their mods folder.

## Mod API reference

`apply(ctx)` may call these. Every call returns a promise and is serialised with the others, so `Promise.all` is safe and the journal order is deterministic.

| Call | Capability | Effect |
| --- | --- | --- |
| `ctx.settings` | — | Resolved settings (defaults applied, ints clamped, selects validated) |
| `ctx.gsettings(schema, key, value)` | `settings` | Set a key. JS string/bool/number/string[]; `null` resets to default |
| `ctx.get(schema, key)` | `settings` | Read `{ ok, raw, error }` — useful for branching |
| `ctx.css(4 \| 3, text)` | `files` | Managed block in `~/.config/gtk-N.0/gtk.css` |
| `ctx.block(path, text)` | `files` | Managed block in any text file (keeps other mods' blocks and your content) |
| `ctx.file(path, text)` | `files` | Whole file (generated files only) |
| `ctx.read(path)` | `files` | Read a file, or `null` if absent |
| `ctx.appEnv(appId, { VAR: 'value' })` | `apps` | Launcher wrapper + `.desktop` override for one app |
| `ctx.exec(cmd, args)` | `exec` | Run a command (argv, never a shell). **Not undone on disable** |
| `ctx.log(message)` | — | Show a line in the UI and the apply result |
| `ctx.dryRun` | — | `true` during the Changes preview |

Paths accept `~`. Ids and keys are checked against strict patterns. `exec` takes an argv array, so mod-supplied values cannot become shell injection.

![Mod source, visible and reviewable](screenshots/mod-source.png)

## How it works internally

```
main.js              Electron main: window, IPC, install streaming, screenshot flags
preload.js           contextBridge — the renderer's only access to the engine
src/                 renderer: index.html, styles.css, renderer.js (no framework)
engine/
  index.js           facade used by IPC and tests (bootstrap, apply, plan, install)
  mods.js            loader + validation + settings schema + scaffolding
  runner.js          ctx construction, serialised ops, transactional apply
  journal.js         state.json, per-mod operation log, reverse replay
  gsettings.js       gsettings CLI wrapper, GVariant literals, array parsing
  files.js           managed-block writing with id markers
  desktop.js         .desktop parsing, per-app wrappers and overrides
  detect.js          desktop/session/themes/icons/cursors/fonts/extensions
  apps.js            app + project catalogues, install/launch plans
mods/                the 47 bundled mods
catalog/apps.json    36 customization apps + 2 projects
tests/               engine, catalogue and whole-catalogue round-trip tests
scripts/             demo launcher, screenshots, icon generator, install
```

## Verification

```sh
npm test
```

**28 tests**, in two suites: one of which is a static *key-ownership audit* — no two mods may write the same `schema key`, because whichever reverted first would restore a value the other never chose. It caught two real collisions in the bundle (`cursor-size` claimed by both GTK Theme and Cursor Theme, `font-hinting` by System Fonts and Text & UI Scaling); each key now has exactly one owner.

- **Engine** (`tests/engine.test.js`) — exact restore of a custom prior value, idempotent re-apply, no stacked operations, read-only previews, CSS block scoping, file-created-then-removed, per-app wrapper churn (including re-applying without leaving a dangling wrapper), capability enforcement, ledger/policy checks for the app catalogue, mod scaffolding, and five regressions found while testing the catalogue: the preview lists CSS/file/per-app changes without writing them, a mod file that fails to parse is reported instead of crashing the whole catalogue, typed literals compare by value rather than as strings, window-button layouts keep their left/right separator, and Hot Corner's Super-key toggle actually clears mutter's overlay key.
- **Whole catalogue** (`tests/mods.test.js`) — for **every bundled mod**: apply with non-default settings, assert at least one real change, disable, and assert the fake desktop is **byte-identical** to before (gsettings database, `~/.config` tree, `.desktop` overrides, wrappers). Plus: every mod declares its requirements and capabilities, extension requirements enforced, install commands validated against injection, 36 apps all installable, exactly 2 projects kept out of the catalogue.

Both suites run against a fake `HOME` with stub `gsettings`/`dconf`, stub `pkexec` and stub `flatpak`, so a passing run proves the tests cannot touch the machine running them.

### The live sweep

```sh
npm run test:live          # or: node tests/live.js --keep
```

`tests/live.js` does the same round-trip on the **real desktop**, because a fake store cannot prove that typed GVariant literals compare equal or that a key which was never written is left unwritten. For every mod it plans with two settings variants, applies, reads every affected key and file back from the desktop itself, disables, and checks the prior value again — then diffs a full `dconf dump /org/gnome/` against the baseline.

Last run — Zorin OS 18.1, GNOME on Wayland, all 47 mods:

```
47 passed · 0 failed · 0 skipped · 0 no-change · dconf restore clean
```

One nuance the sweep now handles explicitly: enabling the magnifier makes GNOME's accessibility daemon pin `toolkit-accessibility` to its default. The sweep checks whether a changed key was ever journalled by a mod, resets it when it was only a daemon-pinned default, and fails if a mod's own key changed or disappeared.

That sweep found bugs the fake desktop could not:

- **Typed literals compared as strings.** `uint32 550` never equalled `550`, and `2.0` never equalled `2`, so re-applying an integer or double setting was always reported as a change. Values are now compared canonically (`gsettings.equal`).
- **Reverting pinned schema defaults.** Keys that were never in dconf were written back with their default value instead of being reset, leaving ~44 keys behind after one pass. The journal now records `wasUnset` and resets those keys.
- **A dead control in Hot Corner.** The “Keep Super-key overview shortcut” toggle changed nothing; it now clears mutter’s `overlay-key` when off, and repairs it only when it is blank.
- **Window buttons lost their side.** Turning the app-menu option off produced `minimize,maximize,close` without the colon, which moves the buttons instead of just dropping the menu; it now emits `:minimize,maximize,close`.

All 47 mods were also planned with altered settings against the **real GNOME schemas**, which is how the touchpad bug surfaced — GNOME 46 has no `scroll-method` key, so the mod now maps its choice onto `two-finger-scrolling-enabled` / `edge-scrolling-enabled`. UI flows — enable → diff → disable, mod creation, install streaming — were driven in a real Electron window against the disposable desktop from `scripts/demo.sh`.

```sh
./scripts/demo.sh                     # the whole app against a fake desktop
./scripts/demo.sh --route='#/mod/wallpaper' --click='[data-action="enable"]'
```

## Limits and honest caveats

- **GNOME/Zorin first.** The engine is backend-shaped, but only the GNOME backend exists. KDE (`kwriteconfig`, KWin scripts) and Cinnamon/XFCE need their own; other desktops get "Not compatible" rather than broken mods.
- **Taskbar and tiling mods target Zorin's extension schemas** (`zorin-taskbar`, `zorin-tiling-shell`). On stock GNOME those keys do not exist, so the cards show *Not compatible* and list the missing keys instead of failing mid-apply.
- **No injection**, so no equivalent of hooking an arbitrary app's internals. GTK apps can be restyled through user CSS; everything else is reached through environment variables, config files and the app's own theming.
- **Wayland restricts** global input and window manipulation, so `xdotool`-style mods are deliberately absent.
- **GTK CSS affects GTK apps only** — Qt and Electron apps ignore it, which is why Qt App Styling and Per-App Environment exist.
- **No marketplace server yet.** The catalogue is local; mods are shared as files.
- **Mods are trusted code** (see Trust model). Capabilities are guard rails, not a jail.
- **The app itself is Electron** (~150 MB runtime) — one codebase, no libadwaita pinning, easy UI iteration.

## Roadmap

1. **KDE backend** — `kwriteconfig`/KWin script actions, so the catalogue is not GNOME-only.
2. **Signed remote index** — catalogue updates, signature checking, "update available" flow.
3. **Mod packs / profiles** — save "gaming" vs "work" sets of enabled mods.
4. **Shell-level tweaks via a bundled extension** — GNOME Shell cannot be CSS-injected from outside; a narrow, audited extension could expose more panel mods.
5. **Packaging** — AppImage and `.deb` so installing does not require a Node toolchain.

## Contributing

Contributions are welcome — porting one more mod counts as much as a refactor.
Read [CONTRIBUTING.md](CONTRIBUTING.md); the short version:

- **New mod, one file** (`mods/<id>.twmod.js`), authored under your own handle — the same
  single-file, author-matches-PR rule [Windhawk uses](https://github.com/ramensoftware/windhawk-mods).
- **No dead controls, no duplicate keys.** Settings must be read by your `apply()`, keys must
  be read by the real desktop component, and `npm test` fails if two mods claim the same key.
- **Prove it before you open the PR**: `npm test` (28 tests) and `npm run test:live` on your
  session — paste the `N passed · 0 failed · dconf restore clean` line into the PR template.
- Good starting points are the `Not portable` / `Partial` rows in
  [docs/windhawk-4-5-star-audit.md](docs/windhawk-4-5-star-audit.md) and the issue templates
  (bug report, new mod idea). Discussion happens in GitHub Discussions.

## Credits and licence

MIT. Inspired by [Windhawk](https://windhawk.net/) by Ramen Software / m417z; Twiking is an independent project, not affiliated with or endorsed by it, and contains no Windhawk code. The mod format and settings-schema design owe a debt to Windhawk's architecture notes ([blog](https://m417z.com/Implementing-Global-Injection-and-Hooking-in-Windows/), [repository](https://github.com/ramensoftware/windhawk), [mod catalogue](https://github.com/ramensoftware/windhawk-mods)).
