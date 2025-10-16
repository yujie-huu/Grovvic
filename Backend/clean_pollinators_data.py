import csv
import re
from pathlib import Path

INPUT = "pollinators_by_plant.csv"
OUTPUT = "pollinators_by_plant_clean.csv"
REPORT = "qa_report.txt"

# Terms that are higher taxonomic ranks or obvious noise; compared in lowercase.
HIGHER_TAXA_OR_NOISE = {
    # Kingdom/Phylum/Class/Order/Family/Superfamily/Subfamily, etc.
    "animalia","arthropoda","insecta","hymenoptera","lepidoptera","coleoptera",
    "diptera","apoidea","syrphidae","halictidae","bombus sp.","bombus cf lucorum sl",
    # Noisy placeholders
    "self pollinated","self-pollinated","unknown","unidentified","non identified bee",
    "solitary bees","solitary_bees","hoverfly unknown or unidentified",
    "coleoptera unknown or unidentified","unidentified sp1 m_pl_015",
    "unidentified sp2 m_pl_036","unidentified sp3 m_pl_015","unidentified sp3 m_pl_018",
    "unidentified sp3 m_pl_043","unidentified sp8 m_pl_017","unidentified sp15 m_pl_043",
    "unidentified sp20 m_pl_018","unidentified sp35 m_pl_058","unidentified sp36 m_pl_017",
    "unidentified sp41 m_pl_058","unidentified sp43 m_pl_017","unidentified sp49 m_pl_058",
    "unidentified sp51 m_pl_058","unidentified sp55 m_pl_058","unidentified sp59 m_pl_058",
}

# Common pollinator genera to KEEP even if only genus-level is given (capitalization-sensitive).
GENUS_WHITELIST = {
    "Apis","Bombus","Lasioglossum","Andrena","Osmia","Megachile","Xylocopa","Hylaeus",
    "Halictus","Eucera","Nomada","Anthophora","Melitta","Colletes","Ceratina","Anthidium",
    "Augochlora","Augochlorella","Augochloropsis","Exomalopsis","Eristalis","Eristalinus",
    "Syrphus","Scaeva","Rhingia","Eupeodes","Sphaerophoria","Platycheirus","Paratrigona",
    "Trigona","Tetragona","Polistes","Vespula","Pepsis","Amegilla","Prosopis","Tetralonia",
}

# Accepts Genus species [subspecies], e.g., "Apis mellifera", "Bombus terrestris dalmatinus"
BINOMIAL_RE = re.compile(r"^[A-Z][a-z]+(?:\s+[a-z\-]+){1,2}$")

def split_list(cell: str):
    """Split a comma-separated pollinator string into a list, trimming whitespace."""
    if not cell:
        return []
    parts = [p.strip() for p in cell.split(",")]
    return [p for p in parts if p]

def is_noise(name: str) -> bool:
    """Return True if the name is clearly noise (unknown/unidentified/etc.)."""
    n = name.strip().lower()
    return n in HIGHER_TAXA_OR_NOISE or " unknown" in n or " unidentified" in n

def is_higher_taxon(name: str) -> bool:
    """
    Heuristic for higher taxonomic ranks (to be discarded):
      - single lowercase word (often family/order/common “bucket”)
      - endings typical of higher ranks: -idae (family), -oidea (superfamily), -inae (subfamily)
      - explicitly listed in HIGHER_TAXA_OR_NOISE
    """
    n = name.strip()
    ln = n.lower()
    if ln in HIGHER_TAXA_OR_NOISE:
        return True
    if " " not in n and n.islower():
        return True
    if ln.endswith(("idae","oidea","inae")):
        return True
    return False

def clean_for_row(plant: str, pollis: list, all_plants: set):
    """Clean one row’s pollinator list with the rules described above."""
    cleaned = []
    seen = set()
    for raw in pollis:
        name = " ".join(raw.split())  # normalize spaces
        if not name:
            continue
        # Drop the plant itself, and drop any other plant names from the first column
        if name == plant or name in all_plants:
            continue
        # Remove obvious noise
        if is_noise(name):
            continue
        # Keep binomials/trinomials
        if BINOMIAL_RE.match(name):
            pass
        else:
            # Or allow common pollinator genera
            if name in GENUS_WHITELIST:
                pass
            else:
                # Otherwise discard if it looks like a higher taxon/general bucket
                if is_higher_taxon(name):
                    continue
        # Deduplicate while preserving order
        if name not in seen:
            seen.add(name)
            cleaned.append(name)
    return cleaned

def main():
    src = Path(INPUT)
    if not src.exists():
        raise SystemExit(f"Input file not found: {INPUT}")

    rows = []
    all_plants = set()

    # Load entire CSV first and collect the set of all plant names
    with open(INPUT, "r", encoding="utf-8", newline="") as f:
        r = csv.DictReader(f)
        if "plant_scientific_name" not in r.fieldnames or "pollinators" not in r.fieldnames:
            raise SystemExit("CSV must contain columns: plant_scientific_name and pollinators")
        for row in r:
            plant = (row["plant_scientific_name"] or "").strip()
            polli = row.get("pollinators","")
            rows.append((plant, polli))
            if plant:
                all_plants.add(plant)

    total = len(rows)
    empty_before = 0
    empty_after = 0
    kept_counts = []

    # Write cleaned CSV
    with open(OUTPUT, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["plant_scientific_name","pollinators"])
        for plant, polli_cell in rows:
            original = split_list(polli_cell)
            if not original:
                empty_before += 1
            cleaned = clean_for_row(plant, original, all_plants)
            if not cleaned:
                empty_after += 1
            kept_counts.append(len(cleaned))
            w.writerow([plant, ", ".join(cleaned)])

    # Simple QA report
    with open(REPORT, "w", encoding="utf-8") as f:
        f.write(f"Total rows: {total}\n")
        f.write(f"Original empty pollinator rows: {empty_before}\n")
        f.write(f"Empty rows after cleaning: {empty_after}\n")
        if kept_counts:
            nonzero = [c for c in kept_counts if c > 0]
            avg_all = sum(kept_counts)/len(kept_counts)
            avg_nonzero = (sum(nonzero)/len(nonzero)) if nonzero else 0.0
            f.write(f"Avg pollinators per plant (all rows): {avg_all:.2f}\n")
            f.write(f"Avg pollinators per plant (non-empty rows): {avg_nonzero:.2f}\n")

    print(f"Done ✅  Wrote: {OUTPUT}")
    print(f"QA report: {REPORT}")

if __name__ == "__main__":
    main()