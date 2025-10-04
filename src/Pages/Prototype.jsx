import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Chart } from "chart.js/auto";
import "../CSS/prototype.css";

const MOCK_DATA = {
  California: {
    center: [36.7783, -119.4179],
    bounds: [
      [32.5, -124.5],
      [42, -114],
    ],
    summary: {
      pm25: 42,
      aqi: 110,
      risk: "Unhealthy for Sensitive Groups",
      recommendation: "Reduce prolonged outdoor exertion.",
    },
    timeseries: [
      { time: "2025-09-19", pm25: 35 },
      { time: "2025-09-20", pm25: 40 },
      { time: "2025-09-21", pm25: 42 },
      { time: "2025-09-22", pm25: 48 },
      { time: "2025-09-23", pm25: 44 },
      { time: "2025-09-24", pm25: 39 },
      { time: "2025-09-25", pm25: 36 },
    ],
  },
  Texas: {
    center: [31.9686, -99.9018],
    bounds: [
      [25.8, -106.7],
      [36.5, -93.5],
    ],
    summary: {
      pm25: 28,
      aqi: 85,
      risk: "Moderate",
      recommendation:
        "People unusually sensitive should consider reducing prolonged outdoor exertion.",
    },
    timeseries: [
      { time: "2025-09-19", pm25: 24 },
      { time: "2025-09-20", pm25: 26 },
      { time: "2025-09-21", pm25: 27 },
      { time: "2025-09-22", pm25: 30 },
      { time: "2025-09-23", pm25: 29 },
      { time: "2025-09-24", pm25: 28 },
      { time: "2025-09-25", pm25: 28 },
    ],
  },
  "New York": {
    center: [43.0004, -75.4999],
    bounds: [
      [40.5, -79.0],
      [45.0, -71.8],
    ],
    summary: {
      pm25: 22,
      aqi: 70,
      risk: "Good to Moderate",
      recommendation: "No special precautions recommended.",
    },
    timeseries: [
      { time: "2025-09-19", pm25: 20 },
      { time: "2025-09-20", pm25: 21 },
      { time: "2025-09-21", pm25: 22 },
      { time: "2025-09-22", pm25: 23 },
      { time: "2025-09-23", pm25: 24 },
      { time: "2025-09-24", pm25: 22 },
      { time: "2025-09-25", pm25: 21 },
    ],
  },
};

const GeoBasira = () => {
  const STATES = Object.keys(MOCK_DATA);
  const [selectedState, setSelectedState] = useState(STATES[0]);
  const [vizType, setVizType] = useState("Time Series");
  const mapRef = useRef(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const rectRef = useRef(null);

  useEffect(() => {
    // Init map
    mapRef.current = L.map("map", { minZoom: 3 }).setView([40, -100], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapRef.current);

    selectState(STATES[0]);

    return () => {
      mapRef.current.remove();
    };
  }, []);

  const selectState = (s) => {
    setSelectedState(s);
    const d = MOCK_DATA[s];

    // fly map
    mapRef.current.flyTo(d.center, 6, { duration: 0.8 });

    // draw rectangle
    if (rectRef.current) mapRef.current.removeLayer(rectRef.current);
    rectRef.current = L.rectangle(d.bounds, {
      color: "#f97316",
      weight: 2,
      fillOpacity: 0.06,
    }).addTo(mapRef.current);

    updateChartForState(s, vizType);
  };

  const updateChartForState = (s, viz) => {
    const d = MOCK_DATA[s];
    const labels = d.timeseries.map((x) => x.time);
    const values = d.timeseries.map((x) => x.pm25);

    const ctx = chartRef.current.getContext("2d");
    if (chartInstance.current) chartInstance.current.destroy();

    if (viz === "Time Series") {
      chartInstance.current = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "PM2.5 (µg/m³)",
              data: values,
              borderWidth: 2,
              tension: 0.3,
            },
          ],
        },
      });
    } else if (viz === "Ground vs Satellite") {
      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Ground PM2.5 (µg/m³)",
              data: values,
              borderWidth: 1,
            },
          ],
        },
      });
    }
  };

  useEffect(() => {
    updateChartForState(selectedState, vizType);
  }, [vizType]);

  return (
    <div className="container">
      {/* LEFT PANEL */}
      <aside className="left-panel">
        <h3>Search by state</h3>
        <input
          placeholder="Search states..."
          onChange={(e) => console.log(e.target.value)}
        />
        <div className="state-list">
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => selectState(s)}
              className={s === selectedState ? "selected" : ""}
            >
              <div>{s}</div>
              <div className="small">
                {MOCK_DATA[s].summary.aqi} AQI • PM2.5{" "}
                {MOCK_DATA[s].summary.pm25} µg/m³
              </div>
            </button>
          ))}
        </div>
        <div className="result">
          <div className="big">
            {MOCK_DATA[selectedState].summary.pm25} µg/m³
          </div>
          <div className="small">{MOCK_DATA[selectedState].summary.risk}</div>
          <div>{MOCK_DATA[selectedState].summary.recommendation}</div>
        </div>
      </aside>

      {/* CENTER MAP */}
      <main className="map-panel">
        <div id="map"></div>
      </main>

      {/* RIGHT PANEL */}
      <aside className="right-panel">
        <h3>Visualizations</h3>
        <select value={vizType} onChange={(e) => setVizType(e.target.value)}>
          <option>Time Series</option>
          <option>PM2.5 Heatmap</option>
          <option>Ground vs Satellite</option>
          <option>Wind vs PM2.5</option>
        </select>

        <div className="chart">
          <canvas ref={chartRef}></canvas>
        </div>
      </aside>
    </div>
  );
};

export default GeoBasira;
