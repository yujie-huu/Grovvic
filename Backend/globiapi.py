# globi_fetch_interactions_exact.py
# Purpose:
#   Exactly fetch the specified interaction types from GloBI WITHOUT any normalization.
#   Global scope (no bbox). One deterministic role per interaction type (like your old script).
#
# Input:
#   scientific_names.csv  (must contain column: scientific_name)
#
# Output (stream-written):
#   plant_animal_interactions.csv
#     Columns:
#       plant_scientific_name,
#       animal_taxon_name,
#       interaction_type_raw   # exactly as returned by GloBI
#
# Request order per interaction type (per page):
#   A1: /interaction CSV + fields
#   A2: /interaction CSV (no fields)
#   A3: /interaction JSON.v2
#   If none returns rows for the type/page:
#   B1: /taxon/{plant}/{interactionType} CSV (distinct list)
#
# Pagination: limit/offset (PAGE_LIMIT).
# Retries:    each attempt retried up to RETRY_EACH_STEP times.
# Streaming:  append rows as soon as they are produced.

import csv
import io
import time
from pathlib import Path
from typing import Optional, List, Dict, Tuple, Set
from urllib.parse import quote

import pandas as pd
import requests

# ===== Configuration =====
INPUT_CSV = "scientific_names.csv"
OUTPUT_CSV = "plant_animal_interactions.csv"

HTTP_TIMEOUT = 60
PAGE_LIMIT = 1024
RETRY_EACH_STEP = 2
SLEEP_BETWEEN_PAGES = 0.15
SLEEP_BETWEEN_SPECIES = 0.25

API_BASE = "https://api.globalbioticinteractions.org"

# EXACT interaction types to fetch (as-is, no normalization)
INTERACTION_TYPES: List[str] = [
    "eatenBy",
    "preyedUponBy",
    "hasParasite",
    "parasitizedBy",
    "hostOf",
    "hasHost",
    "flowersVisitedBy",
    "infectedBy",
    "hasPathogen",
    "pollinatedBy",
]

# Fixed role per interaction type (single direction, like your old script):
# - For interactions where the plant is affected, plant is TARGET.
# - For interactions where the plant "has/hosts" others, plant is SOURCE.
ROLE_BY_TYPE: Dict[str, str] = {
    "eatenBy":          "targetTaxon",
    "preyedUponBy":     "targetTaxon",
    "parasitizedBy":    "targetTaxon",
    "infectedBy":       "targetTaxon",
    "flowersVisitedBy": "targetTaxon",
    "pollinatedBy":     "targetTaxon",
    "hasParasite":      "sourceTaxon",
    "hasPathogen":      "sourceTaxon",
    "hostOf":           "sourceTaxon",
    "hasHost":          "targetTaxon",
}

# Reuse one HTTP session for stability/perf
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "ViGrow/1.0 (academic use)"})


def resolve_name_with_globi(name: str) -> str:
    """Resolve to preferredName via /find; fallback to original."""
    try:
        r = SESSION.get(f"{API_BASE}/find", params={"name": name}, timeout=HTTP_TIMEOUT)
        r.raise_for_status()
        data = r.json()
        item = data[0] if isinstance(data, list) and data else (data if isinstance(data, dict) else None)
        if item:
            resolved = (item.get("preferredName") or item.get("name") or name).strip()
            return resolved or name
    except Exception:
        pass
    return name


def request_csv(url: str, params: dict) -> Optional[pd.DataFrame]:
    """GET CSV → DataFrame; return None if empty/invalid."""
    r = SESSION.get(url, params=params, timeout=HTTP_TIMEOUT)
    r.raise_for_status()
    text = r.text.strip()
    if not text:
        return None
    df = pd.read_csv(io.StringIO(text))
    if df is None or df.empty or len(df.columns) == 0:
        return None
    return df


def request_json_interaction(params: dict) -> Optional[pd.DataFrame]:
    """Fallback for /interaction in JSON.v2 format → DataFrame with canonical columns."""
    p = params.copy()
    p["type"] = "json.v2"
    r = SESSION.get(f"{API_BASE}/interaction", params=p, timeout=HTTP_TIMEOUT)
    r.raise_for_status()
    data = r.json()
    recs = data.get("data") or data.get("records") or []
    rows = []
    for it in recs:
        src = (it.get("source") or {}).get("name")
        tgt = (it.get("target") or {}).get("name")
        itype = it.get("interactionType") or it.get("interaction_type")
        if src or tgt:
            rows.append({
                "source_taxon_name": src,
                "target_taxon_name": tgt,
                "interaction_type": itype
            })
    return pd.DataFrame(rows) if rows else None


def ensure_output_with_header(output_csv: str) -> None:
    """Create output file with header if missing."""
    p = Path(output_csv)
    if p.exists():
        return
    with open(output_csv, "w", encoding="utf-8", newline="") as f:
        csv.writer(f).writerow([
            "plant_scientific_name",
            "animal_taxon_name",
            "interaction_type_raw"
        ])


def load_already_done(output_csv: str) -> Set[str]:
    """Checkpoint: set of plant names already present in output CSV."""
    done = set()
    p = Path(output_csv)
    if not p.exists():
        return done
    try:
        df = pd.read_csv(p, encoding="utf-8", usecols=["plant_scientific_name"])
        done.update(df["plant_scientific_name"].dropna().astype(str).unique().tolist())
    except Exception:
        pass
    return done


