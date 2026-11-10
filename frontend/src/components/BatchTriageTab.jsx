import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Download,
  CheckCircle,
  AlertOctagon,
  FileSpreadsheet,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Activity,
  Layers,
  Database,
  ShieldCheck,
  Table
} from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000";

const ASTRAM_46_COLUMNS = [
  "id", "event_type", "latitude", "longitude", "endlatitude", "endlongitude",
  "address", "end_address", "event_cause", "requires_road_closure",
  "start_datetime", "end_datetime", "status", "authenticated", "modified_datetime",
  "map_file", "direction", "description", "veh_type", "veh_no", "corridor",
  "priority", "cargo_material", "reason_breakdown", "age_of_truck", "created_date",
  "route_path", "client_id", "created_by_id", "last_modified_by_id",
  "assigned_to_police_id", "citizen_accident_id", "comment", "police_station",
  "meta_data", "kgid", "resolved_at_address", "resolved_at_latitude",
  "resolved_at_longitude", "closed_by_id", "closed_datetime", "resolved_by_id",
  "resolved_datetime", "gba_identifier", "zone", "junction"
];

const DEFAULT_SAMPLE_EVENTS = [
  { id: "FKID000000", corridor: "Tumkur Road", cause: "Vehicle Breakdown", hour: "17:01", tier: "Medium", effective_tier: "Medium", confidence: "67.7%", closure: "No", officers: 4, prio: 1, response_priority: "P2 - Elevated", action: "Deploy standby tow vehicle to Jalahalli Cross junction." },
  { id: "FKID000001", corridor: "ORR East 1", cause: "Vehicle Breakdown", hour: "17:05", tier: "Medium", effective_tier: "Medium", confidence: "65.1%", closure: "No", officers: 4, prio: 2, response_priority: "P2 - Elevated", action: "Clear carriageway shoulder at KR Puram / Tin Factory." },
  { id: "FKID000002", corridor: "Non-corridor", cause: "Other Incident", hour: "17:10", tier: "High", effective_tier: "High", confidence: "68.1%", closure: "Yes", officers: 8, prio: 3, response_priority: "P1 - Critical", action: "Coordinate emergency perimeter closure with local traffic station." },
  { id: "FKID000003", corridor: "Non-corridor", cause: "Tree Fall", hour: "17:15", tier: "High", effective_tier: "High", confidence: "61.8%", closure: "Yes", officers: 7, prio: 4, response_priority: "P1 - Critical", action: "Cordon fall site; summon BBMP forest chainsaw rescue team." },
  { id: "FKID000004", corridor: "Non-corridor", cause: "Vehicle Breakdown", hour: "17:20", tier: "Medium", effective_tier: "Medium", confidence: "53.0%", closure: "No", officers: 3, prio: 5, response_priority: "P2 - Elevated", action: "Station patrol officers to manage merge lane slowdown." }
];

