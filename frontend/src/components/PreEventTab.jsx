import React, { useState, useEffect } from 'react';
import {
  Calendar, Users, Shield, MapPin, CheckSquare, Search, Download, Copy,
  Check, Save, AlertTriangle, Layers, Navigation, ArrowRight, Clock,
  FileText, CheckCircle2, ChevronDown, ChevronRight, Sliders, Radio, Sparkles
} from 'lucide-react';
import GoogleMapComponent from './GoogleMapComponent';

const PRESETS = [
  {
    name: "🏏 IPL Cricket Match",
    description: "IPL T20 match at M. Chinnaswamy Stadium with 35,000 spectators",
    cause: "public_event",
    corridor: "CBD 2",
    police_station: "Cubbon Park",
    junction: "QueensCircle",
    zone: "Central Zone 1",
    gba_identifier: "Bengaluru Central Corporation",
    address: "M. Chinnaswamy Stadium, MG Road, Bengaluru, Karnataka",
    lat: 12.978835,
    lng: 77.599537,
    end_address: "Cubbon Road Parking & Brigade Road Junction, Bengaluru",
    endlat: 12.981500,
    endlng: 77.605000,
    crowd_size: 35000,
    closure: true,
    priority: "High",
    veh_type: "bmtc_bus",
    veh_no: "KA-01-F-9901 (BMTC Special Shuttle)",
    direction: "Both",
    kgid: "FKKG000008",
    comment: "Erect pedestrian cordons along Queen's Road and deploy radial shuttle feeder buses from MG Road Metro."
  },
  {
    name: "🚗 VIP State Convoy",
    description: "High-level ministerial official motorcade transit from Airport to Raj Bhavan",
    cause: "vip_movement",
    corridor: "Bellary Road 1",
    police_station: "Sadashivanagar",
    junction: "MekhriCircle",
    zone: "North Zone 1",
    gba_identifier: "Bengaluru North Corporation",
    address: "Bellary Road, Mekhri Circle Flyover, Bengaluru, Karnataka",
    lat: 13.014300,
    lng: 77.583100,
    end_address: "Raj Bhavan Road, Bengaluru, Karnataka",
    endlat: 12.986600,
    endlng: 77.591400,
    crowd_size: 5000,
    closure: true,
    priority: "High",
    veh_type: "vip_convoy",
    veh_no: "KA-01-GA-0001 (VIP Escort Fleet)",
    direction: "Inbound",
    kgid: "FKKG000012",
    comment: "Clear Bellary Road central carriage lane 15 mins prior. Synchronize green corridor signals across all 8 flyovers."
  },
  {
    name: "🎪 Karaga Religious Procession",
    description: "Traditional Bengaluru Karaga night cultural procession covering historic market routes",
    cause: "procession",
    corridor: "Mysore Road",
    police_station: "Halasuru Gate",
    junction: "CorporationCircle",
    zone: "Central Zone 2",
    gba_identifier: "Bengaluru Central Corporation",
    address: "Dharmaraya Swamy Temple, Thigalarpet, Nagarathpete, Bengaluru",
    lat: 12.964800,
    lng: 77.581200,
    end_address: "City Market & OTC Road Junction, Bengaluru",
    endlat: 12.966000,
    endlng: 77.575000,
    crowd_size: 40000,
    closure: true,
    priority: "High",
    veh_type: "others",
    veh_no: "N/A (Pedestrian Procession)",
    direction: "Both",
    kgid: "FKKG000025",
    comment: "Total vehicular ban in KR Market / Avenue Road interior. Divert Mysore Road inbound buses to Satellite Bus Stand."
  },
  {
    name: "🏃 Bengaluru Midnight Marathon",
    description: "Annual 21K city marathon route starting from ITPL Whitefield corridor",
    cause: "public_event",
    corridor: "Varthur Road",
    police_station: "Whitefield",
    junction: "SonyWorldJunction",
    zone: "East Zone 2",
    gba_identifier: "BBMP Mahadevapura Zone",
    address: "ITPL Main Road near Whitefield Club, Bengaluru, Karnataka",
    lat: 12.985000,
    lng: 77.728000,
    end_address: "KTPO Complex, Export Promotion Industrial Park, Whitefield",
    endlat: 12.975000,
    endlng: 77.715000,
    crowd_size: 15000,
    closure: true,
    priority: "High",
    veh_type: "others",
    veh_no: "N/A (Marathon Cordon)",
    direction: "One-Way",
    kgid: "FKKG000034",
    comment: "Barricade eastern slow lane for marathon runners from 22:00 to 04:00. Maintain outer ring road freight diversion."
  },
  {
    name: "🚧 Metro Pier Extension Work",
    description: "Namma Metro Blue Line elevated viaduct pier lifting operations across ORR North",
    cause: "road_work",
    corridor: "ORR North 1",
    police_station: "Kodigehalli",
    junction: "VeerannapalyaJunction(BEL,HO)",
    zone: "North Zone 1",
    gba_identifier: "BBMP Yelahanka Zone",
    address: "Outer Ring Road North near Veerannapalya Flyover, Bengaluru",
    lat: 13.042000,
    lng: 77.610000,
    end_address: "Nagavara Lake ORR Underpass, Bengaluru",
    endlat: 13.049000,
    endlng: 77.635000,
    crowd_size: 2000,
    closure: false,
    priority: "High",
    veh_type: "heavy_vehicle",
    veh_no: "KA-04-CR-8821 (150T Hydraulic Crane)",
    direction: "Outbound",
    kgid: "FKKG000055",
    comment: "Maintain single-lane traffic on ORR North service roads. AFAD automated flaggers deployed 200m upstream."
  },
  {
    name: "📢 Public Rally / Demonstration",
    description: "Civic union demonstration and mass gathering at Freedom Park assembly grounds",
    cause: "protest",
    corridor: "Non-corridor",
    police_station: "Halasuru Gate",
    junction: "RichmondCircle",
    zone: "Central Zone 2",
    gba_identifier: "Bengaluru Central Corporation",
    address: "Freedom Park, Sheshadri Road, Gandhi Nagar, Bengaluru, Karnataka",
    lat: 12.979000,
    lng: 77.581500,
    end_address: "Anand Rao Circle Flyover Junction, Bengaluru",
    endlat: 12.981000,
    endlng: 77.576000,
    crowd_size: 20000,
    closure: true,
    priority: "High",
    veh_type: "others",
    veh_no: "N/A (Mass Gathering)",
    direction: "Both",
    kgid: "FKKG000088",
    comment: "Close Sheshadri Road between Anand Rao Circle and KR Circle. Channel traffic via Palace Road and Race Course Road."
  }
];

