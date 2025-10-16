import os
import re
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

# If COMPANIONS_CSV not set, default to "<script_stem>.csv"
def _default_csv_from_script() -> str:
    script_path = os.path.abspath(__file__)
    stem, _ = os.path.splitext(os.path.basename(script_path))
    return f"{stem}.csv"

COMPANIONS_CSV = os.getenv("COMPANIONS_CSV") or _default_csv_from_script()
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "1000"))

# ---------- Utilities ----------
PG_IDENT_MAXLEN = 63
_ident_re = re.compile(r"[^a-zA-Z0-9_]+")

def make_sql_identifier_from_path(path: str) -> str:
    """
    Derive a safe PostgreSQL identifier (unquoted) from a file path's stem:
      - lower-case
      - non [a-zA-Z0-9_] replaced by '_'
      - if starts with digit, prefix with 't_'
      - truncate to 63 chars (PG limit)
    """
    stem = os.path.splitext(os.path.basename(path))[0]
    ident = _ident_re.sub("_", stem).lower()
    if not ident:
        ident = "t_data"
    if ident[0].isdigit():
        ident = f"t_{ident}"
    if len(ident) > PG_IDENT_MAXLEN:
        ident = ident[:PG_IDENT_MAXLEN]
    return ident

def sniff_dialect(sample_bytes: bytes) -> csv.Dialect:
    """
    Detect CSV dialect; fall back to comma vs tab heuristic.
    """
    try:
        return csv.Sniffer().sniff(sample_bytes.decode("utf-8", errors="ignore"), delimiters=",\t;|")
    except Exception:
        text = sample_bytes.decode("utf-8", errors="ignore")
        if text.count("\t") > text.count(","):
            class _TSV(csv.Dialect):
                delimiter = "\t"
                quotechar = '"'
                doublequote = True
                skipinitialspace = False
                lineterminator = "\n"
                quoting = csv.QUOTE_MINIMAL
            return _TSV
        return csv.excel  # default comma

def normalize_good_bad(value: str) -> str:
    v = (value or "").strip().lower()
    if v in ("good", "bad"):
        return v
    raise ValueError(f"Invalid good_or_bad value: {value!r} (expected 'good' or 'bad')")

def load_csv(path: str) -> List[Dict[str, object]]:
    if not os.path.exists(path):
        raise SystemExit(f"CSV not found: {path}")

    with open(path, "rb") as fb:
        sample = fb.read(4096)
        dialect = sniff_dialect(sample)
        fb.seek(0)
        lines = fb.read().decode("utf-8", errors="ignore").splitlines()

    reader = csv.DictReader(lines, dialect=dialect)
    required = {"plant", "neighbour", "good_or_bad", "why"}
    if not required.issubset(set(reader.fieldnames or [])):
        raise SystemExit(f"CSV must have columns: {', '.join(sorted(required))}. Got: {reader.fieldnames}")

    rows: List[Dict[str, object]] = []
    for i, row in enumerate(reader, start=2):  # header is line 1
        plant = (row.get("plant") or "").strip()
        neighbour = (row.get("neighbour") or "").strip()
        good_bad = normalize_good_bad(row.get("good_or_bad") or "")
        why = (row.get("why") or "").strip() or None

        if not plant or not neighbour:
            raise ValueError(f"Line {i}: plant/neighbour cannot be empty")

        rows.append({
            "plant": plant,
            "neighbour": neighbour,
            "good_or_bad": good_bad,
            "why": why,
        })
    return rows

# ---------- Main ----------
def main():
    table_name = make_sql_identifier_from_path(COMPANIONS_CSV)
    print(f"[info] CSV: {COMPANIONS_CSV}")
    print(f"[info] Target table: public.{table_name}")

    rows = load_csv(COMPANIONS_CSV)
    print(f"[info] Loaded rows: {len(rows)}")

    # Build DDL/DML with sanitized identifier
    drop_sql = f'DROP TABLE IF EXISTS public.{table_name} CASCADE;'
    create_sql = f"""
    CREATE TABLE public.{table_name} (
      plant        TEXT NOT NULL,
      neighbour    TEXT NOT NULL,
      good_or_bad  TEXT NOT NULL CHECK (good_or_bad IN ('good','bad')),
      why          TEXT,
      PRIMARY KEY (plant, neighbour)
    );
    """
    insert_sql = f"""
        INSERT INTO public.{table_name} (
            plant, neighbour, good_or_bad, why
        ) VALUES (
            %(plant)s, %(neighbour)s, %(good_or_bad)s, %(why)s
        )
    """

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(drop_sql)
                cur.execute(create_sql)
                execute_batch(cur, insert_sql, rows, page_size=BATCH_SIZE)
        print(f"[done] Inserted rows -> {table_name}: {len(rows)}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()