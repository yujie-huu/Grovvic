# iteration2_backend.py
# Requirements fastapi uvicorn sqlalchemy psycopg2-binary pydantic

from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import (
    create_engine, MetaData, Table, select, func, asc, and_,
    case, or_, cast, Date
)
from sqlalchemy.sql import literal_column

# configure connection string for PostgreSQL database
DB_URL = "postgresql+psycopg2://gardener:netzeroTP08@localhost:5432/5120netzeroDB"

# define allowed origins for CORS policy
ALLOWED_ORIGINS = ["*"]

# create FastAPI application instance with title and version
app = FastAPI(title="ViGrow API Iteration 2 Core", version="2.2.1")

# enable cross origin resource sharing for all routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# initialize sqlalchemy engine and database metadata reflection
engine = create_engine(DB_URL, pool_pre_ping=True, pool_size=5, max_overflow=10, future=True)
metadata = MetaData()

# reflect required tables from the database schema
companion = Table("epic3_companion_planting", metadata, autoload_with=engine)
varieties = Table("variety_details", metadata, autoload_with=engine)
species_info = Table("species_information_dataset", metadata, autoload_with=engine)
relationships = Table("relationship_dataset", metadata, autoload_with=engine)
occurrences = Table("species_occurrences_cleaned", metadata, autoload_with=engine)

# replace null or empty values with safe placeholder
def clean(v: Optional[str]) -> str:
    return "no information now" if v is None or str(v).strip() == "" else str(v).strip()

# parse bounding box string into numeric float coordinates
def _parse_bbox(bbox: Optional[str]):
    if not bbox:
        return None
    parts = bbox.split(",")
    if len(parts) != 4:
        raise HTTPException(status_code=400, detail="bbox must be minLon,minLat,maxLon,maxLat")
    try:
        return tuple(map(float, parts))
    except Exception:
        raise HTTPException(status_code=400, detail="bbox values must be floats")

# helper function to convert string with digits into integer
def _to_int(val: Any) -> int:
    s = "" if val is None else str(val)
    digits = "".join(ch for ch in s if ch.isdigit())
    return int(digits) if digits else 0

# Pydantic models for structured API responses
class CompanionRow(BaseModel):
    plant: str
    neighbour: str
    good_or_bad: str
    why: str
    neighbour_image_url: Optional[str] = None

class CompanionBrief(BaseModel):
    neighbour: str
    good_or_bad: str
    why: str
    neighbour_image_url: Optional[str] = None

class InteractionRow(BaseModel):
    plant_scientific_name: str
    animal_taxon_name: str
    interaction_type_raw: str

class InteractionRowWithImage(InteractionRow):
    plant_image_url: Optional[str] = None
    animal_vernacular_name: Optional[str] = None
    plant_common_name: Optional[str] = None

class Occurrence(BaseModel):
    animal_taxon_name: str
    decimalLatitude: Optional[float] = None
    decimalLongitude: Optional[float] = None
    eventDate: Optional[str] = None

# health check endpoints used for monitoring and testing
@app.get("/health")
def health():
    return {"ok": True, "service": "iteration2", "db": "5120netzeroDB"}

@app.head("/health")
def health_head():
    return {}

