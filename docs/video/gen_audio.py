"""Synthesise the promo soundtrack: a 120 BPM groove plus sound effects
locked to the moments in index.html. Everything is generated from code so
the video has no third-party audio to license and re-renders identically.

Usage: python3 gen_audio.py   (needs numpy and ffmpeg)
Writes assets/soundtrack.m4a.
"""

import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
LENGTH = 38.0
HERE = Path(__file__).resolve().parent
rng = np.random.default_rng(7)  # seeded: identical output every run

music = np.zeros(int(SR * LENGTH))
sfx = np.zeros_like(music)


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def place(buf, start, sig, gain=1.0):
    i = int(start * SR)
    if i >= len(buf):
        return
    end = min(len(buf), i + len(sig))
    buf[i:end] += sig[: end - i] * gain


def env(dur, attack=0.005, decay=None):
    t = t_axis(dur)
    a = np.clip(t / attack, 0, 1)
    d = np.exp(-t / (decay if decay else dur / 4))
    return a * d


def note(freq):
    return 440.0 * 2 ** ((freq - 69) / 12)


def lowpass(sig, alpha):
    # One-pole low-pass; alpha in (0, 1], smaller = darker.
    out = np.empty_like(sig)
    acc = 0.0
    for i, x in enumerate(sig):
        acc += alpha * (x - acc)
        out[i] = acc
    return out


# ---------- instruments ----------

def kick():
    t = t_axis(0.35)
    f = 50 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def clap():
    t = t_axis(0.2)
    n = rng.standard_normal(len(t))
    n = n - lowpass(n, 0.25)  # high-pass
    return n * np.exp(-t * 22) * 0.6


def hat():
    t = t_axis(0.06)
    n = rng.standard_normal(len(t))
    n = n - lowpass(n, 0.5)
    return n * np.exp(-t * 70) * 0.35


def pluck(midi, dur=0.22):
    t = t_axis(dur)
    f = note(midi)
    sig = np.sign(np.sin(2 * np.pi * f * t)) * 0.3 + np.sin(2 * np.pi * f * 2 * t) * 0.3
    return lowpass(sig * env(dur, 0.003, 0.06), 0.35)


def bass(midi, dur=0.45):
    t = t_axis(dur)
    f = note(midi)
    saw = 2 * ((f * t) % 1) - 1
    return lowpass(saw, 0.08) * env(dur, 0.005, 0.25) * 1.6


def pad(midis, dur):
    t = t_axis(dur)
    sig = sum(np.sin(2 * np.pi * note(m) * t) + 0.3 * np.sin(2 * np.pi * note(m) * 1.003 * t) for m in midis)
    fade = np.minimum(1, np.minimum(t / 0.4, (dur - t) / 0.4))
    return sig * fade * 0.08


def bell(midi, dur=0.8):
    t = t_axis(dur)
    f = note(midi)
    sig = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
    return sig * env(dur, 0.002, 0.25)


def blip(midi, dur=0.12):
    t = t_axis(dur)
    return np.sin(2 * np.pi * note(midi) * t) * env(dur, 0.002, 0.04)


def pop(midi):
    t = t_axis(0.18)
    f = note(midi) * (1 + 1.5 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(0.18, 0.001, 0.05)


def whoosh(dur=0.45, up=True):
    t = t_axis(dur)
    n = rng.standard_normal(len(t))
    shape = np.sin(np.pi * t / dur) ** 2
    alpha = np.linspace(0.05, 0.4, len(t)) if up else np.linspace(0.4, 0.05, len(t))
    out = np.empty_like(n)
    acc = 0.0
    for i, x in enumerate(n):
        acc += alpha[i] * (x - acc)
        out[i] = acc
    return out * shape * 1.2


def boom():
    t = t_axis(1.2)
    f = 40 + 80 * np.exp(-t * 8)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3)


def riser(dur):
    t = t_axis(dur)
    n = rng.standard_normal(len(t))
    alpha = np.linspace(0.02, 0.5, len(t))
    out = np.empty_like(n)
    acc = 0.0
    for i, x in enumerate(n):
        acc += alpha[i] * (x - acc)
        out[i] = acc
    return out * (t / dur) ** 2 * 0.8


def tick():
    t = t_axis(0.03)
    return np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 200) * 0.6


# ---------- music ----------

BEAT = 0.5
OFFSET = 0.2  # so a downbeat lands on 4.2 s, where the logo hits
chords = [  # I – V – vi – IV in C, root + triad (MIDI)
    (36, [60, 64, 67]),
    (43, [59, 62, 67]),
    (45, [57, 60, 64]),
    (41, [57, 60, 65]),
]
GROOVE_START = 4.2
END = 37.0

