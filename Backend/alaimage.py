# animal_images_from_ala.py
# Purpose: Build a 3-column CSV (animal_taxon_name,image_url,summary)
#          Image: via PUBLIC Biocache occurrences API (unchanged, keyless)
#          Summary: try ALA species (guid -> details) first; fallback to Wikipedia REST (with User-Agent)
#
# Behavior:
#   - Reads unique animal names from filtered_merged.csv
#   - For each, fetches one image URL + a short summary
#   - Appends rows incrementally to ala_animal_images.csv (resumable)

import csv
import time
import pathlib
import re
from typing import Optional, List

import pandas as pd
import requests

# ---------------------------- Configuration ----------------------------
INPUT_CSV = "filtered_merged.csv"
OUTPUT_CSV = "ala_animal_images.csv"   # three columns
RATE_LIMIT_SEC = 0.6
TIMEOUT_SEC = 20
RETRIES = 3
BACKOFF_BASE = 0.8

ANIMAL_COL_CANDIDATES = [
    "animal_taxon_name_x",
    "animal_taxon_name_y",
    "animal_taxon_name",
    "Species Name",
]

# Public Biocache WS for IMAGES (no key required)
BIOCACHE_WS = "https://biocache-ws.ala.org.au/ws"

# ALA species endpoints for SUMMARY (may or may not work anonymously)
ALA_BASE = "https://api.ala.org.au"  # /species/guid/{name}  and  /species/{guid}

# Wikipedia REST summary (public) — MUST send a User-Agent per policy
WIKI_BASE = "https://en.wikipedia.org/api/rest_v1/page/summary"
WIKI_UA = "ALA-helper/1.0 (contact: ylii0684@student.monash.edu)"  

# ---------------------------- HTTP helper ----------------------------
def _get_json(url: str, params: dict, label: str, headers: Optional[dict] = None) -> Optional[dict]:
    """GET JSON with retries/backoff; print minimal diagnostics on failure."""
    req_headers = {"accept": "application/json"}
    if headers:
        req_headers.update(headers)

    for attempt in range(1, RETRIES + 1):
        try:
            r = requests.get(url, params=params, headers=req_headers, timeout=TIMEOUT_SEC)
            if r.status_code == 429:
                wait = BACKOFF_BASE * attempt
                print(f"{label}: 429 Too Many Requests, backoff {wait:.1f}s")
                time.sleep(wait)
                continue
            if r.status_code >= 400:
                snippet = (r.text or "")[:200].replace("\n", " ")
                print(f"{label}: HTTP {r.status_code} -> {snippet}")
            r.raise_for_status()
            return r.json()
        except requests.RequestException as e:
            if attempt == RETRIES:
                print(f"{label}: request failed ({e}).")
                return None
            wait = BACKOFF_BASE * attempt
            print(f"{label}: error ({e}), retry in {wait:.1f}s")
            time.sleep(wait)
    return None

# ---------------------------- IMAGE lookup (unchanged) ----------------------------
def _biocache_try(q_expr: str) -> Optional[str]:
    """Call Biocache occurrences search and return imageUrl/smallImageUrl if present."""
    params = {
        "q": q_expr,
        "fq": "multimedia:Image",
        "pageSize": 1,
        "fields": "imageUrl,smallImageUrl",
    }
    j = _get_json(f"{BIOCACHE_WS}/occurrences/search", params, "biocache/occurrences/search")
    if not j:
        return None

    recs: List[dict] = []
    if isinstance(j, dict):
        recs = j.get("occurrences") or j.get("results") or j.get("content") or []
    elif isinstance(j, list):
        recs = j

    if not recs:
        return None

    rec0 = recs[0] or {}
    return rec0.get("imageUrl") or rec0.get("smallImageUrl")

def fetch_image_url_from_ala(scientific_name: str) -> Optional[str]:
    """Keep the working image flow intact: Biocache only."""
    if not scientific_name or scientific_name.lower().startswith("http"):
        return None
    name_q = scientific_name.strip().replace('"', '\\"')

    url = _biocache_try(f'taxon_name:"{name_q}"')
    if url:
        return url
    url = _biocache_try(f'scientificName:"{name_q}"')
    if url:
        return url
    url = _biocache_try(f'"{name_q}"')
    if url:
        return url
    return None

# ---------------------------- SUMMARY lookup ----------------------------
def _clean_summary(text: str, max_len: int = 400) -> str:
    """Strip, collapse spaces, and limit length (try to end on a sentence)."""
    if not text:
        return ""
    t = re.sub(r"\s+", " ", text).strip()
    if len(t) <= max_len:
        return t
    cut = t.rfind(".", 0, max_len)
    if cut == -1:
        cut = max_len
    return t[:cut].strip() + "…"

