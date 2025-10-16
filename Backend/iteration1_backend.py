# backend_iteration1.py
# Requirements: fastapi, uvicorn, sqlalchemy, psycopg2-binary, pydantic, psycopg2

# import required libraries
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, MetaData, Table, select, func, asc
import re

# configure database connection
DB_URL = "postgresql+psycopg2://gardener:netzeroTP08@localhost:5432/5120netzeroDB"
ALLOWED_ORIGINS = ["*"]

# create FastAPI app
app = FastAPI(title="Plant API safe", version="1.0.0")

# allow cross origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create sqlalchemy engine
engine = create_engine(DB_URL, pool_pre_ping=True, pool_size=5, max_overflow=10, future=True)

# reflect existing tables
metadata = MetaData()
sowing_plants = Table("sowing_plants", metadata, autoload_with=engine)
variety_details = Table("variety_details", metadata, autoload_with=engine)
relationship_dataset = Table("relationship_dataset", metadata, autoload_with=engine)

# define response models for plants and varieties
class Plant(BaseModel):
    plant_name: str
    plant_url: Optional[str] = None
    image_url: Optional[str] = None

class Variety(BaseModel):
    variety: str
    overview: str
    quick_method: str
    quick_sowing_depth: str
    quick_season: str
    quick_germination: str
    quick_hardiness_lifecycle: str
    quick_plant_spacing: str
    quick_plant_height: str
    quick_position: str
    quick_days_until_maturity: str
    notes: str
    preparation: str
    how_to_sow: str
    how_to_grow: str
    how_to_harvest: str
    image_url: str
    pollinators: Optional[str] = None

# helper to clean null values
def clean_value(v: Optional[str]) -> str:
    if v is None or str(v).strip() == "":
        return "no information now"
    return str(v).strip()

# helper to get first image url for a plant
def get_first_image_url(conn, plant_name: str) -> Optional[str]:
    stmt = (
        select(variety_details.c.image_url)
        .where(func.lower(variety_details.c.plant_name) == plant_name.lower())
        .order_by(asc(variety_details.c.id))
        .limit(1)
    )
    row = conn.execute(stmt).mappings().first()
    if row and row.get("image_url"):
        return row["image_url"]
    return "no information now"

# regex to extract botanical name
BOT_NAME_RE = re.compile(r"(?i)botanical\s*name\s*:\s*([^,\n\r]+)")

# helper to extract scientific name from overview text
def extract_scientific_name_from_overview(overview_text: Optional[str]) -> str:
    if not overview_text:
        return ""
    m = BOT_NAME_RE.search(overview_text)
    if not m:
        return ""
    return m.group(1).strip()

# helper to lookup pollinators by scientific name
def lookup_pollinators_by_overview(conn, overview_text: Optional[str]) -> str:
    sci = extract_scientific_name_from_overview(overview_text)
    if not sci:
        return ""
    stmt = (
        select(func.distinct(relationship_dataset.c.animal_taxon_name))
        .where(
            relationship_dataset.c.plant_scientific_name.ilike(sci),
            func.lower(relationship_dataset.c.interaction_type_raw) == "pollinatedby"
        )
        .order_by(relationship_dataset.c.animal_taxon_name.asc())
    )
    rows = conn.execute(stmt).scalars().all()
    if not rows:
        return ""
    return ", ".join([str(x).strip() for x in rows if str(x).strip()])

# mapping for month inputs
MONTH_MAP = {
    "1":"jan","2":"feb","3":"mar","4":"apr","5":"may","6":"jun",
    "7":"jul","8":"aug","9":"sep","10":"oct","11":"nov","12":"dec",
    "jan":"jan","feb":"feb","mar":"mar","apr":"apr","may":"may","jun":"jun",
    "jul":"jul","aug":"aug","sep":"sep","oct":"oct","nov":"nov","dec":"dec"
}

# route returns all plants
@app.get("/plants", response_model=List[Plant], response_model_exclude_unset=True)
def get_all_plants():
    with engine.connect() as conn:
        stmt = select(sowing_plants.c.plant_name, sowing_plants.c.plant_url)
        rows = conn.execute(stmt).mappings().all()
        result = []
        for r in rows:
            img = get_first_image_url(conn, r["plant_name"])
            result.append({
                "plant_name": r["plant_name"],
                "plant_url": r.get("plant_url"),
                "image_url": img
            })
        return result

