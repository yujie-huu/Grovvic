# iteration3_backend.py
# Requirements: fastapi, uvicorn, sqlalchemy, psycopg2-binary, pydantic

from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, MetaData, Table, select, func, or_, and_, bindparam
import random

# ------------ Config ------------
DB_URL = "postgresql+psycopg2://gardener:netzeroTP08@localhost:5432/5120netzeroDB"
ALLOWED_ORIGINS = ["*"]

# ------------ App & DB ------------
app = FastAPI(title="ViGrow API Iteration 3 Core", version="3.0.3")

# enable CORS for all origins, needed by frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create SQLAlchemy engine with connection pooling
engine = create_engine(DB_URL, pool_pre_ping=True, pool_size=5, max_overflow=10, future=True)
metadata = MetaData()

# reflect database tables into ORM-like objects
companion = Table("epic3_companion_planting", metadata, autoload_with=engine)
overview = Table("epic7_plants_overview", metadata, autoload_with=engine)
gardens = Table("community_gardens", metadata, autoload_with=engine)
varieties = Table("variety_details", metadata, autoload_with=engine)
species_info = Table("species_information_dataset", metadata, autoload_with=engine)
relationships = Table("relationship_dataset", metadata, autoload_with=engine)
occurrences = Table("species_occurrences_cleaned", metadata, autoload_with=engine)

# ------------ Helpers ------------
def clean(v: Optional[str]) -> str:
    # helper: replace None or empty string with default message
    return "no information now" if v is None or str(v).strip() == "" else str(v).strip()

# ------------ Health Check ------------
@app.get("/health")
def health():
    # return service status and DB connection info
    return {"ok": True, "service": "iteration3", "db": "5120netzeroDB"}

@app.head("/health")
def health_head():
    # head request only needs empty response
    return {}

# ------------ Companion Planting ------------
@app.get("/companion/plants-all")
def list_all_unique_plants():
    with engine.connect() as conn:
        # query both plant and neighbour columns, then merge
        stmt = select(companion.c.plant).union(select(companion.c.neighbour))
        rows = conn.execute(stmt).scalars().all()
    # clean, deduplicate and sort result list
    cleaned = sorted(set(clean(r) for r in rows if r and clean(r).lower() != "all"))
    return cleaned

# ------------ Plants Overview ------------
@app.get("/plants/overview")
def get_plants_overview():
    with engine.connect() as conn:
        # select key fields about each plant for overview page
        stmt = (
            select(
                overview.c.plant_name,
                overview.c.type,
                overview.c.sunshine,
                overview.c.plant_spacing_cm,
                overview.c.hardiness
            )
            .order_by(overview.c.plant_name.asc())
        )
        rows = conn.execute(stmt).mappings().all()
    return [dict(r) for r in rows]

# ------------ Recommend Plants ------------
@app.post("/plants/recommend")
def recommend_plants(plants: List[str] = Body(..., embed=True)):
    if plants is None:
        # reject invalid request without plants field
        raise HTTPException(status_code=400, detail="Request body must include plants")
    # normalize input list: strip and lowercase
    in_set = {p.strip().lower() for p in plants if p and p.strip()}

    # fetch neighbours marked as "good" for "all" category
    with engine.connect() as conn:
        stmt = select(companion.c.neighbour).where(
            func.lower(companion.c.plant) == "all",
            func.lower(companion.c.good_or_bad) == "good"
        )
        all_rows = conn.execute(stmt).scalars().all()
    all_neighbours = [n for n in set(all_rows) if n]

    # helper: randomly pick fallback plants from global neighbour pool
    def pick_from_all(exclude_lower: set, need: int) -> List[str]:
        pool = [n for n in all_neighbours if n and n.lower() not in exclude_lower and n.lower() != "all"]
        random.shuffle(pool)
        return pool[:need]

    # fallback if no input provided or too many plants (>5)
    if not in_set or len(plants) > 5:
        picks = pick_from_all(in_set | {"all"}, 3)
        return {"input": plants, "fallback": True,
                "candidates": [{"plant_name": p, "good_count": 1} for p in picks]}

    good_counts: Dict[str, int] = {}  # dictionary counting good matches
    bad_set: set = set()              # set of explicitly bad matches
    all_hits = 0                      # count of generic "all" matches

    with engine.connect() as conn:
        for p in in_set:
            # query direct companions for this plant
            rows1 = conn.execute(
                select(companion.c.neighbour.label("other"), companion.c.good_or_bad)
                .where(func.lower(companion.c.plant) == p)
            ).mappings().all()
            # query reverse companions where plant is neighbour
            rows2 = conn.execute(
                select(companion.c.plant.label("other"), companion.c.good_or_bad)
                .where(func.lower(companion.c.neighbour) == p)
            ).mappings().all()

            # process results: update good_counts or bad_set
            for r in rows1 + rows2:
                other = (r["other"] or "").strip()
                if not other:
                    continue
                rel = (r["good_or_bad"] or "").lower()
                if rel == "bad":
                    bad_set.add(other.lower())
                elif rel == "good":
                    if other.lower() == "all":
                        all_hits += 1
                    else:
                        good_counts[other] = good_counts.get(other, 0) + 1

    # if there are "all" matches, increase counts for every neighbour
    if all_hits > 0:
        for n in all_neighbours:
            if n:
                good_counts[n] = good_counts.get(n, 0) + all_hits

    # filter candidates: exclude input plants, bad matches, and "all"
    filtered = [(name, cnt) for name, cnt in good_counts.items()
                if name and name.lower() not in in_set and name.lower() != "all" and name.lower() not in bad_set]
    # sort by count descending then name ascending
    filtered.sort(key=lambda x: (-x[1], x[0]))
    top = filtered[:3]

    # if fewer than 3 candidates, fill with random picks
    if len(top) < 3:
        already = {n.lower() for n, _ in top} | in_set | bad_set | {"all"}
        needed = 3 - len(top)
        fills = pick_from_all(already, needed)
        for f in fills:
            top.append((f, max(1, good_counts.get(f, 1))))
    top = top[:3]

    return {"input": plants, "fallback": False,
            "candidates": [{"plant_name": n, "good_count": c} for n, c in top]}

