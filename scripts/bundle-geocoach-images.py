"""Bundle GeoCoach tag clue photos for the existing local Meta lessons."""

import concurrent.futures
import hashlib
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS = ROOT / "public" / "meta-topics"
IMAGES = ROOT / "public" / "meta-courses" / "images"
MANIFEST = ROOT / "src" / "data" / "metaTopicCoursesManifest.json"


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read(), response.headers.get_content_type()


def source_images(course):
    data, _ = fetch(course["sourceUrl"] + "/index.pageContext.json")
    dataset = json.loads(data).get("data", {}).get("dataset")
    if not dataset:
        return course["code"], {}
    images = {}
    for tag in dataset.get("tags") or []:
        photo = next((image for image in tag.get("images") or []
                      if image.get("image_type") == "base" and not image.get("is_incorrect")
                      and isinstance(image.get("image_url"), str)
                      and image["image_url"].startswith("https://storage.googleapis.com/")
                      and image["image_url"].endswith(".avif")), None)
        if photo:
            images[f'{course["code"]}-{tag["id"]}'] = photo["image_url"]
    return course["code"], images


def bundle(item):
    tip_id, url = item
    filename = f'geocoach-{hashlib.sha256(url.encode()).hexdigest()[:20]}.avif'
    path = IMAGES / filename
    if not path.exists():
        data, content_type = fetch(url)
        if content_type != "image/avif" or len(data) > 3_000_000 or data[4:12] != b"ftypavif":
            raise ValueError(f"Invalid GeoCoach image for {tip_id}")
        path.write_bytes(data)
    return tip_id, f"meta-courses/images/{filename}"


def main():
    courses = json.loads(MANIFEST.read_text(encoding="utf-8"))
    IMAGES.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        sources = dict(pool.map(source_images, courses))
    jobs = {}
    for course in courses:
        local = json.loads((TOPICS / f'{course["code"]}.json').read_text(encoding="utf-8"))
        for tip in local["tips"]:
            if tip["id"] in sources[course["code"]]:
                jobs[tip["id"]] = sources[course["code"]][tip["id"]]
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        bundled = dict(pool.map(bundle, jobs.items()))
    for course in courses:
        path = TOPICS / f'{course["code"]}.json'
        local = json.loads(path.read_text(encoding="utf-8"))
        changed = 0
        for tip in local["tips"]:
            if tip["id"] in bundled and tip.get("image") != bundled[tip["id"]]:
                tip["image"] = bundled[tip["id"]]
                changed += 1
        if changed:
            path.write_text(json.dumps(local, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f'{course["code"]}: {changed} images added', flush=True)
    print(f'{len(bundled)} lessons have bundled clue photos')


if __name__ == "__main__":
    main()
