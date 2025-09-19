import os
import csv
from typing import List, Dict

import psycopg2
from psycopg2.extras import execute_batch

# ---------- Configuration ----------
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "5120netzeroDB"),
    "user": os.getenv("DB_USER", "gardener"),
    "password": os.getenv("DB_PASSWORD", "netzeroTP08"),
}

# CSV path (defaults to the cleaned file you just created)
POLLINATORS_CSV = os.getenv("POLLINATORS_CSV", "pollinators_by_plant_clean.csv")

# ---------- DDL for new table ----------
DROP_POLLINATORS_SQL = """
DROP TABLE IF EXISTS public.pollinators_by_plant CASCADE;
"""

CREATE_POLLINATORS_SQL = """
CREATE TABLE public.pollinators_by_plant (
  plant_scientific_name TEXT PRIMARY KEY,
  pollinators TEXT[]  -- cleaned list (comma-split, trimmed, unique)
);
"""

# ---------- Housekeeping: delete Babiana Corms from old tables ----------
DELETE_BABIANA_SQL = """
-- Remove from child table first (explicitly), then parent
DELETE FROM public.variety_details WHERE plant_name = 'Babiana Corms';
DELETE FROM public.sowing_plants WHERE plant_name = 'Babiana Corms';
"""

# ---------- Helpers ----------
def split_pollinators(cell: str) -> List[str]:
    """
    Split a comma-separated pollinator string into a cleaned, de-duplicated list.
    - trims whitespace
    - drops empty pieces
    - preserves order while removing duplicates
    """
    if not cell:
        return []
    seen = set()
    out: List[str] = []
    for p in cell.split(","):
        name = p.strip()
        if not name:
            continue
        if name not in seen:
            seen.add(name)
            out.append(name)
    return out

def load_csv(path: str) -> List[Dict[str, object]]:
    """
    Read pollinators_by_plant_clean.csv and return a list of dicts suitable for execute_batch.
    Expected columns: plant_scientific_name, pollinators
    """
    records: List[Dict[str, object]] = []
    with open(path, "r", encoding="utf-8", newline="") as f:
        r = csv.DictReader(f)
        if "plant_scientific_name" not in r.fieldnames or "pollinators" not in r.fieldnames:
            raise SystemExit("CSV must have columns: plant_scientific_name, pollinators")
        for row in r:
            plant = (row.get("plant_scientific_name") or "").strip()
            polli_raw = row.get("pollinators") or ""
            polli_list = split_pollinators(polli_raw)
            records.append({
                "plant_scientific_name": plant,
                "pollinators": polli_list,
            })
    return records

# ---------- Main load ----------
def main():
    if not os.path.exists(POLLINATORS_CSV):
        raise SystemExit(f"CSV not found: {POLLINATORS_CSV}")

    rows = load_csv(POLLINATORS_CSV)

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn:
            with conn.cursor() as cur:
                # 1) Clean up old Babiana rows in yesterday's tables
                cur.execute(DELETE_BABIANA_SQL)

                # 2) (Re)create the new pollinators table
                cur.execute(DROP_POLLINATORS_SQL)
                cur.execute(CREATE_POLLINATORS_SQL)

                # 3) Insert all pollinator rows
                insert_sql = """
                    INSERT INTO public.pollinators_by_plant (
                        plant_scientific_name, pollinators
                    ) VALUES (
                        %(plant_scientific_name)s, %(pollinators)s
                    )
                """
                execute_batch(cur, insert_sql, rows, page_size=500)

        print(f"Done ✅ Inserted rows -> pollinators_by_plant: {len(rows)}")
        print("Cleaned up 'Babiana Corms' from sowing_plants and variety_details.")
    finally:
        conn.close()

if __name__ == "__main__":
    main()