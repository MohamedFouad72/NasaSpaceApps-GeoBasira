from datetime import datetime, timezone
from typing import Dict, Any

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