for bar in range(20):
    bar_t = OFFSET + bar * 4 * BEAT
    root, triad = chords[bar % 4]
    if bar_t >= END:
        break
    place(music, bar_t, pad(triad + [triad[0] + 12], 4 * BEAT))
    arp = triad + [triad[0] + 12, triad[2], triad[1]] + triad[:2]
    for s in range(8):
        tt = bar_t + s * BEAT / 2
        if tt < END:
            place(music, tt, pluck(arp[s] + 12), 0.45)
    if bar_t < GROOVE_START - 0.01:
        continue
    for b in range(4):
        tt = bar_t + b * BEAT
        if tt >= END:
            break
        place(music, tt, kick(), 0.9)
        place(music, tt + BEAT / 2, hat(), 0.8)
        if b in (1, 3):
            place(music, tt, clap(), 0.5)
        place(music, tt, bass(root), 0.5)
        place(music, tt + BEAT * 0.75, bass(root + 12, 0.2), 0.3)

# Breathing room before the logo drop.
place(music, 3.2, riser(1.0), 0.5)

# Simple sidechain pump: duck everything but the kick slightly on each beat.
duck = np.ones_like(music)
for k in range(int((END - GROOVE_START) / BEAT) + 1):
    i = int((GROOVE_START + k * BEAT) * SR)
    n = int(0.25 * SR)
    seg = 1 - 0.35 * np.exp(-np.arange(n) / SR * 14)
    duck[i:i + n] = np.minimum(duck[i:i + n], seg[: len(duck[i:i + n])])
music *= duck

# Fade out with the picture.
fade_i = int(36.6 * SR)
music[fade_i:] *= np.linspace(1, 0, len(music) - fade_i)

# ---------- sound effects (times match index.html) ----------

# 1 · the 168 count: ticks that slow down with the power2.out ease.
for k in range(22):
    p = k / 21
    tt = 0.4 + 1.2 * (1 - np.sqrt(1 - p))
    place(sfx, tt, tick(), 0.5)
for i, m in enumerate([72, 74, 79, 84]):
    place(sfx, 2.2 + i * 0.16, pop(m), 0.5)

for tt in [3.9, 7.6, 13.05, 19.55, 24.15, 28.15, 32.2]:
    place(sfx, tt - 0.1, whoosh(), 0.35)

# 2 · logo drop
place(sfx, 4.25, boom(), 0.9)
for i, m in enumerate([84, 88, 91, 96]):
    place(sfx, 4.7 + i * 0.07, bell(m, 0.6), 0.15)
for i in range(17):
    place(sfx, 5.3 + i * 0.035, tick(), 0.18)

# 3 · plan
for i in range(4):
    place(sfx, 8.7 + i * 0.15, whoosh(0.25, up=False), 0.25)
for i, tt in enumerate([9.8, 10.7, 11.6]):
    place(sfx, tt, pop(76 + i * 3), 0.4)
for i, m in enumerate([72, 74, 76, 79, 81]):
    place(sfx, 12.0 + i * 0.1, blip(m + 12), 0.35)

# 4 · the three taps and the goal-done celebration
for tt, m in zip([14.95, 15.75, 16.55], [72, 76, 79]):
    place(sfx, tt, pop(m), 0.8)
    place(sfx, tt + 0.03, blip(m + 24, 0.2), 0.2)
for i, m in enumerate([84, 88, 91, 96, 100]):
    place(sfx, 16.85 + i * 0.06, bell(m, 1.2), 0.25)
for k in range(30):
    place(sfx, 16.9 + rng.random() * 0.9, tick(), 0.15 * rng.random())

# 5 · bars grow on a rising pentatonic
for i, m in enumerate([72, 74, 76, 79, 81, 84, 86]):
    place(sfx, 20.7 + i * 0.12, blip(m), 0.35)

# 6 · deal and flip the theme cards
for i in range(7):
    place(sfx, 24.9 + i * 0.09, whoosh(0.2, up=False), 0.2)
    place(sfx, 26.6 + i * 0.08, tick(), 0.4)

# 7 · badges
for i, m in enumerate([76, 79, 83, 88]):
    place(sfx, 29.6 + i * 0.35, pop(m), 0.5)

# 8 · outro slams and the final ding
for i, tt in enumerate([33.0, 33.5, 34.0]):
    place(sfx, tt, kick(), 1.0)
    place(sfx, tt, clap(), 0.7)
    place(sfx, tt, bell(72 + i * 5, 0.5), 0.2)
place(sfx, 34.6, bell(96, 1.5), 0.3)
place(sfx, 34.66, bell(100, 1.5), 0.25)

# ---------- mix ----------

mix = music * 0.55 + sfx * 0.7
mix = np.tanh(mix * 1.2)  # gentle soft-clip glue
mix /= np.max(np.abs(mix)) / 0.89
stereo = np.stack([mix, mix], axis=1)

wav = HERE / 'soundtrack.wav'
with wave.open(str(wav), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((stereo * 32767).astype('<i2').tobytes())

out = HERE / 'assets' / 'soundtrack.m4a'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-c:a', 'aac', '-b:a', '160k', str(out)], check=True)
wav.unlink()
print(f'wrote {out.relative_to(HERE)}')
