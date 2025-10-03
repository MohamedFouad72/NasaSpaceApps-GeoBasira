# backend/main.py
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import requests
import os
from datetime import datetime, timezone

# -------------------------
# Utilities (inlined)
# -------------------------
NORTH_AMERICA_BBOX = {
    "min_lat": 7.0,
    "max_lat": 83.0,
    "min_lon": -168.0,
    "max_lon": -52.0
}

def in_north_america(lat: float, lon: float) -> bool:
    return (
        NORTH_AMERICA_BBOX["min_lat"] <= lat <= NORTH_AMERICA_BBOX["max_lat"] and
        NORTH_AMERICA_BBOX["min_lon"] <= lon <= NORTH_AMERICA_BBOX["max_lon"]
    )

def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

# -------------------------
# Recommendation generator
# -------------------------
def generate_recommendations(report: Dict[str, Any]) -> Dict[str, Any]:
    recs = []

    pollutants = report.get("pollutants", {})
    # pollutant keys are expected to be like 'pm2_5', 'nitrogen_dioxide', etc.
    def get_val(k):
        v = pollutants.get(k)
        if isinstance(v, dict):
            return v.get("value")
        return None

    aod = get_val("aerosol_optical_depth")
    pm25 = get_val("pm2_5")
    no2 = get_val("nitrogen_dioxide")
    o3 = get_val("ozone")
    co = get_val("carbon_monoxide")

    if pm25 is not None:
        recs.append({
            "text": f"PM2.5 is {pm25:.1f} µg/m³ — sensitive people should reduce outdoor exertion.",
            "priority": "high" if pm25 > 55 else "medium" if pm25 > 35 else "low",
            "reason": "Fine particulate matter (PM2.5) affects lungs and heart."
        })
    if no2 is not None:
        recs.append({
            "text": f"NO2 is {no2:.1f} µg/m³ — people with respiratory conditions should be cautious.",
            "priority": "medium" if no2 > 50 else "low",
            "reason": "Nitrogen dioxide can irritate airways."
        })
    if o3 is not None:
        recs.append({
            "text": f"Ozone (O3) is {o3:.1f} µg/m³ — avoid heavy outdoor exercise if possible.",
            "priority": "medium" if o3 > 100 else "low",
            "reason": "Ozone at ground level can irritate lungs."
        })
    if co is not None:
        recs.append({
            "text": f"Carbon Monoxide (CO) is {co:.1f} µg/m³ — avoid enclosed poorly ventilated areas near traffic.",
            "priority": "medium" if co > 1000 else "low",
            "reason": "CO displaces oxygen at high concentrations."
        })
    if aod is not None:
        recs.append({
            "text": f"Aerosol Index (AOD) is {aod:.2f} — high values indicate many particles in air.",
            "priority": "low",
            "reason": "High aerosol load often corresponds to reduced air quality."
        })

    # Weather influence
    weather = report.get("weather", {})
    wind = weather.get("wind_speed_10m") or weather.get("wind_speed_10m_mean")
    rain = weather.get("precipitation") or weather.get("precipitation_mean")
    if wind is not None:
        recs.append({
            "text": f"Wind speed {wind:.1f} m/s — wind helps dispersion of pollutants.",
            "priority": "low",
            "reason": "Higher wind tends to reduce local pollutant concentration."
        })
    if rain is not None and rain > 0:
        recs.append({
            "text": f"Precipitation {rain:.1f} mm — rain may improve air quality.",
            "priority": "low",
            "reason": "Rain scavenges particles from the air."
        })

    report["recommendations"] = recs
    return report

# -------------------------
# Fetching functions
# -------------------------
POLLUTANTS = [
    "pm2_5","pm10","carbon_monoxide","carbon_dioxide","nitrogen_dioxide",
    "ozone","sulphur_dioxide","methane","aerosol_optical_depth"
]

def fetch_air_quality_open_meteo(lat: float, lon: float, hours: int = 48) -> Dict[str, Any]:
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join(POLLUTANTS),
        "forecast_days": max(1, int(hours / 24)),
        "timezone": "UTC"
    }
    try:
        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        # Return empty dict on failure; frontend should handle missing data gracefully
        print(f"[warn] Open-Meteo air-quality fetch failed: {e}")
        return {}

    pollutants_data: Dict[str, Dict[str, Any]] = {}
    hourly = data.get("hourly", {})
    units = data.get("hourly_units", {})
    # Take first timestep as representative (you may want mean/percentile instead)
    if "time" in hourly:
        for key, values in hourly.items():
            if key == "time":
                continue
            try:
                first_val = values[0] if isinstance(values, list) and values else None
                pollutants_data[key] = {
                    "value": float(first_val) if first_val is not None else None,
                    "unit": units.get(key, "")
                }
            except Exception:
                pollutants_data[key] = {"value": None, "unit": units.get(key, "")}
    return pollutants_data

