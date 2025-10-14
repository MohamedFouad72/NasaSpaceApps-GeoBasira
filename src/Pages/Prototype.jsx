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
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // Sidebar open state (default collapsed on small screens)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768; // open on tablet/desktop, closed on mobile
    }
    return true;
  });

  // Toggle sidebar (and tell Leaflet to resize)
  const toggleSidebar = () => {
    setSidebarOpen((s) => {
      const next = !s;
      // delay invalidateSize slightly to allow DOM layout
      setTimeout(() => {
        try {
          mapRef.current && mapRef.current.invalidateSize();
        } catch (e) {
          console.error("Error handling resize:", e);
        }
      }, 220);
      return next;
    });
  };

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

      // marker immediate behavior
      if (markerRef.current && mapRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }

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

      // reset and fetch
      setReport(null);
      setShowRaw(false);
      setLoading(true);

      try {
        const res = await fetch(
          "https://nasaspaceapps-geobasira.onrender.com/coords",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lon: lng }),
          }
        );

        if (!res.ok) {
          console.error(
            "HTTP error from backend:",
            res.status,
            await res.text()
          );
          setLoading(false);
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

        // update popup with short summary
        try {
          let popupHtml = `<b>Coordinates</b><br/>Lat: ${lat.toFixed(
            3
          )}<br/>Lon: ${lng.toFixed(3)}`;

          if (
            json &&
            Array.isArray(json.recommendations) &&
            json.recommendations.length > 0
          ) {
            const first = json.recommendations[0];
            popupHtml += `<hr/><strong>${first.text}</strong><div style="font-size:11px;color:#444">${first.reason} <em>(${first.priority})</em></div>`;
          } else if (json && json.data && json.data.pollutants) {
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

    // handle screen resize: auto open/close sidebar on breakpoint changes
    const onResize = () => {
      try {
        if (window.innerWidth < 768 && sidebarOpen) {
          setSidebarOpen(false);
        } else if (window.innerWidth >= 768 && !sidebarOpen) {
          setSidebarOpen(true);
        }
      } catch (e) {
        console.error("Error handling resize:", e.message);
      }
      // always invalidate map size on resize
      setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      try {
        if (markerRef.current && mapRef.current) {
          mapRef.current.removeLayer(markerRef.current);
        }
      } catch (e) {
        console.error("Error removing marker:", e);
      }
      markerRef.current = null;
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [sidebarOpen]); // we include sidebarOpen so map invalidation after toggle works reliably

  // Sidebar helpers
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
            style={{ padding: "8px 10px", cursor: "pointer", fontSize: 14 }}
          >
            {showRaw ? "Hide raw JSON" : "Show raw JSON"}
          </button>

          <button
            onClick={clearMarkerAndReport}
            style={{ padding: "8px 10px", cursor: "pointer", fontSize: 14 }}
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

  // Layout styles
  const sidebarWidth = 340;
  const sidebarStyle = {
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    width: sidebarOpen ? sidebarWidth : 0,
    padding: sidebarOpen ? 16 : 0,
    background: "#fff",
    boxShadow: sidebarOpen ? "2px 0 6px rgba(0,0,0,0.08)" : "none",
    zIndex: 1000,
    overflowY: "auto",
    transition: "width 200ms ease, padding 200ms ease",
  };

  const mapWrapperStyle = {
    marginLeft: sidebarOpen ? sidebarWidth : 0,
    height: "100vh",
    width: `calc(100% - ${sidebarOpen ? sidebarWidth : 0}px)`,
    transition: "margin-left 200ms ease, width 200ms ease",
  };

  // Toggle button styles (overlay on mobile)
  const toggleButtonStyle = {
    position: "fixed",
    left: sidebarOpen ? sidebarWidth - 42 : 8,
    top: 12,
    zIndex: 1100,
    width: 36,
    height: 36,
    borderRadius: 8,
    border: "none",
    background: "#0b5cff",
    color: "#fff",
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    cursor: "pointer",
    transition: "left 200ms ease",
  };

  return (
    <div style={{ display: "flex" }}>
      {/* Toggle button */}
      <button
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        onClick={toggleSidebar}
        style={toggleButtonStyle}
      >
        {sidebarOpen ? "×" : "☰"}
      </button>

      {/* Sidebar */}
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

        {sidebarOpen && (
          <>
            <hr style={{ margin: "10px 0 14px 0" }} />
            {!report && !loading && renderHeadersOnly()}
            {loading && renderLoading()}
            {report && !loading && renderReport(report)}
          </>
        )}
      </aside>

      {/* Map */}
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
