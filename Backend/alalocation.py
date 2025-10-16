# species_occurrences_to_csv.py
# Build a CSV of per-occurrence locations for each unique species in filtered_merged.csv.
# Columns: species name, lat, lon, and key occurrence fields.
# - Public Biocache API only (no key)
# - Offset paging with start+pageSize (simple & robust)
# - Stream to CSV, species-level resume
# - NEW: cap at MAX_PER_SPECIES per species, and deduplicate by lat/lon

import csv
import time
import pathlib
from typing import Optional, List, Dict, Tuple

import pandas as pd
import requests

# ---------------------------- Config ----------------------------
INPUT_CSV = "filtered_merged.csv"
OUTPUT_CSV = "species_occurrences.csv"
RATE_LIMIT_SEC = 0.25
TIMEOUT_SEC = 25
RETRIES = 3
BACKOFF_BASE = 0.7
PAGE_SIZE = 500

# Cap per species (keep at most this many rows)
MAX_PER_SPECIES: Optional[int] = 10000

ANIMAL_COL_CANDIDATES = [
    "animal_taxon_name_x",
    "animal_taxon_name_y",
    "animal_taxon_name",
    "Species Name",
]

BIOCACHE_WS = "https://biocache-ws.ala.org.au/ws"

# Minimal fields for speed + mapping
FIELDS = [
    "decimalLatitude",
    "decimalLongitude",
    "eventDate",
    "occurrenceID",
    "recordedBy",
    "locality",
    "stateProvince",
    "country",
    "dataResourceName",
    "basisOfRecord",
]

# ---------------------------- HTTP helper ----------------------------
def _get_json(url: str, params: Dict, label: str) -> Optional[Dict]:
    """GET JSON with retries/backoff; minimal diagnostics on failure."""
    headers = {"accept": "application/json"}
    for attempt in range(1, RETRIES + 1):
        try:
            r = requests.get(url, params=params, headers=headers, timeout=TIMEOUT_SEC)
            if r.status_code == 429:
                wait = BACKOFF_BASE * attempt
                print(f"{label}: 429 Too Many Requests, wait {wait:.1f}s")
                time.sleep(wait)
                continue
            if r.status_code >= 400:
                snippet = (r.text or "")[:180].replace("\n", " ")
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

# ---------------------------- Species list ----------------------------
def pick_animal_column(df: pd.DataFrame) -> str:
    """Pick the first existing animal-name column from candidates."""
    for c in ANIMAL_COL_CANDIDATES:
        if c in df.columns:
            return c
    if "animal_taxon_name" in df.columns:
        return "animal_taxon_name"
    raise KeyError("No animal name column found.")

def unique_animals_from_input(path: str) -> List[str]:
    df = pd.read_csv(path)
    col = pick_animal_column(df)
    return (
        df[col]
        .astype(str)
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
        .dropna()
        .drop_duplicates()
        .tolist()
    )

# ---------------------------- CSV I/O ----------------------------
def load_done_species(path: str) -> set:
    p = pathlib.Path(path)
    if not p.exists():
        return set()
    done = set()
    with p.open("r", newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader, None)
        for row in reader:
            if row:
                done.add(row[0])
    return done

def ensure_header(path: str) -> None:
    p = pathlib.Path(path)
    if p.exists():
        return
    with p.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            ["animal_taxon_name", "decimalLatitude", "decimalLongitude",
             "eventDate", "occurrenceID", "recordedBy", "locality",
             "stateProvince", "country", "dataResourceName", "basisOfRecord"]
        )

def append_rows(path: str, rows: List[List[str]]) -> None:
    if not rows:
        return
    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(rows)

# ---------------------------- Utils ----------------------------
def _norm_coord(value) -> Optional[str]:
    """
    Normalize lat/lon to a fixed string with 6 decimal places (e.g., '-33.100000').
    This avoids formatting differences ('-33.1' vs '-33.100000') being treated as different.
    """
    if value is None or value == "":
        return None
    try:
        return f"{float(value):.6f}"
    except Exception:
        return None

# ---------------------------- Core ----------------------------
def fetch_occurrences_for_species(species_name: str) -> int:
    """Stream occurrences for one species (Victoria only), dedupe by lat/lon, cap per species."""
    total_kept = 0
    start = 0

    seen_coords: set[Tuple[str, str]] = set()

    base_params = {
        "q": f'taxon_name:"{species_name}"',
        "fq": [
            'decimalLatitude:[* TO *]',
            'decimalLongitude:[* TO *]',
            '(stateProvince:"Victoria" OR stateProvince:"VIC")',  
        ],
        "pageSize": PAGE_SIZE,
        "disableAllQualityFilters": "true",
        "fields": ",".join(FIELDS),
    }


    while True:
        params = dict(base_params)
        params["start"] = start

        data = _get_json(f"{BIOCACHE_WS}/occurrences/search", params, "occurrences/search")
        if not isinstance(data, dict):
            break

        recs = data.get("occurrences") or data.get("results") or data.get("content") or []
        if not recs:
            break

        out_rows: List[List[str]] = []
        for rec in recs:
            if MAX_PER_SPECIES is not None and total_kept >= MAX_PER_SPECIES:
                break

            lat_s = _norm_coord(rec.get("decimalLatitude"))
            lon_s = _norm_coord(rec.get("decimalLongitude"))
            if not lat_s or not lon_s:
                continue

            key = (lat_s, lon_s)
            if key in seen_coords:
                continue

            seen_coords.add(key)
            out_rows.append([
                species_name,
                lat_s,
                lon_s,
                rec.get("eventDate", ""),
                rec.get("occurrenceID", ""),
                rec.get("recordedBy", ""),
                rec.get("locality", ""),
                rec.get("stateProvince", ""),
                rec.get("country", ""),
                rec.get("dataResourceName", ""),
                rec.get("basisOfRecord", ""),
            ])
            total_kept += 1

        append_rows(OUTPUT_CSV, out_rows)

        total = data.get("totalRecords")
        print(
            f"  wrote {len(out_rows)} | total kept {total_kept}"
            + (f" / cap {MAX_PER_SPECIES}" if MAX_PER_SPECIES is not None else "")
            + (f" / est {total}" if isinstance(total, int) else "")
            + f" | start -> {start + PAGE_SIZE}"
        )

        if (MAX_PER_SPECIES is not None and total_kept >= MAX_PER_SPECIES) or len(recs) < PAGE_SIZE:
            break

        start += PAGE_SIZE
        time.sleep(RATE_LIMIT_SEC)

    return total_kept

# ---------------------------- Main ----------------------------
def main():
    animals = unique_animals_from_input(INPUT_CSV)
    ensure_header(OUTPUT_CSV)
    done_species = load_done_species(OUTPUT_CSV)

    print(f"Unique species: {len(animals)} | already in file (by species): {len(done_species)}")
    for idx, name in enumerate(animals, start=1):
        if not name or name.lower().startswith("http") or name in done_species:
            continue

        print(f"[{idx}/{len(animals)}] {name} ...")
        try:
            written = fetch_occurrences_for_species(name)
        except Exception as e:
            print(f"  error: {e}")
            written = 0

        print(f"  DONE species '{name}': wrote {written} rows")
        time.sleep(RATE_LIMIT_SEC)

    print("All done!")

if __name__ == "__main__":
    main()