# list companion planting rows with multiple optional filters
@app.get("/companion", response_model=List[CompanionRow])
def list_companions(
    plant: Optional[str] = Query(None),
    neighbour: Optional[str] = Query(None),
    good_or_bad: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    with engine.connect() as conn:
        # lateral subquery fetches image url for neighbour plant
        subq = (
            select(varieties.c.image_url)
            .where(
                varieties.c.image_url.isnot(None),
                varieties.c.image_url != "",
                func.lower(varieties.c.plant_name) == func.lower(companion.c.neighbour),
            )
            .order_by(varieties.c.id.asc()).limit(1).lateral()
        )
        # build main query to select from companion table with join
        stmt = (
            select(
                companion.c.plant,
                companion.c.neighbour,
                companion.c.good_or_bad,
                func.coalesce(companion.c.why, "").label("why"),
                func.coalesce(subq.c.image_url, "nan").label("neighbour_image_url"),
            )
            .select_from(companion)
            .outerjoin(subq, literal_column("TRUE"))
            .order_by(companion.c.plant.asc(), companion.c.neighbour.asc())
            .limit(limit).offset(offset)
        )
        # apply optional filters for plant neighbour or type
        if plant:
            stmt = stmt.where(companion.c.plant.ilike(f"%{plant}%"))
        if neighbour:
            stmt = stmt.where(companion.c.neighbour.ilike(f"%{neighbour}%"))
        if good_or_bad:
            stmt = stmt.where(companion.c.good_or_bad.ilike(f"%{good_or_bad}%"))
        rows = conn.execute(stmt).mappings().all()
        return [dict(r) for r in rows]

# retrieve all neighbours associated with one given plant
@app.get("/companion/plant/{plant}", response_model=List[CompanionBrief])
def companions_of_plant(plant: str):
    with engine.connect() as conn:
        # lateral subquery returns image url for neighbour
        subq = (
            select(varieties.c.image_url)
            .where(
                varieties.c.image_url.isnot(None),
                varieties.c.image_url != "",
                func.lower(varieties.c.plant_name) == func.lower(companion.c.neighbour),
            )
            .order_by(varieties.c.id.asc()).limit(1).lateral()
        )
        # main query selects all neighbour rows for the given plant
        stmt = (
            select(
                companion.c.neighbour,
                companion.c.good_or_bad,
                func.coalesce(companion.c.why, "").label("why"),
                func.coalesce(subq.c.image_url, "nan").label("neighbour_image_url"),
            )
            .select_from(companion)
            .outerjoin(subq, literal_column("TRUE"))
            .where(func.lower(companion.c.plant) == plant.lower())
            .order_by(companion.c.neighbour.asc())
        )
        rows = conn.execute(stmt).mappings().all()
        if not rows:
            raise HTTPException(status_code=404, detail="Plant not found")
        return [dict(r) for r in rows]

# return a distinct list of plants from companion table
@app.get("/companion/plants", response_model=List[str])
def distinct_plants():
    with engine.connect() as conn:
        stmt = select(func.distinct(companion.c.plant)).select_from(companion).order_by(companion.c.plant.asc())
        rows = conn.execute(stmt).scalars().all()
        return [clean(x) for x in rows]

# list all animals with minimal fields like name image records
@app.get("/species/animals")
def list_animals_minimal():
    with engine.connect() as conn:
        # build query for animal name image and record count
        stmt = (
            select(
                species_info.c.animal_taxon_name,
                species_info.c.image_url,
                species_info.c["Number of Records"].label("number_of_records_text"),
                func.coalesce(species_info.c["Vernacular Name"], "nan").label("vernacular_name"),
            )
            .select_from(species_info)
            .order_by(species_info.c.animal_taxon_name.asc())
        )
        rows = conn.execute(stmt).mappings().all()
        # convert number of records into integer form
        return [
            {
                "animal_taxon_name": r["animal_taxon_name"],
                "image_url": r["image_url"],
                "number_of_records": _to_int(r["number_of_records_text"]),
                "vernacular_name": r["vernacular_name"],
            }
            for r in rows
        ]

# fetch detailed animal information given scientific name
@app.get("/species/animal/{animal}")
def get_animal_info(animal: str):
    with engine.connect() as conn:
        # select entire row from species info table
        stmt = (
            select(species_info)
            .select_from(species_info)
            .where(func.lower(species_info.c.animal_taxon_name) == animal.lower())
            .limit(1)
        )
        row = conn.execute(stmt).mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="Animal not found")
        raw = dict(row)
        # format response dictionary with cleaned fields
        return {
            "animal_taxon_name": raw.get("animal_taxon_name"),
            "kingdom": raw.get("Kingdom"),
            "phylum": raw.get("Phylum"),
            "class_": raw.get("Class"),
            "order_": raw.get("Order"),
            "family": raw.get("Family"),
            "genus": raw.get("Genus"),
            "vernacular_name": raw.get("Vernacular Name"),
            "number_of_records": _to_int(raw.get("Number of Records")),
            "victoria_conservation_status": raw.get("Victoria : Conservation Status"),
            "epbc_act_threatened_species": raw.get("EPBC Act Threatened Species"),
            "wons": raw.get("Weeds of National Significance (WoNS) as at Feb. 2013"),
            "vic_state_notifiable_pests": raw.get("VIC State Notifiable Pests"),
            "image_url": raw.get("image_url"),
            "summary": raw.get("summary"),
        }

