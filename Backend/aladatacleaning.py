# Outputs:
#   1) relationship_dataset.csv  – normalized interactions, deduped
#   2) species_information_dataset.csv – per animal, joined with checklist + image/summary, filtered

import pandas as pd
from pathlib import Path

# ---- input files ----
FILTERED_MERGED = "filtered_merged.csv"
CHECKLIST = "checklist-2025-09-13.csv"
IMAGES = "ala_animal_images.csv"

# ---- output files ----
OUT_REL = "relationship_dataset.csv"
OUT_SPECIES = "species_information_dataset.csv"

# ---- small helpers ----
def normalize_space(s: pd.Series) -> pd.Series:
    """Trim and collapse inner spaces; keep original case."""
    return s.astype(str).str.replace(r"\s+", " ", regex=True).str.strip()

def canonical_interaction(s: pd.Series) -> pd.Series:
    """Map same-meaning interactions to a canonical label."""
    mapping = {
        # visits
        "visitedby": "visits",
        "flowersvisitedby": "visits",
        "visitsflowersof": "visits",
        "visits": "visits",
        # trophic
        "eatenby": "eatenBy",
        "preyeduponby": "eatenBy",
        # pollination
        "pollinatedby": "pollinatedBy",
        "pollinates": "pollinatedBy",
        # parasite / pathogen
        "hasparasite": "hasParasite",
        "parasiteof": "hasParasite",
        "haspathogen": "hasPathogen",
        "pathogenof": "hasPathogen",
        # oviposition
        "haseggslayedonby": "laysEggsOn",
        "layseggson": "laysEggsOn",
        # host synonyms 
        "hostof": "hasHost",
        "hashost": "hasHost",
    }
    key = s.astype(str).str.replace(r"\s+", "", regex=True).str.lower()
    return key.map(mapping).fillna(s)

def is_extinct(val: str) -> bool:
    """Detect 'Extinct' anywhere in the phrase (case-insensitive)."""
    return isinstance(val, str) and ("extinct" in val.lower())

# ---- 1) relationship dataset ----
def build_relationships():
    df = pd.read_csv(FILTERED_MERGED)

    # decide animal column name
    animal_col = "animal_taxon_name_y" if "animal_taxon_name_y" in df.columns else \
                 "animal_taxon_name_x" if "animal_taxon_name_x" in df.columns else \
                 "animal_taxon_name"

    rel = df[["plant_scientific_name", animal_col, "interaction_type_raw"]].copy()
    rel = rel.rename(columns={animal_col: "animal_taxon_name"})
    rel["animal_taxon_name"] = normalize_space(rel["animal_taxon_name"])

    # canonicalize & dedupe
    rel["interaction_type_raw"] = canonical_interaction(rel["interaction_type_raw"])
    rel = rel.drop_duplicates(subset=["plant_scientific_name", "animal_taxon_name", "interaction_type_raw"])

    rel.to_csv(OUT_REL, index=False, encoding="utf-8")
    print(f"[OK] {OUT_REL}: {len(rel)} rows")

