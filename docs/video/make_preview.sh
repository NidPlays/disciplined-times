#!/bin/sh
# GitHub READMEs can't play a repo-hosted MP4 inline, so the README shows this
# silent, looping animated WebP and links to the MP4 (with sound). WebP keeps
# the gradients smooth at less than half the size of an equivalent GIF.
set -e
cd "$(dirname "$0")"
ffmpeg -y -loglevel error -i disciplined-times.mp4 -an \
  -vf "fps=15,scale=800:-1:flags=lanczos" \
  -c:v libwebp -lossless 0 -q:v 55 -compression_level 6 -loop 0 preview.webp
ls -la preview.webp