# route returns plants by month
@app.get("/plants/month/{month}", response_model=List[Plant], response_model_exclude_unset=True)
def get_plants_by_month(month: str):
    key = MONTH_MAP.get(month.lower())
    if not key:
        raise HTTPException(status_code=400, detail="Invalid month")
    if key not in sowing_plants.c:
        raise HTTPException(status_code=500, detail=f"Month column '{key}' not found")
    with engine.connect() as conn:
        stmt = select(
            sowing_plants.c.plant_name,
            sowing_plants.c.plant_url
        ).where(sowing_plants.c[key] == 1).order_by(sowing_plants.c.plant_name.asc())
        rows = conn.execute(stmt).mappings().all()
        result = []
        for r in rows:
            img = get_first_image_url(conn, r["plant_name"])
            result.append({
                "plant_name": r["plant_name"],
                "plant_url": r.get("plant_url"),
                "image_url": img
            })
        return result

# route returns plants by category
@app.get("/plants/category/{category}", response_model=List[Plant], response_model_exclude_unset=True)
def get_plants_by_category(category: str):
    with engine.connect() as conn:
        stmt = select(
            sowing_plants.c.plant_name,
            sowing_plants.c.plant_url
        ).where(sowing_plants.c.categories.any(category.lower())) \
         .order_by(sowing_plants.c.plant_name.asc())
        rows = conn.execute(stmt).mappings().all()
        result = []
        for r in rows:
            img = get_first_image_url(conn, r["plant_name"])
            result.append({
                "plant_name": r["plant_name"],
                "plant_url": r.get("plant_url"),
                "image_url": img
            })
        return result

# route returns plants by month and category
@app.get("/plants/filter", response_model=List[Plant], response_model_exclude_unset=True)
def get_plants_by_month_and_category(month: str = Query(...), category: str = Query(...)):
    key = MONTH_MAP.get(month.lower())
    if not key:
        raise HTTPException(status_code=400, detail="Invalid month")
    if key not in sowing_plants.c:
        raise HTTPException(status_code=500, detail=f"Month column '{key}' not found")
    with engine.connect() as conn:
        stmt = select(
            sowing_plants.c.plant_name,
            sowing_plants.c.plant_url
        ).where(
            sowing_plants.c[key] == 1,
            sowing_plants.c.categories.any(category.lower())
        ).order_by(sowing_plants.c.plant_name.asc())
        rows = conn.execute(stmt).mappings().all()
        result = []
        for r in rows:
            img = get_first_image_url(conn, r["plant_name"])
            result.append({
                "plant_name": r["plant_name"],
                "plant_url": r.get("plant_url"),
                "image_url": img
            })
        return result

# route returns all varieties of a plant
@app.get("/plant/{plant_name}/varieties", response_model=List[Variety])
def get_varieties(plant_name: str):
    with engine.connect() as conn:
        stmt = (
            select(
                variety_details.c.variety,
                variety_details.c.overview,
                variety_details.c.quick_method,
                variety_details.c.quick_sowing_depth,
                variety_details.c.quick_season,
                variety_details.c.quick_germination,
                variety_details.c.quick_hardiness_lifecycle,
                variety_details.c.quick_plant_spacing,
                variety_details.c.quick_plant_height,
                variety_details.c.quick_position,
                variety_details.c.quick_days_until_maturity,
                variety_details.c.notes,
                variety_details.c.preparation,
                variety_details.c.how_to_sow,
                variety_details.c.how_to_grow,
                variety_details.c.how_to_harvest,
                variety_details.c.image_url
            )
            .where(func.lower(variety_details.c.plant_name) == plant_name.lower())
            .order_by(variety_details.c.variety.asc())
        )
        rows = conn.execute(stmt).mappings().all()
        result = []
        for r in rows:
            payload = {k: clean_value(v) for k, v in r.items()}
            payload["pollinators"] = lookup_pollinators_by_overview(conn, r.get("overview"))
            result.append(payload)
        return result

# route returns detail of a single variety
@app.get("/variety/{variety}", response_model=Variety)
def get_variety_info(variety: str):
    with engine.connect() as conn:
        stmt = (
            select(
                variety_details.c.variety,
                variety_details.c.overview,
                variety_details.c.quick_method,
                variety_details.c.quick_sowing_depth,
                variety_details.c.quick_season,
                variety_details.c.quick_germination,
                variety_details.c.quick_hardiness_lifecycle,
                variety_details.c.quick_plant_spacing,
                variety_details.c.quick_plant_height,
                variety_details.c.quick_position,
                variety_details.c.quick_days_until_maturity,
                variety_details.c.notes,
                variety_details.c.preparation,
                variety_details.c.how_to_sow,
                variety_details.c.how_to_grow,
                variety_details.c.how_to_harvest,
                variety_details.c.image_url
            )
            .where(func.lower(variety_details.c.variety) == variety.lower())
            .limit(1)
        )
        row = conn.execute(stmt).mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="Variety not found")
        payload = {k: clean_value(v) for k, v in row.items()}
        payload["pollinators"] = lookup_pollinators_by_overview(conn, row.get("overview"))
        return payload

