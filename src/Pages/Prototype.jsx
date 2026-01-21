import React, { useState, useEffect } from "react";
import "../CSS/prototype.css";
import MapComponent from "../Components/MapComponent";
import LeftSidebar from "../Components/LeftSidebar";
import RightSidebar from "../Components/RightSidebar";
import { API_BASE_URL } from "../config";

export default function Prototype() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // "Analysis Mode" means a pin is selected, so LeftSidebar shows summary.
  const [analysisMode, setAnalysisMode] = useState(false);

  // Right sidebar visibility
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  const handleMapClick = async (lat, lng, marker) => {
    setReport(null);
    setLoading(true);
    setAnalysisMode(true);
    setRightSidebarOpen(true); // Open right sidebar by default on click

    try {
      const res = await fetch(
        `${API_BASE_URL}/coords`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lon: lng }),
        }
      );

      if (!res.ok) {
        console.error("HTTP error:", res.status);
        setLoading(false);
        if (marker) marker.bindPopup("Error fetching data").openPopup();
        return;
      }

      const json = await res.json();
      console.log("Server response:", json);
      setReport(json);

      if (marker) {
        marker.bindPopup(`<b>${lat.toFixed(3)}, ${lng.toFixed(3)}</b>`).openPopup();
      }

    } catch (err) {
      console.error("Error sending coords:", err);
      if (marker) marker.bindPopup("Network error").openPopup();
    } finally {
      setLoading(false);
    }
  };

  const leftWidth = analysisMode ? 320 : 0;
  const rightWidth = (analysisMode && rightSidebarOpen && report) ? 400 : 0;

  return (
    <div className="analysis-mode-wrapper">
      <LeftSidebar
        sidebarOpen={analysisMode}
        report={report}
        loading={loading}
        // Optional: function to toggle right sidebar if we wanted a button in left sidebar
        onOpenAnalysis={() => setRightSidebarOpen(true)}
      />

      <main
        className="map-wrapper"
        style={{
          marginLeft: leftWidth,
          marginRight: rightWidth,
        }}
      >
        <MapComponent onMapClick={handleMapClick} sidebarOpen={analysisMode} />
      </main>

      <RightSidebar
        sidebarOpen={analysisMode && rightSidebarOpen && !!report}
        report={report}
        onClose={() => setRightSidebarOpen(false)}
      />
    </div>
  );
}