# ---- 2) species information dataset ----
def build_species_info():
    fm = pd.read_csv(FILTERED_MERGED)
    ck = pd.read_csv(CHECKLIST)
    img = pd.read_csv(IMAGES)

    # choose animal column in filtered_merged
    animal_col = "animal_taxon_name_y" if "animal_taxon_name_y" in fm.columns else \
                 "animal_taxon_name_x" if "animal_taxon_name_x" in fm.columns else \
                 "animal_taxon_name"

    # normalize keys
    fm["animal_taxon_name"] = normalize_space(fm[animal_col])
    img["animal_taxon_name"] = normalize_space(img["animal_taxon_name"])

    # columns we want from filtered_merged as base
    base_cols = [
        "animal_taxon_name", "Species", "Kingdom", "Phylum", "Class", "Order",
        "Family", "Genus", "Vernacular Name", "Number of records"
    ]
    base_cols = [c for c in base_cols if c in fm.columns]
    sp = fm[base_cols].drop_duplicates(subset=["animal_taxon_name"]).copy()
    sp = sp.rename(columns={"Number of records": "Number of Records"})

    # pull selected columns from checklist for statuses (join by 'Species' URL if present)
    ck_needed = [
        "Species",  # AFD URL key
        "Victoria : Conservation Status",
        "EPBC Act Threatened Species",
        "Weeds of National Significance (WoNS) as at Feb. 2013",
        "VIC State Notifiable Pests",
    ]
    cols_exist = [c for c in ck_needed if c in ck.columns]
    if cols_exist:
        ck_part = ck[cols_exist].copy()
        if "Species" in sp.columns and "Species" in ck_part.columns:
            sp = sp.merge(ck_part, on="Species", how="left")
        else:
            # fallback join by species name if URL missing
            if "Species Name" in ck.columns:
                ck_part = ck_part.join(ck["Species Name"])
                sp = sp.merge(ck_part, left_on="animal_taxon_name", right_on="Species Name", how="left").drop(columns=["Species Name"])
    else:
        # ensure columns exist even if checklist lacks them
        sp["Victoria : Conservation Status"] = ""
        sp["EPBC Act Threatened Species"] = ""
        sp["Weeds of National Significance (WoNS) as at Feb. 2013"] = ""
        sp["VIC State Notifiable Pests"] = ""

    # add image + summary
    sp = sp.merge(img, on="animal_taxon_name", how="left")

    # drop rows with no image
    sp = sp[sp["image_url"].notna() & (sp["image_url"].astype(str).str.strip() != "") & (sp["image_url"] != "NA")]

    # drop kingdom group if both WoNS & VIC pests blank
    wons = "Weeds of National Significance (WoNS) as at Feb. 2013"
    vicp = "VIC State Notifiable Pests"
    for col in [wons, vicp]:
        if col not in sp.columns:
            sp[col] = ""
    both_blank = (sp[wons].astype(str).str.strip() == "") & (sp[vicp].astype(str).str.strip() == "")
    drop_kingdoms = {"Plantae", "Bacteria", "Chromista", "Fungi", "Protista", "Virus"}
    if "Kingdom" in sp.columns:
        sp = sp[~(both_blank & sp["Kingdom"].isin(drop_kingdoms))]

    # remove Extinct
    vic_col = "Victoria : Conservation Status" if "Victoria : Conservation Status" in sp.columns else None
    epbc_col = "EPBC Act Threatened Species" if "EPBC Act Threatened Species" in sp.columns else None
    extinct_mask = pd.Series(False, index=sp.index)
    if vic_col:
        extinct_mask |= sp[vic_col].apply(is_extinct)
    if epbc_col:
        extinct_mask |= sp[epbc_col].apply(is_extinct)
    sp = sp[~extinct_mask]

    # reorder columns nicely
    ordered = [
        "animal_taxon_name", "Species", "Kingdom", "Phylum", "Class", "Order",
        "Family", "Genus", "Vernacular Name", "Number of Records",
        "Victoria : Conservation Status", "EPBC Act Threatened Species",
        "Weeds of National Significance (WoNS) as at Feb. 2013",
        "VIC State Notifiable Pests",
        "image_url", "summary",
    ]
    final_cols = [c for c in ordered if c in sp.columns] + [c for c in sp.columns if c not in ordered]
    sp = sp[final_cols]

    sp.to_csv(OUT_SPECIES, index=False, encoding="utf-8")
    print(f"[OK] {OUT_SPECIES}: {len(sp)} rows")

# ---- run ----
if __name__ == "__main__":
    for p in [FILTERED_MERGED, CHECKLIST, IMAGES]:
        if not Path(p).exists():
            print(f"[WARN] Missing file: {p}")
    build_relationships()
    build_species_info()
