#!/bin/bash

if [ $# -ne 2 ]; then
  echo "USAGE: $0 [pdf_presentation] [presentation_id]"
  exit 1
fi

magick convert -density 150 "$1" "presentation-${2}.png"
