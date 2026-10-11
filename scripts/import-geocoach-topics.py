"""Snapshot permitted GeoCoach clue maps as local Meta topic-course data."""
import concurrent.futures
import html
import json
import math
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "meta-topics"
CATALOG = "https://www.geocoach.me/maps/index.pageContext.json?group=street-view"


def read_json(url):
    for attempt in range(4):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except (OSError, ValueError):
            if attempt == 3:
                raise
            time.sleep(1 + attempt * 2)


def clean_text(value):
    value = html.unescape(re.sub(r"<[^>]+>", "", value or ""))
    return re.sub(r"\s+", " ", value.replace("**", "").replace("�", "'")).strip()


def valid_location(value):
    return (isinstance(value.get("lat"), (int, float)) and -90 <= value["lat"] <= 90
            and isinstance(value.get("lng"), (int, float)) and -180 <= value["lng"] <= 180
            and isinstance(value.get("heading"), (int, float))
            and isinstance(value.get("pitch"), (int, float)))


def location_for(dataset_id, tag_id):
    endpoint = f"https://geo-backend-217598337483.us-central1.run.app/api/datasets/{dataset_id}/locations/random"
    fallback = []
    for count in (5, 250):
        url = endpoint + "?" + urllib.parse.urlencode({"count": count, "tag_ids": tag_id})
        locations = read_json(url)
        candidates = [row for row in locations if valid_location(row) and isinstance(row.get("pano_id"), str) and row["pano_id"]]
        if candidates:
            return candidates[0]
        fallback = [row for row in locations if valid_location(row)]
    key = next((line.split("=", 1)[1].strip().strip('"') for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines()
                if line.startswith("GOOGLE_MAPS_API_KEY=")), "") if (ROOT / ".env").exists() else ""
    if not key:
        return None
    for row in fallback[:5]:
        query = urllib.parse.urlencode({"location": f"{row['lat']},{row['lng']}", "radius": 50,
                                         "source": "outdoor", "key": key})
        result = read_json("https://maps.googleapis.com/maps/api/streetview/metadata?" + query)
        position = result.get("location") or {}
        if result.get("status") != "OK" or not result.get("pano_id") or not valid_location({**position, "heading": 0, "pitch": 0}):
            continue
        lat1, lat2 = map(math.radians, (row["lat"], position["lat"]))
        dlat = lat2 - lat1
        dlng = math.radians(position["lng"] - row["lng"])
        distance = 6371000 * 2 * math.asin(math.sqrt(math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2))
        if distance <= 50:
            return {**row, "pano_id": result["pano_id"]}
    return None


def make_tip(args):
    course_id, dataset_id, tag, existing = args
    tag_id = str(tag["id"])
    if not tag_id.isdecimal():
        return None
    explanation = clean_text(" ".join(row.get("text", "") for row in tag.get("explanations", []) if isinstance(row, dict)))
    if course_id == "geocoach-plates":
        explanation = explanation.replace("Front plate:", "Front license plate:")
    if not explanation:
        return None
    prior = existing.get(f"{course_id}-{tag_id}")
    location = None if prior else location_for(dataset_id, tag_id)
    if not prior and not location:
        return None
    view = {"map_action": "pano", "pano": location["pano_id"],
            "viewpoint": f"{location['lat']},{location['lng']}",
            "heading": str(location["heading"]), "pitch": str(location["pitch"])} if location else None
    section = clean_text(tag.get("name", ""))
    sensitive = bool(re.search(r"\b(gen(?:eration)?\s*[1-4]|camera|coverage|google car|blurred|copyright year)\b", section + " " + explanation, re.I))
    return {"id": f"{course_id}-{tag_id}", "section": section,
            "mapUrl": prior["mapUrl"] if prior else "https://www.google.com/maps/@?" + urllib.parse.urlencode(view),
            "text": explanation, "countryCodes": tag.get("country_codes") or [],
            "sourceTagId": tag_id, **({"temporallySensitive": True} if sensitive else {})}


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    old_manifest = {item["sourceUrl"].split("/")[4]: item for item in json.loads((ROOT / "src" / "data" / "metaTopicCoursesManifest.json").read_text(encoding="utf-8"))}
    catalog = read_json(CATALOG)["data"]["listing"]
    if not catalog["items"] or len(catalog["items"]) != catalog["total"]:
        raise ValueError("GeoCoach catalog is incomplete")
    manifest = []
    for item in catalog["items"]:
        dataset_id, path, title = item["id"], item["slug"], item["title"]
        source_url = f"https://www.geocoach.me/maps/{dataset_id}/{path}"
        course_id = old_manifest[dataset_id]["code"] if dataset_id in old_manifest else "geocoach-" + re.sub(r"-[0-9a-f]{8}$", "", path)
        asset = OUTPUT / f"{course_id}.json"
        if dataset_id in old_manifest and asset.exists():
            manifest.append(old_manifest[dataset_id])
            continue
        dataset = read_json(source_url + "/index.pageContext.json")["data"]["dataset"]
        tags = dataset.get("tags") or []
        existing = {tip["id"]: tip for tip in json.loads(asset.read_text(encoding="utf-8"))["tips"]} if asset.exists() else {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            tips = list(pool.map(make_tip, ((course_id, dataset_id, tag, existing) for tag in tags)))
        tips = [tip for tip in tips if tip]
        if len({tip["id"] for tip in tips}) != len(tips):
            raise ValueError(f"Duplicate GeoCoach tag in {course_id}")
        manifest.append({"code": course_id, "name": title, "lessonCount": len(tips),
                         "sourceUrl": source_url, "creator": dataset.get("creator_display_name") or dataset.get("creator_username") or "GeoCoach contributor"})
        asset.write_text(
            json.dumps({"code": course_id, "tips": tips}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"{title}: {len(tips)}/{len(tags)} local lessons", flush=True)
    catalog_ids = {item["id"] for item in catalog["items"]}
    manifest.extend(item for dataset_id, item in old_manifest.items() if dataset_id not in catalog_ids)
    if len({item["code"] for item in manifest}) != len(manifest):
        raise ValueError("Duplicate GeoCoach course code")
    manifest_text = json.dumps(manifest, ensure_ascii=False, separators=(",", ":"))
    (OUTPUT / "manifest.json").write_text(manifest_text, encoding="utf-8")
    (ROOT / "src" / "data" / "metaTopicCoursesManifest.json").write_text(manifest_text, encoding="utf-8")


if __name__ == "__main__":
    main()
