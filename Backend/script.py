# backend/main.py
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import requests
import os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
load_dotenv()
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
    print(f"[debug] fetch_air_quality_open_meteo called for {lat},{lon}")
    try:
        # use requests.get directly (or session if you already added one)
        resp = requests.get(url, params=params, timeout=15)
        print(f"[debug] Open-Meteo AQ HTTP {resp.status_code} for {url}")
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        # NO placeholder values here — only log the failure and return empty dict
        print(f"[warn] Open-Meteo air-quality fetch failed for {lat},{lon}: {e}")
        return {}

    pollutants_data: Dict[str, Dict[str, Any]] = {}
    hourly = data.get("hourly", {}) or {}
    units = data.get("hourly_units", {}) or {}
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
            except Exception as e:
                print(f"[warn] parsing open-meteo key '{key}' failed: {e}")
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
    print(f"[debug] fetch_weather_open_meteo called for {lat},{lon}")
    try:
        resp = requests.get(url, params=params, timeout=15)
        print(f"[debug] Open-Meteo weather HTTP {resp.status_code} for {url}")
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[warn] Open-Meteo weather fetch failed for {lat},{lon}: {e}")
        return {}

    weather_out = {}
    hourly = data.get("hourly", {}) or {}
    if "time" in hourly:
        for key in weather_vars:
            try:
                val = hourly.get(key, [None])[0]
                weather_out[key] = float(val) if val is not None else None
            except Exception as e:
                print(f"[warn] parsing weather key '{key}' failed: {e}")
                weather_out[key] = None
    return weather_out

def fetch_openaq(lat, lon, radius_m=20000, days=7, max_locations=3):
    from openaq import OpenAQ
    api_key = os.environ.get("OPENAQ_API_KEY")
    pollutants_result = []
    print(f"[debug] fetch_openaq called for {lat},{lon}")

    try:
        client = OpenAQ(api_key=api_key)
        dt_to = datetime.now(timezone.utc).replace(microsecond=0)
        dt_from = dt_to - timedelta(days=days)

        locs = client.locations.list(
            coordinates=(lat, lon),
            radius=radius_m,
            limit=max_locations
        ).results

        if locs:
            all_meas = []
            for loc in locs:
                sensors = client.locations.sensors(locations_id=loc.id).results
                for s in sensors:
                    meas = client.measurements.list(
                        sensors_id=s.id,
                        datetime_from=dt_from,
                        datetime_to=dt_to,
                        limit=100
                    ).results
                    for m in meas:
                        param_name = s.parameter.get('displayName') if isinstance(s.parameter, dict) else s.parameter
                        if m.value is not None and isinstance(m.value, (int, float)) and m.value >= 0:
                            all_meas.append({
                                "location": loc.name,
                                "pollutant": param_name,
                                "value": m.value
                            })

            if all_meas:
                import pandas as pd
                df = pd.DataFrame(all_meas)
                pollutant_means = df.groupby('pollutant')['value'].mean().reset_index()
                for _, row in pollutant_means.iterrows():
                    pollutants_result.append({
                        "name": row['pollutant'],
                        "mean_value": float(row['value'])
                    })

    except Exception as e:
        # log but DO NOT return placeholder values
        print(f"[warn] OpenAQ fetch failed for {lat},{lon}: {e}")
        # Try a lightweight REST fallback (best-effort). If that fails, we return empty array.
        try:
            rest_url = "https://api.openaq.org/v2/measurements"
            params = {
                "coordinates": f"{lat},{lon}",
                "radius": radius_m,
                "limit": 100,
                "date_from": (datetime.now(timezone.utc) - timedelta(days=days)).isoformat(),
                "date_to": datetime.now(timezone.utc).isoformat()
            }
            print(f"[debug] OpenAQ REST fallback request -> {rest_url} params={params}")
            r = requests.get(rest_url, params=params, timeout=15)
            print(f"[debug] OpenAQ REST HTTP {r.status_code}")
            r.raise_for_status()
            j = r.json()
            results = j.get("results", []) or []
            if results:
                agg = {}
                for it in results:
                    param = it.get("parameter")
                    val = it.get("value")
                    if param and isinstance(val, (int, float)) and val >= 0:
                        agg.setdefault(param, []).append(val)
                for param, vals in agg.items():
                    pollutants_result.append({"name": param, "mean_value": float(sum(vals) / len(vals))})
        except Exception as e2:
            print(f"[warn] OpenAQ REST fallback also failed for {lat},{lon}: {e2}")
            # Finally: return empty list (no placeholders)
            pollutants_result = []

    # Return empty list (not placeholder) if nothing found
    return {"lat": lat, "lon": lon, "pollutants": pollutants_result}




