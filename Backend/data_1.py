# data_1.py
# Purpose: load + clean two CSVs and write into PostgreSQL on EC2.
# - Drops and recreates two tables: sowing_plants, variety_details
# - Cleans Plant names (strip suffixes), normalizes categories, removes
#   "learn more about ... ." sentences from long text fields
# - Links variety_details to sowing_plants via plant_name (from Category in variety CSV)

import os
import re
from typing import List, Dict, Any

import pandas as pd
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

# CSV paths (assumed to be in the same folder as this script)
SOWING_CSV = os.getenv("SOWING_CSV", "sowing_chart_wide_with_links_and_category.csv")
VARIETY_CSV = os.getenv("VARIETY_CSV", "variety_details.csv")

# Suffixes to remove from Plant (case-insensitive, optional trailing '?', whitespace-safe)
PLANT_SUFFIX_RE = re.compile(
    r"\s+(Seeds?|Crowns?|Canes?|Cuttings?|Bulbs?|Tubers?)\s*$",
    flags=re.IGNORECASE,
)

# Pattern to remove any sentence that starts with "learn more about" (case-insensitive)
# and goes until the next period. Applied repeatedly until none left.
LEARN_MORE_SENTENCE_RE = re.compile(r"(?i)learn\s+more\s+about[^.]*\.")

# Long-text columns in the variety CSV where we need to strip "learn more about ..." sentences
VARIETY_TEXT_COLS = [
    "Overview", "Notes", "Preparation", "HowToSow", "HowToGrow", "HowToHarvest"
]

# ---------- Helpers ----------
def clean_plant_name(name: str) -> str:
    """Strip trailing suffixes like 'Seeds', 'Crowns', etc. Return stripped name."""
    if not isinstance(name, str):
        return ""
    out = name.strip()
    # Remove suffix repeatedly in case there are multiple tokens
    prev = None
    while prev != out:
        prev = out
        out = PLANT_SUFFIX_RE.sub("", out).strip()
    return out

def split_categories(raw: str) -> List[str]:
    """Split semicolon-separated categories to a normalized lowercase list."""
    if not isinstance(raw, str) or not raw.strip():
        return []
    parts = [p.strip().lower() for p in raw.split(";")]
    return [p for p in parts if p]

def strip_learn_more(text: Any) -> str:
    """Remove any 'learn more about ... .' sentence(s) from the text."""
    if not isinstance(text, str) or not text:
        return ""
    s = text
    # Apply repeatedly until no more matches
    prev = None
    while prev != s:
        prev = s
        s = LEARN_MORE_SENTENCE_RE.sub("", s)
    # Normalize double spaces and strip
    return re.sub(r"[ \t]{2,}", " ", s).strip()

def to_int01(v: Any) -> int:
    """Coerce to 0/1 integer; non-numeric becomes 0."""
    try:
        return 1 if int(float(v)) == 1 else 0
    except Exception:
        return 0

# ---------- DDL ----------
CREATE_SOWING_SQL = """
CREATE TABLE public.sowing_plants (
  plant_name TEXT PRIMARY KEY,
  plant_url  TEXT,
  jan SMALLINT, feb SMALLINT, mar SMALLINT, apr SMALLINT, may SMALLINT, jun SMALLINT,
  jul SMALLINT, aug SMALLINT, sep SMALLINT, oct SMALLINT, nov SMALLINT, dec SMALLINT,
  category_raw TEXT,
  categories   TEXT[]  -- normalized, lowercased, split by ';'
);
"""

CREATE_VARIETY_SQL = """
CREATE TABLE public.variety_details (
  id BIGSERIAL PRIMARY KEY,
  plant_name TEXT REFERENCES public.sowing_plants(plant_name) ON DELETE SET NULL,
  variety TEXT,
  overview TEXT,
  quick_method TEXT,
  quick_sowing_depth TEXT,
  quick_season TEXT,
  quick_germination TEXT,
  quick_hardiness_lifecycle TEXT,
  quick_plant_spacing TEXT,
  quick_plant_height TEXT,
  quick_position TEXT,
  quick_days_until_maturity TEXT,
  notes TEXT,
  preparation TEXT,
  how_to_sow TEXT,
  how_to_grow TEXT,
  how_to_harvest TEXT,
  source_url TEXT,
  image_url TEXT
);
"""

