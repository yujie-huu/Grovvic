# epic7_plants_lists_create.py
# Build a new table "epic7_plants_overview" from existing sources.
# Sources:
# - epic3_companion_planting (unique plant list from plant ∪ neighbour, excluding 'All')
# - sowing_plants (categories -> Type; months -> Seasons)
# - variety_details (quick_position -> Sunshine; quick_plant_spacing -> Plant Spacing; quick_hardiness_lifecycle -> Hardiness)

import os
import re
import random
import math
from collections import Counter
from typing import List, Optional, Tuple

import psycopg2
from psycopg2.extras import execute_batch

# ---------- Configuration ----------
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "dbname": os.getenv("DB_NAME", "5120netzeroDB"),
    "user": os.getenv("DB_USER", "gardener"),
    "password": os.getenv("DB_PASSWORD", "netzeroTP08"),
}

ALLOWED_TYPES = {"vegetable": "Vegetable", "herb": "Herb", "flower": "Flower"}

SEASON_MAP = {
    "Summer": [12, 1, 2],
    "Autumn": [3, 4, 5],
    "Winter": [6, 7, 8],
    "Spring": [9, 10, 11],
}

# ---------- Helpers ----------
def first_token_before_comma(s: str) -> str:
    return s.split(",")[0].strip()

def mode_with_random_tie(values: List[str]) -> Optional[str]:
    if not values:
        return None
    c = Counter(values)
    max_count = max(c.values())
    candidates = [k for k, v in c.items() if v == max_count]
    return random.choice(candidates)

def extract_cm_number(s: str) -> Optional[int]:
    if not s:
        return None
    m = re.search(r"(\d+)", s)
    return int(m.group(1)) if m else None

def ceil_to_20(n: int) -> int:
    """Round up to the nearest multiple of 20 (20, 40, 60, ...)."""
    return int(math.ceil(n / 20.0)) * 20

def normalize_hardiness(raw: str) -> Optional[str]:
    if not raw:
        return None
    s = raw.strip().lower()
    if "tender" in s:
        return "Frost Tender"
    if "half hardy" in s:
        return "Half Hardy"
    if "hardy" in s:
        return "Frost Hardy"
    return None

def pick_type_from_categories(categories, category_raw: Optional[str]) -> Optional[str]:
    if categories and isinstance(categories, (list, tuple)):
        for item in categories:
            k = str(item).strip().lower()
            if k in ALLOWED_TYPES:
                return ALLOWED_TYPES[k]
    if category_raw:
        for token in [t.strip().lower() for t in category_raw.split(",") if t.strip()]:
            if token in ALLOWED_TYPES:
                return ALLOWED_TYPES[token]
    return None

def months_to_seasons(months: List[int]) -> List[str]:
    """Convert list of month numbers with value=1 to seasons."""
    result = []
    for season, mlist in SEASON_MAP.items():
        if any(m in months for m in mlist):
            result.append(season)
    return result

# ---------- Main ETL ----------
def main():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            # 1) Create destination table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS epic7_plants_overview (
                    plant_name TEXT PRIMARY KEY,
                    type TEXT,
                    sunshine TEXT,
                    plant_spacing_cm SMALLINT,
                    hardiness TEXT,
                    seasons TEXT[]
                );
            """)

            # 2) Build unique plant list
            cur.execute("""
                WITH u AS (
                    SELECT plant AS name FROM epic3_companion_planting
                    UNION
                    SELECT neighbour AS name FROM epic3_companion_planting
                )
                SELECT DISTINCT TRIM(name)
                FROM u
                WHERE name IS NOT NULL
                  AND TRIM(name) <> ''
                  AND LOWER(TRIM(name)) <> 'all'
                ORDER BY 1 ASC;
            """)
            plants = [r[0] for r in cur.fetchall()]

        rows_to_upsert: List[Tuple[str, Optional[str], Optional[str], Optional[int], Optional[str], List[str]]] = []

        with conn.cursor() as cur:
            for plant in plants:
                pname = plant

                # --- Type + Seasons ---
                cur.execute("""
                    SELECT categories, category_raw,
                           jan,feb,mar,apr,may,jun,jul,aug,sep,oct,nov,dec
                    FROM sowing_plants
                    WHERE LOWER(plant_name) = LOWER(%s)
                    LIMIT 1;
                """, (pname,))
                type_val, seasons_val = None, []
                sp_row = cur.fetchone()
                if sp_row:
                    categories, category_raw = sp_row[0], sp_row[1]
                    months_raw = sp_row[2:]
                    # type
                    type_val = pick_type_from_categories(categories, category_raw)
                    # seasons
                    months_active = [i+1 for i, v in enumerate(months_raw) if v == 1]
                    seasons_val = months_to_seasons(months_active)

                # --- Sunshine ---
                cur.execute("""
                    SELECT quick_position
                    FROM variety_details
                    WHERE LOWER(plant_name) = LOWER(%s)
                      AND quick_position IS NOT NULL
                      AND TRIM(quick_position) <> ''
                """, (pname,))
                qpos = [first_token_before_comma(r[0]) for r in cur.fetchall() if r[0]]
                sunshine = mode_with_random_tie(qpos)

                # --- Plant Spacing ---
                cur.execute("""
                    SELECT quick_plant_spacing
                    FROM variety_details
                    WHERE LOWER(plant_name) = LOWER(%s)
                      AND quick_plant_spacing IS NOT NULL
                      AND TRIM(quick_plant_spacing) <> ''
                """, (pname,))
                spacings_raw = [r[0] for r in cur.fetchall()]
                spacing_nums = [extract_cm_number(s) for s in spacings_raw if extract_cm_number(s) is not None]
                plant_spacing_cm = None
                if spacing_nums:
                    plant_spacing_cm = ceil_to_20(max(spacing_nums))

                # --- Hardiness ---
                cur.execute("""
                    SELECT quick_hardiness_lifecycle
                    FROM variety_details
                    WHERE LOWER(plant_name) = LOWER(%s)
                      AND quick_hardiness_lifecycle IS NOT NULL
                      AND TRIM(quick_hardiness_lifecycle) <> ''
                """, (pname,))
                hardiness_raw = [r[0] for r in cur.fetchall() if r[0]]
                hardiness_norm = [normalize_hardiness(x) for x in hardiness_raw]
                hardiness_norm = [h for h in hardiness_norm if h]
                hardiness = mode_with_random_tie(hardiness_norm)

                rows_to_upsert.append((pname, type_val, sunshine, plant_spacing_cm, hardiness, seasons_val))

        with conn.cursor() as cur:
            execute_batch(cur, """
                INSERT INTO epic7_plants_overview (plant_name, type, sunshine, plant_spacing_cm, hardiness, seasons)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (plant_name) DO UPDATE SET
                    type = EXCLUDED.type,
                    sunshine = EXCLUDED.sunshine,
                    plant_spacing_cm = EXCLUDED.plant_spacing_cm,
                    hardiness = EXCLUDED.hardiness,
                    seasons = EXCLUDED.seasons;
            """, rows_to_upsert, page_size=500)

        conn.commit()
        print(f"Upserted {len(rows_to_upsert)} rows into epic7_plants_overview")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    main()