export default function BatchTriageTab() {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showSpecGuide, setShowSpecGuide] = useState(false);
  
  // Results & Summary
  const [results, setResults] = useState(DEFAULT_SAMPLE_EVENTS);
  const [summary, setSummary] = useState({
    total_events: 5,
    high_impact: 2,
    medium_impact: 3,
    low_impact: 0,
    road_closures: 2,
    total_officers_deployed: 26,
    avg_confidence: 63.1,
    validated_columns: 46
  });

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    setValidationError(null);
    setSuccessMessage(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setValidationError({
        message: "Invalid file type. Only standard CSV (.csv) files are supported.",
        errors: ["File extension is not .csv"]
      });
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  // Upload & Process Batch
  const processBatch = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setValidationError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const resp = await fetch(`${API_BASE}/api/batch-predict`, {
        method: "POST",
        body: formData
      });

      const data = await resp.json();

      if (!resp.ok) {
        // Backend validation rejected the file
        const errDetail = data.detail || {};
        setValidationError({
          message: errDetail.message || "CSV rejected due to formatting or incomplete schema.",
          total_missing: errDetail.total_missing || 0,
          required_columns_count: errDetail.required_columns_count || 46,
          received_columns_count: errDetail.received_columns_count || 0,
          missing_columns: errDetail.missing_columns || [],
          errors: errDetail.errors || [data.detail || "Validation error occurred."]
        });
        return;
      }

      // Success: Feed immediately to UI
      setResults(data.results || []);
      setSummary(data.summary || {});
      setSuccessMessage(`46/46 ASTRAM Schema Columns Verified! Successfully triaged ${data.results?.length || 0} disruption events through Gradient Boosting & OR-Tools SCIP solver.`);
    } catch (err) {
      console.error("Batch processing error:", err);
      setValidationError({
        message: "Failed to communicate with ASTER Intelligence API server.",
        errors: [err.message]
      });
    } finally {
      setLoading(false);
    }
  };

  // Download Sample Template CSV (Full 46 columns)
  const downloadTemplate = () => {
    window.location.href = `${API_BASE}/api/batch-template`;
  };

  // Load Built-in Sample Shift Log (1-Click test with all 46 columns)
  const loadSampleDataset = async () => {
    try {
      setLoading(true);
      setValidationError(null);
      const resp = await fetch(`${API_BASE}/api/batch-template`);
      const csvText = await resp.text();
      const blob = new Blob([csvText], { type: "text/csv" });
      const file = new File([blob], "aster_btp_46col_template.csv", { type: "text/csv" });
      setSelectedFile(file);

      const formData = new FormData();
      formData.append("file", file);
      const postResp = await fetch(`${API_BASE}/api/batch-predict`, {
        method: "POST",
        body: formData
      });
      const data = await postResp.json();
      if (postResp.ok) {
        setResults(data.results || []);
        setSummary(data.summary || {});
        setSuccessMessage(`Full 46-Column ASTRAM shift log loaded and triaged (${data.results?.length} events).`);
      } else {
        setValidationError(data.detail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Export Results
  const exportCSV = () => {
    if (!results || results.length === 0) return;
    const headers = "Priority Rank,Event ID,Corridor,Cause,Time,Impact Tier,Confidence,Closure Required,Recommended Police,Response Priority,Action\n";
    const rows = results.map(r => 
      `"${r.prio}","${r.id}","${r.corridor}","${r.cause}","${r.hour}","${r.effective_tier || r.tier}","${r.confidence}","${r.closure}","${r.officers}","${r.response_priority}","${(r.action || '').replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aster_46col_triage_results_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div>
      {/* Top Banner & Action Controls */}
      <div className="metric-card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                background: "rgba(59, 130, 246, 0.15)",
                color: "#60A5FA",
                padding: "6px 10px",
                borderRadius: "6px",
                fontWeight: "700",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <Database size={13} /> ASTRAM 46-Column Enterprise Schema
              </div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>• Strict Full-Schema Enforcement</span>
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginTop: "6px", color: "#F8FAFC" }}>
              Batch Incident Ingestion & Priority Triage
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px", maxWidth: "750px" }}>
              Upload ASTRAM shift logs or multi-incident CSV reports. <b>All 46 columns from the Bengaluru Traffic Police dataset schema are strictly required</b>. If all 46 columns are present and valid, the data is preprocessed and fed immediately into the Gradient Boosting model and OR-Tools SCIP solver.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowSpecGuide(!showSpecGuide)}
              className="btn-primary"
              style={{ background: "#1E2D4E", border: "1px solid rgba(59,130,246,0.3)" }}
            >
              <FileSpreadsheet size={15} />
              46-Column Guide {showSpecGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={downloadTemplate}
              className="btn-primary"
              style={{ background: "#1E293B", border: "1px solid rgba(148,163,184,0.3)", color: "#94A3B8" }}
              title="Download full 46-column template with real ASTRAM sample records"
            >
              <Download size={15} /> Download 46-Col Template
            </button>
            <button className="btn-primary" onClick={exportCSV}>
              <Download size={15} /> Export Queue (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* 46-Column Format Specification Guide (Expandable) */}
      {showSpecGuide && (
        <div className="metric-card" style={{ marginBottom: "20px", borderLeft: "4px solid #3B82F6", background: "#0F1A30" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Info size={18} color="#60A5FA" />
            <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#F8FAFC" }}>
              Full 46-Column ASTRAM Dataset Schema (All 46 Required)
            </h4>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
            To prevent incomplete records and maintain data integrity, the pipeline validates that the uploaded CSV header contains every single one of the 46 columns defined in <code>bengaluru_traffic_events.csv</code>:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
            {/* Identification & Audit */}
            <div style={{ background: "rgba(15, 23, 42, 0.7)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
              <div style={{ color: "#60A5FA", fontWeight: "700", fontSize: "0.8rem", marginBottom: "6px" }}>
                1. Identification & Audit (9 cols)
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <code>id</code>, <code>client_id</code>, <code>created_by_id</code>, <code>last_modified_by_id</code>, <code>assigned_to_police_id</code>, <code>citizen_accident_id</code>, <code>kgid</code>, <code>closed_by_id</code>, <code>resolved_by_id</code>
              </p>
            </div>

            {/* Geospatial & Coordinates */}
            <div style={{ background: "rgba(15, 23, 42, 0.7)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
              <div style={{ color: "#60A5FA", fontWeight: "700", fontSize: "0.8rem", marginBottom: "6px" }}>
                2. Geospatial & Coordinates (9 cols)
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <code>latitude</code>, <code>longitude</code>, <code>endlatitude</code>, <code>endlongitude</code>, <code>address</code>, <code>end_address</code>, <code>resolved_at_address</code>, <code>resolved_at_latitude</code>, <code>resolved_at_longitude</code>
              </p>
            </div>

            {/* Disruption & Priority */}
            <div style={{ background: "rgba(15, 23, 42, 0.7)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
              <div style={{ color: "#60A5FA", fontWeight: "700", fontSize: "0.8rem", marginBottom: "6px" }}>
                3. Cause, Closure & Status (7 cols)
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <code>event_cause</code>, <code>requires_road_closure</code>, <code>priority</code>, <code>event_type</code>, <code>status</code>, <code>authenticated</code>, <code>description</code>
              </p>
            </div>

            {/* Temporal Datetimes */}
            <div style={{ background: "rgba(15, 23, 42, 0.7)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
              <div style={{ color: "#60A5FA", fontWeight: "700", fontSize: "0.8rem", marginBottom: "6px" }}>
                4. Temporal Timestamps (6 cols)
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <code>start_datetime</code>, <code>end_datetime</code>, <code>modified_datetime</code>, <code>created_date</code>, <code>closed_datetime</code>, <code>resolved_datetime</code>
              </p>
            </div>

            {/* Corridor & Routing */}
            <div style={{ background: "rgba(15, 23, 42, 0.7)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
              <div style={{ color: "#60A5FA", fontWeight: "700", fontSize: "0.8rem", marginBottom: "6px" }}>
                5. Corridor & Jurisdiction (7 cols)
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <code>corridor</code>, <code>zone</code>, <code>junction</code>, <code>police_station</code>, <code>direction</code>, <code>route_path</code>, <code>gba_identifier</code>
              </p>
            </div>

            {/* Vehicle & Metadata */}
            <div style={{ background: "rgba(15, 23, 42, 0.7)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
              <div style={{ color: "#60A5FA", fontWeight: "700", fontSize: "0.8rem", marginBottom: "6px" }}>
                6. Vehicle & Operational Meta (8 cols)
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <code>veh_type</code>, <code>veh_no</code>, <code>cargo_material</code>, <code>reason_breakdown</code>, <code>age_of_truck</code>, <code>comment</code>, <code>meta_data</code>, <code>map_file</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Dropzone & Action Box */}
      <div className="metric-card" style={{ marginBottom: "20px" }}>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragging ? "2px dashed #3B82F6" : "2px dashed rgba(59, 130, 246, 0.35)",
            background: isDragging ? "rgba(59, 130, 246, 0.08)" : "rgba(15, 23, 42, 0.5)",
            borderRadius: "10px",
            padding: "26px 20px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            style={{ display: "none" }}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "46px",
              height: "46px",
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#60A5FA"
            }}>
              <UploadCloud size={24} />
            </div>
            <div>
              <span style={{ fontWeight: "700", color: "#F8FAFC", fontSize: "0.95rem" }}>
                {selectedFile ? selectedFile.name : "Click to select or drag & drop 46-column ASTRAM CSV here"}
              </span>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB — Click 'Validate & Run Batch Triage' below` : "Only files containing all 46 dataset columns will be accepted"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls for Selected File */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="btn-primary"
              disabled={!selectedFile || loading}
              onClick={processBatch}
              style={{
                opacity: (!selectedFile || loading) ? 0.6 : 1,
                cursor: (!selectedFile || loading) ? "not-allowed" : "pointer"
              }}
            >
              {loading ? (
                <>
                  <Activity size={16} className="animate-spin" /> Verifying 46 Columns & Running Pipeline...
                </>
              ) : (
                <>
                  <CheckCircle size={16} /> Validate & Run Batch Triage
                </>
              )}
            </button>

            {selectedFile && (
              <button
                onClick={() => { setSelectedFile(null); setValidationError(null); }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <RotateCcw size={14} /> Clear file
              </button>
            )}
          </div>

          <button
            onClick={loadSampleDataset}
            disabled={loading}
            style={{
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "#93C5FD",
              padding: "8px 14px",
              borderRadius: "6px",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Table size={14} /> Quick Demo: Load Valid 46-Column Sample Shift Log
          </button>
        </div>
      </div>

      {/* REJECTION ERROR BANNER (Strict 46-Column Validation Failure) */}
      {validationError && (
        <div style={{
          background: "#1E1318",
          border: "1px solid #EF4444",
          boxShadow: "0 8px 24px rgba(239, 68, 68, 0.15)",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "20px"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <AlertOctagon size={24} color="#EF4444" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h4 style={{ color: "#EF4444", fontSize: "0.95rem", fontWeight: "700" }}>
                  ⛔ CSV File Rejected — Incomplete ASTRAM Schema
                </h4>
                {validationError.received_columns_count !== undefined && (
                  <span style={{ background: "#7F1D1D", color: "#FEE2E2", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>
                    Found {validationError.received_columns_count} of 46 required columns
                  </span>
                )}
              </div>
              <p style={{ color: "#FCA5A5", fontSize: "0.85rem", marginTop: "4px" }}>
                {validationError.message} To ensure the model receives complete records, all 46 columns must be present. Please resolve the following errors:
              </p>

              {validationError.errors && validationError.errors.length > 0 && (
                <div style={{
                  marginTop: "12px",
                  background: "rgba(0, 0, 0, 0.35)",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  maxHeight: "180px",
                  overflowY: "auto",
                  border: "1px solid rgba(239, 68, 68, 0.25)"
                }}>
                  <ul style={{ margin: 0, paddingLeft: "16px", color: "#FEE2E2", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {validationError.errors.map((err, idx) => (
                      <li key={idx} style={{ fontFamily: "monospace", lineHeight: "1.4" }}>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION BANNER */}
      {successMessage && (
        <div style={{
          background: "#0E241B",
          border: "1px solid #10B981",
          borderRadius: "10px",
          padding: "14px 18px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#D1FAE5",
          fontSize: "0.88rem",
          fontWeight: "600"
        }}>
          <CheckCircle size={18} color="#10B981" />
          {successMessage}
        </div>
      )}

      {/* BATCH SUMMARY KPI METRICS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "20px" }}>
        <div className="metric-card" style={{ borderLeft: "4px solid #3B82F6" }}>
          <div className="metric-title">Triaged Incidents</div>
          <div className="metric-value" style={{ color: "#60A5FA" }}>{summary.total_events || 0}</div>
          <div className="metric-sub">46/46 cols verified</div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid #EF4444" }}>
          <div className="metric-title">High Impact Tiers</div>
          <div className="metric-value" style={{ color: "#EF4444" }}>{summary.high_impact || 0}</div>
          <div className="metric-sub">Urgent P1 response</div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid #F59E0B" }}>
          <div className="metric-title">Road Closures</div>
          <div className="metric-value" style={{ color: "#F59E0B" }}>{summary.road_closures || 0}</div>
          <div className="metric-sub">Perimeter cordons</div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid #06B6D4" }}>
          <div className="metric-title">Police Deployed</div>
          <div className="metric-value" style={{ color: "#06B6D4" }}>{summary.total_officers_deployed || 0}</div>
          <div className="metric-sub">OR-Tools MILP Solver</div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid #10B981" }}>
          <div className="metric-title">Avg Confidence</div>
          <div className="metric-value" style={{ color: "#10B981" }}>{summary.avg_confidence || 0}%</div>
          <div className="metric-sub">Gradient Boosting</div>
        </div>
      </div>

      {/* QUEUE TABLE */}
      <div className="metric-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h4 style={{ fontSize: "1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={17} color="#60A5FA" />
            Prioritized Operational Response Queue
          </h4>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Sorted dynamically by impact severity, road closure, and risk tier
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: "70px" }}>Priority</th>
                <th>Event ID</th>
                <th>Corridor</th>
                <th>Reported Cause</th>
                <th>Time (IST)</th>
                <th>Impact Tier</th>
                <th>Confidence</th>
                <th>Road Closure</th>
                <th>Recommended Police</th>
                <th>Tactical Action Plan</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const tierVal = r.effective_tier || r.tier;
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: "800", color: r.prio <= 2 ? "#EF4444" : r.prio <= 4 ? "#F59E0B" : "#94A3B8" }}>
                      #{r.prio}
                    </td>
                    <td style={{ fontFamily: "monospace", color: "#60A5FA", fontWeight: "600" }}>
                      {r.id}
                    </td>
                    <td style={{ fontWeight: "600", color: "#F8FAFC" }}>
                      {r.corridor}
                    </td>
                    <td>{r.cause}</td>
                    <td>{r.hour}</td>
                    <td>
                      <span className={`badge-tier ${tierVal === 'High' ? 'badge-high' : tierVal === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                        {tierVal}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      {r.confidence}
                    </td>
                    <td>
                      <span style={{ color: r.closure === 'Yes' ? '#EF4444' : '#10B981', fontWeight: '700' }}>
                        {r.closure}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: "inline-block",
                        background: "rgba(59, 130, 246, 0.15)",
                        color: "#93C5FD",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontWeight: "700",
                        fontSize: "0.82rem"
                      }}>
                        {r.officers} Officers
                      </span>
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)", maxWidth: "340px", whiteSpace: "normal" }}>
                      {r.action}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
