import React, { useState, useEffect } from 'react';
import { Filter, Layers, Clock, MapPin } from 'lucide-react';
import GoogleMapComponent from './GoogleMapComponent';

export default function HeatmapTab({ config, apiKey }) {
  const [corridor, setCorridor] = useState("All");
  const [tier, setTier] = useState("All");
  const [hour, setHour] = useState(9);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFilteredEvents();
  }, [corridor, tier, hour]);

  const fetchFilteredEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (corridor !== "All") params.append("corridor", corridor);
      if (tier !== "All") params.append("impact_tier", tier);
      if (hour !== null) params.append("hour", hour);
      params.append("limit", "450");

      const resp = await fetch(`http://127.0.0.1:8000/api/events?${params.toString()}`);
      const data = await resp.json();
      setEvents(data);
    } catch (e) {
      console.error("Failed to load events", e);
    } finally {
      setLoading(false);
    }
  };

  const corridors = ["All", ...(config?.corridors || ["Hosur Road", "Mysore Road", "Bellary Road 1"])];

  return (
    <div>
      {/* Filters Bar */}
      <div className="metric-card" style={{ marginBottom: "20px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "20px", padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={16} color="#60A5FA" />
          <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>Filters:</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Corridor:</label>
          <select
            className="form-select"
            style={{ width: "190px", padding: "6px 10px", fontSize: "0.82rem" }}
            value={corridor}
            onChange={(e) => setCorridor(e.target.value)}
          >
            {corridors.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Tier:</label>
          <select
            className="form-select"
            style={{ width: "130px", padding: "6px 10px", fontSize: "0.82rem" }}
            value={tier}
            onChange={(e) => setTier(e.target.value)}
          >
            <option value="All">All Tiers</option>
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "240px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            Hour: <strong>{String(hour).padStart(2, '0')}:00 ± 1h</strong>
          </label>
          <input
            type="range"
            min="0"
            max="23"
            value={hour}
            onChange={(e) => setHour(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: "#3B82F6", cursor: "pointer" }}
          />
        </div>
      </div>

      {/* Map Card */}
      <div className="map-card-container">
        <div className="map-header">
          <div className="map-header-title">
            <Layers size={18} color="#60A5FA" />
            Corridor & Risk-Hour Spatial Visualizer
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Showing <strong style={{ color: "#60A5FA" }}>{events.length}</strong> disruption events in {String(hour).padStart(2, '0')}:00 window
          </div>
        </div>

        <GoogleMapComponent
          apiKey={apiKey}
          events={events}
          mode="density"
          height="560px"
        />
      </div>

      {/* Summary Box */}
      <div className="metric-card" style={{ background: "rgba(30,41,59,0.5)", borderLeft: "4px solid #3B82F6" }}>
        <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "4px" }}>
          📊 Forecast Summary for {String(hour).padStart(2, '0')}:00 ± 1h Window
        </h4>
        <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
          Found <strong>{events.length}</strong> historical events matching selected corridor filter.
          These zones represent corridors that historically experience elevated response requirements at this time of day.
        </p>
      </div>
    </div>
  );
}
