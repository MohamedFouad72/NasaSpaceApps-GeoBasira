import React from "react";
import "../CSS/Sidebar.css";
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

// Explanations for each pollutant
const pollutantInfo = {
    pm2_5: { name: "PM2.5", desc: "Fine particles that can penetrate deep into the lungs and enter the bloodstream.", color: "#3b82f6" },
    pm10: { name: "PM10", desc: "Inhalable particles that can irritate your eyes, nose, and throat.", color: "#8b5cf6" },
    nitrogen_dioxide: { name: "NO2", desc: "Gas from vehicles that irritates airways and aggravates respiratory diseases.", color: "#ef4444" },
    ozone: { name: "Ozone", desc: "Ground-level ozone can trigger asthma and reduce lung function.", color: "#10b981" },
    sulphur_dioxide: { name: "SO2", desc: "Produced by burning fossil fuels, harmful to the respiratory system.", color: "#f59e0b" },
    carbon_monoxide: { name: "CO", desc: "Reduces oxygen delivery to the body's organs and tissues.", color: "#6366f1" },
    uv_index: { name: "UV Index", desc: "Measure of the strength of sunburn-producing ultraviolet radiation.", color: "#ec4899" },
    aerosol_optical_depth: { name: "AOD", desc: "Measure of how much sunlight is prevented from reaching the ground by particles.", color: "#64748b" },
    dust: { name: "Dust", desc: "Fine powder of earth or waste matter.", color: "#a8a29e" },
};

export default function RightSidebar({ sidebarOpen, report, onClose }) {
    const width = 450;
    const dynamicStyle = {
        width: sidebarOpen ? width : 0,
    };

    if (!report) return <aside className={`sidebar right ${sidebarOpen ? "open" : ""}`} style={dynamicStyle} />;

    const { pollutants } = report;

    // Helper to prepare chart data for a specific pollutant
    const renderChartSection = (key, pollutantData) => {
        if (!pollutantData.history || pollutantData.history.length === 0) return null;

        const info = pollutantInfo[key] || { name: key.toUpperCase(), desc: "Pollutant data.", color: "#9ca3af" };

        const labels = pollutantData.times ? pollutantData.times.map(t => {
            const d = new Date(t);
            return d.getHours() + ":00";
        }) : pollutantData.history.map((_, i) => i);

        const data = {
            labels,
            datasets: [
                {
                    label: info.name,
                    data: pollutantData.history,
                    borderColor: info.color,
                    backgroundColor: `${info.color}15`, // very light bg
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                },
            ],
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#111827',
                    bodyColor: '#4b5563',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
        };

        return (
            <div key={key} className="chart-card">
                {/* Header with Color */}
                <div className="chart-header">
                    <div className="chart-title-row">
                        <div className="chart-dot" style={{ background: info.color }} />
                        <h3 className="chart-title">{info.name}</h3>
                    </div>
                    <p className="chart-desc">
                        {info.desc}
                    </p>
                </div>

                {/* Chart Area */}
                <div className="chart-body">
                    <Line data={data} options={options} />
                </div>
            </div>
        );
    };

    return (
        <aside
            className={`sidebar right ${sidebarOpen ? "open" : ""}`}
            style={dynamicStyle}
        >
            <div className="sidebar-content" style={{ minWidth: width }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div>
                        <h2 className="sidebar-title">Pollutant Trends</h2>
                        <p className="sidebar-subtitle">48-hour forecast & analysis</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="close-btn"
                        aria-label="Close Sidebar"
                    >
                        ×
                    </button>
                </div>

                <div style={{ paddingBottom: 20 }}>
                    {Object.entries(pollutants || {})
                        .filter(([_, v]) => v.history && v.history.length > 0)
                        .map(([k, v]) => renderChartSection(k, v))}
                </div>

            </div>
        </aside>
    );
}
