#!/usr/bin/env node
/**
 * Replace spAutoFit with noAutofit in all slide XML inside a .pptx.
 * LibreOffice mis-renders spAutoFit text boxes from Google Slides exports,
 * causing multi-run coloured titles to overlap (e.g. "Who Are We?").
 *
 * Usage: node scripts/fix-pptx-autofit.mjs path/to/deck.pptx
 */
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";

const pptx = process.argv[2];
if (!pptx) {
  console.error("Usage: node fix-pptx-autofit.mjs <deck.pptx>");
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), "pptx-fix-"));
try {
  execSync(`unzip -q "${pptx}" -d "${tmp}"`);

  const slidesDir = join(tmp, "ppt", "slides");
  let fixed = 0;
  for (const name of execSync(`ls "${slidesDir}"/*.xml`).toString().trim().split("\n")) {
    let xml = readFileSync(name, "utf8");
    const before = xml;
    // spAutoFit → noAutofit (LibreOffice-safe)
    xml = xml.replace(/<a:spAutoFit\s*\/>/g, "<a:noAutofit/>");
    // normAutofit → noAutofit
    xml = xml.replace(/<a:normAutofit[^/]*\/>/g, "<a:noAutofit/>");
    if (xml !== before) {
      writeFileSync(name, xml);
      fixed++;
    }
  }

  execSync(`cd "${tmp}" && zip -qr "${pptx}" .`);
  console.log(`Patched ${fixed} slide(s) in ${basename(pptx)}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
