# community_map_data.py
# Purpose: load community garden CSV and write into PostgreSQL on EC2.
# - Drops and recreates table community_gardens
# - Loads id, name, address, lat, lng (with dedup + safe insert)

import os
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

CSV_PATH = os.getenv("COMMUNITY_CSV", "community map data.csv")

# ---------- DDL ----------
DROP_SQL = """
DROP TABLE IF EXISTS public.community_gardens CASCADE;
"""

CREATE_SQL = """
CREATE TABLE public.community_gardens (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
);
"""

INSERT_SQL = """
INSERT INTO public.community_gardens (id, name, address, lat, lng)
VALUES (%(id)s, %(name)s, %(address)s, %(lat)s, %(lng)s)
ON CONFLICT (id) DO NOTHING;
"""

# ---------- Load ----------
def load_csv() -> pd.DataFrame:
    print(f">>> Loading CSV from {CSV_PATH}")
    df = pd.read_csv(CSV_PATH, encoding="utf-8")
    expected = ["id", "name", "address", "lat", "lng"]
    for col in expected:
        if col not in df.columns:
            raise ValueError(f"Missing column in CSV: {col}")

    # 只取需要的列
    df = df[expected]

    # 去重：按 id 只保留第一条
    before = len(df)
    df = df.drop_duplicates(subset=["id"], keep="first")
    after = len(df)
    if before != after:
        print(f">>> Dropped {before - after} duplicate rows by id")

    return df

# ---------- Write ----------
def write_to_db(df: pd.DataFrame) -> int:
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn:
            with conn.cursor() as cur:
                print(">>> Dropping & creating table community_gardens")
                cur.execute(DROP_SQL)
                cur.execute(CREATE_SQL)
                print(f">>> Inserting {len(df)} rows ...")
                execute_batch(cur, INSERT_SQL, df.to_dict("records"), page_size=300)
        return len(df)
    finally:
        conn.close()

# ---------- Main ----------
def main():
    df = load_csv()
    rows = write_to_db(df)
    print(f">>> Done. Inserted {rows} unique rows into community_gardens.")

if __name__ == "__main__":
    main()
