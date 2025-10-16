import os
import re
import csv
from typing import List, Dict, Tuple, Any

import psycopg2
from psycopg2.extras import execute_batch

# ---------- DB config ----------
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "5120netzeroDB"),
    "user": os.getenv("DB_USER", "gardener"),
    "password": os.getenv("DB_PASSWORD", "netzeroTP08"),
}

# ---------- CSV paths ----------
REL_CSV     = os.getenv("REL_CSV",     "relationship_dataset.csv")
SPECIES_CSV = os.getenv("SPECIES_CSV", "species_information_dataset.csv")
OBS_CSV     = os.getenv("OBS_CSV",     "species_occurrences_cleaned.csv")

# ---------- helpers ----------
PG_IDENT_MAXLEN = 63
IDENT_RE = re.compile(r"[^a-zA-Z0-9_]+")

def make_ident(path: str) -> str:
    stem = os.path.splitext(os.path.basename(path))[0]
    ident = IDENT_RE.sub("_", stem).lower()
    if not ident:
        ident = "t_data"
    if ident[0].isdigit():
        ident = f"t_{ident}"
    return ident[:PG_IDENT_MAXLEN]

def sniff_dialect(sample: bytes) -> csv.Dialect:
    try:
        return csv.Sniffer().sniff(sample.decode("utf-8", errors="ignore"),
                                   delimiters=",\t;|")
    except Exception:
        text = sample.decode("utf-8", errors="ignore")
        if text.count("\t") > text.count(","):
            class _TSV(csv.Dialect):
                delimiter = "\t"; quotechar = '"'; doublequote = True
                skipinitialspace = False; lineterminator = "\n"; quoting = csv.QUOTE_MINIMAL
            return _TSV
        return csv.excel

def read_csv_dicts(path: str) -> Tuple[List[Dict[str, str]], List[str]]:
    if not os.path.exists(path):
        raise SystemExit(f"CSV not found: {path}")
    with open(path, "rb") as fb:
        sample = fb.read(4096)
        dialect = sniff_dialect(sample)
        fb.seek(0)
        lines = fb.read().decode("utf-8", errors="ignore").splitlines()
    reader = csv.DictReader(lines, dialect=dialect)
    rows = [dict(r) for r in reader]
    headers = reader.fieldnames or []
    return rows, headers

# ---------- DDL builders ----------
def ddl_relationships(table: str) -> Tuple[str, str]:
    drop_sql = f'DROP TABLE IF EXISTS public.{table} CASCADE;'
    create_sql = f"""
    CREATE TABLE public.{table} (
      plant_scientific_name TEXT NOT NULL,
      animal_taxon_name     TEXT NOT NULL,
      interaction_type_raw  TEXT NOT NULL,
      PRIMARY KEY (plant_scientific_name, animal_taxon_name, interaction_type_raw)
    );
    """
    return drop_sql, create_sql

def ddl_species_info(table: str) -> Tuple[str, str]:
    drop_sql = f'DROP TABLE IF EXISTS public.{table} CASCADE;'
    create_sql = f"""
    CREATE TABLE public.{table} (
      animal_taxon_name TEXT PRIMARY KEY,
      "Species" TEXT,
      "Kingdom" TEXT,
      "Phylum" TEXT,
      "Class" TEXT,
      "Order" TEXT,
      "Family" TEXT,
      "Genus" TEXT,
      "Vernacular Name" TEXT,
      "Number of Records" INTEGER,
      "Victoria : Conservation Status" TEXT,
      "EPBC Act Threatened Species" TEXT,
      "Weeds of National Significance (WoNS) as at Feb. 2013" TEXT,
      "VIC State Notifiable Pests" TEXT,
      image_url TEXT,
      summary TEXT
    );
    """
    return drop_sql, create_sql

