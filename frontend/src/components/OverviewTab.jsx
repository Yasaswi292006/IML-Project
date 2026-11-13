import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Clock, MapPin, ShieldAlert, TrendingUp, Radio,
  Calendar, Users, Shield, CheckCircle2, ChevronRight, Eye, X,
  FileText, Share2, Navigation, Layers, Archive, RefreshCw, Check,
  ChevronDown, ChevronUp, AlertOctagon, Car, ExternalLink
} from 'lucide-react';
import GoogleMapComponent from './GoogleMapComponent';

export default function OverviewTab({ overviewData, eventsData, apiKey }) {
  const [toast, setToast] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);
  const [completedEvents, setCompletedEvents] = useState([]);
  const [selectedEventModal, setSelectedEventModal] = useState(null);
  const [concludingId, setConcludingId] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState("");

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

  // Fetch live & completed pre-events from database
  const refreshPreEvents = async () => {
    try {
      const resp = await fetch("http://127.0.0.1:8000/api/pre-events?status=all");
      if (resp.ok) {
        const data = await resp.json();
        setLiveEvents(data.filter(e => e.status === "live"));
        setCompletedEvents(data.filter(e => e.status === "completed"));
      }
    } catch (err) {
      console.warn("Could not fetch pre-events:", err);
    }
  };

  useEffect(() => {
    if (overviewData?.live_pre_events) {
      setLiveEvents(overviewData.live_pre_events);
    }
    if (overviewData?.completed_pre_events) {
      setCompletedEvents(overviewData.completed_pre_events);
    }
    refreshPreEvents();
  }, [overviewData]);

  // Conclude event handler: closes live notification, removes link, registers into archive
  const handleConcludeEvent = async (eventItem) => {
    setConcludingId(eventItem.id);
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/pre-events/${eventItem.id}/conclude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concluded_by: "BTP Central Command Operations Controller",
          notes: "Operational execution concluded successfully. Corridors returned to standard traffic phasing."
        })
      });

      if (!resp.ok) {
        const errJson = await resp.json();
        throw new Error(errJson.detail || "Failed to conclude event.");
      }

      // Close modal if open
      if (selectedEventModal?.id === eventItem.id) {
        setSelectedEventModal(null);
      }

      // Refresh state from database
      await refreshPreEvents();

      setToast({
        type: "success",
        title: "✅ Operation Concluded & Archived",
        message: `Live notification closed for "${eventItem.title}". Registered permanently in Priorly Conducted Events.`
      });
      setTimeout(() => setToast(null), 6000);
    } catch (err) {
      alert(`Error concluding event: ${err.message}`);
    } finally {
      setConcludingId(null);
    }
  };

  const simulateAlert = () => {
    const corridors = ["Mysore Road", "Hosur Road", "Bellary Road 1", "ORR North 1", "Old Madras Road"];
    const causes = ["Vehicle Breakdown", "Traffic Accident", "Water Logging", "VIP Convoy"];
    const c = corridors[Math.floor(Math.random() * corridors.length)];
    const cause = causes[Math.floor(Math.random() * causes.length)];
    setToast({
      type: "alert",
      title: "🚨 LIVE UNPLANNED ALERT",
      message: `${cause} reported on ${c} — HIGH IMPACT ESCALATION!`
    });
    setTimeout(() => setToast(null), 5000);
  };

  const filteredArchive = completedEvents.filter(e => {
    if (!archiveSearch) return true;
    const term = archiveSearch.toLowerCase();
    return (
      (e.title && e.title.toLowerCase().includes(term)) ||
      (e.corridor && e.corridor.toLowerCase().includes(term)) ||
      (e.police_station && e.police_station.toLowerCase().includes(term)) ||
      (e.id && e.id.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "32px",
          background: toast.type === "success" ? "#064E3B" : "#1E293B",
          border: `1px solid ${toast.type === "success" ? "#10B981" : "#EF4444"}`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          color: toast.type === "success" ? "#ECFDF5" : "#FEE2E2",
          padding: "14px 22px",
          borderRadius: "8px",
          fontSize: "0.88rem",
          fontWeight: "600",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          maxWidth: "520px"
        }}>
          {toast.type === "success" ? <CheckCircle2 color="#34D399" size={20} /> : <AlertTriangle color="#EF4444" size={20} />}
          <div>
            <div style={{ fontWeight: "700" }}>{toast.title}</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.9, marginTop: "2px" }}>{toast.message}</div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. LIVE PRE-PLANNED OPERATIONS BULLETIN (Active Dashboard Notification)
         ───────────────────────────────────────────────────────────── */}
      {liveEvents.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, rgba(185, 28, 28, 0.15) 0%, rgba(30, 41, 59, 0.9) 100%)",
          border: "1px solid rgba(239, 68, 68, 0.5)",
          borderRadius: "12px",
          padding: "18px 24px",
          boxShadow: "0 10px 30px rgba(239, 68, 68, 0.12)",
          position: "relative"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#EF4444",
                boxShadow: "0 0 12px #EF4444"
              }}></span>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "#FCA5A5", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🚨</span> Live Pre-Planned Events Bulletin ({liveEvents.length} Active Operational Plan{liveEvents.length > 1 ? "s" : ""})
              </h3>
            </div>
            <span style={{ fontSize: "0.75rem", background: "rgba(239,68,68,0.25)", color: "#FECACA", padding: "3px 10px", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.5)", fontWeight: "700" }}>
              ● LIVE OPERATION BROADCASTING ON DASHBOARD
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {liveEvents.map((ev) => (
              <div
                key={ev.id}
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px"
                }}
              >
                <div style={{ flex: 1, minWidth: "300px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{
                      background: ev.effective_tier === "High" ? "rgba(185, 28, 28, 0.35)" : "rgba(217, 119, 6, 0.35)",
                      color: ev.effective_tier === "High" ? "#FCA5A5" : "#FDE047",
                      border: `1px solid ${ev.effective_tier === "High" ? "#B91C1C" : "#D97706"}`,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.72rem",
                      fontWeight: "800"
                    }}>
                      {ev.effective_tier || "High"} IMPACT
                    </span>
                    <strong style={{ fontSize: "1rem", color: "#F8FAFC" }}>{ev.title}</strong>
                  </div>

                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0 0 10px 0", lineHeight: "1.45" }}>
                    {ev.description}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    <span>📍 <b>Corridor:</b> {ev.corridor} ({ev.police_station} Stn)</span>
                    <span>🕒 <b>Schedule:</b> {ev.start_datetime?.replace("T", " ")} ➔ {ev.end_datetime?.replace("T", " ")}</span>
                    <span>👥 <b>Crowd:</b> {parseInt(ev.crowd_size || 0).toLocaleString()}</span>
                    <span>👮 <b>Police Staged:</b> <b style={{ color: "#60A5FA" }}>{ev.allocated_officers || 14} Officers</b></span>
                    <span>🚧 <b>Barricades:</b> {(ev.barricades || []).length} Points</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setSelectedEventModal(ev)}
                    style={{
                      background: "rgba(59, 130, 246, 0.15)",
                      border: "1px solid rgba(59, 130, 246, 0.4)",
                      color: "#93C5FD",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer"
                    }}
                  >
                    <Eye size={14} /> View Full Plan & Execution Blueprint
                  </button>

                  <button
                    onClick={() => handleConcludeEvent(ev)}
                    disabled={concludingId === ev.id}
                    style={{
                      background: "rgba(16, 185, 129, 0.18)",
                      border: "1px solid rgba(16, 185, 129, 0.45)",
                      color: "#86EFAC",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer"
                    }}
                    title="Conclude event: closes live dashboard bulletin and registers into Priorly Conducted Events"
                  >
                    <CheckCircle2 size={14} /> {concludingId === ev.id ? "Concluding..." : "Conclude Event & Close Alert"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. METRICS KPI GRID
         ───────────────────────────────────────────────────────────── */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">Total Disruption Events</div>
          <div className="metric-value">{metrics.total_events?.toLocaleString()}</div>
          <div className="metric-sub">
            <Clock size={13} color="#94A3B8" /> {metrics.date_range}
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: "3px solid #B91C1C" }}>
          <div className="metric-title">High-Impact Events</div>
          <div className="metric-value" style={{ color: "#F87171" }}>
            {metrics.high_impact?.toLocaleString()}
          </div>
          <div className="metric-sub" style={{ color: "#FCA5A5" }}>
            <TrendingUp size={13} /> {metrics.high_impact_pct}% of total
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: "3px solid #3B82F6" }}>
          <div className="metric-title">Live & Planned Events</div>
          <div className="metric-value" style={{ color: "#60A5FA" }}>{metrics.planned_events}</div>
          <div className="metric-sub">
            {liveEvents.length} Active • {completedEvents.length} Concluded
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: "3px solid #D97706" }}>
          <div className="metric-title">Road Closures</div>
          <div className="metric-value" style={{ color: "#FCD34D" }}>{metrics.road_closures}</div>
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
          <div className="metric-sub">Operational benchmark</div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAP SECTION
         ───────────────────────────────────────────────────────────── */}
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

      {/* ─────────────────────────────────────────────────────────────
          4. NARRATIVE & IMPACT DISTRIBUTION
         ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
        <div className="metric-card">
          <h3 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "10px", color: "#60A5FA" }}>
            The Problem ASTER Solves
          </h3>
          <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            Bengaluru handles <strong>over 7 million vehicle trips daily</strong>. When an incident occurs on Mysore Road or Outer Ring Road during peak hours, traditional police deployment is reactive.
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

      {/* ─────────────────────────────────────────────────────────────
          5. PRIORLY CONDUCTED EVENTS REGISTER (Archived / Concluded)
         ───────────────────────────────────────────────────────────── */}
      <div className="metric-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <Archive size={18} color="#60A5FA" />
              Priorly Conducted Events Register ({completedEvents.length} Concluded & Archived)
            </h3>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Permanent operational log of completed pre-planned events. Closed from active notification radar.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="text"
              placeholder="Search archive by corridor, event, ID..."
              value={archiveSearch}
              onChange={(e) => setArchiveSearch(e.target.value)}
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#F8FAFC",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.78rem",
                width: "240px"
              }}
            />
            <button
              onClick={() => setShowArchive(prev => !prev)}
              style={{
                background: "rgba(59, 130, 246, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                color: "#93C5FD",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer"
              }}
            >
              {showArchive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showArchive ? "Collapse Register" : "Expand Register"}
            </button>
          </div>
        </div>

        {showArchive && (
          <div style={{ marginTop: "18px" }}>
            {filteredArchive.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No priorly conducted events match your search query.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="custom-table" style={{ fontSize: "0.82rem" }}>
                  <thead>
                    <tr>
                      <th>Event ID & Title</th>
                      <th>Corridor / Police Stn</th>
                      <th>Concluded Date & Time</th>
                      <th>Crowd Managed</th>
                      <th>Police Deployed</th>
                      <th>Execution Status</th>
                      <th>Archive Audit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArchive.map((ev) => (
                      <tr key={ev.id}>
                        <td>
                          <div style={{ fontWeight: "700", color: "#F8FAFC" }}>{ev.title}</div>
                          <div style={{ fontSize: "0.72rem", color: "#64748B", fontFamily: "monospace" }}>{ev.id}</div>
                        </td>
                        <td>
                          <div>{ev.corridor}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{ev.police_station}</div>
                        </td>
                        <td>
                          <div style={{ color: "#CBD5E1" }}>{ev.completed_at?.replace("T", " ") || "Archived"}</div>
                          <div style={{ fontSize: "0.72rem", color: "#64748B" }}>By: {ev.concluded_by || "BTP Sector Command"}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: "600" }}>{parseInt(ev.crowd_size || 0).toLocaleString()}</span>
                        </td>
                        <td>
                          <span style={{ color: "#60A5FA", fontWeight: "700" }}>{ev.allocated_officers || 12} Officers</span>
                        </td>
                        <td>
                          <span style={{
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "#86EFAC",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "0.72rem",
                            fontWeight: "700"
                          }}>
                            ✓ CONCLUDED
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedEventModal(ev)}
                            style={{
                              background: "rgba(255, 255, 255, 0.06)",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              color: "#CBD5E1",
                              padding: "4px 10px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <FileText size={12} /> View Record
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. MODAL: FULL OPERATIONAL PLAN & EXECUTION BLUEPRINT
         ───────────────────────────────────────────────────────────── */}
      {selectedEventModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(10, 15, 28, 0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 9999,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#0F172A",
            border: "1px solid rgba(59, 130, 246, 0.5)",
            borderRadius: "14px",
            width: "900px",
            maxWidth: "96vw",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.8)"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "16px 24px",
              background: "rgba(30, 41, 59, 0.6)",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    background: selectedEventModal.status === "live" ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.2)",
                    color: selectedEventModal.status === "live" ? "#FCA5A5" : "#86EFAC",
                    border: `1px solid ${selectedEventModal.status === "live" ? "#EF4444" : "#10B981"}`,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "0.72rem",
                    fontWeight: "800",
                    textTransform: "uppercase"
                  }}>
                    {selectedEventModal.status === "live" ? "● LIVE ACTIVE BULLETIN" : "✓ PRIORLY CONDUCTED / ARCHIVED"}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", fontFamily: "monospace" }}>
                    ID: {selectedEventModal.id}
                  </span>
                </div>
                <h3 style={{ margin: "4px 0 0 0", fontSize: "1.15rem", color: "#F8FAFC", fontWeight: "800" }}>
                  {selectedEventModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEventModal(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  padding: "4px"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "18px", fontSize: "0.85rem" }}>
              {/* Event Description & Primary Location */}
              <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <div style={{ fontWeight: "700", color: "#93C5FD", marginBottom: "4px" }}>Operational Mission Summary</div>
                <div style={{ color: "#E2E8F0", lineHeight: "1.5" }}>{selectedEventModal.description}</div>
                <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  <span><b>Corridor:</b> {selectedEventModal.corridor}</span>
                  <span><b>Junction:</b> {selectedEventModal.junction}</span>
                  <span><b>Station:</b> {selectedEventModal.police_station}</span>
                  <span><b>Coordinates:</b> {selectedEventModal.latitude}, {selectedEventModal.longitude}</span>
                  {selectedEventModal.endlatitude && (
                    <span><b>Tail:</b> {selectedEventModal.endlatitude}, {selectedEventModal.endlongitude}</span>
                  )}
                </div>
              </div>

              {/* Police Manpower Allocation */}
              <div>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "0.95rem", color: "#60A5FA", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Users size={16} /> Multi-Junction Officer Deployment Breakdown ({selectedEventModal.allocated_officers || 14} Total Officers)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                  {(selectedEventModal.allocations || []).map((a, idx) => (
                    <div key={idx} style={{ background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: "10px 12px", borderRadius: "6px" }}>
                      <div style={{ fontWeight: "700", color: "#F8FAFC" }}>{a.junction}</div>
                      <div style={{ color: "#60A5FA", fontWeight: "800", fontSize: "0.95rem", marginTop: "2px" }}>
                        {a.allocated_officers} Officers
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Barricade Perimeter & Detour Routes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ background: "rgba(30, 41, 59, 0.4)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#FCD34D", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Shield size={15} /> Barricade Cordon Perimeter ({selectedEventModal.buffer_radius})
                  </h4>
                  {(selectedEventModal.barricades || []).length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>No physical barricades required.</div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.8rem", color: "#CBD5E1", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {(selectedEventModal.barricades || []).map((b, i) => (
                        <li key={i}>
                          <strong>{b.name}</strong> ({b.road}) — {b.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div style={{ background: "rgba(30, 41, 59, 0.4)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#6EE7B7", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Navigation size={15} /> Diversion Detour Routing
                  </h4>
                  {(selectedEventModal.routes || []).length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Normal traffic flow maintained.</div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.8rem", color: "#CBD5E1", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {(selectedEventModal.routes || []).map((r, i) => (
                        <li key={i}>
                          <strong>{r.corridor}</strong>: {r.strategy}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* 72-Hour SOP Checklist */}
              {selectedEventModal.tactical_checklist && selectedEventModal.tactical_checklist.length > 0 && (
                <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#93C5FD", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Check size={15} /> Operational SOP Checklist
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    {selectedEventModal.tactical_checklist.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#CBD5E1" }}>
                        <CheckCircle2 size={13} color="#10B981" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-Channel Citizen Announcements */}
              {selectedEventModal.broadcast_advisories && (
                <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#F59E0B", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Share2 size={15} /> Automated Citizen Broadcast Alerts
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "8px 10px", borderRadius: "6px" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#34D399" }}>📱 WhatsApp Alert</span>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.74rem", color: "#E2E8F0" }}>{selectedEventModal.broadcast_advisories.whatsapp}</p>
                    </div>
                    <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "8px 10px", borderRadius: "6px" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#FCD34D" }}>📟 Highway VMS Board</span>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.74rem", color: "#FCD34D", fontFamily: "monospace", fontWeight: "700" }}>{selectedEventModal.broadcast_advisories.vms}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "14px 24px",
              background: "rgba(30, 41, 59, 0.6)",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {selectedEventModal.status === "live" ? "Operation is actively active on city corridors." : `Archived on: ${selectedEventModal.completed_at?.replace("T", " ") || "Archived"}`}
              </span>

              <div style={{ display: "flex", gap: "10px" }}>
                {selectedEventModal.status === "live" && (
                  <button
                    onClick={() => handleConcludeEvent(selectedEventModal)}
                    disabled={concludingId === selectedEventModal.id}
                    style={{
                      background: "#059669",
                      border: "none",
                      color: "#FFFFFF",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer"
                    }}
                  >
                    <CheckCircle2 size={15} /> {concludingId === selectedEventModal.id ? "Concluding..." : "Conclude Event & Close Alert"}
                  </button>
                )}
                <button
                  onClick={() => setSelectedEventModal(null)}
                  className="btn-secondary"
                  style={{ padding: "8px 16px", fontSize: "0.82rem" }}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
