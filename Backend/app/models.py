from pydantic import BaseModel
from typing import List, Dict, Optional

class Recommendation(BaseModel):
    text: str
    priority: str
    reason: str

class WeatherPollutant(BaseModel):
    value: Optional[float]
    unit: Optional[str] = ""
    history: Optional[List[float]] = []
    times: Optional[List[str]] = []

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

class Coordinates(BaseModel):
    lat: float
    lon: float
