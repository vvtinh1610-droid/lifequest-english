"""Tạo file nghe thử các giọng Kokoro để chọn giọng cho game.
Chạy: tools\\.venv\\Scripts\\python.exe tools\\voice-samples.py
Kết quả: audio-samples/index.html (mở qua máy chủ cục bộ để nghe trên điện thoại).
"""
import pathlib
import subprocess
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODELS = ROOT / "tools" / ".models"
OUT = ROOT / "audio-samples"
OUT.mkdir(exist_ok=True)

VOICES = [
    ("am_michael", "Nam Mỹ – Michael"), ("am_fenrir", "Nam Mỹ – Fenrir"), ("am_puck", "Nam Mỹ – Puck"),
    ("am_adam", "Nam Mỹ – Adam"), ("am_eric", "Nam Mỹ – Eric"), ("bm_george", "Nam Anh – George"),
    ("af_heart", "Nữ Mỹ – Heart"), ("af_bella", "Nữ Mỹ – Bella"), ("af_nicole", "Nữ Mỹ – Nicole"),
    ("bf_emma", "Nữ Anh – Emma"),
]
TEXT = ("Welcome to the mine! Tap a rock, then press Dig. "
        "Look! It's a banana! Banana. I eat a banana every day.")

kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
rows = []
for vid, name in VOICES:
    samples, rate = kokoro.create(TEXT, voice=vid, speed=0.95, lang="en-us")
    wav = OUT / f"{vid}.wav"
    sf.write(wav, samples, rate)
    mp3 = OUT / f"{vid}.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-ac", "1", "-b:a", "64k", str(mp3)], check=True)
    wav.unlink()
    rows.append(f'<div class="v"><b>{name}</b> <small>({vid})</small><audio controls preload="none" src="{vid}.mp3"></audio></div>')
    print("ok", vid)

(OUT / "index.html").write_text(f"""<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Chọn giọng đọc</title>
<style>body{{font-family:system-ui,sans-serif;margin:16px;background:#f6f3ec}} .v{{background:#fff;border-radius:12px;padding:10px 12px;margin:10px 0}}
audio{{width:100%;margin-top:6px}} small{{color:#6b7a80}}</style></head><body>
<h2>Nghe thử giọng đọc</h2><p>Câu mẫu: <i>{TEXT}</i></p>{''.join(rows)}</body></html>""", encoding="utf-8")
print("done")
