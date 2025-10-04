import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../CSS/prototype.css";

// Fix default leaflet icon paths (Vite/CRA sometimes require this)
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export default function Prototype() {
  const mapContainerRef = useRef(null); // DOM element for Leaflet
  const mapRef = useRef(null); // Leaflet map instance
  const markerRef = useRef(null); // current marker (so we can remove/update it)

  const [report, setReport] = useState(null); // server JSON (FullResponse)
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // Helper to clear marker + report
  const clearMarkerAndReport = () => {
    try {
      if (markerRef.current && mapRef.current) {
        mapRef.current.removeLayer(markerRef.current);
      }
    } catch (error) {
      console.log("Error during cleanup:", error);
    }
    markerRef.current = null;
    setReport(null);
    setShowRaw(false);
    setLoading(false);
  };

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    // Initialize map (center North America)
    mapRef.current = L.map(mapContainerRef.current).setView(
      [39.8283, -98.5795],
      4
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapRef.current);

    const onClick = async (e) => {
      const { lat, lng } = e.latlng;
      console.log("Clicked:", lat, lng);

      // -- Marker behavior (IMMEDIATE) --
      // Remove previous marker if present
      if (markerRef.current && mapRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      // Add a new marker immediately and show a "Loading..." popup
      if (mapRef.current) {
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
        markerRef.current
          .bindPopup(
            `<b>Coordinates</b><br/>Lat: ${lat.toFixed(
              3
            )}<br/>Lon: ${lng.toFixed(3)}<hr/><em>Loading…</em>`
          )
          .openPopup();
      }

      // Reset previous report & show loading in sidebar
      setReport(null);
      setShowRaw(false);
      setLoading(true);

      // -- Fetch backend (as before) --
      try {
        const res = await fetch("http://127.0.0.1:8000/coords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lon: lng }),
        });

        if (!res.ok) {
          console.error(
            "HTTP error from backend:",
            res.status,
            await res.text()
          );
          setLoading(false);
          // Update marker popup to indicate error (if marker still exists)
          if (markerRef.current) {
            markerRef.current
              .bindPopup(
                `<b>Coordinates</b><br/>Lat: ${lat.toFixed(
                  3
                )}<br/>Lon: ${lng.toFixed(
                  3
                )}<hr/><strong>Error fetching data</strong>`
              )
              .openPopup();
          }
          return;
        }

        const json = await res.json();
        console.log("Server response:", json);
        setReport(json);

        // Update the marker popup to show a short summary (first recommendation if present)
        try {
          let popupHtml = `<b>Coordinates</b><br/>Lat: ${lat.toFixed(
            3
          )}<br/>Lon: ${lng.toFixed(3)}`;

          // If recommendations exist, show the first one in the popup
          if (
            json &&
            Array.isArray(json.recommendations) &&
            json.recommendations.length > 0
          ) {
            const first = json.recommendations[0];
            popupHtml += `<hr/><strong>${first.text}</strong><div style="font-size:11px;color:#444">${first.reason} <em>(${first.priority})</em></div>`;
          } else if (json && json.data && json.data.pollutants) {
            // Otherwise try to show a small pollutant summary (first non-null pollutant)
            const pollutants = json.data.pollutants;
            const firstKey = Object.keys(pollutants).find(
              (k) => pollutants[k] && pollutants[k].value != null
            );
            if (firstKey) {
              const p = pollutants[firstKey];
              popupHtml += `<hr/>${firstKey}: ${p.value} ${p.unit || ""}`;
            }
          }

          if (markerRef.current) {
            markerRef.current.bindPopup(popupHtml).openPopup();
          }
        } catch (err) {
          console.error("Failed to update marker popup with server data:", err);
        }
      } catch (err) {
        console.error("Error sending coords:", err);
        // On error, update marker popup if possible
        if (markerRef.current) {
          markerRef.current
            .bindPopup(
              `<b>Coordinates</b><br/>Lat: ${lat.toFixed(
                3
              )}<br/>Lon: ${lng.toFixed(3)}<hr/><strong>Network error</strong>`
            )
            .openPopup();
        }
      } finally {
        setLoading(false);
      }
    };

    mapRef.current.on("click", onClick);

    return () => {
      // cleanup marker and map on unmount
      try {
        if (markerRef.current && mapRef.current) {
          mapRef.current.removeLayer(markerRef.current);
        }
      } catch (error) {
        console.log("Error during cleanup:", error);
      }
      markerRef.current = null;
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // run once only

  // Sidebar content helpers (unchanged)
  const renderHeadersOnly = () => (
    <div>
      <h3 style={{ marginTop: 0 }}>Location</h3>
      <h3>Pollutants</h3>
      <h3>Recommendations</h3>
    </div>
  );

  const renderLoading = () => (
    <div>
      <h3 style={{ marginTop: 0 }}>Loading…</h3>
      <p>Please wait while we fetch data for the clicked point.</p>
    </div>
  );

  const renderReport = (r) => {
    if (!r) return renderHeadersOnly();

    const data = r.data || {};
    const pollutants = data.pollutants || {};
    const openaq = data.openaq_pollutants || [];
    const recs = r.recommendations || [];

    return (
      <div>
        <h3 style={{ marginTop: 0 }}>Location</h3>
        <div style={{ marginBottom: 12 }}>
          <div>
            <strong>Lat:</strong> {data.lat}
          </div>
          <div>
            <strong>Lon:</strong> {data.lon}
          </div>
        </div>

        <h3>Pollutants</h3>
        <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 12 }}>
          {Object.keys(pollutants).length === 0 ? (
            <div style={{ fontStyle: "italic" }}>
              No pollutant data available.
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                fontSize: 13,
                borderCollapse: "collapse",
              }}
            >
              <tbody>
                {Object.entries(pollutants).map(([k, v]) => (
                  <tr
                    key={k}
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <td
                      style={{
                        padding: "6px 4px",
                        textTransform: "uppercase",
                        width: "55%",
                      }}
                    >
                      {k}
                    </td>
                    <td style={{ padding: "6px 4px", textAlign: "right" }}>
                      {v && v.value !== null
                        ? `${v.value} ${v.unit || ""}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <h3>OpenAQ</h3>
        <div style={{ marginBottom: 12 }}>
          {openaq.length === 0 ? (
            <div style={{ fontStyle: "italic" }}>No OpenAQ measurements.</div>
          ) : (
            <ul style={{ paddingLeft: 18, marginTop: 6 }}>
              {openaq.map((p, i) => (
                <li key={i}>
                  {p.name}: {p.mean_value}
                </li>
              ))}
            </ul>
          )}
        </div>

        <h3>Recommendations</h3>
        <div>
          {recs.length === 0 ? (
            <div style={{ fontStyle: "italic" }}>No recommendations.</div>
          ) : (
            <ol style={{ paddingLeft: 18 }}>
              {recs.map((r, i) => (
                <li key={i}>
                  <div style={{ fontWeight: 600 }}>{r.text}</div>
                  <div style={{ fontSize: 12, color: "#444" }}>
                    {r.reason}{" "}
                    <span style={{ fontStyle: "italic" }}>({r.priority})</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setShowRaw((s) => !s)}
            style={{ padding: "6px 8px", cursor: "pointer" }}
          >
            {showRaw ? "Hide raw JSON" : "Show raw JSON"}
          </button>

          <button
            onClick={clearMarkerAndReport}
            style={{ padding: "6px 8px", cursor: "pointer" }}
          >
            Clear
          </button>
        </div>

        {showRaw && (
          <pre
            style={{
              marginTop: 8,
              maxHeight: 200,
              overflow: "auto",
              background: "#f7f7f7",
              padding: 8,
            }}
          >
            {JSON.stringify(r, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  // Layout styles (unchanged)
  const sidebarWidth = 340;
  const sidebarStyle = {
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    width: sidebarWidth,
    padding: 16,
    background: "#fff",
    boxShadow: "2px 0 6px rgba(0,0,0,0.08)",
    zIndex: 1000,
    overflowY: "auto",
  };
  const mapWrapperStyle = {
    marginLeft: sidebarWidth,
    height: "100vh",
    width: `calc(100% - ${sidebarWidth}px)`,
  };

  return (
    <div style={{ display: "flex" }}>
      <aside style={sidebarStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>GeoBasira</h2>
        </div>
        <hr style={{ margin: "10px 0 14px 0" }} />
        {!report && !loading && renderHeadersOnly()}
        {loading && renderLoading()}
        {report && !loading && renderReport(report)}
      </aside>

      <main style={mapWrapperStyle}>
        <div
          ref={mapContainerRef}
          id="map"
          style={{ height: "100%", width: "100%" }}
        />
      </main>
    </div>
  );
}
