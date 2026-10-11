"""Translate the local GeoCoach topic lessons once for every supported UI language."""
import concurrent.futures
import hashlib
import json
import threading
import time
import urllib.parse
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public" / "meta-topics"
LANGUAGES = ("es", "pt", "fr", "de", "it", "ru", "sv")
REQUEST_LOCK = threading.Lock()
LAST_REQUEST = 0.0


def translate(tip, language):
    global LAST_REQUEST
    source = tip["section"] + "\n" + tip["text"]
    query = urllib.parse.urlencode({"client": "gtx", "sl": "en", "tl": language, "dt": "t", "q": source})
    url = "https://translate.googleapis.com/translate_a/single?" + query
    for attempt in range(8):
        try:
            with REQUEST_LOCK:
                delay = max(0, LAST_REQUEST + 1.2 - time.monotonic())
                if delay:
                    time.sleep(delay)
                LAST_REQUEST = time.monotonic()
            request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(request, timeout=25) as response:
                value = json.load(response)
            result = "".join(piece[0] for piece in value[0])
            section, text = (part.strip() for part in result.split("\n", 1))
            if section and text and "�" not in result:
                return {"id": tip["id"], "section": section, "text": text}
        except urllib.error.HTTPError as error:
            time.sleep(60 if error.code == 429 else min(30, 2 ** attempt))
            continue
        except (OSError, ValueError, IndexError):
            time.sleep(min(30, 2 ** attempt))
    raise ValueError(f"Could not translate {tip['id']} into {language}")


def main():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    for course in manifest:
        code = course["code"]
        source_text = (ROOT / f"{code}.json").read_text(encoding="utf-8")
        tips = json.loads(source_text)["tips"]
        source_hash = hashlib.sha256(json.dumps(
            [{key: tip[key] for key in ("id", "section", "text")} for tip in tips],
            ensure_ascii=False, separators=(",", ":")).encode("utf-8")).hexdigest()
        for language in LANGUAGES:
            path = ROOT / f"{code}.{language}.json"
            existing = {}
            if path.exists():
                old = json.loads(path.read_text(encoding="utf-8"))
                if old.get("sourceHash") == source_hash:
                    existing = {tip["id"]: tip for tip in old["tips"]}
            missing = [tip for tip in tips if tip["id"] not in existing]
            if missing:
                with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
                    for tip in pool.map(lambda item: translate(item, language), missing):
                        existing[tip["id"]] = tip
                        if len(existing) % 10 == 0:
                            path.write_text(json.dumps({"code": code, "language": language, "sourceHash": source_hash,
                                                        "tips": list(existing.values())}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            output = {"code": code, "language": language, "sourceHash": source_hash,
                      "tips": [existing[tip["id"]] for tip in tips]}
            path.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            print(f"{code}/{language}: {len(output['tips'])} translations", flush=True)


if __name__ == "__main__":
    main()
