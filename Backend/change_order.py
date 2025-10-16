# change_order.py
# Purpose:
# 1) Normalize the name "Chamomile" to "German Chamomile" in epic3_companion_planting
#    - Applies to BOTH columns: plant and neighbour (case-insensitive, trimmed)
# 2) Add column "Vernacular Order" to species_information_dataset (if missing)
#    and populate it from order_dataset.csv mapping:  Order,Vernacular Order

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

# CSV with two headers: "Order","Vernacular Order"
ORDER_CSV = os.getenv("ORDER_CSV", "order_dataset.csv")

# Source/target names for normalization in epic3_companion_planting
OLD_PLANT_NAME = "Chamomile"
NEW_PLANT_NAME = "German Chamomile"

# ---------- DDL ----------
ALTER_SPECIES_SQL = """
ALTER TABLE public.species_information_dataset
ADD COLUMN IF NOT EXISTS "Vernacular Order" TEXT;
"""

# ---------- Load & Validate CSV ----------
def load_order_csv() -> pd.DataFrame:
    df = pd.read_csv(ORDER_CSV)
    expected = {"Order", "Vernacular Order"}
    if not expected.issubset(df.columns):
        raise ValueError(f"CSV must contain columns: {expected}, found {df.columns.tolist()}")
    # Keep only the required columns (and preserve order)
    return df[["Order", "Vernacular Order"]]

# ---------- Apply DB Changes ----------
def apply_changes(order_df: pd.DataFrame) -> dict:
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn:
            with conn.cursor() as cur:
                # 1) Update epic3_companion_planting.plant
                cur.execute(
                    """
                    UPDATE public.epic3_companion_planting
                    SET plant = %s
                    WHERE trim(lower(plant)) = trim(lower(%s))
                    """,
                    (NEW_PLANT_NAME, OLD_PLANT_NAME),
                )
                plant_rows = cur.rowcount

                # 1b) Update epic3_companion_planting.neighbour
                cur.execute(
                    """
                    UPDATE public.epic3_companion_planting
                    SET neighbour = %s
                    WHERE trim(lower(neighbour)) = trim(lower(%s))
                    """,
                    (NEW_PLANT_NAME, OLD_PLANT_NAME),
                )
                neighbour_rows = cur.rowcount

                # 2) Ensure new column exists on species_information_dataset
                cur.execute(ALTER_SPECIES_SQL)

                # 3) Create a TEMP table for CSV mapping (session-scoped)
                cur.execute("DROP TABLE IF EXISTS order_dataset_tmp")
                cur.execute(
                    """
                    CREATE TEMP TABLE order_dataset_tmp (
                        "Order" TEXT,
                        "Vernacular Order" TEXT
                    ) ON COMMIT DROP
                    """
                )

                # 4) Bulk insert mapping
                insert_sql = """
                    INSERT INTO order_dataset_tmp ("Order", "Vernacular Order")
                    VALUES (%s, %s)
                """
                execute_batch(cur, insert_sql, order_df.values.tolist(), page_size=200)

                # 5) Update species_information_dataset from mapping
                cur.execute(
                    """
                    UPDATE public.species_information_dataset AS s
                    SET "Vernacular Order" = m."Vernacular Order"
                    FROM order_dataset_tmp AS m
                    WHERE s."Order" = m."Order"
                    """
                )
                species_rows = cur.rowcount

        return {
            "plant_rows": plant_rows,
            "neighbour_rows": neighbour_rows,
            "species_rows": species_rows,
        }
    finally:
        conn.close()

# ---------- Main ----------
def main():
    order_df = load_order_csv()
    result = apply_changes(order_df)
    print(
        "Updated rows -> "
        f"plant: {result['plant_rows']}, "
        f"neighbour: {result['neighbour_rows']}, "
        f"species(vernacular order): {result['species_rows']}"
    )

if __name__ == "__main__":
    main()
