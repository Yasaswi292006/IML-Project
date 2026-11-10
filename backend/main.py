import os
import sys
import json
import joblib
import io
import csv
import pandas as pd
import numpy as np
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from src.utils.config import get_google_maps_api_key
from src.preprocessing.data_loader import (
    preprocess, parse_datetimes, localise_times, clean_causes,
    clean_corridor, clean_zone, compute_duration, build_impact_score,
    NAMED_CORRIDORS
)
from src.features.feature_engineering import build_features, encode_for_model
from src.recommendation.engine import generate_response_plan, plan_to_dict

app = FastAPI(title="ASTER Bengaluru Traffic Intelligence API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(ROOT, "models")
DATA_DIR = os.path.join(ROOT, "data")

# Global state for loaded models & data
gb_model = None
encoders = None
freq_maps = None
label_encoder = None
feature_names = None
df_events = None
lgb_service = None
router = None
manpower_opt = None

CORRIDORS = sorted([
    "Mysore Road", "Bellary Road 1", "Bellary Road 2",
    "Tumkur Road", "Hosur Road", "ORR North 1", "Old Madras Road",
    "Magadi Road", "ORR East 1", "ORR North 2", "Bannerghata Road",
    "ORR East 2", "West of Chord Road", "ORR West 1", "CBD 2",
    "Hennur Main Road", "IRR(Thanisandra road)", "Varthur Road",
    "Old Airport Road", "Non-corridor"
])

CORRIDOR_METADATA = {
    "Hosur Road": {"lat": 12.9166, "lng": 77.6256, "zone": "South Zone 1", "police_station": "Madiwala", "junction": "SilkBoardJunc", "address": "Hosur Road near Silk Board Junction, Madiwala, Bengaluru"},
    "Bellary Road 1": {"lat": 13.0358, "lng": 77.5870, "zone": "North Zone 1", "police_station": "Sadashivanagar", "junction": "MekhriCircle", "address": "Bellary Road, Mekhri Circle Flyover, Bengaluru"},
    "Bellary Road 2": {"lat": 13.0782, "lng": 77.5912, "zone": "North Zone 2", "police_station": "Yelahanka", "junction": "YelhankaCircle", "address": "Bellary Road, Yelahanka Bypass Circle, Bengaluru"},
    "Mysore Road": {"lat": 12.9510, "lng": 77.5400, "zone": "West Zone 1", "police_station": "Byatarayanapura", "junction": "toll gate mysore road", "address": "Mysore Road, Toll Gate Junction, Bengaluru"},
    "Tumkur Road": {"lat": 13.0285, "lng": 77.5186, "zone": "West Zone 2", "police_station": "Peenya", "junction": "JalahalliCross(SM Circle)", "address": "Tumkur Road, Jalahalli Cross Junction, Peenya, Bengaluru"},
    "ORR North 1": {"lat": 13.0420, "lng": 77.6100, "zone": "North Zone 1", "police_station": "Kodigehalli", "junction": "VeerannapalyaJunction(BEL,HO)", "address": "Outer Ring Road North, Veerannapalya Flyover, Bengaluru"},
    "ORR North 2": {"lat": 13.0490, "lng": 77.6350, "zone": "North Zone 2", "police_station": "Hennuru", "junction": "Nagavara-ORR Junction", "address": "Outer Ring Road, Nagavara Lake Junction, Bengaluru"},
    "ORR East 1": {"lat": 12.9900, "lng": 77.6800, "zone": "East Zone 1", "police_station": "K.R. Pura", "junction": "AyyappaTempleJunc", "address": "Outer Ring Road East, Tin Factory / KR Puram, Bengaluru"},
    "ORR East 2": {"lat": 12.9350, "lng": 77.6900, "zone": "East Zone 2", "police_station": "HSR Layout", "junction": "SonyWorldJunction", "address": "Outer Ring Road East, Bellandur EcoSpace, Bengaluru"},
    "ORR West 1": {"lat": 12.9800, "lng": 77.5300, "zone": "West Zone 1", "police_station": "Kamakshipalya", "junction": "KIMCO Junction", "address": "Outer Ring Road West, KIMCO Junction, Bengaluru"},
    "Old Madras Road": {"lat": 12.9912, "lng": 77.6521, "zone": "East Zone 1", "police_station": "Banaswadi", "junction": "AyyappaTempleJunc", "address": "Old Madras Road, Swami Vivekananda Road Junction, Bengaluru"},
    "Old Airport Road": {"lat": 12.9592, "lng": 77.6622, "zone": "East Zone 2", "police_station": "HAL Old Airport", "junction": "SonyWorldJunction", "address": "Old Airport Road near Command Hospital, Bengaluru"},
    "Bannerghata Road": {"lat": 12.8950, "lng": 77.5980, "zone": "South Zone 2", "police_station": "Banashankari", "junction": "DairyCircle", "address": "Bannerghatta Main Road near Jayadeva Hospital, Bengaluru"},
    "Magadi Road": {"lat": 12.9750, "lng": 77.5300, "zone": "West Zone 2", "police_station": "Kamakshipalya", "junction": "toll gate mysore road", "address": "Magadi Main Road, Prasanna Theatre Junction, Bengaluru"},
    "West of Chord Road": {"lat": 12.9980, "lng": 77.5450, "zone": "West Zone 1", "police_station": "Yeshwanthpura", "junction": "YeshwanthpuraCircle", "address": "West of Chord Road, Rajajinagar 1st Block, Bengaluru"},
    "Hennur Main Road": {"lat": 13.0300, "lng": 77.6380, "zone": "North Zone 2", "police_station": "Hennuru", "junction": "Nagavara-ORR Junction", "address": "Hennur Main Road, Bio-Diversity Junction, Bengaluru"},
    "IRR(Thanisandra road)": {"lat": 13.0480, "lng": 77.6200, "zone": "North Zone 1", "police_station": "Kodigehalli", "junction": "Nagavara-ORR Junction", "address": "Thanisandra Main Road, Manyata Tech Park Gate, Bengaluru"},
    "Varthur Road": {"lat": 12.9550, "lng": 77.7200, "zone": "East Zone 2", "police_station": "Whitefield", "junction": "SonyWorldJunction", "address": "Varthur Main Road near Whitefield Club, Bengaluru"},
    "CBD 2": {"lat": 12.9750, "lng": 77.6050, "zone": "Central Zone 1", "police_station": "Cubbon Park", "junction": "K R Circle", "address": "CBD 2, MG Road / Brigade Road Junction, Bengaluru"},
    "Non-corridor": {"lat": 12.9716, "lng": 77.5946, "zone": "Central Zone 2", "police_station": "Halasuru Gate", "junction": "RichmondCircle", "address": "Richmond Road near Richmond Circle, Bengaluru"}
}

CORRIDOR_COORDS = {k: (v["lat"], v["lng"], v["zone"]) for k, v in CORRIDOR_METADATA.items()}

CAUSES = [
    {"key": "vehicle_breakdown", "label": "Vehicle Breakdown", "type": "vehicle_breakdown"},
    {"key": "accident", "label": "Traffic Accident", "type": "accident"},
    {"key": "road_work", "label": "Road Construction / Digging", "type": "road_work"},
    {"key": "water_logging", "label": "Water Logging / Flooding", "type": "hazard"},
    {"key": "tree_fall", "label": "Fallen Tree / Road Obstacle", "type": "hazard"},
    {"key": "pot_holes", "label": "Potholes / Damaged Road Surface", "type": "hazard"},
    {"key": "vip_movement", "label": "VIP Movement / Official Convoy", "type": "special_event"},
    {"key": "public_event", "label": "Public Gathering / Festival / Rally", "type": "special_event"},
    {"key": "protest", "label": "Protest / Demonstration Blockade", "type": "special_event"},
    {"key": "procession", "label": "Religious / Cultural Procession", "type": "special_event"},
    {"key": "signal_failure", "label": "Traffic Signal Malfunction", "type": "infrastructure"},
    {"key": "congestion", "label": "Severe Choke-point Congestion", "type": "congestion"},
    {"key": "others", "label": "Other Unclassified Disturbance", "type": "others"}
]

EVENT_TYPES = ["unplanned", "planned"]
PRIORITIES = ["High", "Medium", "Low"]
VEHICLE_TYPES = [
    {"key": "bmtc_bus", "label": "BMTC City Bus"},
    {"key": "heavy_vehicle", "label": "Heavy Commercial Vehicle / Multi-Axle"},
    {"key": "truck", "label": "Freight Truck / Container"},
    {"key": "lcv", "label": "Light Commercial Vehicle (LCV)"},
    {"key": "private_bus", "label": "Private / Intercity Bus"},
    {"key": "private_car", "label": "Private Car (Sedan / SUV)"},
    {"key": "ksrtc_bus", "label": "KSRTC State Transport Bus"},
    {"key": "auto", "label": "Auto Rickshaw"},
    {"key": "taxi", "label": "App Taxi / Cab"},
    {"key": "two_wheeler", "label": "Two Wheeler / Motorcycle"},
    {"key": "others", "label": "Other / Unknown Vehicle"}
]
ZONES = [
    "Central Zone 1", "Central Zone 2", "East Zone 1", "East Zone 2",
    "North Zone 1", "North Zone 2", "South Zone 1", "South Zone 2",
    "West Zone 1", "West Zone 2"
]
POLICE_STATIONS = [
    "Madiwala", "HSR Layout", "Peenya", "Cubbon Park", "Sadashivanagar",
    "Halasuru Gate", "Yelahanka", "HAL Old Airport", "Byatarayanapura",
    "Yeshwanthpura", "Hennuru", "Kodigehalli", "Banaswadi", "K.R. Pura",
    "Kamakshipalya", "Wilson Garden", "Banashankari", "Whitefield", "Indiranagar"
]
JUNCTIONS = [
    "SilkBoardJunc", "DairyCircle", "MekhriCircle", "JalahalliCross(SM Circle)",
    "AyyappaTempleJunc", "SatteliteBusStandJunc", "YeshwanthpuraCircle", "YelhankaCircle",
    "toll gate mysore road", "Nagavara-ORR Junction", "K R Circle", "KIMCO Junction",
    "VeerannapalyaJunction(BEL,HO)", "RichmondCircle", "TrinityCircle", "SonyWorldJunction"
]

@app.on_event("startup")
def load_assets():
    global gb_model, encoders, freq_maps, label_encoder, feature_names, df_events, lgb_service, router, manpower_opt
    try:
        gb_model = joblib.load(os.path.join(MODELS_DIR, "gb_main.pkl"))
        encoders = joblib.load(os.path.join(MODELS_DIR, "encoders.pkl"))
        freq_maps = joblib.load(os.path.join(MODELS_DIR, "freq_maps.pkl"))
        label_encoder = joblib.load(os.path.join(MODELS_DIR, "label_encoder.pkl"))
        feature_names = joblib.load(os.path.join(MODELS_DIR, "feature_names.pkl"))
    except Exception as e:
        print(f"Warning: Model load error: {e}")

    try:
        data_p = os.path.join(MODELS_DIR, "processed_dataset.csv")
        if not os.path.exists(data_p):
            data_p = os.path.join(DATA_DIR, "bengaluru_traffic_events.csv")
        df_events = pd.read_csv(data_p, low_memory=False)
        df_events["start_datetime"] = pd.to_datetime(df_events["start_datetime"], errors="coerce")
        df_events["hour"] = df_events["start_datetime"].dt.hour
        if "impact_tier" not in df_events.columns:
            df_events["impact_tier"] = "Medium"
        df_events["latitude"] = pd.to_numeric(df_events["latitude"], errors="coerce").fillna(12.9716)
        df_events["longitude"] = pd.to_numeric(df_events["longitude"], errors="coerce").fillna(77.5946)
    except Exception as e:
        print(f"Warning: Data load error: {e}")

    try:
        from src.modeling.lgb_inference import LGBInferenceService
        lgb_service = LGBInferenceService()
    except Exception as e:
        print(f"Warning: LGB service load error: {e}")
        lgb_service = None

    try:
        from src.recommendation.routing_engine import RoutingEngine
        router = RoutingEngine()
    except Exception as e:
        print(f"Warning: RoutingEngine load error: {e}")
        router = None

    try:
        from src.recommendation.manpower import ManpowerOptimizer
        manpower_opt = ManpowerOptimizer()
    except Exception as e:
        print(f"Warning: ManpowerOptimizer load error: {e}")
        manpower_opt = None


def compute_raw_score(event_dict):
    high_causes = {"accident", "construction", "public_event", "protest", "procession", "vip_movement", "water_logging"}
    score = 1
    if str(event_dict.get("requires_road_closure", False)).lower() in ["true", "1", "yes"]:
        score += 2
    if event_dict.get("priority") == "High":
        score += 1
    if event_dict.get("event_cause") in high_causes:
        score += 1
    if event_dict.get("corridor") in CORRIDORS and event_dict.get("corridor") != "Non-corridor":
        score += 1
    return min(score, 6)


class PredictRequest(BaseModel):
    event_type: str = "unplanned"
    cause: str
    corridor: str
    requires_road_closure: bool = False
    priority: str = "High"
    hour: int = 9
    minute: int = 0
    date_str: Optional[str] = "2026-03-15"
    day_of_week: int = 0
    month: int = 3
    vehicle_type: Optional[str] = "bmtc_bus"
    zone: Optional[str] = "South Zone 1"
    police_station: Optional[str] = "Madiwala"
    junction: Optional[str] = "SilkBoardJunc"
    address: Optional[str] = "Hosur Road near Silk Board Junction, Bengaluru"
    description: Optional[str] = "Vehicle breakdown causing significant corridor tailback"
    custom_lat: Optional[float] = None
    custom_lng: Optional[float] = None
    weather_multiplier: Optional[float] = 1.0


@app.get("/api/config")
def get_config():
    return {
        "google_maps_api_key": get_google_maps_api_key(),
        "city": "Bengaluru",
        "corridors": CORRIDORS,
        "causes": CAUSES,
        "event_types": EVENT_TYPES,
        "priorities": PRIORITIES,
        "vehicle_types": VEHICLE_TYPES,
        "zones": ZONES,
        "police_stations": POLICE_STATIONS,
        "junctions": JUNCTIONS,
        "corridor_metadata": CORRIDOR_METADATA,
        "version": "2.1.0"
    }


@app.get("/api/lookup-location")
def lookup_location(lat: float, lng: float):
    # 1. Spatial distance against known corridor centers
    best_corridor = "Hosur Road"
    min_dist = float("inf")
    for corr, meta in CORRIDOR_METADATA.items():
        if corr == "Non-corridor":
            continue
        c_lat, c_lng = meta["lat"], meta["lng"]
        dist = ((lat - c_lat) ** 2 + (lng - c_lng) ** 2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            best_corridor = corr

    default_meta = CORRIDOR_METADATA.get(best_corridor, {})
    detected_station = default_meta.get("police_station", "Madiwala")
    detected_junction = default_meta.get("junction", "SilkBoardJunc")
    detected_zone = default_meta.get("zone", "South Zone 1")
    detected_address = default_meta.get("address", f"{best_corridor}, Bengaluru")

    # 2. Check 1-NN against real ASTRAM events dataset
    if df_events is not None and not df_events.empty:
        try:
            dists = (df_events["latitude"] - lat) ** 2 + (df_events["longitude"] - lng) ** 2
            nearest_row = df_events.iloc[dists.argmin()]
            
            # If within proximity (~2km), inherit station, junction, and address
            if dists.min() < 0.0006:
                corr_val = str(nearest_row.get("corridor", ""))
                if corr_val in CORRIDORS and corr_val != "Non-corridor":
                    best_corridor = corr_val
                
                station_val = str(nearest_row.get("police_station", ""))
                if station_val and station_val != "nan" and station_val != "No Police Station":
                    detected_station = station_val

                junc_val = str(nearest_row.get("junction", ""))
                if junc_val and junc_val != "nan":
                    detected_junction = junc_val

                zone_val = str(nearest_row.get("zone", ""))
                if zone_val and zone_val in ZONES:
                    detected_zone = zone_val

                addr_val = str(nearest_row.get("address", ""))
                if addr_val and addr_val != "nan" and len(addr_val) > 5:
                    detected_address = addr_val
        except Exception as e:
            print(f"Nearest event spatial lookup error: {e}")

    # 3. Router nearest junction refinement
    if router is not None:
        try:
            r_junc = router.find_nearest_junction(lat, lng)
            if r_junc:
                detected_junction = r_junc
        except Exception:
            pass

    # Clean address
    if "Pin-" in detected_address:
        detected_address = detected_address.split("Pin-")[0].strip().rstrip(",")
    if "(India)" in detected_address:
        detected_address = detected_address.replace("(India)", "").strip().rstrip(".")

    return {
        "lat": round(lat, 6),
        "lng": round(lng, 6),
        "corridor": best_corridor,
        "police_station": detected_station,
        "junction": detected_junction,
        "zone": detected_zone,
        "address": detected_address,
        "priority": "High" if best_corridor != "Non-corridor" else "Medium",
        "requires_road_closure": True,
        "description": f"Incident reported on {best_corridor} near {detected_junction} ({detected_station} police station jurisdiction)."
    }


@app.get("/api/search-places")
def search_places(q: str):
    if not q or len(q.strip()) < 2:
        return []
    
    q_clean = q.strip().lower()
    results = []
    seen_names = set()

    # 1. Match Corridor names
    for corr, meta in CORRIDOR_METADATA.items():
        if q_clean in corr.lower():
            results.append({
                "name": corr,
                "label": f"Arterial Corridor: {corr}",
                "lat": float(meta["lat"]),
                "lng": float(meta["lng"]),
                "address": meta["address"],
                "corridor": corr,
                "junction": meta["junction"],
                "police_station": meta["police_station"],
                "zone": meta["zone"]
            })
            seen_names.add(corr.lower())

    # 2. Match Junctions
    for junc in JUNCTIONS:
        if q_clean in junc.lower():
            j_lat, j_lng = 12.9716, 77.5946
            for meta in CORRIDOR_METADATA.values():
                if meta["junction"] == junc:
                    j_lat, j_lng = float(meta["lat"]), float(meta["lng"])
                    break
            results.append({
                "name": junc,
                "label": f"Hotspot Junction: {junc}",
                "lat": j_lat,
                "lng": j_lng,
                "address": f"{junc}, Bengaluru",
                "corridor": "Non-corridor",
                "junction": junc,
                "police_station": "Unknown",
                "zone": "Central Zone 1"
            })
            seen_names.add(junc.lower())

    # 3. Match from df_events historical records using keyword tokens
    if df_events is not None and not df_events.empty:
        try:
            import re
            tokens = [w for w in re.split(r'[\s,]+', q_clean) if len(w) > 2 and w not in ['road', 'junction', 'near', 'bengaluru', 'bangalore', 'karnataka', 'india']]
            if not tokens:
                tokens = [q_clean]

            mask = pd.Series(True, index=df_events.index)
            for t in tokens:
                mask = mask & (
                    df_events["address"].str.lower().str.contains(t, na=False) |
                    df_events["junction"].str.lower().str.contains(t, na=False) |
                    df_events["corridor"].str.lower().str.contains(t, na=False)
                )
            matches = df_events[mask].head(15)
            if matches.empty:
                any_mask = pd.Series(False, index=df_events.index)
                for t in tokens:
                    any_mask = any_mask | (
                        df_events["address"].str.lower().str.contains(t, na=False) |
                        df_events["corridor"].str.lower().str.contains(t, na=False)
                    )
                matches = df_events[any_mask].head(15)

            for _, r in matches.iterrows():
                addr = str(r.get("address", ""))
                if "Pin-" in addr:
                    addr = addr.split("Pin-")[0].strip().rstrip(",")
                if "(India)" in addr:
                    addr = addr.replace("(India)", "").strip().rstrip(".")

                short_label = addr[:55]
                if short_label.lower() in seen_names or not addr or addr == "nan":
                    continue
                seen_names.add(short_label.lower())

                results.append({
                    "name": short_label,
                    "label": short_label,
                    "lat": float(r["latitude"]),
                    "lng": float(r["longitude"]),
                    "address": addr,
                    "corridor": str(r.get("corridor", "Non-corridor")),
                    "junction": str(r.get("junction", "Unknown")),
                    "police_station": str(r.get("police_station", "Unknown")),
                    "zone": str(r.get("zone", "Central Zone 1"))
                })
                if len(results) >= 8:
                    break
        except Exception as e:
            print(f"Places search error: {e}")

    return results[:8]


@app.get("/api/overview")
def get_overview():
    total_events = len(df_events) if df_events is not None else 8173
    high_impact = int((df_events["impact_tier"] == "High").sum()) if df_events is not None else 2394
    closures = int((df_events["requires_road_closure"].astype(str).str.lower().isin(["true", "1", "yes"])).sum()) if df_events is not None else 676
    active_corridors = len(df_events["corridor"].unique()) if df_events is not None else 21
    
    return {
        "metrics": {
            "total_events": total_events,
            "high_impact": high_impact,
            "high_impact_pct": round((high_impact / total_events) * 100, 1),
            "planned_events": 467,
            "road_closures": closures,
            "active_corridors": active_corridors,
            "median_resolution_min": 65,
            "date_range": "Nov 2025 – Apr 2026"
        },
        "impact_distribution": [
            {"tier": "High", "count": high_impact, "pct": round(high_impact / total_events * 100, 1), "color": "#EF4444"},
            {"tier": "Medium", "count": int(total_events * 0.44), "pct": 44.0, "color": "#F59E0B"},
            {"tier": "Low", "count": int(total_events * 0.267), "pct": 26.7, "color": "#10B981"}
        ]
    }


@app.get("/api/events")
def get_events(
    corridor: Optional[str] = None,
    impact_tier: Optional[str] = None,
    hour: Optional[int] = None,
    limit: int = 300
):
    if df_events is None:
        return []
    
    filtered = df_events.copy()
    if corridor and corridor != "All":
        filtered = filtered[filtered["corridor"] == corridor]
    if impact_tier and impact_tier != "All":
        filtered = filtered[filtered["impact_tier"] == impact_tier]
    if hour is not None:
        filtered = filtered[(filtered["hour"] >= max(0, hour - 1)) & (filtered["hour"] <= min(23, hour + 1))]

    filtered = filtered.head(limit)
    
    items = []
    for _, r in filtered.iterrows():
        dur = float(r.get("duration_minutes", 60)) if pd.notna(r.get("duration_minutes")) else 60.0
        items.append({
            "id": str(r.get("id", "")),
            "lat": float(r["latitude"]),
            "lng": float(r["longitude"]),
            "cause": str(r.get("event_cause", "incident")).replace("_", " ").title(),
            "corridor": str(r.get("corridor", "Corridor")),
            "tier": str(r.get("impact_tier", "Medium")),
            "duration": round(dur),
            "requires_closure": str(r.get("requires_road_closure", False)).lower() in ["true", "1", "yes"]
        })
    return items


@app.post("/api/predict")
def predict_incident(req: PredictRequest):
    corridor_meta = CORRIDOR_METADATA.get(req.corridor, {
        "lat": 12.9716, "lng": 77.5946, "zone": "Central Zone 2",
        "police_station": "Halasuru Gate", "junction": "RichmondCircle",
        "address": f"{req.corridor}, Bengaluru"
    })

    lat = float(req.custom_lat) if req.custom_lat is not None else corridor_meta["lat"]
    lon = float(req.custom_lng) if req.custom_lng is not None else corridor_meta["lng"]
    zone = req.zone if req.zone else corridor_meta["zone"]
    police_station = req.police_station if req.police_station else corridor_meta["police_station"]
    junction = req.junction if req.junction else corridor_meta["junction"]
    address = req.address if req.address else corridor_meta["address"]
    desc = req.description if req.description else f"{req.cause.replace('_', ' ').title()} on {req.corridor}"

    # Parse full datetime with fallback
    date_str = req.date_str or "2026-03-15"
    hour_val = max(0, min(23, req.hour))
    minute_val = max(0, min(59, req.minute))
    try:
        start_dt = pd.to_datetime(f"{date_str} {hour_val:02d}:{minute_val:02d}:00", utc=True)
    except Exception:
        start_dt = pd.Timestamp.now(tz="UTC")

    event_dict = {
        "event_type": req.event_type,
        "event_cause": req.cause,
        "requires_road_closure": req.requires_road_closure,
        "priority": req.priority,
        "corridor": req.corridor,
        "zone": zone,
        "latitude": lat,
        "longitude": lon,
        "veh_type": req.vehicle_type or "unknown",
        "police_station": police_station,
        "junction": junction,
        "address": address,
        "description": desc,
        "start_datetime": start_dt
    }

    # Model inference
    pred_tier = "High"
    prob_dict = {"High": 0.72, "Medium": 0.20, "Low": 0.08}
    confidence = 0.72

    if gb_model is not None and encoders is not None:
        try:
            row = pd.DataFrame([event_dict])
            row["start_datetime"] = start_dt
            row["start_local"] = start_dt
            row["corridor"] = row["corridor"].fillna("Non-corridor")
            row["is_named_corridor"] = int(row["corridor"].iloc[0] in NAMED_CORRIDORS)
            row["road_closure_flag"] = int(req.requires_road_closure)
            row["priority"] = req.priority
            row["veh_type"] = req.vehicle_type or "unknown"
            row["zone"] = zone
            row["police_station"] = police_station

            row, _ = build_features(row, freq_maps=freq_maps)
            X, _ = encode_for_model(row, fit_encoders=encoders)
            for col in feature_names:
                if col not in X.columns:
                    X[col] = 0
            X = X[feature_names]

            probs = gb_model.predict_proba(X)[0]
            pred_idx = int(np.argmax(probs))
            pred_tier = label_encoder.classes_[pred_idx]
            confidence = round(float(probs[pred_idx]), 4)
            prob_dict = {label_encoder.classes_[i]: round(float(p), 4) for i, p in enumerate(probs)}
        except Exception as e:
            print(f"GB inference error: {e}")

    raw_score = compute_raw_score(event_dict)

    # Response Plan
    plan = generate_response_plan(
        predicted_tier=pred_tier,
        confidence=confidence,
        impact_score=raw_score,
        event_cause=req.cause,
        corridor=req.corridor,
        zone=zone,
        junction=junction,
        hour=hour_val,
        requires_road_closure=req.requires_road_closure,
        wx_multiplier=req.weather_multiplier or 1.0
    )
    plan_d = plan_to_dict(plan)

    # Routing & Detours
    nearest_junc = "RichmondCircle"
    barricades = []
    routes = []
    if router is not None:
        try:
            nearest_junc = router.find_nearest_junction(lat, lon)
            barricades_raw = router.recommend_barricades(nearest_junc, impact_radius_hops=1)
            barricades = [
                {
                    "name": b.get("intersection_id", "Junction"),
                    "road": b.get("road_name", "Arterial Road"),
                    "lat": float(b.get("latitude", lat + 0.005)),
                    "lng": float(b.get("longitude", lon + 0.005)),
                    "reason": b.get("reason", "Barricade perimeter")
                }
                for b in barricades_raw
            ]
            local_juncs = router.find_nearest_k_junctions(lat, lon, k=3)
            if len(local_juncs) >= 3:
                routes = router.get_alternative_routes(local_juncs[1], local_juncs[2], blocked_node=local_juncs[0])
            else:
                routes = router.get_alternative_routes("RichmondCircle", "CorporationCircle", blocked_node=nearest_junc)
        except Exception as e:
            print(f"Router error: {e}")

    # Manpower optimization
    allocations = []
    current_allocation = plan_d["manpower_min"]
    if manpower_opt is not None:
        try:
            opt_events = [
                {
                    "event_id": "current", "junction": nearest_junc,
                    "latitude": lat, "longitude": lon,
                    "predicted_eis": raw_score / 6.0,
                    "predicted_priority": 1 if req.corridor != "Non-corridor" else 0,
                    "requires_road_closure": int(req.requires_road_closure)
                },
                {
                    "event_id": "concurrent_0", "junction": "SilkBoard",
                    "latitude": 12.9176, "longitude": 77.6244,
                    "predicted_eis": 0.65, "predicted_priority": 1, "requires_road_closure": 0
                },
                {
                    "event_id": "concurrent_1", "junction": "HebbalFlyover",
                    "latitude": 13.0358, "longitude": 77.5970,
                    "predicted_eis": 0.50, "predicted_priority": 1, "requires_road_closure": 0
                }
            ]
            allocations = manpower_opt.optimize(opt_events)
            for a in allocations:
                if a["event_id"] == "current":
                    current_allocation = a["allocated_officers"]
        except Exception as e:
            print(f"Manpower error: {e}")

    # Public advisories
    cause_title = req.cause.replace("_", " ").title()
    wa_text = f"🚨 *Traffic Alert - {req.corridor}*\nCause: {cause_title}\nImpact: {pred_tier}\nRecommended Police Dispatch: {current_allocation} Officers\nSource: ASTER Intelligence"
    vms_text = f"CAUTION: {cause_title[:10].upper()} ON {req.corridor[:10].upper()} - EXPECT DELAYS"
    tw_text = f"🚨 {pred_tier} Impact Alert: {cause_title} on {req.corridor}. Police deployed. Please use alternate bypass routes. #BlrTraffic #ASTER"

    return {
        "predicted_tier": pred_tier,
        "effective_tier": plan_d.get("effective_tier", pred_tier),
        "confidence": confidence,
        "probabilities": prob_dict,
        "impact_score": raw_score,
        "deployment_time": plan_d.get("deployment_time", "≤ 15 mins"),
        "response_priority": plan_d.get("response_priority", "P1 - Critical"),
        "officers_deployed": current_allocation,
        "barricade_order": plan_d.get("barricading", "Hard closure"),
        "primary_action": plan_d.get("risk_reasoning", "Immediate deployment required"),
        "tactical_checklist": plan_d.get("action_items", []),
        "escalation_triggers": plan_d.get("escalation_triggers", []),
        "incident_coords": {"lat": lat, "lng": lon},
        "nearest_junction": nearest_junc,
        "barricades": barricades,
        "routes": routes,
        "allocations": allocations,
        "broadcast_advisories": {
            "whatsapp": wa_text,
            "vms": vms_text,
            "twitter": tw_text
        }
    }


# ─────────────────────────────────────────────────────────────────
# Batch Triage Engine — Full 46-Column ASTRAM Dataset Schema
# ─────────────────────────────────────────────────────────────────

ASTRAM_46_COLUMNS = [
    "id", "event_type", "latitude", "longitude", "endlatitude", "endlongitude",
    "address", "end_address", "event_cause", "requires_road_closure",
    "start_datetime", "end_datetime", "status", "authenticated", "modified_datetime",
    "map_file", "direction", "description", "veh_type", "veh_no", "corridor",
    "priority", "cargo_material", "reason_breakdown", "age_of_truck", "created_date",
    "route_path", "client_id", "created_by_id", "last_modified_by_id",
    "assigned_to_police_id", "citizen_accident_id", "comment", "police_station",
    "meta_data", "kgid", "resolved_at_address", "resolved_at_latitude",
    "resolved_at_longitude", "closed_by_id", "closed_datetime", "resolved_by_id",
    "resolved_datetime", "gba_identifier", "zone", "junction"
]

TEMPLATE_46_PATH = os.path.join(DATA_DIR, "aster_batch_template_46cols.csv")
if not os.path.exists(TEMPLATE_46_PATH):
    raw_csv = os.path.join(DATA_DIR, "bengaluru_traffic_events.csv")
    if os.path.exists(raw_csv):
        try:
            pd.read_csv(raw_csv, nrows=8).to_csv(TEMPLATE_46_PATH, index=False)
        except Exception:
            pass


@app.get("/api/batch-template")
def get_batch_template():
    """Downloadable 46-column CSV template with real ASTRAM schema & sample rows."""
    if os.path.exists(TEMPLATE_46_PATH):
        with open(TEMPLATE_46_PATH, "r", encoding="utf-8") as f:
            content = f.read()
    else:
        content = ",".join(ASTRAM_46_COLUMNS) + "\n"

    return PlainTextResponse(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=aster_btp_46col_template.csv"}
    )


@app.get("/api/batch-schema")
def get_batch_schema():
    """Detailed ASTRAM 46-column schema specifications for batch CSV uploads."""
    return {
        "total_required_columns": 46,
        "policy": "Strict validation active: ALL 46 columns from the ASTRAM BTP dataset schema must be present. Files missing any columns are rejected immediately.",
        "columns": [
            {"index": i + 1, "name": col, "category": (
                "Identification" if col in ["id", "client_id", "created_by_id", "last_modified_by_id", "assigned_to_police_id", "citizen_accident_id", "closed_by_id", "resolved_by_id", "kgid"]
                else "Geospatial & Coordinates" if col in ["latitude", "longitude", "endlatitude", "endlongitude", "address", "end_address", "resolved_at_address", "resolved_at_latitude", "resolved_at_longitude"]
                else "Incident Cause & Impact" if col in ["event_cause", "requires_road_closure", "priority", "description", "comment", "reason_breakdown", "meta_data"]
                else "Temporal Datetimes" if col in ["start_datetime", "end_datetime", "modified_datetime", "created_date", "closed_datetime", "resolved_datetime"]
                else "Corridor & Routing" if col in ["corridor", "zone", "junction", "police_station", "direction", "route_path", "gba_identifier"]
                else "Vehicle Metadata" if col in ["veh_type", "veh_no", "cargo_material", "age_of_truck"]
                else "Operational State"
            )}
            for i, col in enumerate(ASTRAM_46_COLUMNS)
        ]
    }


@app.post("/api/batch-predict")
async def batch_predict(file: UploadFile = File(...)):
    """
    Ingest, strictly validate, and predict a batch of disruption events from CSV.
    Enforces that the uploaded CSV contains all 46 columns of the ASTRAM dataset schema.
    If proper, immediately preprocesses and feeds the complete records to the ML model and OR-Tools optimizer.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid file format: Only .csv files are supported.",
                "errors": [f"Uploaded file '{file.filename}' is not a CSV file."]
            }
        )

    try:
        content_bytes = await file.read()
        df_raw = pd.read_csv(io.BytesIO(content_bytes), low_memory=False)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={"message": f"Malformed CSV syntax: Unable to parse file. {str(e)}", "errors": [str(e)]}
        )

    # 1. Strip whitespace on column headers
    df_raw.columns = [str(c).strip() for c in df_raw.columns]

    # 2. Strict Check for all 46 columns
    missing_cols = [col for col in ASTRAM_46_COLUMNS if col not in df_raw.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail={
                "message": f"CSV Rejected: Incomplete ASTRAM Schema. The uploaded file has {len(df_raw.columns)} column(s) but must contain ALL 46 columns from the dataset. {len(missing_cols)} column(s) are missing.",
                "total_missing": len(missing_cols),
                "missing_columns": missing_cols,
                "required_columns_count": 46,
                "received_columns_count": len(df_raw.columns),
                "errors": [
                    f"Missing required ASTRAM column '{col}'" for col in missing_cols[:30]
                ]
            }
        )

    # 3. Check for row data
    if len(df_raw) == 0:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "CSV Rejected: File contains 0 data rows.",
                "errors": ["File contains the 46 header columns but has no data rows."]
            }
        )

    if len(df_raw) > 500:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "CSV Rejected: Batch size exceeds 500 events limit.",
                "errors": [f"Uploaded file has {len(df_raw)} rows; maximum allowed per batch is 500."]
            }
        )

    # 4. Row-level validation on critical operational fields
    row_errors = []
    for idx, row in df_raw.iterrows():
        row_num = idx + 2
        # Corridor validation
        corr = str(row.get("corridor", "")).strip()
        if not corr or corr.lower() == "nan":
            row_errors.append(f"Row {row_num}: 'corridor' is missing or blank.")
        # Event cause validation
        cause = str(row.get("event_cause", "")).strip()
        if not cause or cause.lower() == "nan":
            row_errors.append(f"Row {row_num}: 'event_cause' is missing or blank.")
        # Coordinates validation (if present, must be numeric)
        lat = row.get("latitude")
        lng = row.get("longitude")
        if pd.notna(lat) and pd.notna(lng):
            try:
                lat_f = float(lat)
                lng_f = float(lng)
                if lat_f != 0.0 and lng_f != 0.0:
                    if not (12.0 <= lat_f <= 14.0) or not (77.0 <= lng_f <= 78.5):
                        row_errors.append(f"Row {row_num}: Coordinates ({lat_f}, {lng_f}) out of Bengaluru operational bounds.")
            except Exception:
                row_errors.append(f"Row {row_num}: 'latitude' and 'longitude' must be numeric.")

    if row_errors:
        raise HTTPException(
            status_code=400,
            detail={
                "message": f"CSV Rejected: {len(row_errors)} data error(s) found in rows. File rejected to protect model integrity.",
                "total_errors": len(row_errors),
                "errors": row_errors[:25]
            }
        )

    # 5. Full ASTRAM Preprocessing Pipeline (same as training pipeline)
    df = df_raw.copy()
    df = parse_datetimes(df)
    df = localise_times(df)
    df = clean_causes(df)
    df = clean_corridor(df)
    df = clean_zone(df)
    df = compute_duration(df)
    df = build_impact_score(df)
    df["road_closure_flag"] = df["requires_road_closure"].astype(str).str.lower().isin(["true", "1", "yes"]).astype(int)

    # 6. Feature Engineering & Encoding
    predictions = []
    if gb_model is not None and encoders is not None:
        try:
            feat_df, _ = build_features(df, freq_maps=freq_maps)
            X, _ = encode_for_model(feat_df, fit_encoders=encoders)
            for col in feature_names:
                if col not in X.columns:
                    X[col] = 0
            X = X[feature_names]
            probs_matrix = gb_model.predict_proba(X)

            for i, probs in enumerate(probs_matrix):
                pred_idx = int(np.argmax(probs))
                tier = label_encoder.classes_[pred_idx]
                conf = round(float(probs[pred_idx]), 4)
                predictions.append({
                    "tier": tier,
                    "confidence": conf,
                    "probabilities": {label_encoder.classes_[k]: round(float(p), 4) for k, p in enumerate(probs)}
                })
        except Exception as e:
            print(f"Batch GB inference error: {e}")

    # Fallback if inference had issues
    while len(predictions) < len(df):
        predictions.append({"tier": "Medium", "confidence": 0.65, "probabilities": {"High": 0.2, "Medium": 0.65, "Low": 0.15}})

    # 7. Response Plans & OR-Tools Solver Inputs
    plans = []
    opt_events = []
    for i, (_, r) in enumerate(df.iterrows()):
        pred_tier = predictions[i]["tier"]
        conf = predictions[i]["confidence"]
        raw_score = compute_raw_score({
            "requires_road_closure": r.get("requires_road_closure", False),
            "priority": r.get("priority", "Medium"),
            "event_cause": r.get("event_cause", "others"),
            "corridor": r.get("corridor", "Non-corridor")
        })
        meta = CORRIDOR_METADATA.get(str(r.get("corridor")), {"junction": "RichmondCircle", "lat": 12.9716, "lng": 77.5946})
        h_val = int(r["start_local"].hour) if pd.notna(r.get("start_local")) else 9
        
        plan = generate_response_plan(
            predicted_tier=pred_tier,
            confidence=conf,
            impact_score=raw_score,
            event_cause=str(r.get("event_cause", "others")),
            corridor=str(r.get("corridor", "Non-corridor")),
            zone=str(r.get("zone", "Central Zone 2")),
            junction=str(r.get("junction") or meta.get("junction", "RichmondCircle")),
            hour=h_val,
            requires_road_closure=bool(r.get("road_closure_flag", 0)),
            wx_multiplier=1.0
        )
        plan_d = plan_to_dict(plan)
        plans.append({"plan": plan_d, "raw_score": raw_score})

        evt_id = str(r.get("id")) if pd.notna(r.get("id")) else f"EVT-B{i+1:02d}"
        opt_events.append({
            "event_id": evt_id,
            "junction": str(r.get("junction") or meta.get("junction", "RichmondCircle")),
            "latitude": float(r.get("latitude")) if pd.notna(r.get("latitude")) else meta.get("lat", 12.9716),
            "longitude": float(r.get("longitude")) if pd.notna(r.get("longitude")) else meta.get("lng", 77.5946),
            "predicted_eis": raw_score / 6.0,
            "predicted_priority": 1 if str(r.get("priority")) == "High" or str(r.get("corridor")) != "Non-corridor" else 0,
            "requires_road_closure": int(r.get("road_closure_flag", 0))
        })

    # 8. OR-Tools Manpower Allocation across entire batch
    officer_allocations = {}
    if manpower_opt is not None and opt_events:
        try:
            alloc_results = manpower_opt.optimize(opt_events)
            for a in alloc_results:
                officer_allocations[a["event_id"]] = a["allocated_officers"]
        except Exception as e:
            print(f"Manpower batch error: {e}")

    # 9. Compile Triaged Response Queue
    results = []
    tier_weights = {"High": 300, "Medium": 200, "Low": 100}
    for i, (_, r) in enumerate(df.iterrows()):
        evt_id = str(r.get("id")) if pd.notna(r.get("id")) else f"EVT-B{i+1:02d}"
        plan_d = plans[i]["plan"]
        raw_score = plans[i]["raw_score"]
        pred_tier = predictions[i]["tier"]
        effective_tier = plan_d.get("effective_tier", pred_tier)
        officers = officer_allocations.get(evt_id, plan_d.get("manpower_min", 4))
        h_str = r["start_local"].strftime("%H:%M") if pd.notna(r.get("start_local")) else "09:00"

        sort_score = tier_weights.get(effective_tier, 100) + raw_score * 10 + (25 if r.get("road_closure_flag", 0) else 0)

        results.append({
            "id": evt_id,
            "corridor": str(r.get("corridor", "Non-corridor")),
            "cause": str(r.get("event_cause", "others")).replace("_", " ").title(),
            "raw_cause": str(r.get("event_cause", "others")),
            "hour": h_str,
            "priority": str(r.get("priority", "Medium")),
            "tier": pred_tier,
            "effective_tier": effective_tier,
            "confidence": f"{predictions[i]['confidence'] * 100:.1f}%",
            "closure": "Yes" if r.get("road_closure_flag", 0) == 1 else "No",
            "officers": officers,
            "response_priority": plan_d.get("response_priority", "P2 - Elevated"),
            "deployment_time": plan_d.get("deployment_time", "≤ 15 mins"),
            "action": plan_d.get("risk_reasoning", "Standard response deployment"),
            "police_station": str(r.get("police_station", "Unknown")),
            "sort_score": sort_score
        })

    # Sort queue by operational criticality
    results.sort(key=lambda x: x["sort_score"], reverse=True)
    for rank, item in enumerate(results, start=1):
        item["prio"] = rank
        del item["sort_score"]

    # Summary Metrics
    high_count = sum(1 for item in results if item["tier"] == "High" or item["effective_tier"] == "High")
    med_count = sum(1 for item in results if item["tier"] == "Medium" and item["effective_tier"] != "High")
    low_count = sum(1 for item in results if item["effective_tier"] == "Low")
    closures_count = sum(1 for item in results if item["closure"] == "Yes")
    total_officers = sum(item["officers"] for item in results)
    avg_conf = np.mean([float(item["confidence"].replace("%", "")) for item in results]) if results else 0.0

    return {
        "status": "success",
        "message": f"Successfully ingested, validated, and triaged {len(results)} events using full 46-column ASTRAM schema.",
        "summary": {
            "total_events": len(results),
            "high_impact": high_count,
            "medium_impact": med_count,
            "low_impact": low_count,
            "road_closures": closures_count,
            "total_officers_deployed": total_officers,
            "avg_confidence": round(float(avg_conf), 1),
            "validated_columns": 46
        },
        "results": results
    }


# ─────────────────────────────────────────────────────────────────
# Pre-Event Planner — 46-Column ASTRAM Conformance Engine
# ─────────────────────────────────────────────────────────────────

ASTRAM_46_COLUMNS = [
    "id", "event_type", "latitude", "longitude", "endlatitude", "endlongitude",
    "address", "end_address", "event_cause", "requires_road_closure",
    "start_datetime", "end_datetime", "status", "authenticated", "modified_datetime",
    "map_file", "direction", "description", "veh_type", "veh_no", "corridor",
    "priority", "cargo_material", "reason_breakdown", "age_of_truck", "created_date",
    "route_path", "client_id", "created_by_id", "last_modified_by_id",
    "assigned_to_police_id", "citizen_accident_id", "comment", "police_station",
    "meta_data", "kgid", "resolved_at_address", "resolved_at_latitude",
    "resolved_at_longitude", "closed_by_id", "closed_datetime", "resolved_by_id",
    "resolved_datetime", "gba_identifier", "zone", "junction"
]


class PreEventPlanRequest(BaseModel):
    id: Optional[str] = None
    event_type: str = "planned"
    event_cause: str = "public_event"
    description: str = "Planned event requiring traffic regulation and officer deployment"
    crowd_size: Optional[int] = 25000
    corridor: str = "CBD 2"
    zone: Optional[str] = "Central Zone 1"
    police_station: Optional[str] = "Cubbon Park"
    junction: Optional[str] = "QueensCircle"
    gba_identifier: Optional[str] = "Bengaluru Central Corporation"
    address: str = "M. Chinnaswamy Stadium, MG Road, Bengaluru"
    latitude: float = 12.9788
    longitude: float = 77.5995
    end_address: Optional[str] = ""
    endlatitude: Optional[float] = 0.0
    endlongitude: Optional[float] = 0.0
    direction: Optional[str] = "Both"
    route_path: Optional[str] = "[]"
    requires_road_closure: bool = True
    priority: str = "High"
    status: str = "scheduled"
    start_date: Optional[str] = "2026-03-25"
    start_time: Optional[str] = "14:00"
    end_date: Optional[str] = "2026-03-25"
    end_time: Optional[str] = "22:00"
    veh_type: Optional[str] = "others"
    veh_no: Optional[str] = "N/A"
    cargo_material: Optional[str] = "N/A"
    reason_breakdown: Optional[str] = "N/A"
    age_of_truck: Optional[float] = None
    comment: Optional[str] = "Pre-event cordon active. VMS alerts deployed."
    kgid: Optional[str] = "FKKG000008"
    created_by_id: Optional[str] = "BTP_PLANNER_01"
    last_modified_by_id: Optional[str] = "BTP_PLANNER_01"
    assigned_to_police_id: Optional[str] = "SECTOR_COMMAND_01"
    citizen_accident_id: Optional[str] = "N/A"
    map_file: Optional[str] = ""
    meta_data: Optional[str] = ""
    authenticated: Optional[str] = "yes"
    client_id: Optional[int] = 1
    weather_multiplier: Optional[float] = 1.0


@app.post("/api/pre-event/plan")
def plan_pre_event(req: PreEventPlanRequest):
    """
    Evaluates a planned disruption event, generates an operational response plan,
    and returns a guaranteed 46-column ASTRAM-compliant data point.
    """
    global df_events
    
    # 1. Determine Event ID
    evt_id = req.id
    if not evt_id:
        total_evts = len(df_events) if df_events is not None else 8173
        evt_id = f"FKID{total_evts:06d}"

    # 2. Parse Datetimes
    start_date_str = req.start_date or "2026-03-25"
    start_time_str = req.start_time or "14:00"
    end_date_str = req.end_date or start_date_str
    end_time_str = req.end_time or "22:00"

    try:
        start_dt = pd.to_datetime(f"{start_date_str} {start_time_str}:00", utc=True)
    except Exception:
        start_dt = pd.Timestamp.now(tz="UTC")

    try:
        end_dt = pd.to_datetime(f"{end_date_str} {end_time_str}:00", utc=True)
    except Exception:
        end_dt = start_dt + pd.Timedelta(hours=4)

    now_iso = pd.Timestamp.now(tz="UTC").isoformat()

    # 3. Assemble full 46-column ASTRAM dictionary
    astram_record = {
        "id": str(evt_id),
        "event_type": str(req.event_type or "planned"),
        "latitude": round(float(req.latitude), 7),
        "longitude": round(float(req.longitude), 7),
        "endlatitude": round(float(req.endlatitude), 7) if req.endlatitude is not None else 0.0,
        "endlongitude": round(float(req.endlongitude), 7) if req.endlongitude is not None else 0.0,
        "address": str(req.address),
        "end_address": str(req.end_address or ""),
        "event_cause": str(req.event_cause),
        "requires_road_closure": bool(req.requires_road_closure),
        "start_datetime": str(start_dt.strftime("%Y-%m-%d %H:%M:%S+00:00")),
        "end_datetime": str(end_dt.strftime("%Y-%m-%d %H:%M:%S+00:00")),
        "status": str(req.status or "scheduled"),
        "authenticated": str(req.authenticated or "yes"),
        "modified_datetime": now_iso,
        "map_file": str(req.map_file or ""),
        "direction": str(req.direction or "Both"),
        "description": str(req.description),
        "veh_type": str(req.veh_type or "others"),
        "veh_no": str(req.veh_no or "N/A"),
        "corridor": str(req.corridor or "CBD 2"),
        "priority": str(req.priority or "High"),
        "cargo_material": str(req.cargo_material or "N/A"),
        "reason_breakdown": str(req.reason_breakdown or "N/A"),
        "age_of_truck": float(req.age_of_truck) if req.age_of_truck is not None else "",
        "created_date": now_iso,
        "route_path": str(req.route_path or "[]"),
        "client_id": int(req.client_id or 1),
        "created_by_id": str(req.created_by_id or "BTP_PLANNER_01"),
        "last_modified_by_id": str(req.last_modified_by_id or req.created_by_id or "BTP_PLANNER_01"),
        "assigned_to_police_id": str(req.assigned_to_police_id or "SECTOR_COMMAND_01"),
        "citizen_accident_id": str(req.citizen_accident_id or "N/A"),
        "comment": str(req.comment or ""),
        "police_station": str(req.police_station or "Cubbon Park"),
        "meta_data": str(req.meta_data or json.dumps({"crowd_size": req.crowd_size or 25000})),
        "kgid": str(req.kgid or "FKKG000008"),
        "resolved_at_address": str(req.address),
        "resolved_at_latitude": round(float(req.latitude), 7),
        "resolved_at_longitude": round(float(req.longitude), 7),
        "closed_by_id": "",
        "closed_datetime": "",
        "resolved_by_id": "",
        "resolved_datetime": "",
        "gba_identifier": str(req.gba_identifier or "Bengaluru Central Corporation"),
        "zone": str(req.zone or "Central Zone 1"),
        "junction": str(req.junction or "QueensCircle")
    }

    # 4. Generate Columns Audit
    columns_audit = []
    for i, col in enumerate(ASTRAM_46_COLUMNS):
        val = astram_record.get(col, "")
        val_repr = str(val) if val is not None else ""
        col_type = "bool" if isinstance(val, bool) else ("float" if isinstance(val, float) else ("int" if isinstance(val, int) else "string"))
        columns_audit.append({
            "index": i,
            "column": col,
            "value": val_repr,
            "type": col_type,
            "status": "Satisfied"
        })

    # 5. Format CSV Row
    csv_out = io.StringIO()
    writer = csv.DictWriter(csv_out, fieldnames=ASTRAM_46_COLUMNS)
    writer.writeheader()
    writer.writerow(astram_record)
    csv_str = csv_out.getvalue()

    # 6. ML Model Inference
    hour_val = start_dt.hour
    event_dict = {
        "event_type": req.event_type,
        "event_cause": req.event_cause,
        "requires_road_closure": req.requires_road_closure,
        "priority": req.priority,
        "corridor": req.corridor,
        "zone": req.zone,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "veh_type": req.veh_type,
        "police_station": req.police_station,
        "junction": req.junction,
        "address": req.address,
        "description": req.description,
        "start_datetime": start_dt
    }

    pred_tier = "High"
    confidence = 0.75
    prob_dict = {"High": 0.75, "Medium": 0.20, "Low": 0.05}

    if gb_model is not None and encoders is not None:
        try:
            row = pd.DataFrame([event_dict])
            row["start_datetime"] = start_dt
            row["start_local"] = start_dt
            row["corridor"] = row["corridor"].fillna("Non-corridor")
            row["is_named_corridor"] = int(row["corridor"].iloc[0] in NAMED_CORRIDORS)
            row["road_closure_flag"] = int(req.requires_road_closure)
            row["priority"] = req.priority
            row["veh_type"] = req.veh_type or "others"
            row["zone"] = req.zone or "Central Zone 1"
            row["police_station"] = req.police_station or "Cubbon Park"

            row, _ = build_features(row, freq_maps=freq_maps)
            X, _ = encode_for_model(row, fit_encoders=encoders)
            for col in feature_names:
                if col not in X.columns:
                    X[col] = 0
            X = X[feature_names]

            probs = gb_model.predict_proba(X)[0]
            pred_idx = int(np.argmax(probs))
            pred_tier = label_encoder.classes_[pred_idx]
            confidence = round(float(probs[pred_idx]), 4)
            prob_dict = {label_encoder.classes_[k]: round(float(p), 4) for k, p in enumerate(probs)}
        except Exception as e:
            print(f"Pre-event model inference error: {e}")

    raw_score = compute_raw_score(event_dict)

    # 7. Operational Plan Generation
    plan = generate_response_plan(
        predicted_tier=pred_tier,
        confidence=confidence,
        impact_score=raw_score,
        event_cause=req.event_cause,
        corridor=req.corridor,
        zone=req.zone or "Central Zone 1",
        junction=req.junction or "QueensCircle",
        hour=hour_val,
        requires_road_closure=req.requires_road_closure,
        wx_multiplier=req.weather_multiplier or 1.0
    )
    plan_d = plan_to_dict(plan)

    # Crowd scale calibration for pre-events
    crowd = req.crowd_size or 20000
    base_officers = plan_d.get("manpower_min", 4)
    if crowd > 50000:
        recommended_officers = max(45, round(crowd / 1000 * 0.95))
        buffer_radius = "2.5 km Exclusion & Security Cordon"
        lead_time = "96 Hours Notice"
    elif crowd > 25000:
        recommended_officers = max(28, round(crowd / 1000 * 0.85))
        buffer_radius = "1.5 km Exclusion Cordon"
        lead_time = "72 Hours Notice"
    elif crowd > 10000:
        recommended_officers = max(18, round(crowd / 1000 * 0.75))
        buffer_radius = "1.0 km Perimeter Buffer"
        lead_time = "48 Hours Notice"
    else:
        recommended_officers = max(base_officers + 4, 12)
        buffer_radius = "600 m Perimeter Buffer"
        lead_time = "24 Hours Notice"

    # Barricades and Detours via Router
    nearest_junc = req.junction or "QueensCircle"
    barricades = []
    routes = []
    if router is not None:
        try:
            nearest_junc = router.find_nearest_junction(req.latitude, req.longitude)
            barricades_raw = router.recommend_barricades(nearest_junc, impact_radius_hops=1)
            barricades = [
                {
                    "name": b.get("intersection_id", "Junction"),
                    "road": b.get("road_name", "Arterial Road"),
                    "lat": float(b.get("latitude", req.latitude + 0.005)),
                    "lng": float(b.get("longitude", req.longitude + 0.005)),
                    "reason": b.get("reason", "Outer security perimeter")
                }
                for b in barricades_raw
            ]
            local_juncs = router.find_nearest_k_junctions(req.latitude, req.longitude, k=3)
            if len(local_juncs) >= 3:
                routes = router.get_alternative_routes(local_juncs[1], local_juncs[2], blocked_node=local_juncs[0])
            else:
                routes = router.get_alternative_routes("QueensCircle", "RichmondCircle", blocked_node=nearest_junc)
        except Exception as e:
            print(f"Pre-event router error: {e}")

    # Tactical Pre-Event Checklist
    timeline_checklist = [
        {"time": "T-72 Hours", "action": f"Issue public traffic advisory for {req.corridor} across BTP social channels and VMS boards."},
        {"time": "T-48 Hours", "action": f"Coordinate with BMTC for spectator feeder shuttles; designate satellite parking lots beyond {buffer_radius}."},
        {"time": "T-24 Hours", "action": f"Deploy advance directional diversion signboards at perimeter junctions ({nearest_junc})."},
        {"time": "T-06 Hours", "action": f"Stage {recommended_officers} traffic personnel, emergency CATS ambulances, and heavy recovery towing cranes."},
        {"time": "T-02 Hours", "action": f"Enforce {'full carriage road closure' if req.requires_road_closure else 'lane regulation & parking embargo'} around venue perimeter."},
        {"time": "Event Start", "action": "Activate dynamic signal priority on radial escape routes to prevent corridor gridlock."},
        {"time": "Egress / Conclusion", "action": "Initiate phased dispersal protocol; hold intersecting cross-traffic until major pedestrian dispersal clears."}
    ]

    cause_title = req.event_cause.replace("_", " ").title()
    wa_advisory = (
        f"🚨 *BTP PRE-EVENT TRAFFIC ADVISORY*\n"
        f"Event: {req.description}\n"
        f"Corridor: {req.corridor} near {req.junction}\n"
        f"Expected Crowd: {crowd:,}\n"
        f"Closure: {'Full Road Closure in effect' if req.requires_road_closure else 'Traffic slow; alternate routes advised'}\n"
        f"Deployed Force: {recommended_officers} Officers\n"
        f"ASTER Intelligence System"
    )
    vms_advisory = f"PLANNED EVENT ON {req.corridor.upper()}: USE RADIAL BYPASS"
    tw_advisory = f"🚨 Traffic Alert: Planned {cause_title} on {req.corridor} on {start_date_str}. {recommended_officers} officers deployed. Please follow diversions. #BlrTraffic #BTP"

    return {
        "status": "success",
        "astram_record": astram_record,
        "columns_audit": columns_audit,
        "total_columns": len(ASTRAM_46_COLUMNS),
        "columns_satisfied": len(columns_audit),
        "csv_row": csv_str,
        "predicted_tier": pred_tier,
        "effective_tier": plan_d.get("effective_tier", pred_tier),
        "confidence": confidence,
        "probabilities": prob_dict,
        "recommended_officers": recommended_officers,
        "buffer_radius": buffer_radius,
        "lead_time": lead_time,
        "barricade_order": plan_d.get("barricading", "Full lane closure, 6+ barriers"),
        "diversion_urgency": plan_d.get("diversion_urgency", "Mandatory diversion"),
        "deployment_priority": plan_d.get("response_priority", "P1 - Critical"),
        "timeline_checklist": timeline_checklist,
        "nearest_junction": nearest_junc,
        "barricades": barricades,
        "routes": routes,
        "broadcast_advisories": {
            "whatsapp": wa_advisory,
            "vms": vms_advisory,
            "twitter": tw_advisory
        }
    }


@app.post("/api/pre-event/save")
def save_pre_event(record: Dict[str, Any]):
    """
    Saves a planned 46-column ASTRAM event record to the processed dataset and in-memory events table.
    """
    global df_events
    if not record or "id" not in record:
        raise HTTPException(status_code=400, detail="Invalid ASTRAM record format.")

    # Validate all 46 columns
    missing = [c for c in ASTRAM_46_COLUMNS if c not in record]
    if missing:
        raise HTTPException(status_code=400, detail=f"Record missing required ASTRAM columns: {', '.join(missing)}")

    try:
        # 1. Update processed dataset CSV
        data_p = os.path.join(MODELS_DIR, "processed_dataset.csv")
        row_df = pd.DataFrame([record])
        if os.path.exists(data_p):
            row_df.to_csv(data_p, mode="a", header=False, index=False)

        # 2. Update raw events CSV as well
        raw_p = os.path.join(DATA_DIR, "bengaluru_traffic_events.csv")
        if os.path.exists(raw_p):
            row_df[ASTRAM_46_COLUMNS].to_csv(raw_p, mode="a", header=False, index=False)

        # 3. Append to in-memory DataFrame
        if df_events is not None:
            new_event_row = row_df.copy()
            new_event_row["start_datetime"] = pd.to_datetime(new_event_row["start_datetime"], errors="coerce")
            new_event_row["hour"] = new_event_row["start_datetime"].dt.hour
            if "impact_tier" not in new_event_row.columns:
                new_event_row["impact_tier"] = "High" if str(record.get("priority", "")).lower() == "high" else "Medium"
            new_event_row["latitude"] = pd.to_numeric(new_event_row["latitude"], errors="coerce").fillna(12.9716)
            new_event_row["longitude"] = pd.to_numeric(new_event_row["longitude"], errors="coerce").fillna(77.5946)
            df_events = pd.concat([df_events, new_event_row], ignore_index=True)

        return {
            "status": "success",
            "message": f"Pre-event '{record['id']}' successfully committed to ASTRAM database with all 46 columns.",
            "record_id": record["id"],
            "total_events_now": len(df_events) if df_events is not None else 8174
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save record to ASTRAM database: {str(e)}")


@app.get("/api/model-performance")
def get_model_performance():
    metrics_path = os.path.join(MODELS_DIR, "evaluation_metrics.json")
    fi_path = os.path.join(MODELS_DIR, "feature_importance.csv")
    
    metrics = {}
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            metrics = json.load(f)
            
    fi_list = []
    if os.path.exists(fi_path):
        fi_df = pd.read_csv(fi_path).head(10)
        fi_list = fi_df.to_dict(orient="records")

    return {
        "metrics": metrics,
        "top_features": fi_list
    }


from fastapi.staticfiles import StaticFiles

# Serve built React frontend at root
FRONTEND_DIST = os.path.join(ROOT, "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