def _ala_summary(scientific_name: str) -> Optional[str]:
    """
    Try ALA species: /species/guid/{name} -> /species/{guid}
    Extract a short description from typical fields if available.
    """
    guid_resp = _get_json(f"{ALA_BASE}/species/guid/{requests.utils.quote(scientific_name)}", {}, "species/guid")
    if not guid_resp:
        return None

    guid = None
    if isinstance(guid_resp, dict):
        guid = guid_resp.get("guid") or guid_resp.get("taxonConceptID") or guid_resp.get("id")
    elif isinstance(guid_resp, str):
        guid = guid_resp.strip()
    if not guid:
        return None

    sp = _get_json(f"{ALA_BASE}/species/{guid}", {}, "species/details")
    if not isinstance(sp, dict):
        return None

    candidates = [
        "generalDescription", "briefDescription", "abstract", "summary",
        "shortDescription", "speciesProfile", "notes",
    ]
    for key in candidates:
        if key not in sp:
            continue
        val = sp.get(key)
        if isinstance(val, str) and val.strip():
            return _clean_summary(val)
        if isinstance(val, list) and val:
            first = val[0]
            if isinstance(first, dict):
                txt = first.get("text") or first.get("value") or ""
                if txt.strip():
                    return _clean_summary(txt)
    return None

def _wikipedia_summary(scientific_name: str) -> Optional[str]:
    """
    Wikipedia REST fallback (requires a real User-Agent).
    GET /api/rest_v1/page/summary/{title}
    """
    title = scientific_name.strip().replace(" ", "_")
    j = _get_json(
        f"{WIKI_BASE}/{requests.utils.quote(title)}",
        {},
        "wikipedia/summary",
        headers={"accept": "application/json; charset=utf-8", "User-Agent": WIKI_UA},
    )
    if not isinstance(j, dict):
        return None
    extract = j.get("extract") or j.get("description") or ""
    if not extract:
        return None
    return _clean_summary(extract)

def fetch_summary(scientific_name: str) -> Optional[str]:
    """Try ALA first; if unavailable, fall back to Wikipedia (with UA)."""
    if not scientific_name or scientific_name.lower().startswith("http"):
        return None
    s = _ala_summary(scientific_name)
    if s:
        return s
    s = _wikipedia_summary(scientific_name)
    if s:
        return s
    return None

# ---------------------------- CSV I/O helpers ----------------------------
def pick_animal_column(df: pd.DataFrame) -> str:
    for c in ANIMAL_COL_CANDIDATES:
        if c in df.columns:
            return c
    if "animal_taxon_name" in df.columns:
        return "animal_taxon_name"
    raise KeyError("No animal name column found.")

def load_done_set(path: str) -> set:
    p = pathlib.Path(path)
    done = set()
    if p.exists():
        with p.open("r", newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader, None)
            for row in reader:
                if not row:
                    continue
                done.add(row[0].strip())
    return done

def append_row(path: str, animal: str, img: str, summary: str) -> None:
    p = pathlib.Path(path)
    file_exists = p.exists()
    with p.open("a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["animal_taxon_name", "image_url", "summary"])
        writer.writerow([animal, img, summary])

# ---------------------------- Main ----------------------------
def main():
    df = pd.read_csv(INPUT_CSV)
    animal_col = pick_animal_column(df)

    animals = (
        df[animal_col].astype(str).str.strip().str.replace(r"\s+", " ", regex=True)
        .dropna().drop_duplicates().tolist()
    )

    done = load_done_set(OUTPUT_CSV)
    print(f"Unique animals: {len(animals)}; already done: {len(done)}")

    for idx, name in enumerate(animals, start=1):
        if name in done or name == "" or name.lower().startswith("http"):
            continue

        img_url = fetch_image_url_from_ala(name) or "NA"
        summary = fetch_summary(name) or "NA"

        append_row(OUTPUT_CSV, name, img_url, summary)
        done.add(name)

        preview = summary if summary == "NA" else (summary[:60] + ("…" if len(summary) > 60 else ""))
        print(f"[{idx}/{len(animals)}] {name} -> image: {'OK' if img_url!='NA' else 'NA'}, summary: {preview}")

        time.sleep(RATE_LIMIT_SEC)

    print(f"Finished. Wrote {len(done)} rows to {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
