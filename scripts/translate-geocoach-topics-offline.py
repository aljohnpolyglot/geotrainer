"""Translate local GeoCoach courses with Argos Translate and installed en-to-language models.

Usage: python scripts/translate-geocoach-topics-offline.py es
"""
import hashlib
import json
import re
import sys
from pathlib import Path

import argostranslate.translate

ROOT = Path(__file__).resolve().parents[1]
TOPICS = ROOT / "public" / "meta-topics"
LANGUAGES = ("es", "pt", "fr", "de", "it", "ru", "sv")
SCRIPT_CHARS = re.compile(r"[\u0400-\u052f\u0600-\u06ff\u0900-\u0dff\u10a0-\u10ff\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]+")
SCRIPT_LABELS = {"es": "Caracteres originales:", "pt": "Caracteres originais:",
                 "fr": "Caractères d’origine :", "de": "Originalzeichen:",
                 "it": "Caratteri originali:", "ru": "Исходные символы:", "sv": "Originaltecken:"}


def translate(value, language):
    return argostranslate.translate.translate(value, "en", language).strip()


def translate_bengali_note(value, language):
    parts = re.split(r"([\u0980-\u09ff]+)", value)
    return "".join(part if re.fullmatch(r"[\u0980-\u09ff]+", part) else (
        part[:len(part) - len(part.lstrip())] + translate(part.strip(), language) + part[len(part.rstrip()):]
        if part.strip() else part) for part in parts)


def translate_bengali_lesson(value, language):
    body, separator, latin = value.rpartition(" Latin: ")
    if not separator:
        raise ValueError("Bengali lesson is missing its Latin label")
    formula, note_separator, note = body.partition(" Note: ")
    formula = formula.replace("(inherent o)", f"({translate('inherent o', language)})")
    if note_separator:
        formula += " " + translate("Note:", language) + " " + translate_bengali_note(note, language)
    return formula + " " + translate("Latin:", language) + " " + latin


def main(language):
    if language not in LANGUAGES:
        raise ValueError("Unsupported Meta language")
    manifest = json.loads((TOPICS / "manifest.json").read_text(encoding="utf-8"))
    for course in manifest:
        code = course["code"]
        tips = json.loads((TOPICS / f"{code}.json").read_text(encoding="utf-8"))["tips"]
        source_hash = hashlib.sha256(json.dumps(
            [{key: tip[key] for key in ("id", "section", "text")} for tip in tips],
            ensure_ascii=False, separators=(",", ":")).encode("utf-8")).hexdigest()
        path = TOPICS / f"{code}.{language}.json"
        old = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
        existing = {tip["id"]: tip for tip in old.get("tips", [])} if old.get("sourceHash") == source_hash and (code != "geocoach-bangladesh-districts-bengali" or old.get("glyphSafe")) else {}
        translated = []
        for tip in tips:
            row = existing.get(tip["id"])
            if not row:
                if code == "geocoach-bangladesh-districts-bengali":
                    section, text = tip["section"], translate_bengali_lesson(tip["text"], language)
                else:
                    result = translate(tip["section"] + "\n" + tip["text"], language)
                    if "\n" in result:
                        section, text = (part.strip() for part in result.split("\n", 1))
                    else:
                        section, text = translate(tip["section"], language), translate(tip["text"], language)
                if not section or not text or "\ufffd" in section + text:
                    raise ValueError(f"Invalid translation: {tip['id']}/{language}")
                row = {"id": tip["id"], "section": section, "text": text}
            missing = list(dict.fromkeys(glyph for glyph in SCRIPT_CHARS.findall(tip["text"]) if glyph not in row["text"]))
            if missing:
                row = {**row, "text": row["text"] + " " + SCRIPT_LABELS[language] + " " + ", ".join(missing)}
            translated.append(row)
        output = {"code": code, "language": language, "sourceHash": source_hash, "tips": translated}
        if code == "geocoach-bangladesh-districts-bengali":
            output["glyphSafe"] = True
        path.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"{code}/{language}: {len(translated)} lessons", flush=True)


if __name__ == "__main__":
    main(*sys.argv[1:])
