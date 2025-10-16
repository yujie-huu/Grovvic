# clean_observations.py
# Remove unwanted columns from species_occurrences.csv

import pandas as pd

INPUT = "species_occurrences.csv"
OUTPUT = "species_occurrences_cleaned.csv"

DROP_COLS = [
    "occurrenceID",
    "recordedBy",
    "locality",         
    "stateProvince",
    "country",
    "dataResourceName",
    "basisOfRecord",
]

def clean_observations(in_path=INPUT, out_path=OUTPUT):
    df = pd.read_csv(in_path)

    # drop only those columns that exist
    drop_actual = [c for c in DROP_COLS if c in df.columns]
    df = df.drop(columns=drop_actual)

    df.to_csv(out_path, index=False, encoding="utf-8")
    print(f"[OK] Saved cleaned observations to {out_path}, {df.shape[0]} rows, {df.shape[1]} cols.")

if __name__ == "__main__":
    clean_observations()