# ------------ Filter Plants ------------
@app.post("/plants/filter")
def filter_plants(body: dict = Body(...)):
    # read filter options from request body
    season = (body.get("season") or "").strip()
    type_ = (body.get("type") or "").strip()
    spacing = (body.get("spacing") or "").strip()
    hardiness = (body.get("hardiness") or "").strip()
    sunshine = (body.get("sunshine") or "").strip()

    # base query selecting overview fields
    stmt = select(
        overview.c.plant_name,
        overview.c.type,
        overview.c.sunshine,
        overview.c.plant_spacing_cm,
        overview.c.hardiness,
        overview.c.seasons
    )
    conds = []  # dynamic list of filter conditions

    if season and season.lower() != "all season":
        conds.append(func.any(overview.c.seasons) == season)

    if type_:
        conds.append(overview.c.type == type_)

    if spacing:
        try:
            if spacing == ">= 80":
                conds.append(overview.c.plant_spacing_cm >= 80)
            else:
                val = int(spacing.replace("cm", "").strip())
                conds.append(overview.c.plant_spacing_cm == val)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid spacing value")

    if hardiness:
        conds.append(overview.c.hardiness == hardiness)

    if sunshine and sunshine.lower() != "all":
        s = sunshine.lower()
        # sunshine filter uses case-insensitive LIKE patterns
        if s == "full sun":
            conds.append(or_(
                func.lower(overview.c.sunshine).like("%full sun%"),
                func.lower(overview.c.sunshine).like("%full or part sun%"),
                func.lower(overview.c.sunshine).like("%part or full sun%")
            ))
        elif s == "part sun":
            conds.append(or_(
                func.lower(overview.c.sunshine).like("%part sun%"),
                func.lower(overview.c.sunshine).like("%full or part sun%"),
                func.lower(overview.c.sunshine).like("%part or full sun%")
            ))
        elif s == "part shade":
            conds.append(or_(
                func.lower(overview.c.sunshine).like("%part shade%"),
                func.lower(overview.c.sunshine).like("%shade or sun%"),
                func.lower(overview.c.sunshine).like("%sun or shade%")
            ))
        elif s == "full shade":
            conds.append(func.lower(overview.c.sunshine).like("%full shade%"))
        else:
            raise HTTPException(status_code=400, detail="Invalid sunshine value")

    # apply all filter conditions if present
    if conds:
        stmt = stmt.where(and_(*conds))

    stmt = stmt.order_by(overview.c.plant_name.asc())
    with engine.connect() as conn:
        rows = conn.execute(stmt).mappings().all()
    return [dict(r) for r in rows]

# ------------ Community Gardens ------------
@app.get("/community/gardens")
def get_all_community_gardens():
    with engine.connect() as conn:
        # select id, name, address and coordinates of gardens
        stmt = select(
            gardens.c.id, gardens.c.name, gardens.c.address,
            gardens.c.lat, gardens.c.lng
        ).order_by(gardens.c.id.asc())
        rows = conn.execute(stmt).mappings().all()
    return [dict(r) for r in rows]

