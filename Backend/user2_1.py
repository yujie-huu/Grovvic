# user2_1.py
# FastAPI backend for querying plant data
# Requirements: fastapi, uvicorn, sqlalchemy, psycopg2-binary, pydantic

from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
import re

# ------------ Config ------------
DB_URL = "postgresql+psycopg2://gardener:netzeroTP08@localhost:5432/5120netzeroDB"

# Allow all origins for development; in production restrict to frontend domain
ALLOWED_ORIGINS = ["*"]

# ------------ App & DB ------------
app = FastAPI(title="Plant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = create_engine(DB_URL, pool_pre_ping=True, pool_size=5, max_overflow=10, future=True)

# ------------ Models ------------
class Plant(BaseModel):
    plant_name: str
    # keep plant_url optional in the schema, but we won't set it in responses.
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
    # NEW: returned pollinators from pollinators_by_plant
    pollinators: Optional[str] = None

# ------------ Helpers ------------
def clean_value(v: Optional[str]) -> str:
    """Replace None/empty string with 'no information now'."""
    if v is None or str(v).strip() == "":
        return "no information now"
    return str(v).strip()

def get_first_image_url(conn, plant_name: str) -> Optional[str]:
    """Fetch the first variety image URL for a given plant_name."""
    row = conn.execute(
        text("SELECT image_url FROM variety_details WHERE LOWER(plant_name)=LOWER(:p) ORDER BY id ASC LIMIT 1"),
        {"p": plant_name},
    ).mappings().first()
    return row["image_url"] if row and row["image_url"] else "no information now"

# ---- NEW helper: fetch pollinators by scientific name parsed from overview ----
BOT_NAME_RE = re.compile(r"(?i)botanical\s*name\s*:\s*([^,\n\r]+)")

def extract_scientific_name_from_overview(overview_text: Optional[str]) -> str:
    if not overview_text:
        return ""
    m = BOT_NAME_RE.search(overview_text)
    if not m:
        return ""
    return m.group(1).strip()

def lookup_pollinators_by_overview(conn, overview_text: Optional[str]) -> str:
    """Parse botanical name from overview and query pollinators_by_plant."""
    sci = extract_scientific_name_from_overview(overview_text)
    if not sci:
        return ""
    row = conn.execute(
        text("SELECT pollinators FROM pollinators_by_plant WHERE plant_scientific_name ILIKE :p LIMIT 1"),
        {"p": sci},
    ).mappings().first()
    if not row:
        return ""
    val = row.get("pollinators")
    # Column is TEXT in your DB; still handle list just in case.
    if isinstance(val, list):
        return ", ".join([str(x).strip() for x in val if str(x).strip()])
    return str(val).strip()

# ------------ Routes ------------

@app.get(
    "/plants",
    response_model=List[Plant],
    response_model_exclude_unset=True,   # <- ensure plant_url not included when unset
)
def get_all_plants():
    """Return all plant categories with first variety image."""
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT plant_name, plant_url FROM sowing_plants ORDER BY plant_name ASC")
        ).mappings().all()
        result: List[Dict[str, Any]] = []
        for r in rows:
            img = get_first_image_url(conn, r["plant_name"])
            # do NOT set plant_url to exclude it from response
            result.append({
                "plant_name": r["plant_name"],
                "image_url": img
            })
        return result

@app.get(
    "/plants/month/{month}",
    response_model=List[Plant],
    response_model_exclude_unset=True,   # <- hide plant_url
)
def get_plants_by_month(month: str):
    """Return plants sowable in a given month (jan..dec or 1..12)."""
    month_map = {
        "1":"jan","2":"feb","3":"mar","4":"apr","5":"may","6":"jun",
        "7":"jul","8":"aug","9":"sep","10":"oct","11":"nov","12":"dec",
        "jan":"jan","feb":"feb","mar":"mar","apr":"apr","may":"may","jun":"jun",
        "jul":"jul","aug":"aug","sep":"sep","oct":"oct","nov":"nov","dec":"dec"
    }
    key = month_map.get(month.lower())
    if not key:
        raise HTTPException(status_code=400, detail="Invalid month")
    with engine.connect() as conn:
        rows = conn.execute(
            text(f"SELECT plant_name, plant_url FROM sowing_plants WHERE {key}=1 ORDER BY plant_name ASC")
        ).mappings().all()
        result: List[Dict[str, Any]] = []
        for r in rows:
            img = get_first_image_url(conn, r["plant_name"])
            result.append({
                "plant_name": r["plant_name"],
                "image_url": img
            })
        return result