# get all relations where animal is specified
@app.get("/relations/by-animal", response_model=List[InteractionRowWithImage])
def relations_by_animal(animal: str, limit: int = 500, offset: int = 0):
    with engine.connect() as conn:
        # lateral subquery retrieves plant image and name by overview
        subq = (
            select(varieties.c.plant_name, varieties.c.image_url)
            .where(
                varieties.c.image_url.isnot(None),
                varieties.c.image_url != "",
                func.lower(varieties.c.overview).like(
                    func.concat("%", func.lower(relationships.c.plant_scientific_name), "%")
                ),
            )
            .order_by(varieties.c.id.asc()).limit(1).lateral()
        )
        # main query selects relationships joined with plant and animal info
        stmt = (
            select(
                relationships.c.plant_scientific_name,
                relationships.c.animal_taxon_name,
                relationships.c.interaction_type_raw,
                func.coalesce(subq.c.image_url, "nan").label("plant_image_url"),
                func.coalesce(species_info.c["Vernacular Name"], "nan").label("animal_vernacular_name"),
                func.coalesce(subq.c.plant_name, "nan").label("plant_common_name"),
            )
            .select_from(relationships)
            .outerjoin(subq, literal_column("TRUE"))
            .outerjoin(
                species_info,
                func.lower(species_info.c.animal_taxon_name) == func.lower(relationships.c.animal_taxon_name),
            )
            .where(relationships.c.animal_taxon_name.ilike(f"%{animal}%"))
            .order_by(relationships.c.plant_scientific_name.asc())
            .limit(limit).offset(offset)
        )
        rows = conn.execute(stmt).mappings().all()
        return [dict(r) for r in rows]

# get all relations where plant is specified
@app.get("/relations/by-plant", response_model=List[InteractionRowWithImage])
def relations_by_plant(plant: str, limit: int = 500, offset: int = 0):
    with engine.connect() as conn:
        # lateral subquery returns plant image and plant name
        subq = (
            select(varieties.c.plant_name, varieties.c.image_url)
            .where(
                varieties.c.image_url.isnot(None),
                varieties.c.image_url != "",
                func.lower(varieties.c.overview).like(
                    func.concat("%", func.lower(relationships.c.plant_scientific_name), "%")
                ),
            )
            .order_by(varieties.c.id.asc()).limit(1).lateral()
        )
        # main query with join across relationship and species info
        stmt = (
            select(
                relationships.c.plant_scientific_name,
                relationships.c.animal_taxon_name,
                relationships.c.interaction_type_raw,
                func.coalesce(subq.c.image_url, "nan").label("plant_image_url"),
                func.coalesce(species_info.c["Vernacular Name"], "nan").label("animal_vernacular_name"),
                func.coalesce(subq.c.plant_name, "nan").label("plant_common_name"),
            )
            .select_from(relationships)
            .outerjoin(subq, literal_column("TRUE"))
            .outerjoin(
                species_info,
                func.lower(species_info.c.animal_taxon_name) == func.lower(relationships.c.animal_taxon_name),
            )
            .where(relationships.c.plant_scientific_name.ilike(f"%{plant}%"))
            .order_by(relationships.c.animal_taxon_name.asc())
            .limit(limit).offset(offset)
        )
        rows = conn.execute(stmt).mappings().all()
        return [dict(r) for r in rows]

# list distinct interaction types stored in relationship table
@app.get("/relations/interactions", response_model=List[str])
def list_interaction_types():
    with engine.connect() as conn:
        stmt = (
            select(func.distinct(relationships.c.interaction_type_raw))
            .select_from(relationships)
            .where(relationships.c.interaction_type_raw != "")
            .order_by(relationships.c.interaction_type_raw.asc())
        )
        return conn.execute(stmt).scalars().all()

# list species occurrences for a given animal name
@app.get("/occurrences/by-animal", response_model=List[Occurrence])
def occurrences_by_animal(
    animal: str,
    bbox: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 1000,
    offset: int = 0,
):
    with engine.connect() as conn:
        # build query to select occurrence records with coordinates
        stmt = (
            select(
                occurrences.c.animal_taxon_name,
                occurrences.c.decimalLatitude,
                occurrences.c.decimalLongitude,
                func.to_char(func.to_timestamp(occurrences.c.eventDate/1000), "YYYY-MM-DD").label("eventDate"),
            )
            .select_from(occurrences)
            .where(occurrences.c.animal_taxon_name.ilike(f"%{animal}%"))
        )
        # optionally filter by bounding box coordinates if provided
        box = _parse_bbox(bbox)
        if box:
            minlon, minlat, maxlon, maxlat = box
            stmt = stmt.where(
                occurrences.c.decimalLongitude.between(minlon, maxlon),
                occurrences.c.decimalLatitude.between(minlat, maxlat),
            )
        # optionally filter by date range boundaries if provided
        if date_from:
            stmt = stmt.where(
                cast(func.to_timestamp(occurrences.c.eventDate/1000), Date) >= func.to_date(date_from, "YYYY-MM-DD")
            )
        if date_to:
            stmt = stmt.where(
                cast(func.to_timestamp(occurrences.c.eventDate/1000), Date) <= func.to_date(date_to, "YYYY-MM-DD")
            )
        # order by most recent events and apply pagination
        stmt = stmt.order_by(func.to_timestamp(occurrences.c.eventDate/1000).desc()).limit(limit).offset(offset)
        rows = conn.execute(stmt).mappings().all()
        return [dict(r) for r in rows]