# ------------ Count Relations ------------
@app.post("/plants/good-relations/count")
def count_relations(plants: List[str] = Body(..., embed=True)):
    if not plants:
        raise HTTPException(status_code=400, detail="No plants provided")

    in_set = {p.strip().lower() for p in plants if p and p.strip()}
    if not in_set:
        raise HTTPException(status_code=400, detail="No valid plant names provided")

    # query relations among the given set of plants
    stmt = (
        select(companion.c.plant, companion.c.neighbour, companion.c.good_or_bad, companion.c.why)
        .where(
            func.lower(companion.c.good_or_bad).in_(["good", "bad"]),
            func.lower(companion.c.plant).in_(bindparam("plants", expanding=True)),
            func.lower(companion.c.neighbour).in_(bindparam("plants", expanding=True)),
        )
        .order_by(companion.c.plant.asc(), companion.c.neighbour.asc())
    )

    with engine.connect() as conn:
        rows = conn.execute(stmt, {"plants": list(in_set)}).mappings().all()

    good_list, bad_list = [], []
    for r in rows:
        rel = (r["good_or_bad"] or "").lower()
        item = {"plant": r["plant"] or "", "neighbour": r["neighbour"] or "",
                "relation": rel, "reason": (r["why"] or "").strip()}
        if rel == "good":
            good_list.append(item)
        elif rel == "bad":
            bad_list.append(item)

    return {"input": plants,
            "good_relation_count": len(good_list), "good_relations": good_list,
            "bad_relation_count": len(bad_list), "bad_relations": bad_list}

# ------------ Animals by Plants ------------
@app.post("/species/animals/by-plants")
def animals_by_plants(plants: List[str] = Body(..., embed=True)):
    if not plants:
        raise HTTPException(status_code=400, detail="No plants provided")

    lower_plants = [p.lower() for p in plants]

    with engine.connect() as conn:
        # step1: query variety_details for botanical names
        stmt_varieties = (
            select(varieties.c.plant_name, varieties.c.overview)
            .where(func.lower(varieties.c.plant_name).in_(bindparam("plants", expanding=True)))
        )
        rows = conn.execute(stmt_varieties, {"plants": lower_plants}).mappings().all()

        scientific_names = set()
        for r in rows:
            overview_text = r["overview"] or ""
            if "Botanical name:" in overview_text:
                sci = overview_text.split("Botanical name:")[1].split(",")[0].strip()
                if sci:
                    scientific_names.add(sci)

        if not scientific_names:
            return {"input": plants, "animals": [], "summary": {"animals": 0, "pollinators": 0, "pests_and_weeds": 0}}

        # step2: query relationships for animals linked to plants
        stmt_rel = (
            select(relationships.c.animal_taxon_name)
            .where(func.lower(relationships.c.plant_scientific_name).in_(bindparam("sci", expanding=True)))
        )
        rel_rows = conn.execute(stmt_rel, {"sci": [s.lower() for s in scientific_names]}).mappings().all()
        animals = {r["animal_taxon_name"] for r in rel_rows if r["animal_taxon_name"]}

        if not animals:
            return {"input": plants, "animals": [], "summary": {"animals": 0, "pollinators": 0, "pests_and_weeds": 0}}

        # step3: query species_information_dataset for animal details
        stmt_info = (
            select(
                species_info.c.animal_taxon_name,
                species_info.c["Vernacular Name"].label("vernacular_name"),
                species_info.c.Kingdom,
                species_info.c.Phylum,
                species_info.c.Class,
                species_info.c.Order,
                species_info.c.Family,
                species_info.c.Genus,
                species_info.c.image_url,
                species_info.c["Number of Records"],
                species_info.c["EPBC Act Threatened Species"],
                species_info.c["Weeds of National Significance (WoNS) as at Feb. 2013"].label("wons"),
                species_info.c["VIC State Notifiable Pests"].label("vic_pests")
            )
            .where(func.lower(species_info.c.animal_taxon_name).in_(bindparam("animals", expanding=True)))
        )
        info_rows = conn.execute(stmt_info, {"animals": [a.lower() for a in animals]}).mappings().all()

    # prepare final result and counters
    result, counts = [], {"animals": 0, "pollinators": 0, "pests_and_weeds": 0}
    for r in info_rows:
        is_animal = (r["Kingdom"] or "").lower() == "animalia"
        is_pollinator = False
        is_pest_or_weed = (str(r["wons"]).upper() == "Y") or (str(r["vic_pests"]).upper() == "Y")

        result.append({
            "animal_taxon_name": r["animal_taxon_name"],
            "vernacular_name": r["vernacular_name"],
            "kingdom": r["Kingdom"],
            "order": r["Order"],
            "family": r["Family"],
            "genus": r["Genus"],
            "image_url": r["image_url"],
            "records": r["Number of Records"],
            "is_animal": is_animal,
            "is_pollinator": "T" if is_pollinator else "F",
            "is_pest_or_weed": "T" if is_pest_or_weed else "F",
        })

        if is_animal:
            counts["animals"] += 1
        if is_pest_or_weed:
            counts["pests_and_weeds"] += 1

    return {"input": plants, "animals": result, "summary": counts}

