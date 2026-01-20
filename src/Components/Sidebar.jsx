import React from "react";
import Report from "./Report";

export default function Sidebar({ sidebarOpen, toggleSidebar, report, loading }) {
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

    const renderHeadersOnly = () => (
        <div>
            <h3 style={{ marginTop: 0, marginBottom: "1em" }}>Location</h3>
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

    return (
        <>
            <button
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                onClick={toggleSidebar}
                style={toggleButtonStyle}
            >
                {sidebarOpen ? "×" : "☰"}
            </button>

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
                        {report && !loading && <Report report={report} />}
                    </>
                )}
            </aside>
        </>
    );
}