DROP_TABLES_SQL = """
DROP TABLE IF EXISTS public.variety_details CASCADE;
DROP TABLE IF EXISTS public.sowing_plants CASCADE;
"""

# ---------- Load & Transform ----------
def load_and_transform() -> Dict[str, Any]:
    # Load CSVs (UTF-8 assumed)
    sow = pd.read_csv(SOWING_CSV)
    var = pd.read_csv(VARIETY_CSV)

    # --- Clean sowing ---
    month_cols = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
    for m in month_cols:
        if m not in sow.columns:
            raise ValueError(f"Missing month column in sowing CSV: {m}")

    sow["plant_name"] = sow["Plant"].apply(clean_plant_name)
    sow["plant_url"]  = sow.get("PlantURL", "")

    # Normalize categories
    sow["category_raw"] = sow.get("Category", "").fillna("")
    sow["categories"]   = sow["category_raw"].apply(split_categories)

    # Coerce months to 0/1 ints
    for m in month_cols:
        sow[m.lower()] = sow[m].apply(to_int01)

    # ---- NEW: deduplicate by plant_name (merge rows) ----
    def first_non_empty(series: pd.Series) -> str:
        for v in series:
            if isinstance(v, str) and v.strip():
                return v
        return ""

    def merge_categories_raw(series: pd.Series) -> str:
        # join unique non-empty pieces with ';'
        parts = []
        for s in series:
            if isinstance(s, str) and s.strip():
                parts.extend([p.strip() for p in s.split(";") if p.strip()])
        return ";".join(sorted(set(p.lower() for p in parts)))

    def merge_categories_array(series: pd.Series) -> list[str]:
        acc = set()
        for lst in series:
            if isinstance(lst, list):
                acc.update([str(x).strip().lower() for x in lst if str(x).strip()])
        return sorted(acc)  # psycopg2 will map list -> text[]

    agg_dict = {
        "plant_url": first_non_empty,
        "jan": "max", "feb": "max", "mar": "max", "apr": "max", "may": "max", "jun": "max",
        "jul": "max", "aug": "max", "sep": "max", "oct": "max", "nov": "max", "dec": "max",
        "category_raw": merge_categories_raw,
        "categories": merge_categories_array,
    }

    sow_merged = (
        sow.groupby("plant_name", as_index=False)
        .agg(agg_dict)
    )

    # Select and order columns for DB
    sow_db = sow_merged[[
        "plant_name","plant_url",
        "jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec",
        "category_raw","categories"
    ]].copy()

    # --- Clean variety ---
    # Derive plant_name from Category column
    if "Category" not in var.columns:
        raise ValueError("Missing 'Category' column in variety CSV")
    var["plant_name"] = var["Category"].apply(lambda x: clean_plant_name(str(x)))

    # Drop Learn-more sentences from long text fields
    for col in VARIETY_TEXT_COLS:
        if col in var.columns:
            var[col] = var[col].apply(strip_learn_more)
        else:
            var[col] = ""  # ensure column exists

    # Ensure all expected columns exist (fill empty if missing)
    expected = [
        "plant_name",
        "Variety","Overview","Quick_Method","Quick_SowingDepth","Quick_Season",
        "Quick_Germination","Quick_HardinessLifeCycle","Quick_PlantSpacing",
        "Quick_PlantHeight","Quick_Position","Quick_DaysUntilMaturity",
        "Notes","Preparation","HowToSow","HowToGrow","HowToHarvest",
        "SourceURL","ImageURL"
    ]
    for col in expected:
        if col not in var.columns:
            var[col] = ""

    # Build final dataframe with proper names
    var_db = pd.DataFrame({
        "plant_name": var["plant_name"].fillna(""),
        "variety": var["Variety"].fillna(""),
        "overview": var["Overview"].fillna(""),
        "quick_method": var["Quick_Method"].fillna(""),
        "quick_sowing_depth": var["Quick_SowingDepth"].fillna(""),
        "quick_season": var["Quick_Season"].fillna(""),
        "quick_germination": var["Quick_Germination"].fillna(""),
        "quick_hardiness_lifecycle": var["Quick_HardinessLifeCycle"].fillna(""),
        "quick_plant_spacing": var["Quick_PlantSpacing"].fillna(""),
        "quick_plant_height": var["Quick_PlantHeight"].fillna(""),
        "quick_position": var["Quick_Position"].fillna(""),
        "quick_days_until_maturity": var["Quick_DaysUntilMaturity"].fillna(""),
        "notes": var["Notes"].fillna(""),
        "preparation": var["Preparation"].fillna(""),
        "how_to_sow": var["HowToSow"].fillna(""),
        "how_to_grow": var["HowToGrow"].fillna(""),
        "how_to_harvest": var["HowToHarvest"].fillna(""),
        "source_url": var["SourceURL"].fillna(""),
        "image_url": var["ImageURL"].fillna(""),
    })

    return {"sowing": sow_db, "variety": var_db}

