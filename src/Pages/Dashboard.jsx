import React, { useState } from "react";

function Dashboard() {
  const [lat, setLat] = useState("31.438037");
  const [lon, setLon] = useState("31.438037");
  const [hours, setHours] = useState(48);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Change this if your backend runs on a different port
  const baseUrl = "http://127.0.0.1:8000/air_weather";

  const validateCoords = (latVal, lonVal) => {
    const la = parseFloat(latVal);
    const lo = parseFloat(lonVal);
    if (Number.isNaN(la) || Number.isNaN(lo))
      return "Latitude and longitude must be valid numbers.";
    if (la < -90 || la > 90) return "Latitude must be between -90 and 90.";
    if (lo < -180 || lo > 180) return "Longitude must be between -180 and 180.";
    return null;
  };

  const fetchData = async () => {
    setError(null);
    setData(null);

    const valError = validateCoords(lat, lon);
    if (valError) {
      setError(valError);
      return;
    }

    const la = parseFloat(lat);
    const lo = parseFloat(lon);
    // const h = Math.max(1, parseInt(hours || 48, 10));

    const url = `${baseUrl}?lat=${encodeURIComponent(
      la
    )}&lon=${encodeURIComponent(lo)}`;

    setLoading(true);
    try {
      // timeout helper (optional)
      const controller = new AbortController();

      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        let detail = "";
        try {
          const errJson = await res.json();
          detail = errJson.detail ? `: ${errJson.detail}` : "";
        } catch (e) {
          setError(e.message || "Unknown error");
        }
        throw new Error(`HTTP ${res.status}${detail}`);
      }

      const jsonData = await res.json();
      setData(jsonData);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.name === "AbortError") setError("Request timed out.");
      else setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const prettyJSON = (obj) =>
    JSON.stringify(
      obj,
      (k, v) => {
        if (typeof v === "number") return Math.round(v * 100) / 100;
        return v;
      },
      2
    );

  // helper to render pollutants safely
  const renderPollutants = (polls) => {
    if (!polls || typeof polls !== "object")
      return <div>No pollutant data</div>;
    const keys = Object.keys(polls);
    if (keys.length === 0) return <div>No pollutant data</div>;

    return (
      <ul style={{ paddingLeft: 16 }}>
        {keys.map((k) => {
          const v = polls[k];
          // v is expected { value: number|null, unit: string }
          const val = v && typeof v === "object" ? v.value : v;
          const unit = v && typeof v === "object" ? v.unit || "" : "";
          return (
            <li key={k} style={{ marginBottom: 6 }}>
              <strong style={{ textTransform: "uppercase" }}>{k}</strong>:{" "}
              {val === null || val === undefined
                ? "—"
                : Math.round(val * 100) / 100}{" "}
              {unit}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div style={{ padding: "20px", marginTop: "80px", maxWidth: 900 }}>
      <h1>GeoBasira — Weather & Air Quality</h1>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <label
          style={{ display: "flex", flexDirection: "column", fontSize: 14 }}
        >
          Latitude
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            style={{ padding: 8, width: 160, marginTop: 6 }}
          />
        </label>

        <label
          style={{ display: "flex", flexDirection: "column", fontSize: 14 }}
        >
          Longitude
          <input
            type="text"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            style={{ padding: 8, width: 160, marginTop: 6 }}
          />
        </label>

        <label
          style={{ display: "flex", flexDirection: "column", fontSize: 14 }}
        >
          Hours (forecast window)
          <input
            type="number"
            value={hours}
            min={1}
            onChange={(e) => setHours(e.target.value)}
            style={{ padding: 8, width: 120, marginTop: 6 }}
          />
        </label>

        <div>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              padding: "10px 16px",
              background: loading ? "#999" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Fetching…" : "Fetch Data"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 16,
            color: "crimson",
            background: "#fff0f0",
            padding: 10,
            borderRadius: 6,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <div
          style={{
            marginTop: 20,
            display: "grid",
            gap: 12,
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 8,
              background: "#f8fafc",
              border: "1px solid #e6eefc",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Summary</h3>
            <p>
              <strong>Location:</strong> {data.data?.lat ?? "—"},{" "}
              {data.data?.lon ?? "—"}
            </p>
            {/* timestamp may not be present in data.data depending on backend model */}
            <p>
              <strong>Timestamp:</strong> {data.data?.timestamp ?? "N/A"}
            </p>

            <h4 style={{ marginBottom: 6 }}>Pollutants</h4>
            {renderPollutants(data.data?.pollutants)}

            <h4 style={{ marginTop: 12 }}>Recommendations</h4>
            {Array.isArray(data.recommendations) &&
            data.recommendations.length > 0 ? (
              <ul>
                {data.recommendations.map((r, idx) => (
                  <li key={idx} style={{ marginBottom: 8 }}>
                    <strong>[{r.priority}]</strong> {r.text}
                    <div style={{ fontSize: 12, color: "#555" }}>
                      {r.reason}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recommendations returned.</p>
            )}
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Full API Response</h3>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                maxHeight: 360,
                overflow: "auto",
                fontSize: 13,
              }}
            >
              {prettyJSON(data)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
