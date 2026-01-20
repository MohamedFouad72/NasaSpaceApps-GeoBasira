import React from "react";
import "../CSS/Sidebar.css";

export default function LeftSidebar({ sidebarOpen, report, loading, onOpenAnalysis }) {
    const width = 340;
    const dynamicStyle = {
        width: sidebarOpen ? width : 0,
    };

    if (!report && !loading) {
        return (
            <aside
                className={`sidebar left ${sidebarOpen ? "open" : ""}`}
                style={dynamicStyle}
            >
                <div className="sidebar-content" style={{ minWidth: width }}>
                    <h2 className="sidebar-title">GeoBasira</h2>
                    <p className="sidebar-subtitle">Select a location on the map to see air quality insights.</p>
                </div>
            </aside>
        );
    }

    const { lat, lon, timestamp, pollutants, recommendations } = report || {};

    // Calculate AQI Status
    const pm25 = pollutants?.pm2_5?.value;
    let status = "Unknown";
    let statusColor = "#9ca3af";
    if (pm25 !== undefined && pm25 !== null) {
        if (pm25 < 12) { status = "Good"; statusColor = "#10b981"; }
        else if (pm25 < 35.4) { status = "Moderate"; statusColor = "#f59e0b"; }
        else if (pm25 < 55.4) { status = "Unhealthy for Sensitive Groups"; statusColor = "#f97316"; }
        else { status = "Poor"; statusColor = "#ef4444"; }
    }

    return (
        <aside
            className={`sidebar left ${sidebarOpen ? "open" : ""}`}
            style={dynamicStyle}
        >
            <div className="sidebar-content" style={{ minWidth: width }}>

                {/* Header */}
                <div className="sidebar-header">
                    <h2 className="sidebar-title">
                        {lat?.toFixed(3)}°, {lon?.toFixed(3)}°
                    </h2>
                    <div className="sidebar-subtitle">
                        Updated {timestamp ? new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "just now"}
                    </div>
                </div>

                {/* AQI Badge */}
                <div
                    className="aqi-badge"
                    style={{
                        background: `linear-gradient(135deg, ${statusColor}, ${statusColor}dd)`,
                        boxShadow: `0 10px 25px -5px ${statusColor}66`,
                    }}
                >
                    <div className="aqi-circle" />
                    <div className="aqi-title">Air Quality Index</div>
                    <div className="aqi-value">{status}</div>
                    <div className="aqi-subtitle">Based on PM2.5 levels</div>
                </div>

                {/* All Pollutants Metrics */}
                <div style={{ marginBottom: 28 }}>
                    <h3 className="sidebar-section-title">
                        Current Metrics
                    </h3>
                    <div className="metric-grid">
                        {Object.entries(pollutants || {}).map(([key, data]) => {
                            if (!data || data.value === null) return null;

                            const val = data.value;
                            let accent = "#10b981";
                            if (val > 15) accent = "#f59e0b";
                            if (val > 40) accent = "#ef4444";

                            return (
                                <div key={key} className="metric-item">
                                    <div className="metric-bar" style={{ background: accent }} />
                                    <div className="metric-label">
                                        {key.replace(/_/g, " ")}
                                    </div>
                                    <div className="metric-value">
                                        {val.toFixed(1)}
                                    </div>
                                    <div className="metric-unit">{data.unit}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recommendations List */}
                {recommendations && recommendations.length > 0 && (
                    <div style={{ marginBottom: "auto" }}>
                        <h3 className="sidebar-section-title">
                            Recommendations
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {recommendations.map((rec, idx) => (
                                <div key={idx} className="recommendation-item">
                                    <div
                                        className="rec-dot"
                                        style={{
                                            background: rec.priority === "high" ? "#ef4444" : rec.priority === "medium" ? "#f59e0b" : "#10b981",
                                            boxShadow: `0 0 0 3px ${rec.priority === "high" ? "#fee2e2" : rec.priority === "medium" ? "#fef3c7" : "#d1fae5"}`
                                        }}
                                    />
                                    <div className="rec-text">
                                        {rec.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {loading && (
                    <div style={{ marginTop: 10, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
                        Updating data...
                    </div>
                )}
            </div>
        </aside>
    );
}
