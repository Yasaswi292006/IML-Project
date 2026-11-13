import React, { useState, useEffect } from 'react';
import {
  AlertCircle, Shield, Navigation, Users, Share2, CheckCircle2,
  ChevronRight, Copy, MapPin, Calendar, Clock, AlertTriangle, RotateCcw,
  Sparkles, Layers, ArrowRight, Activity, Zap, Check, Compass, Sliders,
  Minimize2, Maximize2, Eye, EyeOff
} from 'lucide-react';
import GoogleMapComponent, { isInBengaluru, BENGALURU_BOUNDS } from './GoogleMapComponent';

// ─────────────────────────────────────────────────────────────────
// Preset Scenario Test Cases for Immediate Testing & Auto-Prediction
// ─────────────────────────────────────────────────────────────────
const PRESET_TEST_CASES = [
  {
    id: "tc_silk_board_crash",
    name: "💥 Peak-Hour Multi-Vehicle Crash",
    badge: "Accident / P1",
    badgeColor: "#EF4444",
    corridor: "Hosur Road",
    cause: "accident",
    eventType: "unplanned",
    priority: "High",
    vehType: "private_car",
    policeStation: "Madiwala",
    junction: "SilkBoardJunc",
    zone: "South Zone 1",
    address: "Hosur Road near Silk Board Flyover Junction, Madiwala, Bengaluru",
    lat: 12.917600,
    lng: 77.624400,
    hour: 9,
    minute: 15,
    dateStr: "2026-03-15",
    roadClosure: true,
    weatherMultiplier: 1.0,
    description: "3-vehicle pileup blocking 2 center lanes on northbound Hosur Road approaching Silk Board flyover.",
    expectedSummary: "High Impact • ~47 min resolution • 8 Officers • Silk Board choke cordon"
  },
  {
    id: "tc_mysore_bmtc",
    name: "🚌 BMTC Bus Transmission Failure",
    badge: "Breakdown",
    badgeColor: "#F59E0B",
    corridor: "Mysore Road",
    cause: "vehicle_breakdown",
    eventType: "unplanned",
    priority: "High",
    vehType: "bmtc_bus",
    policeStation: "Byatarayanapura",
    junction: "NayandahalliFlyover",
    zone: "West Zone 1",
    address: "Mysore Road Flyover near Nayandahalli Junction, Bengaluru",
    lat: 12.946300,
    lng: 77.528400,
    hour: 18,
    minute: 30,
    dateStr: "2026-03-15",
    roadClosure: false,
    weatherMultiplier: 1.0,
    description: "BMTC articulated bus stalled on uphill flyover ramp, heavy tailback towards Satellite Bus Stand.",
    expectedSummary: "High/Med Impact • ~52 min resolution • 5 Officers • Mysore Rd bypass"
  },
  {
    id: "tc_hebbal_subway",
    name: "⛈️ Monsoon Subway Waterlogging",
    badge: "Flooding / Weather",
    badgeColor: "#06B6D4",
    corridor: "Bellary Road 1",
    cause: "water_logging",
    eventType: "unplanned",
    priority: "High",
    vehType: "others",
    policeStation: "Hebbal",
    junction: "HebbalFlyover",
    zone: "North Zone 1",
    address: "Bellary Road, Hebbal Flyover Underpass, Bengaluru",
    lat: 13.035800,
    lng: 77.597000,
    hour: 17,
    minute: 45,
    dateStr: "2026-03-15",
    roadClosure: true,
    weatherMultiplier: 1.6,
    description: "Underpass water level 2.5 feet following flash cloudburst; airport outbound traffic halted.",
    expectedSummary: "High Impact • ~75 min resolution • 6 Officers • Hard closure & Ring detour"
  },
  {
    id: "tc_tin_factory_bwssb",
    name: "🚧 BWSSB Emergency Pipeline Excavation",
    badge: "Road Work",
    badgeColor: "#8B5CF6",
    corridor: "ORR North 1",
    cause: "construction",
    eventType: "unplanned",
    priority: "High",
    vehType: "heavy_vehicle",
    policeStation: "K.R. Pura",
    junction: "TinFactoryJunc",
    zone: "East Zone 1",
    address: "Old Madras Road & Outer Ring Road near Tin Factory, K.R. Pura, Bengaluru",
    lat: 12.994200,
    lng: 77.662500,
    hour: 14,
    minute: 10,
    dateStr: "2026-03-15",
    roadClosure: true,
    weatherMultiplier: 1.0,
    description: "Underground main water pipeline ruptured; road excavated across 2 lanes under Tin Factory suspension bridge.",
    expectedSummary: "High Impact • ~85 min resolution • 7 Officers • Kasturi Nagar diversion"
  },
  {
    id: "tc_vip_mekhri",
    name: "🚨 VIP State Motorcade Transit",
    badge: "VIP Convoy",
    badgeColor: "#3B82F6",
    corridor: "Bellary Road 2",
    cause: "vip_movement",
    eventType: "planned",
    priority: "High",
    vehType: "private_car",
    policeStation: "Sadashivanagar",
    junction: "MekhriCircle",
    zone: "North Zone 2",
    address: "Bellary Road corridor at Mekhri Circle Underpass, Sadashivanagar, Bengaluru",
    lat: 13.014300,
    lng: 77.583100,
    hour: 11,
    minute: 0,
    dateStr: "2026-03-15",
    roadClosure: true,
    weatherMultiplier: 1.0,
    description: "Official ministerial delegation convoy from Kempegowda Airport to Vidhana Soudha requiring sterile green corridor.",
    expectedSummary: "High Priority • ~35 min duration • 10 Officers • Green corridor signals"
  },
  {
    id: "tc_peenya_axle",
    name: "🚚 Heavy Axle Container Breakdown",
    badge: "Freight / Peenya",
    badgeColor: "#F97316",
    corridor: "Tumkur Road",
    cause: "vehicle_breakdown",
    eventType: "unplanned",
    priority: "Medium",
    vehType: "truck",
    policeStation: "Peenya",
    junction: "JalahalliCross(SM Circle)",
    zone: "North Zone 3",
    address: "Tumkur Road, Peenya Industrial Area near Jalahalli Cross, Bengaluru",
    lat: 13.033400,
    lng: 77.518600,
    hour: 15,
    minute: 20,
    dateStr: "2026-03-15",
    roadClosure: false,
    weatherMultiplier: 1.0,
    description: "Multi-axle cargo container snapped rear axle occupying slow lane near Peenya 8th Mile.",
    expectedSummary: "Medium Impact • ~60 min resolution • 4 Officers • Slow lane taper"
  }
];