# list all animals with flags including animal pollinator pest status
@app.get("/species/animals/flags")
def list_animals_with_flags():
    with engine.connect() as conn:
        # extract special pest and weed columns for classification
        wons_col = species_info.c["Weeds of National Significance (WoNS) as at Feb. 2013"]
        vic_col = species_info.c["VIC State Notifiable Pests"]

        # boolean expression to check if species belongs to animal kingdom
        is_animal_expr = case((species_info.c["Kingdom"].ilike("Animalia"), True), else_=False)

        # boolean expressions to detect pest or weed classifications
        wons_is_y = func.coalesce(func.nullif(wons_col, ""), "N") == "Y"
        vic_is_y = func.coalesce(func.nullif(vic_col, ""), "N") == "Y"
        is_pest_or_weed_expr = case((or_(wons_is_y, vic_is_y), True), else_=False)

        # build cte counting pollinatedby relationships for each animal
        rel_cte = (
            select(
                func.lower(relationships.c.animal_taxon_name).label("animal_lower"),
                func.count().label("poll_count"),
            )
            .where(func.lower(relationships.c.interaction_type_raw) == "pollinatedby")
            .group_by(func.lower(relationships.c.animal_taxon_name))
            .cte("rel")
        )

        # main statement combining species info with pollination counts
        stmt = (
            select(
                species_info.c.animal_taxon_name.label("animal_taxon_name"),
                species_info.c["Vernacular Order"].label("vernacular_order"),
                species_info.c.image_url.label("image_url"),
                is_animal_expr.label("is_animal"),
                case((func.coalesce(rel_cte.c.poll_count, 0) > 0, True), else_=False).label("is_pollinator"),
                is_pest_or_weed_expr.label("is_pest_or_weed"),
            )
            .select_from(
                species_info.outerjoin(
                    rel_cte, func.lower(species_info.c.animal_taxon_name) == rel_cte.c.animal_lower
                )
            )
            .order_by(species_info.c.animal_taxon_name.asc())
        )

        rows = conn.execute(stmt).mappings().all()

        # helper to convert boolean into text representation
        def tf(b: Any) -> str:
            return "T" if bool(b) else "F"

        # build response list with all flag values
        return [
            {
                "animal_taxon_name": r["animal_taxon_name"],
                "vernacular_order": r["vernacular_order"],
                "image_url": r["image_url"],
                "animals": tf(r["is_animal"]),
                "pollinators": tf(r["is_pollinator"]),
                "pests_and_weeds": tf(r["is_pest_or_weed"]),
            }
            for r in rows
        ]

