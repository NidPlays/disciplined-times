#!/bin/sh
# Builds the extras in output/ from output/disciplined-times.mp4:
#   poster.jpg   README thumbnail with a play button (links to the MP4)
#   preview.gif  silent looping preview for places that can't play video
set -e
cd "$(dirname "$0")/output"
ffmpeg -y -loglevel error -ss 6.9 -i disciplined-times.mp4 -frames:v 1 -vf scale=1280:-1 frame.png
python3 - <<'PY'
from PIL import Image, ImageDraw
im = Image.open('frame.png').convert('RGB')
w, h = im.size
over = Image.new('RGBA', (w, h), (0, 0, 0, 0))
d = ImageDraw.Draw(over)
r = 70
cx, cy = w // 2, int(h * 0.82)
d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(16, 185, 129, 235))
d.polygon([(cx - 22, cy - 34), (cx - 22, cy + 34), (cx + 38, cy)], fill=(2, 44, 34, 255))
im = Image.alpha_composite(im.convert('RGBA'), over).convert('RGB')
im.save('poster.jpg', quality=88)
PY
rm frame.png
FILTERS="fps=10,scale=640:-1:flags=lanczos"
ffmpeg -y -loglevel error -i disciplined-times.mp4 -vf "$FILTERS,palettegen=max_colors=128:stats_mode=diff" palette.png
ffmpeg -y -loglevel error -i disciplined-times.mp4 -i palette.png -lavfi "$FILTERS [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" preview.gif
rm palette.png
ls -la
