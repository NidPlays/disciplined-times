#!/bin/sh
# Voices every line in lines.tsv with HyperFrames' local Kokoro TTS.
# Needs: pip install kokoro-onnx soundfile (or HYPERFRAMES_PYTHON=<venv python>).
set -e
cd "$(dirname "$0")"
VOICE=${VOICE:-af_heart}
i=0
grep -v '^#' lines.tsv | while IFS="$(printf '\t')" read -r start speed text; do
  i=$((i + 1))
  out=$(printf 'line%02d.wav' "$i")
  bunx hyperframes@0.8.225 tts "$text" -v "$VOICE" -s "$speed" -o "$out" >/dev/null
  echo "$out  ${start}s  $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out")s  $text"
done