# ---------- Write to PostgreSQL ----------
def write_to_db(payload: Dict[str, pd.DataFrame]) -> Dict[str, int]:
    sow_df: pd.DataFrame = payload["sowing"]
    var_df: pd.DataFrame = payload["variety"]

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn:
            with conn.cursor() as cur:
                # Drop & create tables
                cur.execute(DROP_TABLES_SQL)
                cur.execute(CREATE_SOWING_SQL)
                cur.execute(CREATE_VARIETY_SQL)

                # Insert sowing_plants
                sow_sql = """
                    INSERT INTO public.sowing_plants (
                        plant_name, plant_url,
                        jan,feb,mar,apr,may,jun,jul,aug,sep,oct,nov,dec,
                        category_raw, categories
                    ) VALUES (
                        %(plant_name)s, %(plant_url)s,
                        %(jan)s, %(feb)s, %(mar)s, %(apr)s, %(may)s, %(jun)s, %(jul)s, %(aug)s, %(sep)s, %(oct)s, %(nov)s, %(dec)s,
                        %(category_raw)s, %(categories)s
                    )
                """
                # psycopg2 will map Python list -> PostgreSQL text[] automatically
                execute_batch(cur, sow_sql, sow_df.to_dict("records"), page_size=500)

                # Insert variety_details
                var_sql = """
                    INSERT INTO public.variety_details (
                        plant_name, variety, overview, quick_method, quick_sowing_depth,
                        quick_season, quick_germination, quick_hardiness_lifecycle,
                        quick_plant_spacing, quick_plant_height, quick_position,
                        quick_days_until_maturity, notes, preparation, how_to_sow,
                        how_to_grow, how_to_harvest, source_url, image_url
                    ) VALUES (
                        %(plant_name)s, %(variety)s, %(overview)s, %(quick_method)s, %(quick_sowing_depth)s,
                        %(quick_season)s, %(quick_germination)s, %(quick_hardiness_lifecycle)s,
                        %(quick_plant_spacing)s, %(quick_plant_height)s, %(quick_position)s,
                        %(quick_days_until_maturity)s, %(notes)s, %(preparation)s, %(how_to_sow)s,
                        %(how_to_grow)s, %(how_to_harvest)s, %(source_url)s, %(image_url)s
                    )
                """
                execute_batch(cur, var_sql, var_df.to_dict("records"), page_size=300)

        return {"sowing_rows": len(sow_df), "variety_rows": len(var_df)}
    finally:
        conn.close()

# ---------- Main ----------
def main():
    payload = load_and_transform()
    result = write_to_db(payload)
    print(f"Loaded rows -> sowing_plants: {result['sowing_rows']}, variety_details: {result['variety_rows']}")

if __name__ == "__main__":
    main()