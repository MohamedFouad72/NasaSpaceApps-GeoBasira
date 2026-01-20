import React from "react";

export default function Report({ report }) {
    if (!report) return null;

    const pollutants = report.pollutants || {};
    const openaq = report.openaq?.pollutants || [];
    const recs = report.recommendations || [];
    const data = {
        lat: report.lat,
        lon: report.lon,
        weather: report.weather || {},
    };

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>Location</h3>
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
                                    e.currentTarget.style.boxShadow =
                                        "0 3px 8px rgba(0,0,0,0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.boxShadow =
                                        "0 1px 3px rgba(0,0,0,0.05)";
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
                                        e.currentTarget.style.boxShadow =
                                            "0 3px 8px rgba(0,0,0,0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.boxShadow =
                                            "0 1px 4px rgba(0,0,0,0.06)";
                                    }}
                                >
                                    <div
                                        style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}
                                    >
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