def generate_gemini_recommendations(flat_pollutants: dict, top_n: int = 3, location_name: str = "Unknown"):
    """
    Generate exactly top_n health/outdoor recommendations using Gemini.
    flat_pollutants: dict where key = pollutant name (str), value = float
    """
    import google.generativeai as genai
    import json
    import os
    
    genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
    model = genai.GenerativeModel("models/gemini-2.5-pro")

    combined = {**flat_pollutants, "location": location_name}
    prompt = f"""
            You are an environmental health assistant.
            Here is today's air-pollution data for {combined['location']}:

            {json.dumps(combined, indent=2)}

            Based on these values, give *exactly {top_n} concise health and outdoor-activity recommendations*.
            ⚠ Respond *only in English*.
            Return output strictly as a JSON array with the following fields:
            - text: short English recommendation
            - priority: high | medium | low
            - reason: a user-friendly explanation of WHY this recommendation matters
            """
    try:
        response = model.generate_content(prompt)
        raw = (response.text or "").strip()

        # Remove surrounding markdown fences if present (e.g. json ... ).
        if raw.startswith(""):
            # drop the first fence line (e.g. "json" or "")
            first_nl = raw.find("\n")
            if first_nl != -1:
                raw = raw[first_nl + 1 :].rstrip()
            # drop trailing fence
            if raw.endswith(""):
                raw = raw[: -3].strip()

        # If result contains extra text, extract the first JSON array it contains
        if not raw.lstrip().startswith("["):
            a = raw.find("[")
            b = raw.rfind("]")
            if a != -1 and b != -1 and b > a:
                raw = raw[a : b + 1]

        recs = json.loads(raw)
        if not isinstance(recs, list):
            raise ValueError("parsed Gemini output is not a JSON array")
        return recs

    except Exception as e:
        # helpful debug prints (safe to remove in production)
        print("Gemini error:", e)
        try:
            print("raw response (truncated 1000 chars):", (response.text or "")[:1000])
        except Exception:
            pass
        return []



# -------------------------
# Report generator
# -------------------------
def generate_report(lat: float, lon: float, hours: int = 48) -> dict:
    pollutants = fetch_air_quality_open_meteo(lat, lon, hours=hours)
    weather = fetch_weather_open_meteo(lat, lon, hours=hours)
    openaq = fetch_openaq(lat, lon)

    # Merge OpenAQ into OpenMeteo, OpenAQ takes priority
    if openaq and "pollutants" in openaq:
        for p in openaq["pollutants"]:
            key = p["name"].lower().replace(".", "").replace("-", "")
            pollutants[key] = {"value": float(p["mean_value"]), "unit": "µg/m³"}

    # Prepare combined dict for Gemini
    flat_pollutants = {k: v["value"] for k, v in pollutants.items() if v.get("value") is not None}

    # Correct call: top_n=3, include a location name (use lat/lon or a friendly name)
    recommendations = generate_gemini_recommendations(flat_pollutants, top_n=3, location_name=f"{lat},{lon}")
    if not recommendations:
        tmp_report = {"pollutants": pollutants, "weather": weather}
        fallback = generate_recommendations(tmp_report)
        recommendations = fallback.get("recommendations", [])

    report = {
        "lat": lat,
        "lon": lon,
        "timestamp": utc_timestamp(),
        "pollutants": pollutants,
        "weather": weather,
        "openaq": openaq,
        "recommendations": recommendations
    }
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
    "http://127.0.0.1:3000",
    "https://geobasira.earth/"
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
class Coordinates(BaseModel):
    lat: float
    lon: float

def build_fullresponse_from_report(report: dict) -> FullResponse:
    pollutants_pyd = {}
    for k, v in (report.get("pollutants") or {}).items():
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

    recs = []
    for r in report.get("recommendations", []):
        recs.append(Recommendation(text=r.get("text", ""), priority=r.get("priority", "low"), reason=r.get("reason", "")))

    return FullResponse(data=data, recommendations=recs)


@app.post("/coords")
def receive_coords(coords: Coordinates):
    lat = coords.lat
    lon = coords.lon
    print(f"Received coords: lat={lat}, lon={lon}")

    report = generate_report(lat, lon, 48)
    # Return as JSON matching the exact shape required
    return report

# @app.get("/air_weather", response_model=FullResponse)
# def air_weather(lat: float = Query(...), lon: float = Query(...), hours: int = Query(48)):
#     try:
#         report = generate_report(lat, lon, hours=hours)
#         print(
#             f"[info] Generated report for lat={lat}, lon={lon} at {report.get('timestamp')}"
#         )
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")

#     return report
# -------------------------
# Run server if executed directly
# -------------------------
if __name__ == "__main__":
    import uvicorn
    # port 8000 used earlier in conversation; change if needed
    uvicorn.run(app, host="0.0.0.0", port=8000)