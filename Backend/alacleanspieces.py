# clean_non_animal_and_sync.py
# Overwrite three CSVs in place:
#   - species_information_dataset.csv
#   - relationship_dataset.csv
#   - species_occurrences_cleaned.csv
# Rule: if BOTH "Weeds of National Significance ..." and "VIC State Notifiable Pests"
#       are blank AND Kingdom in {Plantae,Bacteria,Chromista,Fungi,Protista,Virus},
#       drop the species from species_information; then remove the same species
#       from relationship and occurrences datasets.

import pandas as pd
from pathlib import Path

# ---- file names (kept the same) ----
SPECIES_CSV = Path("species_information_dataset.csv")
REL_CSV     = Path("relationship_dataset.csv")
OBS_CSV     = Path("species_occurrences_cleaned.csv")

# ---- parameters ----
NON_ANIMAL_KINGDOMS = {"plantae","bacteria","chromista","fungi","protista","virus"}

# ---- helpers ----
def _find_col(cols, needle):
    """Case-insensitive exact match for a column; return real name or None."""
    low = {c.lower(): c for c in cols}
    return low.get(needle.lower())

def _find_col_contains(cols, substring):
    """Case-insensitive 'contains' search to be robust to long column names."""
    for c in cols:
        if substring.lower() in c.lower():
            return c
    return None

def main():
    # ---------- load species info ----------
    sp = pd.read_csv(SPECIES_CSV)
    # required columns
    col_animal = _find_col(sp.columns, "animal_taxon_name")
    col_king   = _find_col(sp.columns, "Kingdom")
    if not col_animal or not col_king:
        raise SystemExit("species_information_dataset.csv must contain 'animal_taxon_name' and 'Kingdom'.")

    # fuzzy find the two flag columns (names can be long)
    col_weeds = _find_col_contains(sp.columns, "Weeds of National Significance")
    col_vicnp = _find_col_contains(sp.columns, "VIC State Notifiable Pests")
    if not col_weeds or not col_vicnp:
        raise SystemExit("Cannot find 'Weeds of National Significance ...' and/or 'VIC State Notifiable Pests' columns.")

    # build mask: both flags blank AND kingdom in the non-animal list
    weeds_blank = sp[col_weeds].fillna("").astype(str).str.strip().eq("")
    vicnp_blank = sp[col_vicnp].fillna("").astype(str).str.strip().eq("")
    kingdom_is_non_animal = sp[col_king].fillna("").str.strip().str.lower().isin(NON_ANIMAL_KINGDOMS)

    drop_mask = weeds_blank & vicnp_blank & kingdom_is_non_animal
    to_drop = sp.loc[drop_mask, col_animal].dropna().astype(str).str.strip().unique().tolist()

    print(f"[species] total={len(sp)} | remove(non-animal & no flags)={len(to_drop)}")
    # keep the rest
    sp_kept = sp.loc[~sp[col_animal].isin(to_drop)].copy()
    # overwrite file
    sp_kept.to_csv(SPECIES_CSV, index=False)
    print(f"[species] wrote -> {SPECIES_CSV} | kept={len(sp_kept)}")

    # ---------- sync remove in relationship ----------
    rel = pd.read_csv(REL_CSV)
    rel_animal = _find_col(rel.columns, "animal_taxon_name")
    if not rel_animal:
        # be tolerant to a common variant
        rel_animal = _find_col(rel.columns, "animal_taxon_name_x") or _find_col(rel.columns, "animal_taxon_name_y")
    if not rel_animal:
        raise SystemExit("relationship_dataset.csv must contain 'animal_taxon_name' (or *_x/_y).")

    before_rel = len(rel)
    rel_kept = rel.loc[~rel[rel_animal].astype(str).str.strip().isin(to_drop)].copy()
    print(f"[relation] total={before_rel} | removed={before_rel - len(rel_kept)}")
    rel_kept.to_csv(REL_CSV, index=False)
    print(f"[relation] wrote -> {REL_CSV} | kept={len(rel_kept)}")

    # ---------- sync remove in occurrences ----------
    obs = pd.read_csv(OBS_CSV)
    obs_animal = _find_col(obs.columns, "animal_taxon_name")
    if not obs_animal:
        raise SystemExit("species_occurrences_cleaned.csv must contain 'animal_taxon_name'.")

    before_obs = len(obs)
    obs_kept = obs.loc[~obs[obs_animal].astype(str).str.strip().isin(to_drop)].copy()
    print(f"[occurrences] total={before_obs} | removed={before_obs - len(obs_kept)}")
    obs_kept.to_csv(OBS_CSV, index=False)
    print(f"[occurrences] wrote -> {OBS_CSV} | kept={len(obs_kept)}")

    # ---------- summary ----------
    print(f"[done] species removed: {len(to_drop)}")
    if len(to_drop) <= 20:
        print("  e.g.", to_drop[:20])

if __name__ == "__main__":
    main()