export default function PredictTab({ config, apiKey }) {
  // Corridor list and metadata
  const corridorsList = config?.corridors || ["Hosur Road", "Mysore Road", "Bellary Road 1", "ORR North 1"];
  const corridorMeta = config?.corridor_metadata || {};

  // Form State - Complete Dataset Attributes
  const [corridor, setCorridor] = useState("Hosur Road");
  const [cause, setCause] = useState("accident");
  const [eventType, setEventType] = useState("unplanned");
  const [priority, setPriority] = useState("High");
  const [vehType, setVehType] = useState("private_car");
  const [policeStation, setPoliceStation] = useState("Madiwala");
  const [junction, setJunction] = useState("SilkBoardJunc");
  const [zone, setZone] = useState("South Zone 1");
  const [address, setAddress] = useState("Hosur Road near Silk Board Flyover Junction, Madiwala, Bengaluru");
  const [lat, setLat] = useState(12.917600);
  const [lng, setLng] = useState(77.624400);
  const [dateStr, setDateStr] = useState("2026-03-15");
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(15);
  const [roadClosure, setRoadClosure] = useState(true);
  const [weatherMultiplier, setWeatherMultiplier] = useState(1.0);
  const [description, setDescription] = useState("3-vehicle pileup blocking 2 center lanes on northbound Hosur Road approaching Silk Board flyover.");

  // Operational State
  const [activePresetId, setActivePresetId] = useState("tc_silk_board_crash");
  const [validationErrors, setValidationErrors] = useState([]);
  const [outOfBoundsError, setOutOfBoundsError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);
  const [mapSyncLoading, setMapSyncLoading] = useState(false);
  const [syncedNotification, setSyncedNotification] = useState(null);
  const [mapCollapsed, setMapCollapsed] = useState(false);

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
  const handleLocationSelect = async ({ lat: newLat, lng: newLng, googleAddress, inBengaluru }) => {
    setLat(newLat);
    setLng(newLng);
    setActivePresetId(null);

    const isInside = inBengaluru !== undefined ? inBengaluru : isInBengaluru(newLat, newLng);
    if (!isInside) {
      setOutOfBoundsError(`⛔ Selected Location Outside Bengaluru Limits: Coordinates (${newLat.toFixed(5)}, ${newLng.toFixed(5)}) are outside the Bengaluru Traffic Police (BTP) jurisdictional perimeter (${BENGALURU_BOUNDS.minLat}°–${BENGALURU_BOUNDS.maxLat}° N, ${BENGALURU_BOUNDS.minLng}°–${BENGALURU_BOUNDS.maxLng}° E). ASTER incident response cannot cater to locations outside Bengaluru.`);
      setSyncedNotification(null);
      return;
    }
    setOutOfBoundsError(null);
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

        // Clear any previous missing field warnings
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
    if (isNaN(lat) || !isInBengaluru(lat, lng)) errors.push(`Bengaluru Latitude (12.7300 - 13.2500 N)`);
    if (isNaN(lng) || !isInBengaluru(lat, lng)) errors.push(`Bengaluru Longitude (77.3700 - 77.8200 E)`);
    if (!dateStr) errors.push("Start Date");
    if (!description || !description.trim()) errors.push("Incident Description / Notes");
    return errors;
  };

  // Core Prediction Execution
  const executePrediction = async (payload) => {
    setLoading(true);
    try {
      const resp = await fetch("http://127.0.0.1:8000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      console.error("Prediction error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!isInBengaluru(lat, lng)) {
      setOutOfBoundsError(`⛔ Out of Bengaluru Limits: Coordinates (${lat}, ${lng}) are outside BTP jurisdiction. ASTER tactical response cannot cater to incidents outside Bengaluru.`);
      return;
    }
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    await executePrediction({
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
    });
  };

  // Apply a scenario test case immediately (auto-fill & run prediction)
  const applyPresetTestCase = (tc) => {
    setActivePresetId(tc.id);
    setCorridor(tc.corridor);
    setCause(tc.cause);
    setEventType(tc.eventType);
    setPriority(tc.priority);
    setVehType(tc.vehType);
    setPoliceStation(tc.policeStation);
    setJunction(tc.junction);
    setZone(tc.zone);
    setAddress(tc.address);
    setLat(tc.lat);
    setLng(tc.lng);
    setDateStr(tc.dateStr);
    setHour(tc.hour);
    setMinute(tc.minute);
    setRoadClosure(tc.roadClosure);
    setWeatherMultiplier(tc.weatherMultiplier);
    setDescription(tc.description);
    setValidationErrors([]);

    // Execute prediction immediately with preset payload
    executePrediction({
      corridor: tc.corridor,
      cause: tc.cause,
      event_type: tc.eventType,
      priority: tc.priority,
      vehicle_type: tc.vehType,
      police_station: tc.policeStation,
      junction: tc.junction,
      zone: tc.zone,
      address: tc.address,
      custom_lat: tc.lat,
      custom_lng: tc.lng,
      date_str: tc.dateStr,
      hour: tc.hour,
      minute: tc.minute,
      requires_road_closure: tc.roadClosure,
      weather_multiplier: tc.weatherMultiplier,
      description: tc.description
    });
  };

  // Run initial prediction on mount for the default test case
  useEffect(() => {
    const defaultCase = PRESET_TEST_CASES[0];
    applyPresetTestCase(defaultCase);
  }, []);

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
    setActivePresetId(null);
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
    "CorporationCircle", "K.R.PuramRailwayStation", "NayandahalliFlyover",
    "HebbalFlyover", "RichmondCircle", "TinFactoryJunc", "GoraguntepalyaJunc"
  ];

  // Shared Incident Form Renderer for both Split View (2-column inputs) and Wide View (multi-column grid)
  const renderIncidentForm = (isWide = false) => (
    <div className="metric-card" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "10px" }}>
        <h3 style={{ fontSize: "0.98rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          <span>🚨</span> ASTRAM Incident Parameters
        </h3>
        <button
          onClick={handleReset}
          style={{
            background: "transparent",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            color: "var(--text-muted)",
            borderRadius: "6px",
            padding: "4px 8px",
            fontSize: "0.74rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
          title="Reset form fields to defaults"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isWide ? "repeat(auto-fit, minmax(210px, 1fr))" : "1fr 1fr",
        gap: "10px"
      }}>
        {/* Corridor */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Arterial Corridor <span style={{ color: "#EF4444" }}>*</span></label>
          <select className="form-select" value={corridor} onChange={(e) => handleCorridorChange(e.target.value)}>
            {corridorsList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Disruption Cause */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Disruption Cause <span style={{ color: "#EF4444" }}>*</span></label>
          <select className="form-select" value={cause} onChange={(e) => setCause(e.target.value)}>
            {causesList.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Priority Tier */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Priority Tier <span style={{ color: "#EF4444" }}>*</span></label>
          <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="High">🔴 High Priority</option>
            <option value="Medium">🟡 Medium Priority</option>
            <option value="Low">🟢 Low Priority</option>
          </select>
        </div>

        {/* Vehicle Involved */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Vehicle Involved <span style={{ color: "#EF4444" }}>*</span></label>
          <select className="form-select" value={vehType} onChange={(e) => setVehType(e.target.value)}>
            {vehicleTypesList.map((v) => (
              <option key={v.key} value={v.key}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Police Station */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Police Jurisdiction <span style={{ color: "#EF4444" }}>*</span></label>
          <select className="form-select" value={policeStation} onChange={(e) => setPoliceStation(e.target.value)}>
            {stationsList.map((s) => (
              <option key={s} value={s}>{s} Traffic PS</option>
            ))}
          </select>
        </div>

        {/* Junction / Chokepoint */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Junction / Chokepoint <span style={{ color: "#EF4444" }}>*</span></label>
          <select className="form-select" value={junction} onChange={(e) => setJunction(e.target.value)}>
            {junctionsList.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>

        {/* Admin Zone */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Admin Zone <span style={{ color: "#EF4444" }}>*</span></label>
          <input type="text" className="form-select" value={zone} onChange={(e) => setZone(e.target.value)} placeholder="e.g. South Zone 1" />
        </div>

        {/* Incident Address */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Address / Landmark <span style={{ color: "#EF4444" }}>*</span></label>
          <input type="text" className="form-select" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Hosur Road near Silk Board" />
        </div>

        {/* Latitude */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Latitude (WGS84) <span style={{ color: "#EF4444" }}>*</span></label>
          <input type="number" step="0.000001" className="form-select" value={lat} onChange={(e) => setLat(parseFloat(e.target.value))} />
        </div>

        {/* Longitude */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Longitude (WGS84) <span style={{ color: "#EF4444" }}>*</span></label>
          <input type="number" step="0.000001" className="form-select" value={lng} onChange={(e) => setLng(parseFloat(e.target.value))} />
        </div>

        {/* Date */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Date <span style={{ color: "#EF4444" }}>*</span></label>
          <input type="date" className="form-select" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
        </div>

        {/* Time */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Time (Hour : Min) <span style={{ color: "#EF4444" }}>*</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <input type="number" min="0" max="23" className="form-select" value={hour} onChange={(e) => setHour(parseInt(e.target.value))} placeholder="HH" />
            <input type="number" min="0" max="59" className="form-select" value={minute} onChange={(e) => setMinute(parseInt(e.target.value))} placeholder="MM" />
          </div>
        </div>

        {/* Road Closure */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Road Closure (Lanes Blocked)</label>
          <div style={{ display: "flex", gap: "14px", marginTop: "6px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.82rem", cursor: "pointer" }}>
              <input type="radio" name="road_closure" checked={roadClosure === true} onChange={() => setRoadClosure(true)} />
              <span style={{ color: "#EF4444", fontWeight: "700" }}>Yes</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.82rem", cursor: "pointer" }}>
              <input type="radio" name="road_closure" checked={roadClosure === false} onChange={() => setRoadClosure(false)} />
              <span style={{ color: "#10B981", fontWeight: "700" }}>No</span>
            </label>
          </div>
        </div>

        {/* Weather Multiplier */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Weather Condition</label>
          <select className="form-select" value={weatherMultiplier} onChange={(e) => setWeatherMultiplier(parseFloat(e.target.value))}>
            <option value="1.0">☀️ Normal (1.0x)</option>
            <option value="1.25">🌧️ Rain (1.25x)</option>
            <option value="1.6">⛈️ Heavy (1.6x)</option>
          </select>
        </div>

        {/* Description / Notes */}
        <div className="form-group" style={{ margin: 0, gridColumn: isWide ? "span 2" : "span 2" }}>
          <label className="form-label" style={{ fontSize: "0.76rem" }}>Incident Description / Notes <span style={{ color: "#EF4444" }}>*</span></label>
          <input
            type="text"
            className="form-select"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 3-vehicle pileup blocking center lanes"
          />
        </div>
      </div>

      {/* Out of Bengaluru warning */}
      {!isInBengaluru(lat, lng) && (
        <div style={{
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid #EF4444",
          borderRadius: "8px",
          padding: "8px 12px",
          marginTop: "10px",
          fontSize: "0.78rem",
          color: "#FCA5A5",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <AlertTriangle size={15} color="#EF4444" style={{ flexShrink: 0 }} />
          <span>⛔ Coordinates outside Bengaluru limits. Response prediction disabled.</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        className="btn-primary"
        style={{
          width: "100%",
          marginTop: "12px",
          padding: "10px",
          fontSize: "0.92rem",
          opacity: !isInBengaluru(lat, lng) ? 0.55 : 1,
          cursor: !isInBengaluru(lat, lng) ? "not-allowed" : "pointer"
        }}
        onClick={handlePredict}
        disabled={loading || !isInBengaluru(lat, lng)}
      >
        {!isInBengaluru(lat, lng) ? "⛔ Disabled — Out of Bengaluru Limits" : loading ? "Computing ASTER AI Pipeline..." : "⚡ Run ASTER AI Pipeline"}
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: "1550px", margin: "0 auto", paddingBottom: "60px" }}>

      {/* ─────────────────────────────────────────────────────────────
          1. TOP BAR: Scenario Selector & Map Layout Mode Switcher
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))",
        border: "1px solid rgba(59, 130, 246, 0.35)",
        borderRadius: "14px",
        padding: "16px 22px",
        marginBottom: "20px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.4)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          
          {/* Left: Heading & Scenario Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", flex: "1 1 500px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.3rem" }}>⚡</span>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#F8FAFC", margin: 0, whiteSpace: "nowrap" }}>
                Predict & Respond
              </h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "300px" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#93C5FD", whiteSpace: "nowrap" }}>
                Scenario:
              </label>
              <select
                className="form-select"
                value={activePresetId || ""}
                onChange={(e) => {
                  const tc = PRESET_TEST_CASES.find(t => t.id === e.target.value);
                  if (tc) applyPresetTestCase(tc);
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  borderRadius: "8px",
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(59, 130, 246, 0.5)",
                  color: "#F8FAFC",
                  cursor: "pointer"
                }}
              >
                <option value="" disabled>-- Select a Pre-Designed Scenario --</option>
                {PRESET_TEST_CASES.map((tc) => (
                  <option key={tc.id} value={tc.id} style={{ background: "#0F172A", color: "#F8FAFC" }}>
                    {tc.name} ({tc.corridor})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Layout & Map Visibility Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setMapCollapsed(prev => !prev)}
              style={{
                background: !mapCollapsed ? "rgba(59, 130, 246, 0.25)" : "rgba(30, 41, 59, 0.8)",
                border: !mapCollapsed ? "1px solid #3B82F6" : "1px solid rgba(148, 163, 184, 0.3)",
                color: !mapCollapsed ? "#60A5FA" : "var(--text-secondary)",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "0.82rem",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              title={mapCollapsed ? "Show Tactical Google Map side-by-side with parameters" : "Hide Map to give full screen width to results"}
            >
              <Navigation size={15} color={!mapCollapsed ? "#60A5FA" : "#94A3B8"} />
              <span>{!mapCollapsed ? "🗺️ Map Open (Side-by-Side)" : "🗺️ Show Tactical Map"}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Out of Bengaluru Limits Warning Banner */}
      {outOfBoundsError && (
        <div style={{
          background: "rgba(239, 68, 68, 0.16)",
          border: "1px solid #EF4444",
          borderRadius: "10px",
          padding: "14px 18px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          animation: "fadeIn 0.3s ease"
        }}>
          <AlertTriangle color="#EF4444" size={22} style={{ marginTop: "2px", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "700", color: "#FCA5A5", fontSize: "0.95rem" }}>
              ⛔ Jurisdiction Warning — Location Outside Bengaluru City Limits
            </div>
            <div style={{ fontSize: "0.85rem", color: "#FECACA", marginTop: "4px", lineHeight: "1.5" }}>
              {outOfBoundsError}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#F87171", marginTop: "6px" }}>
              ASTER tactical algorithms & Bengaluru Traffic Police (BTP) response only cater to the designated Bengaluru Metropolitan perimeter.
            </div>
          </div>
          <button
            onClick={() => setOutOfBoundsError(null)}
            style={{ background: "transparent", border: "none", color: "#FCA5A5", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1 }}
            title="Dismiss notice"
          >
            ×
          </button>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationErrors.length > 0 && (
        <div style={{
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid #EF4444",
          borderRadius: "10px",
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

      {/* ─────────────────────────────────────────────────────────────
          2. INSTANT EXECUTIVE KPI TRIAGE RIBBON (Always visible when result is ready!)
         ───────────────────────────────────────────────────────────── */}
      {result && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "14px",
          marginBottom: "20px"
        }}>
          {/* Card 1: Forecasted Impact Triage */}
          <div className="metric-card" style={{
            borderLeft: `4px solid ${result.predicted_tier === "High" ? "#B91C1C" : result.predicted_tier === "Medium" ? "#D97706" : "#15803D"}`,
            padding: "14px 18px"
          }}>
            <div className="metric-title" style={{ fontSize: "0.74rem" }}>FORECASTED IMPACT TRIAGE</div>
            <div style={{
              fontSize: "1.35rem",
              fontWeight: "800",
              color: result.predicted_tier === "High" ? "#B91C1C" : result.predicted_tier === "Medium" ? "#D97706" : "#15803D",
              marginTop: "4px"
            }}>
              {result.predicted_tier === "High" ? "🔴" : result.predicted_tier === "Medium" ? "🟡" : "🟢"} {result.predicted_tier?.toUpperCase()} IMPACT
            </div>
            <div className="metric-sub" style={{ marginTop: "4px" }}>
              Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong> • Priority: <strong>{priority}</strong>
            </div>
          </div>

          {/* Card 2: Incident Resolution Time */}
          <div className="metric-card" style={{ borderLeft: "4px solid #60A5FA", padding: "14px 18px" }}>
            <div className="metric-title" style={{ fontSize: "0.74rem" }}>INCIDENT RESOLUTION TIME</div>
            <div className="metric-value" style={{ color: "#60A5FA", fontSize: "1.35rem" }}>
              {result.predicted_duration_minutes || 48} mins
            </div>
            <div className="metric-sub" style={{ marginTop: "4px" }}>
              Est. Clear: <strong>{result.predicted_end_datetime ? result.predicted_end_datetime.split(" ").slice(-1)[0] : "Shortly"}</strong>
            </div>
          </div>

          {/* Card 3: Police Deployment SLA & Officers */}
          <div className="metric-card" style={{ borderLeft: "4px solid #34D399", padding: "14px 18px" }}>
            <div className="metric-title" style={{ fontSize: "0.74rem" }}>POLICE DEPLOYMENT (MILP)</div>
            <div className="metric-value" style={{ color: "#34D399", fontSize: "1.35rem" }}>
              {result.officers_deployed} Officers Active
            </div>
            <div className="metric-sub" style={{ marginTop: "4px" }}>
              SLA: <strong>{result.deployment_time}</strong> • {policeStation} PS
            </div>
          </div>

          {/* Card 4: Road Closure & Traffic Routing */}
          <div className="metric-card" style={{ borderLeft: "4px solid #F59E0B", padding: "14px 18px" }}>
            <div className="metric-title" style={{ fontSize: "0.74rem" }}>ROAD CLOSURE & DIVERSION</div>
            <div className="metric-value" style={{ color: roadClosure ? "#EF4444" : "#10B981", fontSize: "1.35rem" }}>
              {roadClosure ? "🚨 Lanes Blocked" : "✓ Minor / Shoulder"}
            </div>
            <div className="metric-sub" style={{ marginTop: "4px" }}>
              {result.barricades?.length || 4} Barricades • {corridor} Cordon
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. SPATIAL & PARAMETERS WORKSPACE (WORKABLE IN BOTH MODES)
         ───────────────────────────────────────────────────────────── */}
      {!mapCollapsed ? (
        /* ─── WHEN MAP IS OPEN: Side-by-Side 2-Column Split ─── */
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(380px, 460px) minmax(0, 1fr)",
          gap: "20px",
          alignItems: "start",
          marginBottom: "24px"
        }}>
          {/* Left: Compact Incident Form */}
          {renderIncidentForm(false)}

          {/* Right: Tactical Google Map */}
          <div className="map-card-container" style={{ position: "relative", zIndex: 1, marginBottom: 0 }}>
            <div className="map-header">
              <div className="map-header-title">
                <Navigation size={18} color="#60A5FA" />
                <span>
                  Tactical Incident Map — <strong style={{ color: "#F8FAFC" }}>{corridor}</strong>
                  {result?.nearest_junction && ` (${result.nearest_junction})`}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.78rem", flexWrap: "wrap" }}>
                <span style={{ background: "rgba(59,130,246,0.15)", color: "#93C5FD", padding: "3px 8px", borderRadius: "4px" }}>
                  📍 {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
                <span style={{ color: mapSyncLoading ? "#F59E0B" : "#38BDF8", fontWeight: "600" }}>
                  {mapSyncLoading ? "⚡ Syncing..." : "✨ Click map to pin"}
                </span>
                <button
                  onClick={() => setMapCollapsed(true)}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(148, 163, 184, 0.3)",
                    color: "var(--text-secondary)",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "0.74rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    cursor: "pointer"
                  }}
                  title="Collapse Tactical Map"
                >
                  <Minimize2 size={13} /> Collapse Map
                </button>
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
              height="450px"
              onLocationSelect={handleLocationSelect}
            />
          </div>
        </div>
      ) : (
        /* ─── WHEN MAP IS NOT OPEN (Map Collapsed / Results Focus) ─── */
        <div style={{ marginBottom: "24px" }}>
          {/* Minimized map strip with restore button */}
          <div style={{
            background: "rgba(15, 23, 42, 0.75)",
            border: "1px dashed rgba(59, 130, 246, 0.4)",
            borderRadius: "10px",
            padding: "12px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <MapPin size={18} color="#60A5FA" />
              <span style={{ fontSize: "0.85rem", color: "#F8FAFC" }}>
                Tactical Map Minimized • Active Location: <strong>{address || corridor}</strong> ({lat.toFixed(5)}, {lng.toFixed(5)})
              </span>
            </div>
            <button
              onClick={() => setMapCollapsed(false)}
              style={{
                background: "rgba(59, 130, 246, 0.2)",
                border: "1px solid #3B82F6",
                color: "#93C5FD",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "0.82rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Maximize2 size={14} /> Open Tactical Map
            </button>
          </div>

          {/* Form in wide responsive grid */}
          {renderIncidentForm(true)}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. DETAILED TACTICAL RESPONSE DASHBOARD (Full 100% Width!)
         ───────────────────────────────────────────────────────────── */}
      {result ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* ─────────────────────────────────────────────────────────────
                  PREDICTABLE DATASET ATTRIBUTES MATRIX (46-COLUMN PREDICTIONS)
                 ───────────────────────────────────────────────────────────── */}
              <div className="metric-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#F8FAFC", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      <Activity size={18} color="#10B981" />
                      Predicted Dataset Attributes Matrix (Sorted by Impact & Confidence)
                    </h4>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      ASTER runs 4 pre-trained LightGBM models, 1 Gradient Boosting classifier, 1 OR-Tools MILP solver, and 1 NetworkX graph engine to predict 10 key operational attributes.
                    </div>
                  </div>
                  <span style={{ fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.15)", color: "#6EE7B7", padding: "4px 10px", borderRadius: "6px", fontWeight: "700" }}>
                    ✓ 10 Model Outputs Computed
                  </span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table className="custom-table" style={{ fontSize: "0.82rem" }}>
                    <thead>
                      <tr>
                        <th>Predictable Attribute (Dataset Field)</th>
                        <th>ML / Mathematical Engine</th>
                        <th>AI Predicted Value</th>
                        <th>Confidence / Fit</th>
                        <th>Operational Implication</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(result.dataset_predictions || []).map((p, idx) => (
                        <tr key={idx} style={{ background: idx === 0 ? "rgba(239, 68, 68, 0.06)" : idx === 1 ? "rgba(59, 130, 246, 0.05)" : "transparent" }}>
                          <td>
                            <div style={{ fontWeight: "700", color: "#F8FAFC" }}>{p.label}</div>
                            <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}><code>{p.field}</code></div>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.74rem", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px", color: "#CBD5E1" }}>
                              {p.model}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontWeight: "800",
                              fontSize: "0.92rem",
                              color: p.id === "impact_tier"
                                ? (result.predicted_tier === "High" ? "#B91C1C" : result.predicted_tier === "Medium" ? "#D97706" : "#15803D")
                                : p.id === "duration_minutes" ? "#60A5FA"
                                : p.id === "manpower_count" ? "#34D399"
                                : "#F8FAFC"
                            }}>
                              {p.metric_display}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: "0.75rem",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: "rgba(59, 130, 246, 0.15)",
                              color: "#93C5FD",
                              fontWeight: "600"
                            }}>
                              {p.confidence}
                            </span>
                          </td>
                          <td style={{ color: "#E2E8F0", fontSize: "0.78rem" }}>
                            {p.action_implication}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
      ) : (
        <div className="metric-card" style={{ padding: "32px", textAlign: "center" }}>
          <Activity size={32} color="#60A5FA" style={{ margin: "0 auto 12px" }} />
          <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#F8FAFC", marginBottom: "6px" }}>
            Ready to Predict Incident Impact & Tactical Plan
          </h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "560px", margin: "0 auto" }}>
            Click "⚡ Run ASTER AI Pipeline" in the form above or pick a scenario from the dropdown to compute the 10-attribute forecast and BTP dispatch.
          </p>
        </div>
      )}
    </div>
  );
}
