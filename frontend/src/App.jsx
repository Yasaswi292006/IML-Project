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
  Server,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [config, setConfig] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [eventsData, setEventsData] = useState([]);
  const [connected, setConnected] = useState(false);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar (ChatGPT style)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const currentTabItem = navItems.find(item => item.id === activeTab) || navItems[0];

  return (
    <div className="app-container">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR (Full width with ChatGPT-style toggle)
         ───────────────────────────────────────────────────────────── */}
      <header className="top-navbar">
        {/* Left: Sidebar Toggle + Brand Logo & Title */}
        <div className="top-navbar-left">
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="sidebar-toggle-btn"
            title={sidebarOpen ? "Collapse sidebar (Ctrl+B)" : "Expand sidebar (Ctrl+B)"}
            aria-label="Toggle navigation sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}
          </button>

          <div
            className="top-navbar-brand"
            onClick={() => setActiveTab("overview")}
            title="Return to Overview"
          >
            <img src="/logo.png" alt="ASTER" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="brand-name">ASTER</span>
              <span style={{ fontSize: "0.66rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: "700" }}>
                Traffic AI
              </span>
            </div>
          </div>
        </div>

        {/* Center: Top Navigation Bar Tabs */}
        <div className="top-navbar-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`top-navbar-tab ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Active Tab Indicator & Backend Status */}
        <div className="top-navbar-right">
          <div className="system-badge">
            <div className="pulse-dot"></div>
            <span>{connected ? "FastAPI Connected" : "Connecting..."}</span>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. BODY: COLLAPSIBLE SCROLLABLE SIDEBAR + MAIN WORKSPACE
         ───────────────────────────────────────────────────────────── */}
      <div className="app-body">
        {/* Left Sidebar (ChatGPT-style toggle & smooth collapse) */}
        <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          {/* Sidebar Header with Quick Close Button */}
          <div className="brand-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src="/logo.png"
                alt="ASTER Logo"
                style={{
                  width: "32px",
                  height: "32px",
                  objectFit: "contain",
                  borderRadius: "6px"
                }}
              />
              <div>
                <div className="brand-title" style={{ fontSize: "1.1rem" }}>ASTER</div>
                <div className="brand-subtitle" style={{ fontSize: "0.68rem" }}>Decision Support</div>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="sidebar-toggle-btn"
              style={{ width: "30px", height: "30px", padding: 0 }}
              title="Close sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          {/* Navigation Menu */}
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
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px", marginTop: "16px" }}>
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
    </div>
  );
}
