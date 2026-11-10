import React, { useState } from 'react';
import { AlertTriangle, Clock, MapPin, ShieldAlert, TrendingUp, Radio } from 'lucide-react';
import GoogleMapComponent from './GoogleMapComponent';

export default function OverviewTab({ overviewData, eventsData, apiKey }) {
  const [toast, setToast] = useState(null);

  const metrics = overviewData?.metrics || {
    total_events: 8173,
    high_impact: 2394,
    high_impact_pct: 29.3,
    planned_events: 467,
    road_closures: 676,
    active_corridors: 21,
    median_resolution_min: 65,
    date_range: "Nov 2025 – Apr 2026"
  };

  const simulateAlert = () => {
    const corridors = ["Mysore Road", "Hosur Road", "Bellary Road 1", "ORR North 1", "Old Madras Road"];
    const causes = ["Vehicle Breakdown", "Traffic Accident", "Water Logging", "VIP Convoy"];
    const c = corridors[Math.floor(Math.random() * corridors.length)];
    const cause = causes[Math.floor(Math.random() * causes.length)];
    setToast(`🚨 LIVE ALERT: ${cause} reported on ${c} — HIGH IMPACT ESCALATION!`);
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "32px",
          background: "#1E293B",
          border: "1px solid #EF4444",
          boxShadow: "0 8px 24px rgba(239,68,68,0.25)",
          color: "#FEE2E2",
          padding: "12px 20px",
          borderRadius: "8px",
          fontSize: "0.9rem",
          fontWeight: "600",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <AlertTriangle color="#EF4444" size={18} />
          {toast}
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">Total Disruption Events</div>
          <div className="metric-value">{metrics.total_events?.toLocaleString()}</div>
          <div className="metric-sub">
            <Clock size={13} color="#94A3B8" /> {metrics.date_range}
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: "3px solid #EF4444" }}>
          <div className="metric-title">High-Impact Events</div>
          <div className="metric-value" style={{ color: "#EF4444" }}>
            {metrics.high_impact?.toLocaleString()}
          </div>
          <div className="metric-sub" style={{ color: "#FCA5A5" }}>
            <TrendingUp size={13} /> {metrics.high_impact_pct}% of total
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Planned Events</div>
          <div className="metric-value">{metrics.planned_events}</div>
          <div className="metric-sub">5.7% Construction / VIP</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Road Closures</div>
          <div className="metric-value" style={{ color: "#F59E0B" }}>{metrics.road_closures}</div>
          <div className="metric-sub">Requires detour diversion</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Active Corridors</div>
          <div className="metric-value">{metrics.active_corridors}</div>
          <div className="metric-sub">
            <MapPin size={13} color="#94A3B8" /> Across Bengaluru
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Median Resolution</div>
          <div className="metric-value" style={{ color: "#60A5FA" }}>{metrics.median_resolution_min} min</div>
          <div className="metric-sub">Honest pre-dispatch baseline</div>
        </div>
      </div>

      {/* Map Section */}
      <div className="map-card-container">
        <div className="map-header">
          <div className="map-header-title">
            <span>🗺️</span> Live Event Density & Congestion Map
            <span style={{ fontSize: "0.75rem", background: "rgba(59,130,246,0.15)", color: "#93C5FD", padding: "2px 8px", borderRadius: "4px", marginLeft: "6px" }}>
              Google Maps Active
            </span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-secondary" onClick={simulateAlert}>
              <Radio size={14} color="#EF4444" /> Simulate High-Impact Alert
            </button>
          </div>
        </div>

        <GoogleMapComponent
          apiKey={apiKey}
          events={eventsData}
          mode="density"
          height="520px"
        />
      </div>

      {/* Narrative & Impact Distribution Split */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
        <div className="metric-card">
          <h3 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "10px", color: "#60A5FA" }}>
            The Problem ASTER Solves
          </h3>
          <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            Bengaluru handles <strong>over 7 million vehicle trips daily</strong>. When an incident occurs on Mysore Road or Outer Ring Road during evening peak, traditional police deployment is reactive.
          </p>
          <div style={{ marginTop: "12px", background: "rgba(30,41,59,0.5)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#F8FAFC", marginBottom: "4px" }}>
              🎯 Decision-Support Objective
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Forecast event-driven congestion before gridlock sets in, recommend exact officer counts via Google OR-Tools MILP, and publish detour routes in under 5 minutes.
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "14px" }}>
            Impact Tier Breakdown
          </h3>
          {overviewData?.impact_distribution?.map((item) => (
            <div key={item.tier} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "4px" }}>
                <span style={{ fontWeight: "600", color: item.color }}>{item.tier} Impact</span>
                <span style={{ color: "var(--text-muted)" }}>{item.count?.toLocaleString()} ({item.pct}%)</span>
              </div>
              <div style={{ height: "8px", background: "rgba(30,41,59,0.8)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${item.pct}%`, background: item.color, height: "100%", borderRadius: "4px" }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
