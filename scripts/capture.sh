#!/bin/bash
NAME="$1"
OUT="/home/jlfernandes/Documents/GitHub/RunTracker/RunTracker/screenshots/${NAME}.png"
for attempt in 1 2 3 4; do
  adb shell "screenrecord --time-limit 3 --bit-rate 5000000 /sdcard/cap_$$.mp4" >/dev/null 2>&1
  adb pull /sdcard/cap_$$.mp4 /tmp/cap_$$.mp4 >/dev/null 2>&1
  adb shell rm -f /sdcard/cap_$$.mp4 >/dev/null 2>&1
  DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 /tmp/cap_$$.mp4 2>/dev/null | grep -oE '[0-9.]+')
  if python3 -c "import sys; sys.exit(0 if float('${DUR:-0}') > 1.5 else 1)" 2>/dev/null; then
    ffmpeg -y -i /tmp/cap_$$.mp4 -ss 1.0 -frames:v 1 "$OUT" >/dev/null 2>&1
    if [ -f "$OUT" ]; then echo "OK $NAME (dur=${DUR}s)"; rm -f /tmp/cap_$$.mp4; exit 0; fi
  fi
  echo "retry $attempt (dur=${DUR}s)"
  sleep 1
done
echo "FAIL $NAME"
rm -f /tmp/cap_$$.mp4
exit 1
