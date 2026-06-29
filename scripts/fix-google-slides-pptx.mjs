#!/usr/bin/env node
/**
 * Patch Google Slides .pptx exports for reliable LibreOffice PNG export.
 *
 * LibreOffice headless double-renders multi-run text when spAutoFit is set,
 * causing ghosted/overlapping text on slide 1 (and potentially others).
 *
 * Usage:
 *   node scripts/fix-google-slides-pptx.mjs path/to/deck.pptx [output.pptx]
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const src = process.argv[2];
const dest = process.argv[3] || src;

if (!src) {
  console.error("Usage: node scripts/fix-google-slides-pptx.mjs <deck.pptx> [output.pptx]");
  process.exit(1);
}

const work = fs.mkdtempSync(path.join("/tmp", "evolearn-ppt-fix-"));
execSync(`unzip -q "${path.resolve(src)}" -d "${work}"`);

function patchSlide1(xml) {
  xml = xml.replace(/<a:spAutoFit\/>/g, "<a:noAutofit/>");
  xml = xml.replace(
    /<a:bodyPr anchorCtr="0" anchor="t" bIns="0" lIns="0" spcFirstLastPara="1" rIns="0" wrap="square" tIns="0"><a:noAutofit\/><\/a:bodyPr><a:lstStyle\/><a:p><a:pPr indent="0" lvl="0" marL="0" marR="0" rtl="0" algn="ctr"><a:lnSpc><a:spcPct val="109992"\/>/,
    '<a:bodyPr anchorCtr="1" anchor="ctr" bIns="45720" lIns="91440" spcFirstLastPara="1" rIns="91440" wrap="square" tIns="45720"><a:noAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr indent="0" lvl="0" marL="0" marR="0" rtl="0" algn="ctr"><a:lnSpc><a:spcPct val="100000"/>'
  );
  return xml;
}

const slidesDir = path.join(work, "ppt/slides");
for (const file of fs.readdirSync(slidesDir)) {
  if (!/^slide\d+\.xml$/.test(file)) continue;
  let xml = fs.readFileSync(path.join(slidesDir, file), "utf8");
  xml = file === "slide1.xml" ? patchSlide1(xml) : xml.replace(/<a:spAutoFit\/>/g, "<a:noAutofit/>");
  fs.writeFileSync(path.join(slidesDir, file), xml);
}

execSync(`cd "${work}" && zip -qr "${path.resolve(dest)}" .`);
fs.rmSync(work, { recursive: true, force: true });
console.log(`Patched PPTX written to ${path.resolve(dest)}`);