def append_row(output_csv: str, row: List[str]) -> None:
    """Stream-append a single row."""
    with open(output_csv, "a", encoding="utf-8", newline="") as f:
        csv.writer(f).writerow(row)


def fetch_interactions_for_one(plant_raw: str) -> List[List[str]]:
    """
    For a single plant:
      - Resolve name
      - For each EXACT interaction type, use its ONE role and try:
          A1: /interaction CSV + fields
          A2: /interaction CSV (no fields)
          A3: /interaction JSON.v2
        If none returns rows for the type:
          B1: /taxon/{plant}/{interactionType} CSV (distinct list)
      - De-duplicate within the plant on (animal.lower, interaction_type_raw)
      - Return rows ready to be written
    """
    plant = resolve_name_with_globi(plant_raw)
    rows_out: List[List[str]] = []
    seen_pairs: Set[Tuple[str, str]] = set()  # (animal_lower, interaction_type_raw)

    for itype in INTERACTION_TYPES:
        role = ROLE_BY_TYPE[itype]

        # ----- /interaction with pagination -----
        offset = 0
        while True:
            df = None
            attempts = []

            base = {
                "interactionType": itype,
                role: plant,
                "limit": PAGE_LIMIT,
                "offset": offset,
            }

            # A1: CSV + fields
            p1 = base.copy()
            p1["type"] = "csv"
            p1["fields"] = "source_taxon_name,target_taxon_name,interaction_type"
            attempts.append(("A1", f"{API_BASE}/interaction", p1, request_csv))

            # A2: CSV (no fields)
            p2 = base.copy()
            p2["type"] = "csv"
            attempts.append(("A2", f"{API_BASE}/interaction", p2, request_csv))

            # A3: JSON.v2
            p3 = base.copy()
            attempts.append(("A3", None, p3, request_json_interaction))

            # run attempts
            for tag, url, params, func in attempts:
                ok = False
                for _ in range(RETRY_EACH_STEP + 1):
                    try:
                        df = func(url, params) if url else func(params)
                        if df is not None and not df.empty:
                            ok = True
                            break
                    except requests.HTTPError:
                        time.sleep(0.2)
                    except Exception:
                        time.sleep(0.2)
                # if one attempt worked, stop trying others
                if ok:
                    break

            if df is None or df.empty:
                # no data for this page → stop pagination for this type and go fallback
                break

            # collect rows
            pl_l = plant.lower()
            for _, r in df.iterrows():
                src = str(r.get("source_taxon_name") or "").strip()
                tgt = str(r.get("target_taxon_name") or "").strip()
                it_raw = str(r.get("interaction_type") or itype).strip()

                # decide counterpart taxon from role result
                animal = None
                if src.lower() == pl_l:
                    animal = tgt
                elif tgt.lower() == pl_l:
                    animal = src
                else:
                    continue
                if not animal:
                    continue

                key = (animal.lower(), it_raw)
                if key in seen_pairs:
                    continue
                seen_pairs.add(key)
                rows_out.append([plant, animal, it_raw])

            if len(df) < PAGE_LIMIT:
                break
            offset += PAGE_LIMIT
            time.sleep(SLEEP_BETWEEN_PAGES)

        # ----- Fallback: /taxon/{plant}/{interactionType} CSV (distinct list, no pagination) -----
        url = f"{API_BASE}/taxon/{quote(plant)}/{itype}"
        df2 = None
        got = False
        for _ in range(RETRY_EACH_STEP + 1):
            try:
                df2 = request_csv(url, {"type": "csv"})
                if df2 is not None and not df2.empty:
                    got = True
                    break
            except requests.HTTPError:
                time.sleep(0.2)
            except Exception:
                time.sleep(0.2)

        if got:
            cols = [c for c in df2.columns if "name" in c.lower() or "taxon" in c.lower()]
            if not cols:
                cols = [df2.columns[0]]
            for col in cols:
                for s in df2[col].dropna().astype(str):
                    animal = s.strip()
                    if not animal:
                        continue
                    key = (animal.lower(), itype)
                    if key in seen_pairs:
                        continue
                    seen_pairs.add(key)
                    rows_out.append([plant, animal, itype])

    return rows_out


def main():
    cwd = Path(".").resolve()
    print(f"Working directory: {cwd}")

    # 1) Load scientific names
    df = pd.read_csv(INPUT_CSV, encoding="utf-8", keep_default_na=False)
    if "scientific_name" not in df.columns:
        raise ValueError("INPUT_CSV must contain column: scientific_name")
    names_all = [str(x).strip() for x in df["scientific_name"].tolist() if str(x).strip()]

    # Order-preserving unique
    seen, names = set(), []
    for n in names_all:
        if n not in seen:
            names.append(n); seen.add(n)

    print(f"Total scientific names detected: {len(names)}")

    # 2) Prepare output header & checkpoint
    ensure_output_with_header(OUTPUT_CSV)
    done = load_already_done(OUTPUT_CSV)
    print(f"Already completed (checkpoint): {len(done)}")

    # 3) Iterate, fetch, and stream-append
    total = len(names)
    for i, plant in enumerate(names, 1):
        if plant in done:
            print(f"({i}/{total}) Skip (done): {plant}")
            continue

        print(f"({i}/{total}) Fetching: {plant}")
        try:
            rows = fetch_interactions_for_one(plant)
        except Exception as e:
            print(f"[WARN] {plant} exception: {e}")
            rows = []

        for r in rows:
            append_row(OUTPUT_CSV, r)

        time.sleep(SLEEP_BETWEEN_SPECIES)

    print(f"Done ✅ Saved to: {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
