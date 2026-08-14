#!/usr/bin/env bash
# Build the CV, light and dark, and drop both where the site links to them.
#
#   ./cv/build.sh
#
# XeLaTeX is required: the fonts in cv/fonts/ are TTFs loaded through
# fontspec. Two passes each, because the running foot needs \pageref and the
# closing band needs to know which page is last.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$here"

out="$here/out"
mkdir -p "$out"

build() {
  local job="$1" preamble="$2" dest="$3"
  for _ in 1 2; do
    xelatex -interaction=nonstopmode -halt-on-error \
            -output-directory="$out" -jobname="$job" \
            "$preamble\\input{cv.tex}" >/dev/null
  done
  cp "$out/$job.pdf" "$here/../public/$dest"

  local pages size
  pages=$(pdfinfo "$out/$job.pdf" 2>/dev/null | awk '/^Pages:/ {print $2}')
  size=$(du -h "$out/$job.pdf" | cut -f1)
  echo "public/$dest  ${pages:-?} pages, $size"
}

build cv       ""                                              Ferran_Alia_CV.pdf
build cv-dark  "\\PassOptionsToPackage{dark}{cvstyle}"          Ferran_Alia_CV_dark.pdf
