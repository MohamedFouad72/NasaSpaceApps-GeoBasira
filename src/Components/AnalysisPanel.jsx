import React from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function AnalysisPanel({ isOpen, report, onClose }) {
    if (!isOpen || !report) return null;

    const { pollutants, recommendations } = report;

    // Chart Rendering Helper
    const renderChart = (key, pollutantData) => {
        if (!pollutantData.history || pollutantData.history.length === 0) return null;

        const labels = pollutantData.times ? pollutantData.times.map(t => {
            const d = new Date(t);
            return d.getHours() + ":00";
        }) : pollutantData.history.map((_, i) => i);

        const data = {
            labels,
            datasets: [
                {
                    label: key.toUpperCase(),
                    data: pollutantData.history,
                    borderColor: "rgb(59, 130, 246)",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                },
            ],
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `${key.toUpperCase()}`,
                    font: { size: 14, weight: 'bold' }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: "#f3f4f6" } }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        };

        return (
            <div key={key} style={{
                background: "#fff",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                height: 250 // Taller charts
            }}>
                <Line data={data} options={options} />
            </div>
        );
    };

    return (
        <div className="analysis-overlay" onClick={onClose}>
            <div className="analysis-panel" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: 20,
                    borderBottom: "1px solid #e5e7eb",
                    marginBottom: 24
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Detailed Analysis</h2>
                        <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
                            Comprehensive air quality report for {report.lat.toFixed(3)}°, {report.lon.toFixed(3)}°
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "#f3f4f6",
                            border: "none",
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            fontSize: 20,
                            cursor: "pointer",
                            color: "#4b5563",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background 0.2s"
                        }}
                    >
                        ×
                    </button>
                </div>

                <div className="analysis-content">

                    {/* Pollutants Grid */}
                    <section style={{ marginBottom: 32 }}>
                        <h3 style={{ fontSize: 14, textTransform: "uppercase", color: "#6b7280", letterSpacing: 0.5, marginBottom: 16, fontWeight: 600 }}>
                            Current Pollutant Metrics
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                            {Object.entries(pollutants || {}).map(([k, v]) => (
                                <div key={k} style={{
                                    padding: 16,
                                    background: "#f9fafb",
                                    borderRadius: 12,
                                    border: "1px solid #f3f4f6"
                                }}>
                                    <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>
                                        {k.replace(/_/g, " ")}
                                    </div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
                                        {v.value?.toFixed(1) ?? "—"}
                                        <span style={{ fontSize: 12, fontWeight: 400, color: "#6b7280", marginLeft: 4 }}>{v.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Trends Section */}
                    <section style={{ marginBottom: 32 }}>
                        <h3 style={{ fontSize: 14, textTransform: "uppercase", color: "#6b7280", letterSpacing: 0.5, marginBottom: 16, fontWeight: 600 }}>
                            48-Hour Trends
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                            {Object.entries(pollutants || {})
                                .filter(([_, v]) => v.history && v.history.length > 0)
                                .slice(0, 4) // Show top 4 charts to not overwhelm
                                .map(([k, v]) => renderChart(k, v))}
                        </div>
                    </section>

                    {/* Recommendations */}
                    <section>
                        <h3 style={{ fontSize: 14, textTransform: "uppercase", color: "#6b7280", letterSpacing: 0.5, marginBottom: 16, fontWeight: 600 }}>
                            Health & Activity Recommendations
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                            {recommendations && recommendations.map((rec, i) => (
                                <div key={i} style={{
                                    padding: 16,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 12,
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 16
                                }}>
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: rec.priority === "high" ? "#dc2626" : rec.priority === "medium" ? "#f59e0b" : "#10b981",
                                        marginTop: 6,
                                        flexShrink: 0
                                    }} />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15, color: "#111827", marginBottom: 4 }}>
                                            {rec.text}
                                        </div>
                                        <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5 }}>
                                            {rec.reason}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

            </div>
        </div>
    );
}