def ddl_observations(table: str, headers: List[str]) -> Tuple[str, str]:
    drop_sql = f'DROP TABLE IF EXISTS public.{table} CASCADE;'
    types = {h: "TEXT" for h in headers}
    if "animal_taxon_name" in headers: types["animal_taxon_name"] = "TEXT"
    if "decimalLatitude"  in headers: types["decimalLatitude"]  = "DOUBLE PRECISION"
    if "decimalLongitude" in headers: types["decimalLongitude"] = "DOUBLE PRECISION"
    if "eventDate"        in headers: types["eventDate"]        = "BIGINT"  # epoch ms (int)
    cols_sql = ",\n      ".join(f'"{h}" {types.get(h, "TEXT")}' for h in headers)
    create_sql = f"CREATE TABLE public.{table} (\n      {cols_sql}\n);"
    return drop_sql, create_sql

# ---------- DML with SAFE placeholders ----------
SAFE_KEY_RE = re.compile(r"[^a-zA-Z0-9_]")

def make_unique_safe_keys(headers: List[str]) -> Dict[str, str]:
    """Map original header -> unique safe key usable in %(key)s placeholders."""
    mapping: Dict[str, str] = {}
    used: Dict[str, int] = {}
    for h in headers:
        base = SAFE_KEY_RE.sub("_", h) or "col"
        key = base
        if key in used:
            used[key] += 1
            key = f"{base}_c{used[base]}"
        else:
            used[key] = 1
        mapping[h] = key
    return mapping

def cast_value(header: str, value: Any) -> Any:
    """Cast CSV string to appropriate Python type for DB insert."""
    if value == "" or value is None:
        return None
    if header in ("decimalLatitude", "decimalLongitude"):
        try:
            return float(value)
        except Exception:
            return None
    if header == "eventDate":
        # CSV may be "1745087412000.0" -> cast to int millis
        try:
            return int(float(value))
        except Exception:
            return None
    if header == "Number of Records":
        try:
            return int(float(value))
        except Exception:
            return None
    return value  # default as text

def batch_insert(conn, table: str, rows: List[Dict[str, str]], headers: List[str], page_size: int = 2000):
    cols_sql = ", ".join(f'"{h}"' for h in headers)
    safe_keys = make_unique_safe_keys(headers)
    placeholders = ", ".join(f"%({safe_keys[h]})s" for h in headers)
    sql = f'INSERT INTO public.{table} ({cols_sql}) VALUES ({placeholders})'

    params = []
    for r in rows:
        p = {}
        for h in headers:
            p[safe_keys[h]] = cast_value(h, r.get(h))
        params.append(p)

    with conn.cursor() as cur:
        execute_batch(cur, sql, params, page_size=page_size)

# ---------- main ----------
def main():
    # relationships
    rel_rows, rel_headers = read_csv_dicts(REL_CSV)
    need_rel = ["plant_scientific_name", "animal_taxon_name", "interaction_type_raw"]
    if not set(need_rel).issubset(rel_headers):
        miss = set(need_rel) - set(rel_headers)
        raise SystemExit(f"{REL_CSV} missing columns: {miss}")
    rel_table = make_ident(REL_CSV)
    print(f"[rel] {REL_CSV} -> public.{rel_table} ({len(rel_rows)} rows)")

    # species info
    sp_rows, sp_headers = read_csv_dicts(SPECIES_CSV)
    if "animal_taxon_name" not in sp_headers:
        raise SystemExit(f"{SPECIES_CSV} must contain 'animal_taxon_name'")
    sp_table = make_ident(SPECIES_CSV)
    print(f"[species] {SPECIES_CSV} -> public.{sp_table} ({len(sp_rows)} rows)")

    # observations
    obs_rows, obs_headers = read_csv_dicts(OBS_CSV)
    obs_table = make_ident(OBS_CSV)
    print(f"[obs] {OBS_CSV} -> public.{obs_table} ({len(obs_rows)} rows)")

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn:
            with conn.cursor() as cur:
                drop, create = ddl_relationships(rel_table)
                cur.execute(drop); cur.execute(create)
                batch_insert(conn, rel_table, rel_rows, need_rel)

                drop, create = ddl_species_info(sp_table)
                cur.execute(drop); cur.execute(create)
                batch_insert(conn, sp_table, sp_rows, sp_headers)

                drop, create = ddl_observations(obs_table, obs_headers)
                cur.execute(drop); cur.execute(create)
                batch_insert(conn, obs_table, obs_rows, obs_headers)

        print("[done] Loaded all three tables successfully.")
    finally:
        conn.close()

if __name__ == "__main__":
    main()