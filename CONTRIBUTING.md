# Contributing to Twiking

Twiking is a Windhawk-style mod platform for the Linux desktop: small,
reversible, single-owner changes to GNOME/Zorin, plus a catalogue of
customization apps. Contributions of every size are welcome — one more ported
mod counts as much as a refactor.

The way we work is deliberately close to
[Windhawk's own contribution model](https://github.com/ramensoftware/windhawk-mods)
(single-file mod PRs, author identity matching the mod, template-driven issues),
with one addition that exists because Twiking's whole promise is *reversibility*.

## Ways to help

| Kind of contribution | What to do |
| --- | --- |
| **Port a Windhawk mod** | Pick a `Not portable`/`Partial` row from [docs/windhawk-4-5-star-audit.md](docs/windhawk-4-5-star-audit.md) and find the Linux mechanism — or open a "new mod idea" issue first to check nobody is on it |
| **Fix a bug** | Open a bug-report issue, or send a PR with a regression test |
| **Improve the UI** | `src/renderer.js`, `src/styles.css` — screenshots in PRs help |
| **Apps catalogue** | New customization-only apps in `catalog/apps.json` (purpose must be `customization`) |
| **Docs / translations** | README, audit doc, screenshots |

## Ground rules for a mod PR

1. **One mod, one file, one owner.** A mod lives in `mods/<id>.twmod.js` and
   must not write a `schema key` that another mod already writes. This is
   enforced: `npm test` runs a key-ownership audit and fails the build on a
   collision.
2. **No dead controls.** Every setting you declare must be read by the code in
   `apply()`, and the key must be read by the real desktop component (extension
   source, schema, `libmutter`) — not merely present in a schema. Zorin's
   `minimize-shift` and `trans-dynamic-distance` are examples of keys that look
   real and are never read; don't ship them.
3. **Declare what you need.** `requires.keys`, `.binaries`, `.desktops` (and
   `.extensions` when a mod needs one already enabled) must be complete, so
   machines without them show **Not compatible** instead of failing mid-apply.
4. **Defaults must be the schema's own defaults.** Enabling a mod with default
   settings should change nothing on a stock system.
5. **Prove it.** Run before opening the PR:

   ```sh
   npm test          # 28 unit tests against a fake desktop — must be green
   npm run test:live # same round-trip on your real session (flickers, then restores)
   ```

   The live sweep applies two settings variants per mod, reads every key back
   from the desktop, disables, and diffs `dconf dump /org/gnome/` against a
   baseline. Attach its summary line to the PR.

6. **Identity.** Set `meta.author` to your handle; if you add a `github`-style
   link, it must be your own profile (same rule Windhawk uses for `@github`).

## Pull requests

- Target `main`. Keep a PR to **one mod** or one focused engine/UI change.
- Fill in the PR template — including the AI-assistance disclosure (Windhawk
  asks the same; it does not affect acceptance).
- Bump `meta.version` when updating an existing mod, and say what changed in
  the PR body — that text becomes the changelog.
- A PR that adds a key to a mod must also update that mod's `requires.keys`.

## Issues

Use the templates: **bug report**, **new mod idea**, or **feature request**.
For "can this Windhawk mod run on Linux?" questions, link the mod's page — the
rating, vote count and target process in the audit are what decide whether it
is worth porting.

## Licence

By contributing you agree your work is released under the MIT licence, the
same as the rest of the project.