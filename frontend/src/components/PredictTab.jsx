import React, { useState, useEffect } from 'react';
import {
  AlertCircle, Shield, Navigation, Users, Share2, CheckCircle2,
  ChevronRight, Copy, MapPin, Calendar, Clock, AlertTriangle, RotateCcw
} from 'lucide-react';
import GoogleMapComponent from './GoogleMapComponent';

export default function PredictTab({ config, apiKey }) {
  // Corridor list and metadata
  const corridorsList = config?.corridors || ["Hosur Road", "Mysore Road", "Bellary Road 1", "ORR North 1"];
  const corridorMeta = config?.corridor_metadata || {};

  // Form State - Complete Dataset Attributes
  const [corridor, setCorridor] = useState("Hosur Road");
  const [cause, setCause] = useState("vehicle_breakdown");
  const [eventType, setEventType] = useState("unplanned");
  const [priority, setPriority] = useState("High");
  const [vehType, setVehType] = useState("bmtc_bus");
  const [policeStation, setPoliceStation] = useState("Madiwala");
  const [junction, setJunction] = useState("SilkBoardJunc");
  const [zone, setZone] = useState("South Zone 1");
  const [address, setAddress] = useState("Hosur Road near Silk Board Junction, Madiwala, Bengaluru");
  const [lat, setLat] = useState(12.916600);
  const [lng, setLng] = useState(77.625600);
  const [dateStr, setDateStr] = useState("2026-03-15");
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(15);
  const [roadClosure, setRoadClosure] = useState(true);
  const [weatherMultiplier, setWeatherMultiplier] = useState(1.0);
  const [description, setDescription] = useState("BMTC bus breakdown on center carriage lane causing 1.5km peak backlog");

  // Operational State
  const [validationErrors, setValidationErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);
  const [mapSyncLoading, setMapSyncLoading] = useState(false);
  const [syncedNotification, setSyncedNotification] = useState(null);

  // When corridor changes, populate smart defaults from dataset metadata
  const handleCorridorChange = (newCorridor) => {
    setCorridor(newCorridor);
    const meta = corridorMeta[newCorridor];
    if (meta) {
      if (meta.lat) setLat(parseFloat(meta.lat));
      if (meta.lng) setLng(parseFloat(meta.lng));
      if (meta.zone) setZone(meta.zone);
      if (meta.police_station) setPoliceStation(meta.police_station);
      if (meta.junction) setJunction(meta.junction);
      if (meta.address) setAddress(meta.address);
    }
  };

  // Map Click Handler - Update Coordinates & Pin & Automatically populate all fields on the left
  const handleLocationSelect = async ({ lat: newLat, lng: newLng, googleAddress }) => {
    setLat(newLat);
    setLng(newLng);
    setMapSyncLoading(true);

    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/lookup-location?lat=${newLat}&lng=${newLng}`);
      if (resp.ok) {
        const data = await resp.json();

        // 1. Auto-fill Corridor, Station, Junction, Zone
        if (data.corridor) setCorridor(data.corridor);
        if (data.police_station) setPoliceStation(data.police_station);
        if (data.junction) setJunction(data.junction);
        if (data.zone) setZone(data.zone);

        // 2. Auto-fill exact address (preferring Google Maps Geocoded road name if available)
        const finalAddress = googleAddress || data.address;
        if (finalAddress) setAddress(finalAddress);

        // 3. Auto-fill priority & description
        if (data.priority) setPriority(data.priority);
        if (data.description) setDescription(data.description);
        if (data.requires_road_closure !== undefined) setRoadClosure(data.requires_road_closure);

        // Clear any previous missing field warnings since we filled everything
        setValidationErrors([]);

        // Display confirmation badge
        setSyncedNotification({
          corridor: data.corridor,
          station: data.police_station,
          junction: data.junction,
          address: finalAddress,
          lat: newLat,
          lng: newLng
        });
        setTimeout(() => setSyncedNotification(null), 5000);
      } else {
        if (googleAddress) setAddress(googleAddress);
      }
    } catch (err) {
      console.error("Location lookup error:", err);
      if (googleAddress) setAddress(googleAddress);
    } finally {
      setMapSyncLoading(false);
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = [];
    if (!corridor) errors.push("Arterial Corridor");
    if (!cause) errors.push("Disruption Cause");
    if (!eventType) errors.push("Event Type (Planned / Unplanned)");
    if (!priority) errors.push("Priority Tier");
    if (!vehType) errors.push("Vehicle Type");
    if (!policeStation) errors.push("Police Station Jurisdiction");
    if (!junction) errors.push("Junction / Landmark");
    if (!zone) errors.push("Administrative Zone");
    if (!address || !address.trim()) errors.push("Incident Address / Location");
    if (isNaN(lat) || lat < 12.5 || lat > 13.5) errors.push("Valid Latitude (12.5 - 13.5)");
    if (isNaN(lng) || lng < 77.3 || lng > 77.9) errors.push("Valid Longitude (77.3 - 77.9)");
    if (!dateStr) errors.push("Start Date");
    if (!description || !description.trim()) errors.push("Incident Description / Notes");
    return errors;
  };

  const handlePredict = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    setLoading(true);

    try {
      const resp = await fetch("http://127.0.0.1:8000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corridor,
          cause,
          event_type: eventType,
          priority,
          vehicle_type: vehType,
          police_station: policeStation,
          junction,
          zone,
          address,
          custom_lat: parseFloat(lat),
          custom_lng: parseFloat(lng),
          date_str: dateStr,
          hour: parseInt(hour),
          minute: parseInt(minute),
          requires_road_closure: roadClosure,
          weather_multiplier: parseFloat(weatherMultiplier),
          description
        })
      });
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      console.error("Prediction error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    handleCorridorChange("Hosur Road");
    setCause("vehicle_breakdown");
    setEventType("unplanned");
    setPriority("High");
    setVehType("bmtc_bus");
    setHour(9);
    setMinute(15);
    setRoadClosure(true);
    setWeatherMultiplier(1.0);
    setDescription("BMTC bus breakdown on center carriage lane causing 1.5km peak backlog");
    setValidationErrors([]);
    setResult(null);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 3000);
  };

  // Lookup options from config with robust fallbacks
  const causesList = config?.causes || [
    { key: "vehicle_breakdown", label: "Vehicle Breakdown" },
    { key: "accident", label: "Traffic Accident" },
    { key: "road_work", label: "Road Construction / Digging" },
    { key: "water_logging", label: "Water Logging / Flooding" },
    { key: "tree_fall", label: "Fallen Tree / Obstacle" },
    { key: "vip_movement", label: "VIP Movement / Convoy" },
    { key: "public_event", label: "Public Gathering / Festival" },
    { key: "signal_failure", label: "Signal Malfunction" }
  ];

  const vehicleTypesList = config?.vehicle_types || [
    { key: "bmtc_bus", label: "BMTC City Bus" },
    { key: "heavy_vehicle", label: "Heavy Commercial Vehicle" },
    { key: "truck", label: "Freight Truck / Container" },
    { key: "lcv", label: "Light Commercial Vehicle (LCV)" },
    { key: "private_bus", label: "Private Bus" },
    { key: "private_car", label: "Private Car (Sedan / SUV)" },
    { key: "ksrtc_bus", label: "KSRTC Bus" },
    { key: "auto", label: "Auto Rickshaw" },
    { key: "taxi", label: "App Taxi / Cab" },
    { key: "two_wheeler", label: "Two Wheeler" },
    { key: "others", label: "Other Vehicle" }
  ];

  const stationsList = config?.police_stations || [
    "Madiwala", "HSR Layout", "Peenya", "Cubbon Park", "Sadashivanagar",
    "Halasuru Gate", "Yelahanka", "HAL Old Airport", "Byatarayanapura",
    "Yeshwanthpura", "Hennuru", "Kodigehalli", "Banaswadi", "K.R. Pura",
    "Kamakshipalya", "Wilson Garden", "Banashankari", "Whitefield", "Indiranagar"
  ];

  const junctionsList = config?.junctions || [
    "SilkBoardJunc", "DairyCircle", "MekhriCircle", "JalahalliCross(SM Circle)",
    "AyyappaTempleJunc", "SatteliteBusStandJunc", "YeshwanthpuraCircle", "YelhankaCircle",
    "toll gate mysore road", "Nagavara-ORR Junction", "K R Circle", "KIMCO Junction",
    "VeerannapalyaJunction(BEL,HO)", "RichmondCircle", "TrinityCircle", "SonyWorldJunction"
  ];

  const zonesList = config?.zones || [
    "Central Zone 1", "Central Zone 2", "East Zone 1", "East Zone 2",
    "North Zone 1", "North Zone 2", "South Zone 1", "South Zone 2",
    "West Zone 1", "West Zone 2"
  ];

  return (
    <div>
      {/* Validation Error Banner */}
      {validationErrors.length > 0 && (
        <div style={{
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid #EF4444",
          borderRadius: "8px",
          padding: "12px 18px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px"
        }}>
          <AlertTriangle color="#EF4444" size={20} style={{ marginTop: "2px", flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: "700", color: "#FCA5A5", fontSize: "0.92rem" }}>
              Incomplete Dataset Entry — {validationErrors.length} Required Field(s) Missing:
            </div>
            <div style={{ fontSize: "0.82rem", color: "#FECACA", marginTop: "4px" }}>
              {validationErrors.join(" • ")}
            </div>
          </div>
        </div>
      )}

      {/* Map Synchronization Success Banner */}
      {syncedNotification && (
        <div style={{
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.4)",
          borderRadius: "8px",
          padding: "10px 16px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          animation: "fadeIn 0.3s ease"
        }}>
          <CheckCircle2 color="#10B981" size={20} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: "0.84rem", color: "#D1FAE5" }}>
            <span style={{ fontWeight: "700", color: "#6EE7B7" }}>✓ Map Pin Synchronized:</span> Auto-populated corridor <strong>{syncedNotification.corridor}</strong>, <strong>{syncedNotification.junction}</strong>, <strong>{syncedNotification.station}</strong> police jurisdiction, and address coordinates.
          </div>
        </div>
      )}

      {/* Main 2-Column Command Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: "24px", alignItems: "start" }}>

        {/* LEFT COLUMN: All Required Dataset Fields Form */}
        <div className="metric-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <span>🚨</span> ASTRAM Dataset Incident Entry
            </h3>
            <button
              onClick={handleReset}
              style={{
                background: "transparent",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                color: "var(--text-muted)",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer"
              }}
              title="Reset fields to BTP default template"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Section 1: Core Incident Identifiers */}
          <div style={{ fontSize: "0.76rem", fontWeight: "700", color: "#60A5FA", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
            1. Core Incident Identifiers
          </div>

          <div className="form-group">
            <label className="form-label">
              Arterial Corridor <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <select
              className="form-select"
              value={corridor}
              onChange={(e) => handleCorridorChange(e.target.value)}
            >
              {corridorsList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">
                Disruption Cause <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                className="form-select"
                value={cause}
                onChange={(e) => setCause(e.target.value)}
              >
                {causesList.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Event Type <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                className="form-select"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              >
                <option value="unplanned">Unplanned Disruption</option>
                <option value="planned">Planned Event / Works</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">
                Initial Priority <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="High">High (Immediate)</option>
                <option value="Medium">Medium (Routine)</option>
                <option value="Low">Low (Advisory)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Vehicle Involved <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                className="form-select"
                value={vehType}
                onChange={(e) => setVehType(e.target.value)}
              >
                {vehicleTypesList.map((v) => (
                  <option key={v.key} value={v.key}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Geographic & Jurisdictional Data */}
          <div style={{ fontSize: "0.76rem", fontWeight: "700", color: "#60A5FA", textTransform: "uppercase", letterSpacing: "0.05em", margin: "16px 0 10px" }}>
            2. Location & Jurisdiction
          </div>

          <div className="form-group">
            <label className="form-label">
              Incident Address / Landmark <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="text"
              className="form-select"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Hosur Road near Silk Board Junction, Madiwala"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">
                Latitude <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                className="form-select"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Longitude <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                className="form-select"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
              />
            </div>
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "-8px", marginBottom: "12px" }}>
            💡 Tip: Click anywhere on the Google Map on the right to set exact coordinates.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">
                Police Station <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                className="form-select"
                value={policeStation}
                onChange={(e) => setPoliceStation(e.target.value)}
              >
                {stationsList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Nearest Junction <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                className="form-select"
                value={junction}
                onChange={(e) => setJunction(e.target.value)}
              >
                {junctionsList.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Administrative Traffic Zone <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <select
              className="form-select"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
            >
              {zonesList.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          {/* Section 3: Operational Conditions */}
          <div style={{ fontSize: "0.76rem", fontWeight: "700", color: "#60A5FA", textTransform: "uppercase", letterSpacing: "0.05em", margin: "16px 0 10px" }}>
            3. Timing & Operational Conditions
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">
                Date (2025–2026) <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="date"
                className="form-select"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Time (IST) <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <select
                  className="form-select"
                  value={hour}
                  onChange={(e) => setHour(parseInt(e.target.value))}
                  style={{ width: "60px" }}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                  ))}
                </select>
                <span style={{ alignSelf: "center", fontWeight: "bold" }}>:</span>
                <select
                  className="form-select"
                  value={minute}
                  onChange={(e) => setMinute(parseInt(e.target.value))}
                  style={{ width: "60px" }}
                >
                  <option value={0}>00</option>
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={45}>45</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Road Closure Required? <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.85rem" }}>
                <input
                  type="radio"
                  name="road_closure"
                  checked={roadClosure === true}
                  onChange={() => setRoadClosure(true)}
                />
                <span style={{ color: "#EF4444", fontWeight: "600" }}>Yes</span> (Carriage Lane Blocked)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.85rem" }}>
                <input
                  type="radio"
                  name="road_closure"
                  checked={roadClosure === false}
                  onChange={() => setRoadClosure(false)}
                />
                <span style={{ color: "#10B981", fontWeight: "600" }}>No</span> (Shoulder / Minor Delay)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Weather Impact Condition</label>
            <select
              className="form-select"
              value={weatherMultiplier}
              onChange={(e) => setWeatherMultiplier(parseFloat(e.target.value))}
            >
              <option value="1.0">☀️ Normal / Dry Surface (1.0x)</option>
              <option value="1.25">🌧️ Light Rain / Wet Road (1.25x)</option>
              <option value="1.6">⛈️ Heavy Monsoon / Waterlogged (1.6x)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Incident Description / Patrol Notes <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <textarea
              className="form-select"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., BMTC bus broken down near bus bay, traffic slow moving."
            />
          </div>

          <button
            className="btn-primary"
            style={{ width: "100%", marginTop: "14px", padding: "12px", fontSize: "0.95rem" }}
            onClick={handlePredict}
            disabled={loading}
          >
            {loading ? "Computing ASTER AI Pipeline..." : "⚡ Run ASTER AI Pipeline"}
          </button>
        </div>

        {/* RIGHT COLUMN: Fixed Google Maps + Results Canvas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* PERMANENT FIXED GOOGLE MAP */}
          <div className="map-card-container" style={{ position: "sticky", top: "16px", zIndex: 10 }}>
            <div className="map-header">
              <div className="map-header-title">
                <Navigation size={18} color="#60A5FA" />
                <span>
                  Tactical Incident Map —{" "}
                  <strong style={{ color: "#F8FAFC" }}>{corridor}</strong>
                  {result?.nearest_junction && ` (Junction: ${result.nearest_junction})`}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.78rem" }}>
                <span style={{ background: "rgba(59,130,246,0.15)", color: "#93C5FD", padding: "3px 8px", borderRadius: "4px" }}>
                  📍 {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
                <span style={{ color: mapSyncLoading ? "#F59E0B" : "#38BDF8", fontWeight: "600" }}>
                  {mapSyncLoading ? "⚡ Syncing form..." : "✨ Click map to auto-fill form"}
                </span>
              </div>
            </div>

            <GoogleMapComponent
              apiKey={apiKey}
              incident={{
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                tier: result?.predicted_tier || null
              }}
              barricades={result?.barricades || []}
              routes={result?.routes || []}
              allocations={result?.allocations || []}
              mode="tactical"
              height="440px"
              onLocationSelect={handleLocationSelect}
            />
          </div>

          {/* BELOW MAP: Real-Time AI Results or Readiness Guide */}
          {!result ? (
            <div className="metric-card" style={{ padding: "28px 24px", textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <MapPin size={24} color="#60A5FA" />
              </div>
              <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#F8FAFC", marginBottom: "6px" }}>
                Tactical Map Position Fixed & Ready
              </h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "560px", margin: "0 auto 12px" }}>
                The Google Maps live canvas is actively positioned at <strong>{corridor}</strong>. You can click anywhere on the road network to relocate the incident pin. When all required dataset fields on the left are filled, click <strong>Run ASTER AI Pipeline</strong> to generate the 500m cordon, detour polylines, and OR-Tools officer dispatch.
              </p>
              <div style={{ display: "inline-flex", gap: "16px", fontSize: "0.78rem", color: "#94A3B8" }}>
                <span>✓ Live Google Traffic Layer</span>
                <span>✓ 6-Decimal Pin Precision</span>
                <span>✓ Full ASTRAM Schema Validation</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Triage Overview Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: "16px" }}>
                <div className="metric-card" style={{
                  borderLeft: `4px solid ${result.predicted_tier === "High" ? "#EF4444" : result.predicted_tier === "Medium" ? "#F59E0B" : "#10B981"}`
                }}>
                  <div className="metric-title">Forecasted Impact Triage</div>
                  <div style={{
                    fontSize: "1.6rem",
                    fontWeight: "800",
                    color: result.predicted_tier === "High" ? "#EF4444" : result.predicted_tier === "Medium" ? "#F59E0B" : "#10B981",
                    marginTop: "4px"
                  }}>
                    {result.predicted_tier === "High" ? "🔴" : result.predicted_tier === "Medium" ? "🟡" : "🟢"} {result.predicted_tier.toUpperCase()} IMPACT
                  </div>
                  <div className="metric-sub">
                    Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong> | Priority: <strong>{result.response_priority}</strong>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-title">Police Deployment SLA</div>
                  <div className="metric-value" style={{ color: "#60A5FA" }}>
                    {result.deployment_time}
                  </div>
                  <div className="metric-sub">
                    Target response SLA
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-title">Optimized Officers</div>
                  <div className="metric-value" style={{ color: "#3B82F6" }}>
                    {result.officers_deployed} Active
                  </div>
                  <div className="metric-sub">
                    MILP via Google OR-Tools
                  </div>
                </div>
              </div>

              {/* MILP Manpower Optimization Table */}
              {result.allocations?.length > 0 && (
                <div className="metric-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                      <Users size={16} color="#3B82F6" />
                      MILP Police Officer Allocation (Google OR-Tools)
                    </h4>
                    <span style={{ fontSize: "0.75rem", background: "rgba(59,130,246,0.15)", color: "#93C5FD", padding: "2px 8px", borderRadius: "4px" }}>
                      Pool Capacity: 30 Officers
                    </span>
                  </div>

                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Assigned Junction / Post</th>
                        <th>Distance to Epicenter</th>
                        <th>Severity EIS</th>
                        <th>Recommended Officers</th>
                        <th>Action Protocol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.allocations.map((a, idx) => (
                        <tr key={idx} style={{ background: a.event_id === "current" ? "rgba(59, 130, 246, 0.08)" : "transparent" }}>
                          <td>
                            <strong>{a.junction}</strong>
                            {a.event_id === "current" && (
                              <span style={{ marginLeft: "6px", fontSize: "0.7rem", background: "#3B82F6", color: "#FFF", padding: "1px 5px", borderRadius: "3px" }}>
                                PRIMARY
                              </span>
                            )}
                          </td>
                          <td>{(a.distance_km || 0.8).toFixed(1)} km</td>
                          <td>{(a.predicted_eis || 0.75).toFixed(2)}</td>
                          <td>
                            <span style={{ color: "#60A5FA", fontWeight: "bold", fontSize: "0.95rem" }}>
                              {a.allocated_officers} Officers
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: "0.75rem",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: a.allocated_officers >= 4 ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)",
                              color: a.allocated_officers >= 4 ? "#FCA5A5" : "#93C5FD"
                            }}>
                              {a.allocated_officers >= 4 ? "Cordon & Divert" : "Traffic Flow Control"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* BTP SOP Action Checklist */}
              {result.tactical_checklist?.length > 0 && (
                <div className="metric-card">
                  <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Shield size={16} color="#10B981" />
                    BTP Operational Standard Operating Procedure (SOP) Checklist
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {result.tactical_checklist.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <CheckCircle2 size={16} color="#10B981" style={{ marginTop: "2px", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.82rem", color: "#E2E8F0" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Public Broadcast Advisories */}
              {result.broadcast_advisories && (
                <div className="metric-card">
                  <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Share2 size={16} color="#F59E0B" />
                    Automated Multi-Channel Citizen Broadcast Advisories
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                    {/* WhatsApp Alert */}
                    <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "8px", padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#34D399" }}>📱 WhatsApp Citizen Alert</span>
                        <button
                          className="btn-copy"
                          onClick={() => copyToClipboard(result.broadcast_advisories.whatsapp, 'wa')}
                        >
                          <Copy size={12} /> {copySuccess === 'wa' ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <pre style={{ fontSize: "0.75rem", color: "#E2E8F0", whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0, maxHeight: "90px", overflowY: "auto" }}>
                        {result.broadcast_advisories.whatsapp}
                      </pre>
                    </div>

                    {/* VMS Display Board */}
                    <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "8px", padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#FCD34D" }}>📟 VMS Highway Board</span>
                        <button
                          className="btn-copy"
                          onClick={() => copyToClipboard(result.broadcast_advisories.vms, 'vms')}
                        >
                          <Copy size={12} /> {copySuccess === 'vms' ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <pre style={{ fontSize: "0.75rem", color: "#FCD34D", whiteSpace: "pre-wrap", fontFamily: "monospace", margin: 0, fontWeight: "bold" }}>
                        {result.broadcast_advisories.vms}
                      </pre>
                    </div>

                    {/* Twitter / X */}
                    <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.25)", borderRadius: "8px", padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#38BDF8" }}>🐦 Twitter / X Feed</span>
                        <button
                          className="btn-copy"
                          onClick={() => copyToClipboard(result.broadcast_advisories.twitter, 'tw')}
                        >
                          <Copy size={12} /> {copySuccess === 'tw' ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <pre style={{ fontSize: "0.75rem", color: "#E2E8F0", whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0, maxHeight: "90px", overflowY: "auto" }}>
                        {result.broadcast_advisories.twitter}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
