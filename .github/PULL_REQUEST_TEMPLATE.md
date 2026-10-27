# AI assistance disclosure (Windhawk asks the same — it does not affect acceptance)

- [ ] I did not use AI tools for this change
- [ ] I used AI tools (which ones, and which parts): <!-- e.g. "drafted the mod skeleton, I wrote and reviewed the rest" -->

## What this PR does

<!-- One or two sentences. For a mod: which Windhawk mod or Linux need it answers. -->

## Type of change

- [ ] New mod (`mods/<id>.twmod.js`)
- [ ] Update to an existing mod (bumped `meta.version`)
- [ ] Engine / UI fix
- [ ] Docs / catalogue

## Checklist

- [ ] `npm test` is green (28 tests, including the key-ownership audit)
- [ ] `npm run test:live` passed on my session: <!-- paste the `N passed · 0 failed · dconf restore clean` line -->
- [ ] Every declared setting is actually read by `apply()` (no dead controls)
- [ ] Every key is read by the real desktop component (extension source, schema or `libmutter`), not just present in a schema
- [ ] No `schema key` is written by another mod (the test fails if so)
- [ ] `requires.keys` / `.binaries` / `.desktops` are complete, defaults match schema defaults
- [ ] README table updated if a mod was added or renamed

## Evidence

<!-- For mods: the live-sweep evidence lines, or a note on what you verified by hand. -->