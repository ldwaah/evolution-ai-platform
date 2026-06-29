#!/usr/bin/env node
/**
 * Fix slide 1 title ghosting in Google Slides → LibreOffice PNG exports.
 *
 * LibreOffice double-draws when a paragraph has multiple coloured <a:r> runs.
 * Collapse the title to one run (one line). For pixel-perfect multi-colour
 * titles, export PNGs from Microsoft PowerPoint instead.
 *
 * Usage: node scripts/fix-slide1-title.mjs path/to/deck.pptx
 */
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";

const pptx = process.argv[2];
if (!pptx) {
  console.error("Usage: node fix-slide1-title.mjs <deck.pptx>");
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), "pptx-s1-"));
try {
  execSync(`unzip -q "${pptx}" -d "${tmp}"`);
  const slidePath = join(tmp, "ppt", "slides", "slide1.xml");
  let xml = readFileSync(slidePath, "utf8");

  const titleMatch = xml.match(/<p:sp>[\s\S]*?Google Shape;85[\s\S]*?<\/p:sp>/);
  if (!titleMatch) {
    console.error("Slide 1 title shape (85) not found");
    process.exit(1);
  }

  const fixedTitle = `<p:sp><p:nvSpPr><p:cNvPr id="85" name="Google Shape;85;p13"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="3235642" y="2400000"/><a:ext cx="5720715" cy="2000000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr anchorCtr="1" anchor="ctr" bIns="45720" lIns="91440" spcFirstLastPara="1" rIns="91440" wrap="square" tIns="45720"><a:noAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr indent="0" lvl="0" marL="0" marR="0" rtl="0" algn="ctr"><a:lnSpc><a:spcPct val="100000"/></a:lnSpc><a:spcBef><a:spcPts val="0"/></a:spcBef><a:spcAft><a:spcPts val="0"/></a:spcAft><a:buNone/></a:pPr><a:r><a:rPr b="1" lang="en-US" sz="6375"><a:solidFill><a:srgbClr val="F8FAFC"/></a:solidFill><a:latin typeface="Arial"/><a:ea typeface="Arial"/><a:cs typeface="Arial"/></a:rPr><a:t>Who Are We?</a:t></a:r><a:endParaRPr/></a:p></p:txBody></p:sp>`;

  xml = xml.replace(titleMatch[0], fixedTitle);

  // Move subtitle down so it cannot collide with the title box in LibreOffice.
  xml = xml.replace(
    /<a:off x="3371850" y="4700000"/,
    '<a:off x="3371850" y="5200000"'
  );
  xml = xml.replace(/typeface="Urbanist"/g, 'typeface="Arial"');

  writeFileSync(slidePath, xml);
  execSync(`cd "${tmp}" && zip -qr "${pptx}" .`);
  console.log(`Fixed slide 1 title in ${basename(pptx)}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