def fetch_weather_open_meteo(lat: float, lon: float, hours: int = 48) -> Dict[str, Any]:
    url = "https://api.open-meteo.com/v1/forecast"
    weather_vars = ["temperature_2m","wind_speed_10m","precipitation","relativehumidity_2m","uv_index","cloudcover"]
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join(weather_vars),
        "forecast_days": max(1, int(hours / 24)),
        "timezone": "UTC"
    }
    try:
        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[warn] Open-Meteo weather fetch failed: {e}")
        return {}

    weather_out = {}
    hourly = data.get("hourly", {})
    units = data.get("hourly_units", {})
    if "time" in hourly:
        # pick first timestep as representative
        for key in weather_vars:
            try:
                val = hourly.get(key, [None])[0]
                weather_out[key] = float(val) if val is not None else None
            except Exception:
                weather_out[key] = None
    return weather_out

def fetch_openaq(lat: float, lon: float, radius_m: int = 5000) -> Optional[Dict[str, Any]]:
    """
    Optional: call OpenAQ to get nearby station means.
    Requires environment variable OPENAQ_API_KEY if you want higher limits; otherwise anonymous calls may work.
    This returns a simple list of pollutant means or None if not available.
    """
    api_key = os.environ.get("OPENAQ_API_KEY")
    try:
        base = "https://api.openaq.org/v2/measurements"
        params = {
            "coordinates": f"{lat},{lon}",
            "radius": radius_m,
            "limit": 100,
            "sort": "desc"
        }
        headers = {}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        resp = requests.get(base, params=params, headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])
        if not results:
            return None
        # compute mean per parameter
        agg = {}
        counts = {}
        for r in results:
            p = r.get("parameter")
            v = r.get("value")
            if p is None or v is None:
                continue
            agg[p] = agg.get(p, 0.0) + float(v)
            counts[p] = counts.get(p, 0) + 1
        out = [{"name": p, "mean_value": agg[p] / counts[p]} for p in agg.keys()]
        return {"pollutants": out}
    except Exception as e:
        print(f"[info] OpenAQ fetch skipped/failed: {e}")
        return None

# -------------------------
# Report generator
# -------------------------
def generate_report(lat: float, lon: float, hours: int = 48) -> Dict[str, Any]:
    # optional geographic guard (uncomment if you want)
    # if not in_north_america(lat, lon):
    #     return {"error": "Coordinates are outside North America."}

    pollutants = fetch_air_quality_open_meteo(lat, lon, hours=hours)
    weather = fetch_weather_open_meteo(lat, lon, hours=hours)
    openaq = fetch_openaq(lat, lon)

    report = {
        "lat": lat,
        "lon": lon,
        "timestamp": utc_timestamp(),
        "pollutants": pollutants,
        "weather": weather,
        "openaq": openaq
    }

    report = generate_recommendations(report)
    return report

# -------------------------
# Pydantic models for response
# -------------------------
class Recommendation(BaseModel):
    text: str
    priority: str
    reason: str

class WeatherPollutant(BaseModel):
    value: Optional[float]
    unit: Optional[str] = ""

class Pollutant(BaseModel):
    name: str
    mean_value: float

class AirWeatherData(BaseModel):
    lat: float
    lon: float
    pollutants: Dict[str, WeatherPollutant]
    openaq_pollutants: Optional[List[Pollutant]] = None

class FullResponse(BaseModel):
    data: AirWeatherData
    recommendations: List[Recommendation]

# -------------------------
# FastAPI app & endpoint
# -------------------------
app = FastAPI(title="GeoBasira Backend (FastAPI)")

# CORS - allow your frontend origin(s)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",  # optional
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/air_weather", response_model=FullResponse)
def air_weather(lat: float = Query(...), lon: float = Query(...), hours: int = Query(48)):
    """
    Example: GET /air_weather?lat=40.7128&lon=-74.0060&hours=48
    Returns aggregated Open-Meteo + optional OpenAQ data and simple recommendations.
    """
    try:
        report = generate_report(lat, lon, hours=hours)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")

    # Build AirWeatherData pydantic model
    pollutants_pyd = {}
    for k, v in (report.get("pollutants") or {}).items():
        # ensure correct shape for Pydantic
        if isinstance(v, dict):
            pollutants_pyd[k] = WeatherPollutant(value=v.get("value"), unit=v.get("unit"))
        else:
            pollutants_pyd[k] = WeatherPollutant(value=None, unit="")

    openaq_list = None
    openaq_obj = report.get("openaq")
    if openaq_obj and isinstance(openaq_obj, dict) and "pollutants" in openaq_obj:
        openaq_list = []
        for p in openaq_obj["pollutants"]:
            try:
                openaq_list.append(Pollutant(name=p.get("name"), mean_value=float(p.get("mean_value"))))
            except Exception:
                continue

    data = AirWeatherData(
        lat=report.get("lat"),
        lon=report.get("lon"),
        pollutants=pollutants_pyd,
        openaq_pollutants=openaq_list
    )

    # Convert generate_recommendations output to Recommendation pydantic list
    recs = []
    for r in report.get("recommendations", []):
        recs.append(Recommendation(text=r.get("text", ""), priority=r.get("priority", "low"), reason=r.get("reason", "")))

    return FullResponse(data=data, recommendations=recs)

# -------------------------
# Run server if executed directly
# -------------------------
if __name__ == "__main__":
    import uvicorn
    # port 8000 used earlier in conversation; change if needed
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

    