@app.get(
    "/plants/category/{category}",
    response_model=List[Plant],
    response_model_exclude_unset=True,   # <- hide plant_url
)
def get_plants_by_category(category: str):
    """Return plants by category (vegetable, flower, herb), case-insensitive."""
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT plant_name, plant_url FROM sowing_plants WHERE LOWER(:c) = ANY (categories) ORDER BY plant_name ASC"),
            {"c": category.lower()},
        ).mappings().all()
        result: List[Dict[str, Any]] = []
        for r in rows:
            img = get_first_image_url(conn, r["plant_name"])
            result.append({
                "plant_name": r["plant_name"],
                "image_url": img
            })
        return result

@app.get(
    "/plants/filter",
    response_model=List[Plant],
    response_model_exclude_unset=True,   # <- hide plant_url
)
def get_plants_by_month_and_category(month: str, category: str):
    """Return plants filtered by both month and category."""
    month_map = {
        "1":"jan","2":"feb","3":"mar","4":"apr","5":"may","6":"jun",
        "7":"jul","8":"aug","9":"sep","10":"oct","11":"nov","12":"dec",
        "jan":"jan","feb":"feb","mar":"mar","apr":"apr","may":"may","jun":"jun",
        "jul":"jul","aug":"aug","sep":"sep","oct":"oct","nov":"nov","dec":"dec"
    }
    key = month_map.get(month.lower())
    if not key:
        raise HTTPException(status_code=400, detail="Invalid month")
    with engine.connect() as conn:
        rows = conn.execute(
            text(f"""
                SELECT plant_name, plant_url 
                FROM sowing_plants
                WHERE {key}=1 AND LOWER(:c) = ANY (categories)
                ORDER BY plant_name ASC
            """),
            {"c": category.lower()},
        ).mappings().all()
        result: List[Dict[str, Any]] = []
        for r in rows:
            img = get_first_image_url(conn, r["plant_name"])
            result.append({
                "plant_name": r["plant_name"],
                "image_url": img
            })
        return result

@app.get("/plant/{plant_name}/varieties", response_model=List[Variety])
def get_varieties(plant_name: str):
    """Return all varieties of a given plant, with image url."""
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT variety, overview, quick_method, quick_sowing_depth, quick_season,
                       quick_germination, quick_hardiness_lifecycle, quick_plant_spacing,
                       quick_plant_height, quick_position, quick_days_until_maturity,
                       notes, preparation, how_to_sow, how_to_grow, how_to_harvest,
                       image_url
                FROM variety_details
                WHERE LOWER(plant_name)=LOWER(:p)
                ORDER BY variety ASC
            """),
            {"p": plant_name},
        ).mappings().all()
        result: List[Dict[str, Any]] = []
        for r in rows:
            payload = {k: clean_value(v) for k, v in r.items()}
            # attach pollinators if any
            payload["pollinators"] = lookup_pollinators_by_overview(conn, r.get("overview"))
            result.append(payload)
        return result

@app.get("/variety/{variety}", response_model=Variety)
def get_variety_info(variety: str):
    """Return all info for a specific variety, plus pollinators (via botanical name in overview)."""
    with engine.connect() as conn:
        row = conn.execute(
            text("""
                SELECT variety, overview, quick_method, quick_sowing_depth, quick_season,
                       quick_germination, quick_hardiness_lifecycle, quick_plant_spacing,
                       quick_plant_height, quick_position, quick_days_until_maturity,
                       notes, preparation, how_to_sow, how_to_grow, how_to_harvest,
                       image_url
                FROM variety_details
                WHERE LOWER(variety)=LOWER(:v)
                LIMIT 1
            """),
            {"v": variety},
        ).mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="Variety not found")

        payload: Dict[str, Any] = {k: clean_value(v) for k, v in row.items()}
        payload["pollinators"] = lookup_pollinators_by_overview(conn, row.get("overview"))
        return payload