# get detailed animal flags and plant lists for visualization
@app.get("/species/animal/{animal}/map-flags")
def get_animal_map_flags(animal: str):
    with engine.connect() as conn:
        # build cte counting plant relations grouped by interaction types
        rel_counts_cte = (
            select(
                func.lower(relationships.c.animal_taxon_name).label("a_lower"),
                func.array_agg(
                    func.distinct(
                        case(
                            (func.lower(relationships.c.interaction_type_raw) == "visitedby", relationships.c.plant_scientific_name),
                            else_=None
                        )
                    )
                ).label("visits_plants"),
                func.array_agg(
                    func.distinct(
                        case(
                            (func.lower(relationships.c.interaction_type_raw) == "eatenby", relationships.c.plant_scientific_name),
                            else_=None
                        )
                    )
                ).label("eats_plants"),
                func.array_agg(
                    func.distinct(
                        case(
                            (func.lower(relationships.c.interaction_type_raw) == "pollinatedby", relationships.c.plant_scientific_name),
                            else_=None
                        )
                    )
                ).label("pollinates_plants"),
                func.array_agg(
                    func.distinct(
                        case(
                            (func.lower(relationships.c.interaction_type_raw) == "hasparasite", relationships.c.plant_scientific_name),
                            else_=None
                        )
                    )
                ).label("parasite_plants"),
                func.array_agg(
                    func.distinct(
                        case(
                            (func.lower(relationships.c.interaction_type_raw) == "haspathogen", relationships.c.plant_scientific_name),
                            else_=None
                        )
                    )
                ).label("pathogen_plants"),
                func.array_agg(
                    func.distinct(
                        case(
                            (func.lower(relationships.c.interaction_type_raw) == "haseggslayedonby", relationships.c.plant_scientific_name),
                            else_=None
                        )
                    )
                ).label("eggs_plants"),
            )
            .group_by(func.lower(relationships.c.animal_taxon_name))
            .cte("rel_counts")
        )

        # build cte counting occurrence records between given years
        date_start = func.to_date("2000-01-01", "YYYY-MM-DD")
        date_end = func.to_date("2025-12-31", "YYYY-MM-DD")
        occ_cte = (
            select(
                func.lower(occurrences.c.animal_taxon_name).label("a_lower"),
                func.count().label("vic_records"),
            )
            .where(
                cast(func.to_timestamp(occurrences.c.eventDate / 1000), Date) >= date_start,
                cast(func.to_timestamp(occurrences.c.eventDate / 1000), Date) <= date_end,
            )
            .group_by(func.lower(occurrences.c.animal_taxon_name))
            .cte("occ")
        )

        # boolean check for animal kingdom classification
        is_animal_expr = case((species_info.c["Kingdom"].ilike("Animalia"), True), else_=False)

        # boolean check for pest or weed classification
        wons_col = species_info.c["Weeds of National Significance (WoNS) as at Feb. 2013"]
        vic_col = species_info.c["VIC State Notifiable Pests"]
        wons_is_y = func.coalesce(func.nullif(wons_col, ""), "N") == "Y"
        vic_is_y = func.coalesce(func.nullif(vic_col, ""), "N") == "Y"
        is_pest_or_weed_expr = case((or_(wons_is_y, vic_is_y), True), else_=False)

        # helper function to check nonempty array content
        def nonempty_array(expr):
            return case((and_(expr.isnot(None), func.array_length(expr, 1) > 0), True), else_=False)

        # main query joining species info with relationship and occurrence data
        stmt = (
            select(
                species_info.c.animal_taxon_name.label("animal_taxon_name"),
                func.coalesce(species_info.c["Vernacular Name"], "nan").label("vernacular_name"),
                species_info.c["Order"].label("order_name"),
                species_info.c["Vernacular Order"].label("vernacular_order"),
                species_info.c.image_url.label("image_url"),
                func.coalesce(occ_cte.c.vic_records, 0).label("number_of_records"),
                is_animal_expr.label("is_animal"),
                case((nonempty_array(rel_counts_cte.c.pollinates_plants), True), else_=False).label("is_pollinator"),
                is_pest_or_weed_expr.label("is_pest_or_weed"),
                rel_counts_cte.c.visits_plants,
                rel_counts_cte.c.eats_plants,
                rel_counts_cte.c.pollinates_plants,
                rel_counts_cte.c.parasite_plants,
                rel_counts_cte.c.pathogen_plants,
                rel_counts_cte.c.eggs_plants,
            )
            .select_from(
                species_info
                .outerjoin(rel_counts_cte, func.lower(species_info.c.animal_taxon_name) == rel_counts_cte.c.a_lower)
                .outerjoin(occ_cte, func.lower(species_info.c.animal_taxon_name) == occ_cte.c.a_lower)
            )
            .where(func.lower(species_info.c.animal_taxon_name) == animal.lower())
            .limit(1)
        )

        row = conn.execute(stmt).mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="Animal not found")

        # helper to transform boolean values into string flags
        def tf(b: Any) -> str:
            return "T" if bool(b) else "F"

        # helper to format plant arrays with count and names
        def _pack(plants):
            if plants is None:
                return {"count": 0, "plants": []}
            clean_plants = [p for p in plants if p is not None]
            return {"count": len(set(clean_plants)), "plants": clean_plants}

        # final structured response including all details
        return {
            "animal_taxon_name": row["animal_taxon_name"],
            "vernacular_name": row["vernacular_name"],
            "order": row["order_name"],
            "vernacular_order": row["vernacular_order"],
            "image_url": row["image_url"],
            "number_of_records": row["number_of_records"],
            "animals": tf(row["is_animal"]),
            "pollinators": tf(row["is_pollinator"]),
            "pests_and_weeds": tf(row["is_pest_or_weed"]),
            "visits": _pack(row["visits_plants"]),
            "eats": _pack(row["eats_plants"]),
            "pollinates": _pack(row["pollinates_plants"]),
            "parasite_to": _pack(row["parasite_plants"]),
            "pathogen_to": _pack(row["pathogen_plants"]),
            "lays_eggs_on": _pack(row["eggs_plants"]),
        }
