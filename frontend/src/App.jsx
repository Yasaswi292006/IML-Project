import React, { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  Navigate
} from 'react-router-dom';
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
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import OverviewTab from './components/OverviewTab';
import PredictTab from './components/PredictTab';
import HeatmapTab from './components/HeatmapTab';
import BatchTriageTab from './components/BatchTriageTab';
import PreEventTab from './components/PreEventTab';
import ModelPerformanceTab from './components/ModelPerformanceTab';

const API_BASE = "http://127.0.0.1:8000";

const NAV_PAGES = [
  {
    id: "overview",
    path: "/overview",
    altPaths: ["/"],
    label: "🏠 Overview",
    title: "Overview & Real-Time Key Performance Indicators",
    browserTitle: "ASTER — Bengaluru Traffic Intelligence & Tactical Decision Support",
    icon: LayoutDashboard
  },
  {
    id: "predict",
    path: "/predict",
    altPaths: ["/predict-and-respond"],
    label: "🔮 Predict & Respond",
    title: "Predict & Respond — Tactical Incident Triage & Manpower Dispatch",
    browserTitle: "Predict & Respond — ASTER Traffic Police Decision Support",
    icon: Navigation
  },
  {
    id: "heatmap",
    path: "/heatmap",
    altPaths: ["/map-and-heatmap"],
    label: "🗺️ Map & Heatmap",
    title: "Spatial Map & Corridor Congestion Density Heatmap",
    browserTitle: "Map & Corridor Heatmap — ASTER Decision Support",
    icon: Layers
  },
  {
    id: "batch",
    path: "/batch",
    altPaths: ["/batch-triage"],
    label: "📦 Batch Triage",
    title: "Batch Incident Triage — Automated 46-Column Priority Ranking",
    browserTitle: "Batch Incident Triage — ASTER Tactical System",
    icon: Boxes
  },
  {
    id: "preevent",
    path: "/preevent",
    altPaths: ["/pre-event", "/pre-event-planner"],
    label: "📅 Pre-Event Planner",
    title: "Pre-Event Disruption Mitigation & Tactical Crowd Planning",
    browserTitle: "Pre-Event Traffic Planner — ASTRAM System",
    icon: Calendar
  },
  {
    id: "model",
    path: "/model",
    altPaths: ["/model-performance"],
    label: "📈 Model Performance",
    title: "Machine Learning Evaluation Benchmarks & Metrics",
    browserTitle: "Model Benchmarks & Metrics — ASTER AI Pipeline",
    icon: Activity
  }
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [config, setConfig] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [eventsData, setEventsData] = useState([]);
  const [connected, setConnected] = useState(false);

  // Identify active page based on current URL path
  const currentPath = location.pathname;
  const currentPage = NAV_PAGES.find(p => p.path === currentPath || (p.altPaths && p.altPaths.includes(currentPath))) || NAV_PAGES[0];

  // Dynamically update document title to reflect the active page (standard for government portals)
  useEffect(() => {
    document.title = currentPage.browserTitle;
  }, [currentPage]);

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

  return (
    <div className="app-container">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR (Clean header with toggle & branding only)
         ───────────────────────────────────────────────────────────── */}
      <header className="top-navbar">
        <div className="top-navbar-left">
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="sidebar-toggle-btn"
            title={sidebarOpen ? "Collapse sidebar (Ctrl+B)" : "Expand sidebar (Ctrl+B)"}
            aria-label="Toggle navigation sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}
          </button>

          <Link
            to="/overview"
            className="top-navbar-brand"
            style={{ textDecoration: "none" }}
            title="Return to Home / Overview"
          >
            <img src="/logo.png" alt="ASTER" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="brand-name">ASTER</span>
              <span style={{ fontSize: "0.66rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: "700" }}>
                Traffic AI
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. BODY: COLLAPSIBLE SCROLLABLE SIDEBAR + ROUTED PAGE CONTENT
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

          {/* Navigation Menu with Real Page Links */}
          <div className="nav-menu">
            {NAV_PAGES.map((page) => {
              const Icon = page.icon;
              const isActive = currentPage.id === page.id;
              return (
                <Link
                  key={page.id}
                  to={page.path}
                  className={`nav-item ${isActive ? "active" : ""}`}
                  style={{ textDecoration: "none" }}
                >
                  <Icon size={18} />
                  <span>{page.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer Metadata */}
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px", marginTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", background: "rgba(255,255,255,0.03)", padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="pulse-dot"></div>
              <span style={{ fontSize: "0.72rem", color: connected ? "#86EFAC" : "#FCA5A5", fontWeight: "600" }}>
                {connected ? "FastAPI Connected" : "Connecting Backend..."}
              </span>
            </div>

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

        {/* Main Content Area: Renders Dedicated Page Routes */}
        <main className="main-content">
          {/* Government Portal Breadcrumb Banner */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "18px",
            padding: "8px 14px",
            background: "rgba(15, 23, 42, 0.45)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
            fontSize: "0.76rem",
            color: "var(--text-muted)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>Government of Karnataka</span>
              <ChevronRight size={12} />
              <span>Bengaluru Traffic Police (BTP)</span>
              <ChevronRight size={12} />
              <span style={{ color: "#93C5FD", fontWeight: "600" }}>{currentPage.title}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "monospace", color: "#64748B" }}>
              <span>URL:</span>
              <code style={{ color: "#38BDF8", background: "rgba(56, 189, 248, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                {currentPath}
              </code>
            </div>
          </div>

          <Routes>
            {/* Page 1: Overview */}
            <Route
              path="/"
              element={
                <OverviewTab
                  overviewData={overviewData}
                  eventsData={eventsData}
                  apiKey={config?.google_maps_api_key}
                />
              }
            />
            <Route
              path="/overview"
              element={
                <OverviewTab
                  overviewData={overviewData}
                  eventsData={eventsData}
                  apiKey={config?.google_maps_api_key}
                />
              }
            />

            {/* Page 2: Predict and Respond */}
            <Route
              path="/predict"
              element={
                <PredictTab
                  config={config}
                  apiKey={config?.google_maps_api_key}
                />
              }
            />
            <Route
              path="/predict-and-respond"
              element={
                <PredictTab
                  config={config}
                  apiKey={config?.google_maps_api_key}
                />
              }
            />

            {/* Page 3: Map and Heatmap */}
            <Route
              path="/heatmap"
              element={
                <HeatmapTab
                  config={config}
                  apiKey={config?.google_maps_api_key}
                />
              }
            />
            <Route
              path="/map-and-heatmap"
              element={
                <HeatmapTab
                  config={config}
                  apiKey={config?.google_maps_api_key}
                />
              }
            />

            {/* Page 4: Batch Triage */}
            <Route
              path="/batch"
              element={<BatchTriageTab />}
            />
            <Route
              path="/batch-triage"
              element={<BatchTriageTab />}
            />

            {/* Page 5: Pre-Event Planner */}
            <Route
              path="/preevent"
              element={
                <PreEventTab
                  config={config}
                  apiKey={config?.google_maps_api_key}
                />
              }
            />
            <Route
              path="/pre-event"
              element={
                <PreEventTab
                  config={config}
                  apiKey={config?.google_maps_api_key}
                />
              }
            />
            <Route
              path="/pre-event-planner"
              element={
                <PreEventTab
                  config={config}
                  apiKey={config?.google_maps_api_key}
                />
              }
            />

            {/* Page 6: Model Performance */}
            <Route
              path="/model"
              element={<ModelPerformanceTab />}
            />
            <Route
              path="/model-performance"
              element={<ModelPerformanceTab />}
            />

            {/* Catch-all redirect to Overview */}
            <Route
              path="*"
              element={<Navigate to="/overview" replace />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
