'use strict';
/* Managed text files: GTK user CSS, settings.ini and friends.
 *
 * Several mods may contribute to the same file, so a mod never owns the whole
 * file. Instead its contribution lives between two marker lines carrying its
 * id. Removing the mod removes exactly its block and leaves every other byte —
 * including edits the user made by hand — untouched.
 */
const fs = require('fs');
const path = require('path');
const { readIfExists, writeFileAtomic, expand, ensureDir } = require('./paths');

function markerStart(id) {
  return `/* >>> Twiking ${id} >>> */`;
}
function markerEnd(id) {
  return `/* <<< Twiking ${id} <<< */`;
}

/* Config formats we touch are all comment-safe with C-style block comments:
 * CSS uses them, and INI/conf files from GTK accept them too. */
function blockFor(id, body) {
  return `${markerStart(id)}\n${String(body).trimEnd()}\n${markerEnd(id)}\n`;
}

function locate(content, id) {
  if (!content) return null;
  const start = content.indexOf(markerStart(id));
  if (start === -1) return null;
  const endMarker = markerEnd(id);
  const end = content.indexOf(endMarker);
  if (end === -1) return { start, end: content.length, broken: true };
  return { start, end: end + endMarker.length, broken: false };
}

function removeBlock(content, id) {
  const found = locate(content, id);
  if (!found) return content;
  let after = content.slice(found.end);
  // swallow the newline that followed the end marker, if any
  if (after.startsWith('\r\n')) after = after.slice(2);
  else if (after.startsWith('\n')) after = after.slice(1);
  let out = content.slice(0, found.start) + after;
  // collapse the blank line the block may have left behind
  out = out.replace(/\n{3,}/g, '\n\n');
  return out;
}

function upsertBlock(content, id, body) {
  const cleaned = removeBlock(content || '', id);
  const block = blockFor(id, body);
  if (!cleaned.trim()) return block;
  return `${cleaned.replace(/\s+$/, '')}\n\n${block}`;
}

/* Where a "gtk-css" target points. `version` 3 or 4. */
function gtkCssPath(version) {
  return expand(`~/.config/gtk-${version}.0/gtk.css`);
}

function writeManagedBlock({ file, id, body }) {
  const target = expand(file);
  const existing = readIfExists(target);
  const next = upsertBlock(existing, id, body);
  return {
    path: target,
    before: existing,
    after: next,
    remove() {
      const current = readIfExists(target);
      if (current === null) return;
      const cleaned = removeBlock(current, id);
      if (!cleaned.trim()) {
        try { fs.unlinkSync(target); } catch { /* already gone */ }
      } else {
        writeFileAtomic(target, cleaned, 0o644);
      }
    },
  };
}

function writeWholeFile({ file, content }) {
  const target = expand(file);
  const before = readIfExists(target);
  ensureDir(path.dirname(target));
  writeFileAtomic(target, content, 0o644);
  return { path: target, before, after: content };
}

module.exports = {
  markerStart, markerEnd, blockFor, locate, removeBlock, upsertBlock,
  gtkCssPath, writeManagedBlock, writeWholeFile,
};
