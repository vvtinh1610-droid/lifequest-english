"""Thu âm sẵn mọi câu tiếng Anh của game bằng giọng AI Kokoro (miễn phí, mã nguồn mở, Apache 2.0).

Cần: môi trường tools/.venv có kokoro-onnx + soundfile, và 2 file mô hình trong tools/.models/
(kokoro-v1.0.onnx, voices-v1.0.bin — tải từ github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0).

Chạy (sau khi `node tools/list-speech.js`):
    tools\\.venv\\Scripts\\python.exe tools\\make-audio.py            # thu câu còn thiếu
    tools\\.venv\\Scripts\\python.exe tools\\make-audio.py --limit 20 # thu thử 20 câu
Người chơi chọn giọng nam hoặc nữ, nên mỗi câu được thu bằng cả 2 giọng trong VOICES.
Kết quả: audio/<giọng>/<mã>.mp3 và js/audio.index.js (bảng tra câu → mã file, game tự đọc).
"""
import argparse
import hashlib
import json
import pathlib
import subprocess
import sys
import time

import soundfile as sf
from kokoro_onnx import Kokoro

VOICES = {"male": "am_adam", "female": "af_heart"}   # giọng nam / nữ người chơi chọn trong Hồ sơ
SPEED = 0.92           # hơi chậm hơn bình thường cho người mới học

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODELS = ROOT / "tools" / ".models"
AUDIO = ROOT / "audio"
INDEX = ROOT / "js" / "audio.index.js"
LIST = ROOT / "tools" / "speech-list.json"
META = AUDIO / "_voice.json"


def key(text):
    return " ".join(text.split()).lower()


def file_id(text):
    return hashlib.sha1(f"{SPEED}|{key(text)}".encode("utf-8")).hexdigest()[:12]


def to_mp3(wav, mp3):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-ac", "1", "-ar", "24000", "-b:a", "48k", str(mp3)], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="chỉ thu N câu (thử)")
    ap.add_argument("--all", action="store_true", help="thu lại tất cả (khi đổi giọng)")
    ap.add_argument("--index-only", action="store_true", help="chỉ tạo lại js/audio.index.js từ các file đã có")
    args = ap.parse_args()
    if args.index_only:
        write_index(json.loads(LIST.read_text(encoding="utf-8")))
        return

    AUDIO.mkdir(exist_ok=True)
    texts = json.loads(LIST.read_text(encoding="utf-8"))
    silence = AUDIO / "_silence.mp3"
    if not silence.exists():
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "0.1", "-b:a", "32k", str(silence)], check=True)

    kokoro = None
    keep = {f"{file_id(t)}.mp3" for t in texts}
    removed = 0
    for gender, voice in VOICES.items():
        folder = AUDIO / voice
        folder.mkdir(exist_ok=True)
        todo = [t for t in texts if args.all or not (folder / f"{file_id(t)}.mp3").exists()]
        if args.limit:
            todo = todo[: args.limit]
        print(f"Giọng {gender} ({voice}), tốc độ {SPEED}: {len(texts)} câu, cần thu {len(todo)} câu", flush=True)
        if todo:
            kokoro = kokoro or Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
            tmp = folder / "_tmp.wav"
            start = time.time()
            for i, t in enumerate(todo, 1):
                samples, rate = kokoro.create(t, voice=voice, speed=SPEED, lang="en-us")
                sf.write(tmp, samples, rate)
                to_mp3(tmp, folder / f"{file_id(t)}.mp3")
                if i % 50 == 0 or i == len(todo):
                    spent = time.time() - start
                    print(f"  {i}/{len(todo)} câu · {spent:.0f}s · còn khoảng {spent / i * (len(todo) - i):.0f}s", flush=True)
            tmp.unlink(missing_ok=True)
        # Xóa file cũ không còn dùng (câu đã bỏ / đổi tốc độ)
        for f in folder.glob("*.mp3"):
            if f.name not in keep:
                f.unlink()
                removed += 1
    # File cũ để ngay trong audio/ (bản thu thử trước đây)
    for f in AUDIO.glob("*.mp3"):
        if f.name != "_silence.mp3":
            f.unlink()
            removed += 1

    write_index(texts)
    print(f"Đã xóa {removed} file cũ")


def write_index(texts):
    # Câu nào có file ở ít nhất một giọng thì đưa vào bảng tra (game tự thử giọng kia nếu giọng đã chọn chưa có)
    ids = {key(t): file_id(t) for t in texts
           if any((AUDIO / v / f"{file_id(t)}.mp3").exists() for v in VOICES.values())}
    INDEX.write_text("/* TỰ ĐỘNG TẠO bởi tools/make-audio.py — không sửa tay. Câu tiếng Anh → file audio/<giọng>/<mã>.mp3 */\n"
                     f"window.LQ_AUDIO = {json.dumps({'voices': VOICES, 'speed': SPEED, 'ids': ids}, ensure_ascii=False)};\n",
                     encoding="utf-8")
    full = sum(all((AUDIO / v / f"{file_id(t)}.mp3").exists() for v in VOICES.values()) for t in texts)
    META.write_text(json.dumps({"voices": VOICES, "speed": SPEED, "count": len(ids), "full": full}), encoding="utf-8")
    size = sum(f.stat().st_size for f in AUDIO.rglob("*.mp3")) / 1e6
    print(f"Bảng tra: {len(ids)}/{len(texts)} câu có file ({full} câu đủ 2 giọng) · audio/ nặng {size:.1f} MB")


if __name__ == "__main__":
    sys.exit(main())
