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
      <h3 style={{ marginTop: 0, marginBottom : "1em" }}>Location</h3>
      <h3>Pollutants</h3>
      <h3>Recommendations</h3>
    </div>
  );

  const renderLoading = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 0",
      textAlign: "center",
      color: "#374151",
    }}
  >
    {/* Spinner */}
    <div
      style={{
        width: 40,
        height: 40,
        border: "4px solid #e5e7eb",
        borderTop: "4px solid #3b82f6",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: 16,
      }}
    />

    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Fetching Data…</h3>
    <p style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>
      Please wait while we process your location request.
    </p>

    {/* Spinner animation */}
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);


  const renderReport = (r) => {
    if (!r) return renderHeadersOnly();

    const pollutants = r.pollutants || {};
    const openaq = r.openaq?.pollutants || [];
    const recs = r.recommendations || [];
    const data = {
      lat: r.lat,
      lon: r.lon,
      weather: r.weather || {},
    };

    return (
      <div>
        <h3 style={{ marginTop: 0}}>Location</h3>
        <div
  style={{
    marginBottom: 16,
    background: "linear-gradient(135deg, #f9fafb, #f3f4f6)",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "12px 14px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  }}
>
  <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
    Coordinates
  </div>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      fontSize: 15,
      fontWeight: 600,
      color: "#111827",
    }}
  >
    <div>
      <span style={{ color: "#6b7280", fontWeight: 500 }}>Lat:</span>{" "}
      {data.lat?.toFixed(4) ?? "—"}
    </div>
    <div>
      <span style={{ color: "#6b7280", fontWeight: 500 }}>Lon:</span>{" "}
      {data.lon?.toFixed(4) ?? "—"}
    </div>
  </div>
</div>


<h3>Pollutants</h3>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "10px",
    marginBottom: 16,
  }}
>
  {Object.keys(pollutants).length === 0 ? (
    <div
      style={{
        gridColumn: "1 / -1",
        fontStyle: "italic",
        color: "#6b7280",
        textAlign: "center",
        padding: "8px 0",
      }}
    >
      No pollutant data available.
    </div>
  ) : (
    Object.entries(pollutants).map(([k, v]) => {
      const value = v?.value ?? null;
      const unit = v?.unit ?? "";
      const severityColor =
        value === null
          ? "#9ca3af"
          : value > 100
          ? "#dc2626"
          : value > 50
          ? "#f59e0b"
          : "#16a34a";
      const bgGradient =
        value === null
          ? "linear-gradient(135deg, #f9fafb, #f3f4f6)"
          : `linear-gradient(135deg, ${severityColor}15, #ffffff)`;

      return (
        <div
          key={k}
          style={{
            background: bgGradient,
            border: `1px solid ${severityColor}25`,
            borderRadius: 10,
            padding: "10px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            textAlign: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.04)";
            e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#374151",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {k.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: severityColor,
            }}
          >
            {value !== null ? `${value}` : "—"}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#6b7280",
              marginTop: 2,
            }}
          >
            {unit}
          </div>
        </div>
      );
    })
  )}
</div>


    <h3>OpenAQ</h3>
<div style={{ marginBottom: 16 }}>
  {openaq.length === 0 ? (
    <div
      style={{
        fontStyle: "italic",
        color: "#6b7280",
        textAlign: "center",
        padding: "8px 0",
      }}
    >
      No OpenAQ measurements. <br />(Falling back to OpenMeteo)
    </div>
  ) : (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        marginTop: 8,
      }}
    >
      {openaq.map((p, i) => {
        const value = p.mean_value ?? null;
        const severityColor =
          value === null
            ? "#9ca3af"
            : value > 100
            ? "#dc2626"
            : value > 50
            ? "#f59e0b"
            : "#16a34a";
        const bgGradient =
          value === null
            ? "linear-gradient(135deg, #f9fafb, #f3f4f6)"
            : `linear-gradient(135deg, ${severityColor}15, #f9fafb)`;

        return (
          <div
            key={i}
            style={{
              background: bgGradient,
              border: `1px solid ${severityColor}30`,
              borderRadius: 10,
              padding: "12px 14px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
            }}
          >
            <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
              {p.name}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: severityColor,
                marginTop: 4,
              }}
            >
              {value !== null ? value : "—"}
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>



        <h3>Recommendations</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {recs.length === 0 ? (
          <div style={{ fontStyle: "italic" }}>No recommendations.</div>
        ) : (
          recs.map((r, i) => {
            // Priority color cues
            let color =
              r.priority?.toUpperCase() === "HIGH"
                ? "#dc2626"
                : r.priority?.toUpperCase() === "MEDIUM"
                ? "#f59e0b"
                : "#16a34a";

            return (
              <div
                key={i}
                style={{
                  background: "#f9fafb",
                  border: `1px solid ${color}20`,
                  borderLeft: `4px solid ${color}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "#111827",
                      flex: 1,
                    }}
                  >
                    {r.text}
                  </div>
                  <div
                    style={{
                      background: color,
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 6,
                      padding: "2px 6px",
                      alignSelf: "flex-start",
                    }}
                  >
                    {r.priority}
                  </div>
                </div>

                <div style={{ fontSize: 13, color: "#444" }}>{r.reason}</div>
              </div>
            );
          })
        )}
      </div>

      </div>
    );
  }

  // Layout styles
  const sidebarWidth = 470;
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
    transition: "left 200ms ease"  };

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
