from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .models import FullResponse, Coordinates, AirWeatherData, WeatherPollutant, Pollutant, Recommendation
from .services import generate_report

load_dotenv()

app = FastAPI(title="GeoBasira Backend (FastAPI)")

# CORS - allow your frontend origin(s)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",  # optional
    "http://127.0.0.1:3000",
    "https://geobasira.earth",
    "https://www.geobasira.earth"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "GeoBasira Backend is running. Go to /docs for API documentation."}

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
            pollutants_pyd[k] = WeatherPollutant(
                value=v.get("value"), 
                unit=v.get("unit"),
                history=v.get("history", []),
                times=v.get("times", [])
            )
        else:
            pollutants_pyd[k] = WeatherPollutant(value=None, unit="", history=[], times=[])

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

@app.post("/coords")
def receive_coords(coords: Coordinates):
    lat = coords.lat
    lon = coords.lon
    print(f"Received coords: lat={lat}, lon={lon}")

    report = generate_report(lat, lon, 48)
    # Return as JSON matching the exact shape required
    return report

if __name__ == "__main__":
    import uvicorn
    import os
    # port 8000 used locally; Render/Railway will provide a PORT env var
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

