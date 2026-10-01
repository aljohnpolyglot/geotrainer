"""Generate the lazy Plonkit country-course assets from the source JSON."""
import json
import hashlib
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("plonkit-map-tips.json")
ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "meta-courses"
MANIFEST = ROOT / "src" / "data" / "metaCountryCoursesManifest.json"
IMAGES = PUBLIC / "images"
REPORT = ROOT / "scripts" / "meta-course-image-report.json"


def is_http_url(value):
    return isinstance(value, str) and value.startswith(("https://", "http://"))


data = json.loads(SOURCE.read_text(encoding="utf-8"))
PUBLIC.mkdir(parents=True, exist_ok=True)
IMAGES.mkdir(parents=True, exist_ok=True)
manifest = []
kept_codes = set()
image_jobs = {}
image_by_tip_id = {}

for country in data["countries"]:
    code = country.get("code")
    # The source also contains Middle Earth, regional subcourses (US-AK, US-HI,
    # PT-AZ, PT-MA), US Minor Outlying Islands, and spillover pools. Only ISO
    # alpha-2 country entries belong in the country-course feature.
    if not isinstance(code, str) or not re.fullmatch(r"[A-Z]{2}", code):
        continue
    if code in kept_codes:
        raise ValueError(f"Duplicate country code: {code}")
    kept_codes.add(code)
    tips = []
    seen_ids = set()
    for raw in country.get("tips", []):
        if not isinstance(raw, dict):
            continue
        tip_id, section, map_url, text = (raw.get(key) for key in ("id", "section", "mapUrl", "text"))
        if not all(isinstance(value, str) and value.strip() for value in (tip_id, section, map_url, text)):
            continue
        if tip_id in seen_ids:
            raise ValueError(f"Duplicate tip ID in {code}: {tip_id}")
        if not is_http_url(map_url):
            continue
        seen_ids.add(tip_id)
        image = raw.get("image")
        note = raw.get("note")
        local_image = None
        if is_http_url(image):
            filename = hashlib.sha256(image.encode("utf-8")).hexdigest() + ".webp"
            image_jobs.setdefault(image, {"path": filename, "references": []})["references"].append(f"{code}-{tip_id}")
            image_by_tip_id[f"{code}-{tip_id}"] = f"meta-courses/images/{filename}"
            if (IMAGES / filename).is_file():
                local_image = image_by_tip_id[f"{code}-{tip_id}"]
        tips.append({
            "id": f"{code}-{tip_id}",
            "section": section,
            "mapUrl": map_url,
            **({"image": local_image} if local_image else {}),
            "text": text,
            **({"note": note} if isinstance(note, str) and note.strip() else {}),
        })
    manifest.append({"code": code, "name": country["name"], "lessonCount": len(tips)})
    (PUBLIC / f"{code}.json").write_text(
        json.dumps({"code": code, "tips": tips}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

manifest.sort(key=lambda course: course["name"].casefold())
manifest_json = json.dumps(manifest, ensure_ascii=False, separators=(",", ":"))
MANIFEST.write_text(manifest_json, encoding="utf-8")
(PUBLIC / "manifest.json").write_text(manifest_json, encoding="utf-8")

for old_asset in PUBLIC.glob("*.json"):
    if old_asset.stem != "manifest" and "." not in old_asset.stem and old_asset.stem not in kept_codes:
        old_asset.unlink()

print(f"Generated {len(manifest)} courses with {sum(c['lessonCount'] for c in manifest)} tips")


def finalize_course_images():
    for course in manifest:
        asset = PUBLIC / f"{course['code']}.json"
        value = json.loads(asset.read_text(encoding="utf-8"))
        for tip in value["tips"]:
            path = image_by_tip_id.get(tip["id"])
            if path and (ROOT / "public" / path).is_file():
                tip["image"] = path
            else:
                tip.pop("image", None)
        asset.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


finalize_course_images()
missing = [{"url": url, "references": job["references"], "error": "output file missing"}
           for url, job in image_jobs.items() if not (IMAGES / job["path"]).is_file()]
total_bytes = sum(path.stat().st_size for path in IMAGES.glob("*.webp"))
report = {"generatedAt": datetime.now(timezone.utc).isoformat(), "uniqueSourceImages": len(image_jobs),
          "hostedImages": len(image_jobs) - len(missing), "missingImages": missing, "hostedBytes": total_bytes}
REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Image report: {report['hostedImages']}/{report['uniqueSourceImages']} hosted; {len(missing)} missing; {total_bytes:,} bytes", flush=True)
