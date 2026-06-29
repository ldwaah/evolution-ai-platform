#!/usr/bin/env bash
# Export a .pptx deck to numbered PNGs (01.png, 02.png, …) for lesson HTML.
# Uses LibreOffice → PDF → pdftoppm at 200 DPI for reliable layout fidelity.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <path/to/deck.pptx> <output/exports/dir>" >&2
  exit 1
fi

PPTX="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
OUT_DIR="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -f "$PPTX" ]]; then
  echo "PPTX not found: $PPTX" >&2
  exit 1
fi

command -v soffice >/dev/null || { echo "soffice (LibreOffice) required" >&2; exit 1; }
command -v pdftoppm >/dev/null || { echo "pdftoppm (poppler) required" >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Google Slides exports use spAutoFit text boxes that LibreOffice renders with
# overlapping multi-colour runs. Patch before export when fix scripts exist.
if [[ -f "$SCRIPT_DIR/fix-pptx-autofit.mjs" ]]; then
  node "$SCRIPT_DIR/fix-pptx-autofit.mjs" "$PPTX"
fi
if [[ -f "$SCRIPT_DIR/fix-slide1-title.mjs" ]]; then
  node "$SCRIPT_DIR/fix-slide1-title.mjs" "$PPTX"
fi
command -v node >/dev/null || { echo "node required for Google Slides PPTX patch" >&2; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$OUT_DIR" "$TMP/pdf" "$TMP/png"

# Google Slides exports use spAutoFit; LibreOffice double-renders multi-run text.
FIXED="$TMP/fixed.pptx"
node "$SCRIPT_DIR/fix-google-slides-pptx.mjs" "$PPTX" "$FIXED"

soffice --headless --invisible --nologo --nofirststartwizard \
  --convert-to pdf --outdir "$TMP/pdf" "$FIXED"

PDF="$TMP/pdf/$(basename "${PPTX%.pptx}.pdf")"
if [[ ! -f "$PDF" ]]; then
  PDF="$(find "$TMP/pdf" -name '*.pdf' -print -quit)"
fi
[[ -f "$PDF" ]] || { echo "PDF conversion failed" >&2; exit 1; }

pdftoppm -png -r 200 "$PDF" "$TMP/png/slide"

i=1
for f in "$TMP/png"/slide-*.png; do
  [[ -f "$f" ]] || continue
  cp "$f" "$OUT_DIR/$(printf '%02d.png' "$i")"
  i=$((i + 1))
done

count=$((i - 1))
echo "Exported $count slides to $OUT_DIR"
