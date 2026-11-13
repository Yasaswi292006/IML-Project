import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Navigation,
  Layers,
  Boxes,
  Calendar,
  Activity,
  MapPin,
  ShieldAlert,
  Server
} from 'lucide-react';
import OverviewTab from './components/OverviewTab';
import PredictTab from './components/PredictTab';
import HeatmapTab from './components/HeatmapTab';
import BatchTriageTab from './components/BatchTriageTab';
import PreEventTab from './components/PreEventTab';
import ModelPerformanceTab from './components/ModelPerformanceTab';

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const initialTab = (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab")) || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [config, setConfig] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [eventsData, setEventsData] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // 1. Fetch Config
    fetch(`${API_BASE}/api/config`)
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setConnected(true);
      })
      .catch(err => {
        console.error("Config fetch error:", err);
        setConnected(false);
      });

    // 2. Fetch Overview Metrics
    fetch(`${API_BASE}/api/overview`)
      .then(res => res.json())
      .then(data => setOverviewData(data))
      .catch(err => console.error("Overview fetch error:", err));

    // 3. Fetch Initial Events
    fetch(`${API_BASE}/api/events?limit=350`)
      .then(res => res.json())
      .then(data => setEventsData(data))
      .catch(err => console.error("Events fetch error:", err));
  }, []);

  const navItems = [
    { id: "overview", label: "🏠 Overview", icon: LayoutDashboard },
    { id: "predict", label: "🔮 Predict & Respond", icon: Navigation },
    { id: "heatmap", label: "🗺️ Map & Heatmap", icon: Layers },
    { id: "batch", label: "📦 Batch Triage", icon: Boxes },
    { id: "preevent", label: "📅 Pre-Event Planner", icon: Calendar },
    { id: "model", label: "📈 Model Performance", icon: Activity }
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-header">
          <img
            src="/logo.png"
            alt="ASTER Logo"
            style={{
              width: "40px",
              height: "40px",
              objectFit: "contain",
              borderRadius: "8px",
              filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.45))"
            }}
          />
          <div>
            <div className="brand-title">ASTER</div>
            <div className="brand-subtitle">Smart Traffic AI</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer Metadata */}
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", marginTop: "16px" }}>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "8px" }}>
            🗺️ <strong>Map Engine:</strong><br />
            <span style={{ color: "#86EFAC" }}>🟢 Google Maps (Live Traffic)</span>
          </div>

          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
            <b>Data:</b> 8,173 events · Nov 2025 – Apr 2026<br />
            <b>Model:</b> GBM — Honest (pre-dispatch)<br />
            <b>City:</b> Bengaluru, Karnataka
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-title-box">
            <h1>ASTER Intelligence Command Center</h1>
            <p>Adaptive Smart Traffic Event Response — Bengaluru Traffic Police</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="system-badge">
              <div className="pulse-dot"></div>
              <span>{connected ? "FastAPI Backend Connected" : "Connecting Backend..."}</span>
            </div>
          </div>
        </header>

        {/* Active View Render */}
        {activeTab === "overview" && (
          <OverviewTab
            overviewData={overviewData}
            eventsData={eventsData}
            apiKey={config?.google_maps_api_key}
          />
        )}

        {activeTab === "predict" && (
          <PredictTab
            config={config}
            apiKey={config?.google_maps_api_key}
          />
        )}

        {activeTab === "heatmap" && (
          <HeatmapTab
            config={config}
            apiKey={config?.google_maps_api_key}
          />
        )}

        {activeTab === "batch" && (
          <BatchTriageTab />
        )}

        {activeTab === "preevent" && (
          <PreEventTab config={config} apiKey={config?.google_maps_api_key} />
        )}

        {activeTab === "model" && (
          <ModelPerformanceTab />
        )}
      </main>
    </div>
  );
}
