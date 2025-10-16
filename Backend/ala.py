import pandas as pd

# ---------------- I/O ----------------
df1 = pd.read_csv("plant_animal_interactions.csv")
df2 = pd.read_csv("checklist-2025-09-13.csv")

# ---------------- Clean df1 ----------------
# Drop rows where plant and animal names are identical (case-insensitive)
df1 = df1[
    df1["plant_scientific_name"].astype(str).str.strip().str.lower()
    != df1["animal_taxon_name"].astype(str).str.strip().str.lower()
]

# Drop rows with very long animal names (> 80 chars)
df1 = df1[df1["animal_taxon_name"].astype(str).str.len() <= 80]

# --- NEW: dedup within hostOf/hasHost by identical (plant, animal) pair,
#          then normalize kept relation to "has Host"
inter_col = "interaction_type_raw" if "interaction_type_raw" in df1.columns else "interaction_type"
if inter_col in df1.columns:
    inter_norm = df1[inter_col].astype(str).str.strip().str.lower()
    host_mask = inter_norm.isin(["hostof", "hashost", "has host"])
    if host_mask.any():
        # normalized pair
        df1["_p"] = df1["plant_scientific_name"].astype(str).str.strip().str.lower()
        df1["_a"] = df1["animal_taxon_name"].astype(str).str.strip().str.lower()

        # keep first per (plant, animal) inside hostOf/hasHost
        keep_idx = (
            df1.loc[host_mask]
            .drop_duplicates(subset=["_p", "_a"], keep="first")
            .index
        )

        # recombine: non-host rows + deduped host rows
        df1 = pd.concat([df1.loc[~host_mask], df1.loc[keep_idx]], ignore_index=True)

        # standardize relation text
        inter_norm2 = df1[inter_col].astype(str).str.strip().str.lower()
        host_mask2 = inter_norm2.isin(["hostof", "hashost", "has host"])
        df1.loc[host_mask2, inter_col] = "has Host"

        # cleanup helpers
        df1 = df1.drop(columns=[c for c in ["_p", "_a"] if c in df1.columns])

# ---------------- Prepare df2 ----------------
keep_cols = [
    "Species","Species Name","Scientific Name Authorship",
    "Taxon Rank","Kingdom","Phylum","Class","Order","Family","Genus",
    "Vernacular Name","Number of records"
]
df2 = df2[keep_cols].rename(columns={"Species Name": "animal_taxon_name"})

# ---------------- Merge (case-insensitive on animal name) ----------------
df1["animal_taxon_name_lower"] = df1["animal_taxon_name"].astype(str).str.strip().str.lower()
df2["animal_taxon_name_lower"] = df2["animal_taxon_name"].astype(str).str.strip().str.lower()

merged = pd.merge(df1, df2, on="animal_taxon_name_lower", how="inner")

# Drop helper col
merged = merged.drop(columns=["animal_taxon_name_lower"])

# ---------------- Save ----------------
merged.to_csv("filtered_merged.csv", index=False, encoding="utf-8")
print(f"Done! {len(merged)} rows saved to filtered_merged.csv")