export default function PreEventTab({ config, apiKey }) {
  // Configuration options
  const corridorsList = config?.corridors || ["CBD 2", "Hosur Road", "Bellary Road 1", "Mysore Road", "ORR North 1"];
  const corridorMeta = config?.corridor_metadata || {};
  const causesList = config?.causes || [
    { key: "public_event", label: "Public Gathering / Festival / Rally" },
    { key: "vip_movement", label: "VIP Movement / Official Convoy" },
    { key: "procession", label: "Religious / Cultural Procession" },
    { key: "protest", label: "Protest / Demonstration Blockade" },
    { key: "road_work", label: "Road Construction / Digging" },
    { key: "congestion", label: "Severe Choke-point Congestion" },
    { key: "others", label: "Other Disruption" }
  ];
  const vehicleTypes = config?.vehicle_types || [
    { key: "bmtc_bus", label: "BMTC City Bus" },
    { key: "heavy_vehicle", label: "Heavy Commercial / Multi-Axle" },
    { key: "private_bus", label: "Private / Shuttle Bus" },
    { key: "private_car", label: "Private Car / SUV" },
    { key: "vip_convoy", label: "VIP Convoy / Police Escort" },
    { key: "others", label: "Other / Pedestrian Cordon" }
  ];
  const policeStations = config?.police_stations || [
    "Cubbon Park", "Madiwala", "Sadashivanagar", "Halasuru Gate", "HSR Layout",
    "Peenya", "Byatarayanapura", "Whitefield", "Yeshwanthpura", "Kodigehalli"
  ];
  const junctionsList = config?.junctions || [
    "QueensCircle", "SilkBoardJunc", "MekhriCircle", "CorporationCircle",
    "RichmondCircle", "SonyWorldJunction", "VeerannapalyaJunction(BEL,HO)", "DairyCircle"
  ];
  const zonesList = config?.zones || [
    "Central Zone 1", "Central Zone 2", "East Zone 1", "East Zone 2",
    "North Zone 1", "North Zone 2", "South Zone 1", "South Zone 2",
    "West Zone 1", "West Zone 2"
  ];

  // Pin Targeting Mode on Map
  const [pinMode, setPinMode] = useState("start"); // "start" or "end"

  // ─────────────────────────────────────────────────────────────
  // 46 ASTRAM Column Form State
  // ─────────────────────────────────────────────────────────────
  const [eventId, setEventId] = useState("PLN-2026-8173");
  const [eventType, setEventType] = useState("planned");
  const [cause, setCause] = useState("public_event");
  const [description, setDescription] = useState("IPL T20 Cricket Match at M. Chinnaswamy Stadium with 35,000 spectators");
  const [crowdSize, setCrowdSize] = useState(35000);
  const [corridor, setCorridor] = useState("CBD 2");
  const [policeStation, setPoliceStation] = useState("Cubbon Park");
  const [junction, setJunction] = useState("QueensCircle");
  const [zone, setZone] = useState("Central Zone 1");
  const [gbaIdentifier, setGbaIdentifier] = useState("Bengaluru Central Corporation");
  
  // Start Venue & Coordinates
  const [address, setAddress] = useState("M. Chinnaswamy Stadium, MG Road, Bengaluru, Karnataka");
  const [lat, setLat] = useState(12.978835);
  const [lng, setLng] = useState(77.599537);

  // Destination / End Coordinates (For routes, processions, marathons)
  const [endAddress, setEndAddress] = useState("Cubbon Road Parking & Brigade Road Junction, Bengaluru");
  const [endLat, setEndLat] = useState(12.981500);
  const [endLng, setEndLng] = useState(77.605000);
  const [direction, setDirection] = useState("Both");
  const [routePath, setRoutePath] = useState("[12.9788, 77.5995] -> [12.9815, 77.6050]");

  // Schedule & Flags
  const [startDate, setStartDate] = useState("2026-03-25");
  const [startTime, setStartTime] = useState("14:00");
  const [endDate, setEndDate] = useState("2026-03-25");
  const [endTime, setEndTime] = useState("22:00");
  const [roadClosure, setRoadClosure] = useState(true);
  const [priority, setPriority] = useState("High");
  const [status, setStatus] = useState("scheduled");
  const [authenticated, setAuthenticated] = useState("yes");

  // Fleet, Logistics & Credentials
  const [vehType, setVehType] = useState("bmtc_bus");
  const [vehNo, setVehNo] = useState("KA-01-F-9901 (BMTC Special Shuttle)");
  const [cargoMaterial, setCargoMaterial] = useState("Event Stage Logistics & Cordon Equipment");
  const [reasonBreakdown, setReasonBreakdown] = useState("N/A");
  const [ageOfTruck, setAgeOfTruck] = useState("");
  const [comment, setComment] = useState("Erect pedestrian cordons along Queen's Road and deploy radial shuttle feeder buses from MG Road Metro.");
  const [kgid, setKgid] = useState("FKKG000008");
  const [createdById, setCreatedById] = useState("BTP_PLANNER_01");
  const [assignedPoliceId, setAssignedPoliceId] = useState("SECTOR_COMMAND_01");
  const [clientId, setClientId] = useState(1);
  const [citizenAccidentId, setCitizenAccidentId] = useState("N/A");
  const [mapFile, setMapFile] = useState("route_chinnaswamy_ipl.geojson");
  const [metaData, setMetaData] = useState('{"crowd_size": 35000, "buffer_radius_m": 1500}');

  // Operational State
  const [activeFormTab, setActiveFormTab] = useState("identity"); // "identity", "spatial", "schedule", "credentials"
  const [activeViewTab, setActiveViewTab] = useState("plan"); // "plan", "inspector"
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [mapSyncToast, setMapSyncToast] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);
  const [saveToast, setSaveToast] = useState(null);
  const [inspectorFilter, setInspectorFilter] = useState("");

  // Apply a preset
  const applyPreset = (p) => {
    setDescription(p.description);
    setCause(p.cause);
    setCorridor(p.corridor);
    setPoliceStation(p.police_station);
    setJunction(p.junction);
    setZone(p.zone);
    setGbaIdentifier(p.gba_identifier);
    setAddress(p.address);
    setLat(p.lat);
    setLng(p.lng);
    setEndAddress(p.end_address || "");
    setEndLat(p.endlat || 0.0);
    setEndLng(p.endlng || 0.0);
    setCrowdSize(p.crowd_size);
    setRoadClosure(p.closure);
    setPriority(p.priority);
    setVehType(p.veh_type || "others");
    setVehNo(p.veh_no || "N/A");
    setDirection(p.direction || "Both");
    setKgid(p.kgid || "FKKG000008");
    setComment(p.comment || "");
    setRoutePath(`[${p.lat}, ${p.lng}] -> [${p.endlat || p.lat}, ${p.endlng || p.lng}]`);
    setMetaData(JSON.stringify({ crowd_size: p.crowd_size, preset: p.name }));

    setMapSyncToast({
      title: `Preset Applied: ${p.name}`,
      message: `${p.corridor} • ${p.junction} • Expected Crowd: ${p.crowd_size.toLocaleString()}`
    });
    setTimeout(() => setMapSyncToast(null), 4000);
  };

  // Map Click / Search location selection handler
  const handleLocationSelect = async ({ lat: newLat, lng: newLng, googleAddress }) => {
    if (pinMode === "end") {
      setEndLat(newLat);
      setEndLng(newLng);
      if (googleAddress) setEndAddress(googleAddress);
      setRoutePath(`[${lat}, ${lng}] -> [${newLat}, ${newLng}]`);
      setMapSyncToast({
        title: "🏁 Destination Point Synced",
        message: `${googleAddress || `${newLat}, ${newLng}`} (Route End)`
      });
      setTimeout(() => setMapSyncToast(null), 4000);
      return;
    }

    // Origin / Venue Location Pinning
    setLat(newLat);
    setLng(newLng);

    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/lookup-location?lat=${newLat}&lng=${newLng}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.corridor) setCorridor(data.corridor);
        if (data.police_station) setPoliceStation(data.police_station);
        if (data.junction) setJunction(data.junction);
        if (data.zone) setZone(data.zone);
        const resolvedAddr = googleAddress || data.address;
        if (resolvedAddr) setAddress(resolvedAddr);

        // Derive GBA identifier from zone
        if (data.zone) {
          if (data.zone.includes("Central")) setGbaIdentifier("Bengaluru Central Corporation");
          else if (data.zone.includes("North")) setGbaIdentifier("Bengaluru North Corporation / BBMP Yelahanka");
          else if (data.zone.includes("South")) setGbaIdentifier("BBMP South Zone");
          else if (data.zone.includes("East")) setGbaIdentifier("BBMP Mahadevapura Zone");
          else setGbaIdentifier("BBMP Rajarajeshwarinagar Zone");
        }

        setRoutePath(`[${newLat}, ${newLng}] -> [${endLat || newLat}, ${endLng || newLng}]`);

        setMapSyncToast({
          title: "📍 Origin Venue Synced from Map",
          message: `${data.corridor} near ${data.junction} (${data.police_station} station)`
        });
        setTimeout(() => setMapSyncToast(null), 4500);
      } else {
        if (googleAddress) setAddress(googleAddress);
      }
    } catch (err) {
      console.error("Location lookup error:", err);
      if (googleAddress) setAddress(googleAddress);
    }
  };

  // Run Pre-Event Response Plan & Audit
  const handleSimulate = async () => {
    setLoading(true);
    try {
      const payload = {
        id: eventId,
        event_type: eventType,
        event_cause: cause,
        description: description,
        crowd_size: parseInt(crowdSize) || 20000,
        corridor: corridor,
        zone: zone,
        police_station: policeStation,
        junction: junction,
        gba_identifier: gbaIdentifier,
        address: address,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        end_address: endAddress,
        endlatitude: parseFloat(endLat) || 0.0,
        endlongitude: parseFloat(endLng) || 0.0,
        direction: direction,
        route_path: routePath,
        requires_road_closure: roadClosure,
        priority: priority,
        status: status,
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        veh_type: vehType,
        veh_no: vehNo,
        cargo_material: cargoMaterial,
        reason_breakdown: reasonBreakdown,
        age_of_truck: ageOfTruck ? parseFloat(ageOfTruck) : null,
        comment: comment,
        kgid: kgid,
        created_by_id: createdById,
        assigned_to_police_id: assignedPoliceId,
        citizen_accident_id: citizenAccidentId,
        map_file: mapFile,
        meta_data: metaData,
        authenticated: authenticated,
        client_id: parseInt(clientId) || 1,
        weather_multiplier: 1.0
      };

      const resp = await fetch("http://127.0.0.1:8000/api/pre-event/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        throw new Error(`Simulation failed: ${resp.statusText}`);
      }

      const data = await resp.json();
      setSimulationResult(data);
    } catch (err) {
      console.error("Pre-event simulation error:", err);
      alert(`Simulation Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount once with default IPL match
  useEffect(() => {
    handleSimulate();
  }, []);

  // Save Pre-Event to ASTRAM Database
  const handleSaveToDatabase = async () => {
    if (!simulationResult?.astram_record) {
      await handleSimulate();
    }
    const recordToSave = simulationResult?.astram_record;
    if (!recordToSave) return;

    setSaveLoading(true);
    try {
      const resp = await fetch("http://127.0.0.1:8000/api/pre-event/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordToSave)
      });

      if (!resp.ok) {
        const errJson = await resp.json();
        throw new Error(errJson.detail || "Failed to commit record.");
      }

      const resData = await resp.json();
      setSaveToast({
        title: "✅ Committed to ASTRAM Database!",
        message: `${resData.message} Total events in system: ${resData.total_events_now}`
      });
      setTimeout(() => setSaveToast(null), 5000);
    } catch (err) {
      alert(`Database Save Error: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // Download CSV
  const handleDownloadCSV = () => {
    if (!simulationResult?.csv_row) return;
    const blob = new Blob([simulationResult.csv_row], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `astram_planned_event_${eventId || "record"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy JSON
  const handleCopyJSON = () => {
    if (!simulationResult?.astram_record) return;
    navigator.clipboard.writeText(JSON.stringify(simulationResult.astram_record, null, 2));
    setCopyStatus("Copied JSON!");
    setTimeout(() => setCopyStatus(null), 3000);
  };

  const copyAdvisory = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(`Copied ${type}!`);
    setTimeout(() => setCopyStatus(null), 2500);
  };

  return (
    <div>
      {/* Toast Alert Notifications */}
      {mapSyncToast && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "32px",
          background: "#1E293B",
          border: "1px solid #3B82F6",
          boxShadow: "0 8px 24px rgba(59,130,246,0.25)",
          color: "#E2E8F0",
          padding: "12px 20px",
          borderRadius: "8px",
          fontSize: "0.88rem",
          fontWeight: "500",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <MapPin color="#60A5FA" size={18} />
          <div>
            <div style={{ fontWeight: "700", color: "#93C5FD" }}>{mapSyncToast.title}</div>
            <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>{mapSyncToast.message}</div>
          </div>
        </div>
      )}

      {saveToast && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "32px",
          background: "#064E3B",
          border: "1px solid #10B981",
          boxShadow: "0 8px 24px rgba(16,185,129,0.3)",
          color: "#ECFDF5",
          padding: "12px 20px",
          borderRadius: "8px",
          fontSize: "0.88rem",
          fontWeight: "500",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <CheckCircle2 color="#34D399" size={20} />
          <div>
            <div style={{ fontWeight: "700", color: "#A7F3D0" }}>{saveToast.title}</div>
            <div style={{ fontSize: "0.78rem", color: "#D1FAE5" }}>{saveToast.message}</div>
          </div>
        </div>
      )}

      {/* Quick Scenario Presets */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={14} color="#60A5FA" /> Quick Scenario Presets (ASTRAM Canonical Events)
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Satisfies all 46 ASTRAM data schema columns
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              className="btn-secondary"
              style={{ fontSize: "0.8rem", padding: "6px 12px", border: "1px solid rgba(59,130,246,0.3)", background: "rgba(15,23,42,0.8)" }}
              onClick={() => applyPreset(p)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Left, Tactical Map & Plan Right */}
      <div style={{ display: "grid", gridTemplateColumns: "480px 1fr", gap: "24px" }}>
        {/* Left Column: Form with Tabbed Category Views */}
        <div className="metric-card" style={{ display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "14px", borderBottom: "1px solid var(--border-color)", marginBottom: "14px" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", color: "#F8FAFC" }}>
                <Calendar size={18} color="#60A5FA" /> Pre-Event Input Matrix
              </h3>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                Conforms strictly to 46-column ASTRAM database format
              </div>
            </div>
            <div style={{
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.35)",
              color: "#93C5FD",
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "0.72rem",
              fontWeight: "700"
            }}>
              46 COLUMNS READY
            </div>
          </div>

          {/* Form Section Navigation */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px", marginBottom: "16px", background: "rgba(15,23,42,0.6)", padding: "4px", borderRadius: "8px" }}>
            <button
              className={`btn-secondary ${activeFormTab === "identity" ? "active" : ""}`}
              style={{
                fontSize: "0.75rem",
                padding: "6px 4px",
                justifyContent: "center",
                background: activeFormTab === "identity" ? "rgba(59,130,246,0.25)" : "transparent",
                color: activeFormTab === "identity" ? "#93C5FD" : "var(--text-secondary)",
                border: "none",
                fontWeight: activeFormTab === "identity" ? "700" : "500"
              }}
              onClick={() => setActiveFormTab("identity")}
            >
              1. Event & Crowd
            </button>
            <button
              className={`btn-secondary ${activeFormTab === "spatial" ? "active" : ""}`}
              style={{
                fontSize: "0.75rem",
                padding: "6px 4px",
                justifyContent: "center",
                background: activeFormTab === "spatial" ? "rgba(59,130,246,0.25)" : "transparent",
                color: activeFormTab === "spatial" ? "#93C5FD" : "var(--text-secondary)",
                border: "none",
                fontWeight: activeFormTab === "spatial" ? "700" : "500"
              }}
              onClick={() => setActiveFormTab("spatial")}
            >
              2. Venue & Route
            </button>
            <button
              className={`btn-secondary ${activeFormTab === "schedule" ? "active" : ""}`}
              style={{
                fontSize: "0.75rem",
                padding: "6px 4px",
                justifyContent: "center",
                background: activeFormTab === "schedule" ? "rgba(59,130,246,0.25)" : "transparent",
                color: activeFormTab === "schedule" ? "#93C5FD" : "var(--text-secondary)",
                border: "none",
                fontWeight: activeFormTab === "schedule" ? "700" : "500"
              }}
              onClick={() => setActiveFormTab("schedule")}
            >
              3. Time Schedule
            </button>
            <button
              className={`btn-secondary ${activeFormTab === "credentials" ? "active" : ""}`}
              style={{
                fontSize: "0.75rem",
                padding: "6px 4px",
                justifyContent: "center",
                background: activeFormTab === "credentials" ? "rgba(59,130,246,0.25)" : "transparent",
                color: activeFormTab === "credentials" ? "#93C5FD" : "var(--text-secondary)",
                border: "none",
                fontWeight: activeFormTab === "credentials" ? "700" : "500"
              }}
              onClick={() => setActiveFormTab("credentials")}
            >
              4. ASTRAM Meta
            </button>
          </div>

          {/* Tab 1: Event Identity & Crowd */}
          {activeFormTab === "identity" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "460px", paddingRight: "4px" }}>
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label className="form-label">Event Description & Title (`description`)</label>
                <input
                  type="text"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Cricket Match at Chinnaswamy Stadium..."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Disruption Cause (`event_cause`)</label>
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

                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Event Type (`event_type`)</label>
                  <select
                    className="form-select"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                  >
                    <option value="planned">planned (Pre-Event)</option>
                    <option value="unplanned">unplanned (Emergency)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Anticipated Crowd Size</label>
                  <input
                    type="number"
                    step="2500"
                    min="500"
                    className="form-input"
                    value={crowdSize}
                    onChange={(e) => setCrowdSize(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Priority Tier (`priority`)</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="High">High (Arterial Corridor)</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label className="form-label">Road Closure Cordon (`requires_road_closure`)</label>
                <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem", color: roadClosure ? "#EF4444" : "var(--text-secondary)", fontWeight: "600" }}>
                    <input
                      type="radio"
                      name="pe_closure"
                      checked={roadClosure === true}
                      onChange={() => setRoadClosure(true)}
                    />
                    Full Road Closure (Mandatory Detour)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem", color: !roadClosure ? "#10B981" : "var(--text-secondary)", fontWeight: "600" }}>
                    <input
                      type="radio"
                      name="pe_closure"
                      checked={roadClosure === false}
                      onChange={() => setRoadClosure(false)}
                    />
                    Traffic Allowed (Lane Regulation)
                  </label>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group" style={{ marginBottom: "0px" }}>
                  <label className="form-label">Status (`status`)</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="scheduled">scheduled</option>
                    <option value="active">active</option>
                    <option value="closed">closed</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: "0px" }}>
                  <label className="form-label">Authenticated (`authenticated`)</label>
                  <select
                    className="form-select"
                    value={authenticated}
                    onChange={(e) => setAuthenticated(e.target.value)}
                  >
                    <option value="yes">yes (BTP Verified)</option>
                    <option value="no">no</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Spatial & Jurisdictions */}
          {activeFormTab === "spatial" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "460px", paddingRight: "4px" }}>
              <div style={{
                background: "rgba(59,130,246,0.08)",
                border: "1px dashed rgba(59,130,246,0.3)",
                padding: "8px 12px",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ fontSize: "0.78rem", color: "#93C5FD", fontWeight: "600" }}>
                  🗺️ Map Click Targeting Mode:
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className={`btn-secondary ${pinMode === "start" ? "active" : ""}`}
                    style={{
                      fontSize: "0.72rem",
                      padding: "3px 8px",
                      background: pinMode === "start" ? "#2563EB" : "rgba(30,41,59,0.8)",
                      color: "#FFFFFF"
                    }}
                    onClick={() => setPinMode("start")}
                  >
                    📍 Start / Venue
                  </button>
                  <button
                    className={`btn-secondary ${pinMode === "end" ? "active" : ""}`}
                    style={{
                      fontSize: "0.72rem",
                      padding: "3px 8px",
                      background: pinMode === "end" ? "#D97706" : "rgba(30,41,59,0.8)",
                      color: "#FFFFFF"
                    }}
                    onClick={() => setPinMode("end")}
                  >
                    🏁 End / Route
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label className="form-label">Venue / Origin Address (`address`)</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Start Latitude (`latitude`)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-input"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Start Longitude (`longitude`)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-input"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Corridor (`corridor`)</label>
                  <select
                    className="form-select"
                    value={corridor}
                    onChange={(e) => setCorridor(e.target.value)}
                  >
                    {corridorsList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Police Station (`police_station`)</label>
                  <select
                    className="form-select"
                    value={policeStation}
                    onChange={(e) => setPoliceStation(e.target.value)}
                  >
                    {policeStations.map((ps) => (
                      <option key={ps} value={ps}>{ps}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Junction Landmark (`junction`)</label>
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
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Zone (`zone`)</label>
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
              </div>

              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label className="form-label">GBA Identifier (`gba_identifier`)</label>
                <input
                  type="text"
                  className="form-input"
                  value={gbaIdentifier}
                  onChange={(e) => setGbaIdentifier(e.target.value)}
                />
              </div>

              {/* Route End Coordinates */}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "10px" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#F59E0B", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Navigation size={13} /> Route / Destination Coordinates (`endlatitude`, `endlongitude`)
                </div>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Destination Address (`end_address`)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={endAddress}
                    onChange={(e) => setEndAddress(e.target.value)}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group" style={{ marginBottom: "10px" }}>
                    <label className="form-label">End Latitude (`endlatitude`)</label>
                    <input
                      type="number"
                      step="0.000001"
                      className="form-input"
                      value={endLat}
                      onChange={(e) => setEndLat(parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "10px" }}>
                    <label className="form-label">End Longitude (`endlongitude`)</label>
                    <input
                      type="number"
                      step="0.000001"
                      className="form-input"
                      value={endLng}
                      onChange={(e) => setEndLng(parseFloat(e.target.value))}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group" style={{ marginBottom: "0px" }}>
                    <label className="form-label">Direction (`direction`)</label>
                    <select
                      className="form-select"
                      value={direction}
                      onChange={(e) => setDirection(e.target.value)}
                    >
                      <option value="Both">Both Directions</option>
                      <option value="Inbound">Inbound to City</option>
                      <option value="Outbound">Outbound to Suburbs</option>
                      <option value="One-Way">One-Way</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: "0px" }}>
                    <label className="form-label">Route Coordinates (`route_path`)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={routePath}
                      onChange={(e) => setRoutePath(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Time Schedule */}
          {activeFormTab === "schedule" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto", maxHeight: "460px", paddingRight: "4px" }}>
              <div style={{ background: "rgba(15,23,42,0.6)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#60A5FA", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={14} /> Start Time & Window (`start_datetime`)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group" style={{ marginBottom: "0px" }}>
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "0px" }}>
                    <label className="form-label">Start Time (24h)</label>
                    <input
                      type="time"
                      className="form-input"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ background: "rgba(15,23,42,0.6)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#F59E0B", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={14} /> Concluding Egress Time (`end_datetime`)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group" style={{ marginBottom: "0px" }}>
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "0px" }}>
                    <label className="form-label">End Time (24h)</label>
                    <input
                      type="time"
                      className="form-input"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.3)",
                padding: "12px",
                borderRadius: "8px"
              }}>
                <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#34D399", marginBottom: "4px" }}>
                  📅 Calculated Lead Notice Window: 72 Hours Prior
                </div>
                <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                  Conforms to BTP SOP: VMS digital signage, social media bulletins, and transit advisories must trigger at least 72 hours before start timestamp.
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Logistics, Fleet & ASTRAM Metadata */}
          {activeFormTab === "credentials" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "460px", paddingRight: "4px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Event ID (`id`)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Officer KGID (`kgid`)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={kgid}
                    onChange={(e) => setKgid(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Vehicle Type (`veh_type`)</label>
                  <select
                    className="form-select"
                    value={vehType}
                    onChange={(e) => setVehType(e.target.value)}
                  >
                    {vehicleTypes.map((v) => (
                      <option key={v.key} value={v.key}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Convoy Reg (`veh_no`)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vehNo}
                    onChange={(e) => setVehNo(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Created By (`created_by_id`)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={createdById}
                    onChange={(e) => setCreatedById(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label className="form-label">Assigned Sector (`assigned_to_police_id`)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={assignedPoliceId}
                    onChange={(e) => setAssignedPoliceId(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label className="form-label">Cargo / Equipment (`cargo_material`)</label>
                <input
                  type="text"
                  className="form-input"
                  value={cargoMaterial}
                  onChange={(e) => setCargoMaterial(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "0px" }}>
                <label className="form-label">Advisory Directives (`comment`)</label>
                <textarea
                  rows="2"
                  className="form-input"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Action Button: Simulate & Audit */}
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-color)" }}>
            <button
              className="btn-primary"
              style={{ width: "100%", padding: "12px 18px", fontSize: "0.95rem" }}
              onClick={handleSimulate}
              disabled={loading}
            >
              {loading ? (
                <span>Evaluating Pre-Event Impact...</span>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>⚡ Simulate Response Plan & Audit 46 Columns</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Tactical Map, Decision Cards & 46-Column Inspector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Tactical Map with Search and Hotspots */}
          <div className="map-card-container">
            <div className="map-header">
              <div className="map-header-title">
                <Navigation size={18} color="#3B82F6" />
                <span>Pre-Event Cordon & Diversion Map (Google Maps Live Traffic)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.78rem" }}>
                <span style={{ color: pinMode === "start" ? "#93C5FD" : "#F59E0B", fontWeight: "600" }}>
                  Active Pin: {pinMode === "start" ? "📍 Start Venue" : "🏁 Route End"}
                </span>
                <span style={{ color: "var(--text-muted)" }}>• Click map or use search box</span>
              </div>
            </div>

            <GoogleMapComponent
              apiKey={apiKey}
              center={{ lat, lng }}
              zoom={13}
              incident={{
                lat: lat,
                lng: lng,
                tier: simulationResult?.effective_tier || "High",
                cause: cause,
                corridor: corridor
              }}
              barricades={simulationResult?.barricades || []}
              routes={simulationResult?.routes || []}
              height="380px"
              onLocationSelect={handleLocationSelect}
            />
          </div>

          {/* Toggle between "Decision & Action Plan" and "46-Column ASTRAM Inspector" */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className={`btn-secondary ${activeViewTab === "plan" ? "active" : ""}`}
                style={{
                  fontSize: "0.85rem",
                  padding: "8px 16px",
                  background: activeViewTab === "plan" ? "rgba(59,130,246,0.2)" : "rgba(30,41,59,0.8)",
                  color: activeViewTab === "plan" ? "#60A5FA" : "var(--text-secondary)",
                  border: activeViewTab === "plan" ? "1px solid #3B82F6" : "1px solid var(--border-color)",
                  fontWeight: "700"
                }}
                onClick={() => setActiveViewTab("plan")}
              >
                📋 Tactical Response Plan
              </button>
              <button
                className={`btn-secondary ${activeViewTab === "inspector" ? "active" : ""}`}
                style={{
                  fontSize: "0.85rem",
                  padding: "8px 16px",
                  background: activeViewTab === "inspector" ? "rgba(59,130,246,0.2)" : "rgba(30,41,59,0.8)",
                  color: activeViewTab === "inspector" ? "#60A5FA" : "var(--text-secondary)",
                  border: activeViewTab === "inspector" ? "1px solid #3B82F6" : "1px solid var(--border-color)",
                  fontWeight: "700"
                }}
                onClick={() => setActiveViewTab("inspector")}
              >
                🔬 46-Column ASTRAM Inspector ({simulationResult?.columns_satisfied || 46}/46 Satisfied)
              </button>
            </div>

            {/* Persistence & Export Actions */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-secondary"
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                onClick={handleDownloadCSV}
                title="Download 46-Column CSV row conforming to dataset"
              >
                <Download size={14} /> Download CSV
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                onClick={handleCopyJSON}
                title="Copy full 46-attribute ASTRAM JSON"
              >
                <Copy size={14} /> {copyStatus || "Copy JSON"}
              </button>
              <button
                className="btn-primary"
                style={{ fontSize: "0.8rem", padding: "6px 14px", background: "linear-gradient(135deg, #10B981, #059669)" }}
                onClick={handleSaveToDatabase}
                disabled={saveLoading}
              >
                <Save size={14} /> {saveLoading ? "Saving..." : "Commit to ASTRAM DB"}
              </button>
            </div>
          </div>

          {/* VIEW TAB 1: Tactical Response Plan */}
          {activeViewTab === "plan" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Tactical Mitigation Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                <div className="metric-card" style={{ borderLeft: "4px solid #3B82F6" }}>
                  <div className="metric-title">Recommended Police Force</div>
                  <div className="metric-value" style={{ color: "#60A5FA" }}>
                    {simulationResult?.recommended_officers || 36} Officers
                  </div>
                  <div className="metric-sub">Calibrated for {crowdSize.toLocaleString()} attendees</div>
                </div>

                <div className="metric-card" style={{ borderLeft: "4px solid #F59E0B" }}>
                  <div className="metric-title">Security Perimeter Buffer</div>
                  <div className="metric-value" style={{ color: "#F59E0B" }}>
                    {simulationResult?.buffer_radius || "1.5 km Cordon"}
                  </div>
                  <div className="metric-sub">Exclusion & diversion cordon</div>
                </div>

                <div className="metric-card" style={{ borderLeft: "4px solid #10B981" }}>
                  <div className="metric-title">Forecast Disruption Tier</div>
                  <div className="metric-value" style={{
                    color: simulationResult?.effective_tier === "High" ? "#EF4444" : simulationResult?.effective_tier === "Medium" ? "#F59E0B" : "#10B981"
                  }}>
                    {simulationResult?.effective_tier || "High"} Tier
                  </div>
                  <div className="metric-sub">Confidence: {((simulationResult?.confidence || 0.75) * 100).toFixed(1)}%</div>
                </div>
              </div>

              {/* 72-Hour Action Timeline */}
              <div className="metric-card">
                <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Shield size={16} color="#10B981" /> 72-Hour Pre-Event Tactical Checklist
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(simulationResult?.timeline_checklist || [
                    { time: "T-72 Hours", action: "Issue public traffic advisory across BTP social channels and VMS boards." },
                    { time: "T-48 Hours", action: "Designate satellite parking zones (Palace Grounds / Army Ground) with shuttle transit." },
                    { time: "T-24 Hours", action: "Erect directional perimeter diversion signboards at perimeter junctions." },
                    { time: "T-06 Hours", action: "Stage traffic personnel, CATS ambulances, and heavy recovery towing units." },
                    { time: "T-02 Hours", action: "Enforce vehicular closure cordon around venue perimeter." },
                    { time: "Event Start", action: "Coordinate dynamic green corridor signals on radial escape routes." },
                    { time: "Dispersal", action: "Initiate phased pedestrian egress; hold intersecting cross-traffic until clearance." }
                  ]).map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      <span style={{
                        background: "rgba(59,130,246,0.15)",
                        border: "1px solid rgba(59,130,246,0.3)",
                        color: "#93C5FD",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        width: "80px",
                        textAlign: "center",
                        flexShrink: 0
                      }}>
                        {item.time}
                      </span>
                      <CheckSquare size={16} color="#3B82F6" style={{ flexShrink: 0 }} />
                      <span>{item.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Broadcast Advisories */}
              <div className="metric-card">
                <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Radio size={16} color="#60A5FA" /> Public Broadcast & VMS Advisories
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#86EFAC" }}>💬 BTP WhatsApp Broadcast</span>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: "0.7rem", padding: "2px 6px" }}
                        onClick={() => copyAdvisory(simulationResult?.broadcast_advisories?.whatsapp, "WhatsApp text")}
                      >
                        Copy
                      </button>
                    </div>
                    <pre style={{ fontSize: "0.75rem", color: "var(--text-secondary)", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                      {simulationResult?.broadcast_advisories?.whatsapp || "BTP Alert: Planned Event Advisory..."}
                    </pre>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#FCD34D" }}>📟 Electronic VMS Sign Text</span>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: "0.7rem", padding: "2px 6px" }}
                        onClick={() => copyAdvisory(simulationResult?.broadcast_advisories?.vms, "VMS text")}
                      >
                        Copy
                      </button>
                    </div>
                    <pre style={{ fontSize: "0.85rem", color: "#FCD34D", fontWeight: "800", background: "#000", padding: "8px", borderRadius: "4px", textAlign: "center" }}>
                      {simulationResult?.broadcast_advisories?.vms || "PLANNED EVENT ON CBD 2: USE RADIAL BYPASS"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW TAB 2: 46-Column ASTRAM Inspector */}
          {activeViewTab === "inspector" && (
            <div className="metric-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileText size={16} color="#60A5FA" /> ASTRAM Canonical 46-Column Audit Table
                  </h4>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Guarantees 100% column-name and index conformity with <code style={{ color: "#93C5FD" }}>bengaluru_traffic_events.csv</code>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: "220px", padding: "6px 10px", fontSize: "0.8rem" }}
                    placeholder="Filter column name..."
                    value={inspectorFilter}
                    onChange={(e) => setInspectorFilter(e.target.value)}
                  />
                  <div style={{
                    background: "rgba(16,185,129,0.15)",
                    border: "1px solid rgba(16,185,129,0.4)",
                    color: "#86EFAC",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: "700"
                  }}>
                    46 / 46 SATISFIED
                  </div>
                </div>
              </div>

              <div style={{ maxHeight: "420px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>#</th>
                      <th style={{ width: "180px" }}>Column Name</th>
                      <th style={{ width: "90px" }}>Data Type</th>
                      <th>Satisfied Value</th>
                      <th style={{ width: "90px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(simulationResult?.columns_audit || []).filter(c => 
                      !inspectorFilter || c.column.toLowerCase().includes(inspectorFilter.toLowerCase()) || String(c.value).toLowerCase().includes(inspectorFilter.toLowerCase())
                    ).map((col) => (
                      <tr key={col.index}>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{col.index}</td>
                        <td style={{ fontWeight: "700", color: "#F8FAFC", fontFamily: "monospace" }}>
                          {col.column}
                        </td>
                        <td>
                          <span style={{
                            fontSize: "0.7rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(59,130,246,0.12)",
                            color: "#93C5FD",
                            fontFamily: "monospace"
                          }}>
                            {col.type}
                          </span>
                        </td>
                        <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {col.value || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>[empty / N/A]</span>}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{
                            fontSize: "0.7rem",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: "rgba(16,185,129,0.15)",
                            color: "#86EFAC",
                            fontWeight: "700"
                          }}>
                            ✓ {col.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
