import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Users, Shield, MapPin, CheckSquare, Search, Download, Copy,
  Check, Save, AlertTriangle, Layers, Navigation, ArrowRight, Clock,
  FileText, CheckCircle2, ChevronDown, ChevronUp, ChevronRight, Sliders, Radio, Sparkles,
  Car, Compass, RefreshCw, Send, AlertOctagon, Info, X, Database, Trash2, ExternalLink, Eye, Archive
} from 'lucide-react';
import GoogleMapComponent, { isInBengaluru, BENGALURU_BOUNDS } from './GoogleMapComponent';

const PRESETS = [
  {
    name: "🏏 IPL Cricket Match",
    badge: "Public Event",
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
    badge: "VIP Convoy",
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
    badge: "Procession",
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
    badge: "Sports Marathon",
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
    badge: "Construction",
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
    badge: "Demonstration",
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
  // Master lists from config
  const corridorsList = config?.corridors || ["CBD 2", "Hosur Road", "Bellary Road 1", "Mysore Road", "ORR North 1"];
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
    "Peenya", "Byatarayanapura", "Whitefield", "Yeshwanthpura", "Kodigehalli", "Banaswadi"
  ];
  const junctionsList = config?.junctions || [
    "QueensCircle", "SilkBoardJunc", "MekhriCircle", "CorporationCircle",
    "RichmondCircle", "SonyWorldJunction", "VeerannapalyaJunction(BEL,HO)", "DairyCircle",
    "JalahalliCross(SM Circle)", "toll gate mysore road", "YeshwanthpuraCircle"
  ];
  const zonesList = config?.zones || [
    "Central Zone 1", "Central Zone 2", "East Zone 1", "East Zone 2",
    "North Zone 1", "North Zone 2", "South Zone 1", "South Zone 2",
    "West Zone 1", "West Zone 2"
  ];

  // Map targeting state: "start" = venue origin pin, "end" = destination pin
  const [pinMode, setPinMode] = useState("start");

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
  
  // Origin Coordinates & Address
  const [address, setAddress] = useState("M. Chinnaswamy Stadium, MG Road, Bengaluru, Karnataka");
  const [lat, setLat] = useState(12.978835);
  const [lng, setLng] = useState(77.599537);

  // Route / Destination Coordinates & Address
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

  // Logistics & Credentials
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
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [mapSyncToast, setMapSyncToast] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);
  const [saveToast, setSaveToast] = useState(null);
  const [inspectorFilter, setInspectorFilter] = useState("");
  const [showInspector, setShowInspector] = useState(true);
  const [showTemplatesDrawer, setShowTemplatesDrawer] = useState(false);

  // Operations Database & Navigation State
  const navigate = useNavigate();
  const [dbEvents, setDbEvents] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbFilter, setDbFilter] = useState("all"); // 'all' | 'live' | 'completed'
  const [dbSearch, setDbSearch] = useState("");
  const [selectedPlanModal, setSelectedPlanModal] = useState(null);
  const [concludingDbId, setConcludingDbId] = useState(null);
  const [highlightedEventId, setHighlightedEventId] = useState(null);

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
      title: `Preset Loaded: ${p.name}`,
      message: `${p.corridor} • Expected Crowd: ${p.crowd_size.toLocaleString()} • Station: ${p.police_station}`
    });
    setTimeout(() => setMapSyncToast(null), 4500);
  };

  // Map Click / Search location selection handler
  const handleLocationSelect = useCallback(async ({ lat: newLat, lng: newLng, googleAddress, inBengaluru }) => {
    const isInside = inBengaluru !== undefined ? inBengaluru : isInBengaluru(newLat, newLng);
    if (!isInside) {
      setMapSyncToast({
        title: "⛔ Outside Bengaluru Limits",
        message: `Coordinates (${newLat.toFixed(5)}, ${newLng.toFixed(5)}) lie outside Bengaluru Metropolitan limits (BTP operational boundary). ASTER response plans only cater to BTP jurisdiction.`
      });
      setTimeout(() => setMapSyncToast(null), 6000);
      return;
    }

    if (pinMode === "end") {
      setEndLat(newLat);
      setEndLng(newLng);
      if (googleAddress) setEndAddress(googleAddress);
      setRoutePath(`[${lat}, ${lng}] -> [${newLat}, ${newLng}]`);
      setMapSyncToast({
        title: "🏁 Route End Coordinate Updated",
        message: `${googleAddress || `${newLat}, ${newLng}`}`
      });
      setTimeout(() => setMapSyncToast(null), 4000);
      return;
    }

    // Origin Venue Location Pinning
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

        if (data.zone) {
          if (data.zone.includes("Central")) setGbaIdentifier("Bengaluru Central Corporation");
          else if (data.zone.includes("North")) setGbaIdentifier("Bengaluru North Corporation / BBMP Yelahanka");
          else if (data.zone.includes("South")) setGbaIdentifier("BBMP South Zone");
          else if (data.zone.includes("East")) setGbaIdentifier("BBMP Mahadevapura Zone");
          else setGbaIdentifier("BBMP Rajarajeshwarinagar Zone");
        }

        setRoutePath(`[${newLat}, ${newLng}] -> [${endLat || newLat}, ${endLng || newLng}]`);

        setMapSyncToast({
          title: "📍 Venue Coordinates Synced from Map",
          message: `${data.corridor} near ${data.junction} • ${data.police_station} Station`
        });
        setTimeout(() => setMapSyncToast(null), 4500);
      } else {
        if (googleAddress) setAddress(googleAddress);
      }
    } catch (err) {
      console.error("Location lookup error:", err);
      if (googleAddress) setAddress(googleAddress);
    }
  }, [pinMode, lat, lng, endLat, endLng]);

  // ─────────────────────────────────────────────────────────────
  // Operations Database CRUD & Lifecycle Handlers
  // ─────────────────────────────────────────────────────────────
  const fetchDbEvents = async () => {
    setDbLoading(true);
    try {
      const resp = await fetch("http://127.0.0.1:8000/api/pre-events?status=all");
      if (resp.ok) {
        const data = await resp.json();
        setDbEvents(data);
      }
    } catch (err) {
      console.warn("Could not fetch pre-events db:", err);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    fetchDbEvents();
  }, []);

  // Conclude event handler from inside PreEvent planner
  const handleConcludeDbEvent = async (eventItem) => {
    setConcludingDbId(eventItem.id);
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

      await fetchDbEvents();
      if (selectedPlanModal?.id === eventItem.id) {
        setSelectedPlanModal(null);
      }
      setSaveToast({
        title: "✅ Operation Concluded & Archived",
        message: `Operation '${eventItem.title || eventItem.id}' is closed from live notifications and registered into Priorly Conducted Events.`
      });
      setTimeout(() => setSaveToast(null), 5000);
    } catch (err) {
      alert(`Error concluding event: ${err.message}`);
    } finally {
      setConcludingDbId(null);
    }
  };

  // Delete event from DB
  const handleDeleteDbEvent = async (eventIdToDelete) => {
    if (!window.confirm(`Are you sure you want to delete event record '${eventIdToDelete}' from the database?`)) return;
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/pre-events/${eventIdToDelete}`, {
        method: "DELETE"
      });
      if (resp.ok) {
        await fetchDbEvents();
        if (selectedPlanModal?.id === eventIdToDelete) {
          setSelectedPlanModal(null);
        }
      }
    } catch (err) {
      alert(`Error deleting record: ${err.message}`);
    }
  };

  // Run Pre-Event Response Plan & Audit
  const handleSimulate = async () => {
    if (!isInBengaluru(parseFloat(lat), parseFloat(lng))) {
      setMapSyncToast({
        title: "⛔ Origin Location Outside Bengaluru",
        message: `Origin coordinates (${lat}, ${lng}) lie outside Bengaluru limits (BTP operational boundary). Pre-event mitigation only caters to Bengaluru.`
      });
      setTimeout(() => setMapSyncToast(null), 5000);
      return null;
    }
    if (endLat && endLng && (parseFloat(endLat) !== 0 || parseFloat(endLng) !== 0) && !isInBengaluru(parseFloat(endLat), parseFloat(endLng))) {
      setMapSyncToast({
        title: "⛔ Destination Outside Bengaluru",
        message: `Route end coordinates (${endLat}, ${endLng}) lie outside Bengaluru limits (BTP operational boundary). Pre-event mitigation only caters to Bengaluru.`
      });
      setTimeout(() => setMapSyncToast(null), 5000);
      return null;
    }

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
      return data;
    } catch (err) {
      console.error("Pre-event simulation error:", err);
      alert(`Simulation Error: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleSimulate();
  }, []);

  // Save & Publish Pre-Event to Operations Database & Live Dashboard
  const handleSaveToDatabase = async () => {
    let currentSim = simulationResult;
    if (!currentSim?.astram_record) {
      currentSim = await handleSimulate();
      if (!currentSim) return;
    }
    const recordToSave = currentSim?.astram_record;

    setSaveLoading(true);
    try {
      const genId = eventId || `ASTRAM-PLAN-${Date.now()}`;
      const fullPlanPayload = {
        id: genId,
        title: `${cause === "public_event" ? "🏏" : cause === "vip_movement" ? "🚗" : cause === "procession" ? "🎪" : "📅"} ${description || eventType || "Planned Event"} — ${corridor}`,
        event_type: eventType,
        event_cause: cause,
        description: description,
        corridor: corridor,
        police_station: policeStation,
        junction: junction,
        zone: zone,
        gba_identifier: gbaIdentifier,
        address: address,
        latitude: lat,
        longitude: lng,
        endlatitude: endLat,
        endlongitude: endLng,
        start_datetime: `${startDate}T${startTime}:00`,
        end_datetime: `${endDate}T${endTime}:00`,
        crowd_size: parseInt(crowdSize) || 20000,
        priority: priority,
        effective_tier: currentSim?.effective_tier || priority || "High",
        road_closure: roadClosure,
        allocated_officers: currentSim?.allocated_officers || 14,
        buffer_radius: currentSim?.buffer_radius || "1,500m",
        barricades: currentSim?.barricades || [],
        routes: currentSim?.routes || [],
        allocations: currentSim?.allocations || [],
        tactical_checklist: currentSim?.tactical_checklist || [],
        broadcast_advisories: currentSim?.broadcast_advisories || {},
        astram_record: recordToSave || {}
      };

      const resp = await fetch("http://127.0.0.1:8000/api/pre-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPlanPayload)
      });

      if (!resp.ok) {
        const errJson = await resp.json();
        throw new Error(errJson.detail || "Failed to publish pre-event.");
      }

      const resData = await resp.json();
      await fetchDbEvents();
      setHighlightedEventId(genId);

      setSaveToast({
        title: "🚀 Pre-Event Stored in Database & Live on Dashboard!",
        message: `${resData.message} Stored below in the operations database and broadcasting live on the Overview dashboard.`,
        eventId: genId
      });

      // Smooth scroll to database section
      setTimeout(() => {
        const el = document.getElementById("preevent-database-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);

      setTimeout(() => setSaveToast(null), 8000);
    } catch (err) {
      alert(`Database Publish Error: ${err.message}`);
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

  const mapCenter = useMemo(() => ({ lat, lng }), [lat, lng]);
  const mapIncident = useMemo(() => ({
    lat,
    lng,
    tier: simulationResult?.effective_tier || "High",
    cause,
    corridor
  }), [lat, lng, simulationResult?.effective_tier, cause, corridor]);
  const mapBarricades = useMemo(() => simulationResult?.barricades || [], [simulationResult?.barricades]);
  const mapRoutes = useMemo(() => simulationResult?.routes || [], [simulationResult?.routes]);

  return (
    <div style={{ maxWidth: "1500px", margin: "0 auto", paddingBottom: "60px", display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Floating Notifications */}
      {mapSyncToast && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "32px",
          background: "#1E293B",
          border: "1px solid #3B82F6",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          color: "#E2E8F0",
          padding: "14px 20px",
          borderRadius: "10px",
          fontSize: "0.88rem",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <MapPin color="#60A5FA" size={20} />
          <div>
            <div style={{ fontWeight: "700", color: "#93C5FD" }}>{mapSyncToast.title}</div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8", marginTop: "2px" }}>{mapSyncToast.message}</div>
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
          boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          color: "#ECFDF5",
          padding: "16px 22px",
          borderRadius: "10px",
          fontSize: "0.88rem",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "500px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <CheckCircle2 color="#34D399" size={24} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: "700", color: "#A7F3D0", fontSize: "0.95rem" }}>{saveToast.title}</div>
              <div style={{ fontSize: "0.82rem", color: "#D1FAE5", marginTop: "3px", lineHeight: "1.35" }}>{saveToast.message}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              onClick={() => navigate('/overview')}
              style={{
                background: "#10B981",
                color: "#064E3B",
                border: "none",
                borderRadius: "6px",
                padding: "7px 14px",
                fontSize: "0.82rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <ExternalLink size={13} /> View Live Bulletin on Dashboard ➔
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("preevent-database-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#ECFDF5",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "6px",
                padding: "7px 12px",
                fontSize: "0.82rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Inspect in Database Below ↓
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER (CLEAN, PROFESSIONAL & OPERATIONAL)
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))",
        border: "1px solid var(--border-color)",
        borderRadius: "14px",
        padding: "22px 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "18px"
      }}>
        <div style={{ maxWidth: "780px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.5rem" }}>📅</span>
            <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>
              Pre-Event Traffic Mitigation & Planning Center
            </h2>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.4" }}>
            Configure planned disruptions with map coordinate targeting, calibrate police forces, evaluate crowd impacts, and satisfy all <strong>46 canonical ASTRAM columns</strong>.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Operations Database Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById("preevent-database-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="btn-secondary"
            style={{
              fontSize: "0.8rem",
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(59, 130, 246, 0.15)",
              borderColor: "#3B82F6",
              color: "#93C5FD"
            }}
            title="Jump to the pre-planned events database and registry below"
          >
            <Database size={15} color="#60A5FA" />
            <span>Operations Database ({dbEvents.length}) ↓</span>
          </button>

          {/* Subtle Quick Load Dropdown */}
          <select
            className="form-select"
            style={{
              width: "210px",
              padding: "8px 12px",
              fontSize: "0.8rem",
              background: "rgba(15, 23, 42, 0.8)",
              borderColor: "rgba(59, 130, 246, 0.3)",
              cursor: "pointer"
            }}
            onChange={(e) => {
              const found = PRESETS.find(p => p.name === e.target.value);
              if (found) applyPreset(found);
            }}
            value=""
          >
            <option value="" disabled>📁 Load Template...</option>
            {PRESETS.map((p, idx) => (
              <option key={idx} value={p.name}>{p.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowTemplatesDrawer(true)}
            className="btn-secondary"
            style={{ fontSize: "0.8rem", padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}
            title="Browse standard Bengaluru operational scenario library on the side"
          >
            <FileText size={15} color="#60A5FA" />
            <span>Templates Side-Library</span>
          </button>

          <div style={{
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            padding: "8px 14px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#86EFAC",
            fontSize: "0.82rem",
            fontWeight: "700"
          }}>
            <CheckCircle2 size={15} /> 46 / 46 ASTRAM READY
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          QUICK DATABASE STATUS RIBBON
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: "rgba(15, 23, 42, 0.75)",
        border: "1px solid rgba(59, 130, 246, 0.25)",
        borderRadius: "10px",
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        fontSize: "0.84rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#E2E8F0" }}>
          <Database size={17} color="#60A5FA" />
          <span>
            <strong style={{ color: "#93C5FD" }}>Central Operations Database:</strong>{" "}
            <span style={{ color: "#FCA5A5", fontWeight: "700" }}>{dbEvents.filter(e => e.status === "live").length} Live</span> Broadcasting on Dashboard •{" "}
            <span style={{ color: "#86EFAC", fontWeight: "700" }}>{dbEvents.filter(e => e.status === "completed").length} Priorly Conducted</span> Archive Records
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => {
              const el = document.getElementById("preevent-database-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              color: "#93C5FD",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Database size={13} /> View Database Below ({dbEvents.length}) ↓
          </button>
          <button
            onClick={() => navigate('/overview')}
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#FCA5A5",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Radio size={13} color="#EF4444" /> Go to Live Dashboard Bulletin ➔
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. EXPANSIVE TACTICAL MAP & LOCATION SYNC
         ───────────────────────────────────────────────────────────── */}
      <div className="map-card-container" style={{ margin: 0 }}>
        <div className="map-header" style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Navigation size={20} color="#3B82F6" />
            <div>
              <div style={{ fontSize: "1rem", fontWeight: "700", color: "#F8FAFC" }}>
                Tactical Location & Cordon Map
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Use search bar, jump hotspots, or click on the map to pin exact coordinates
              </div>
            </div>
          </div>

          {/* Pin Mode Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(15,23,42,0.8)", padding: "4px 8px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>PINNING MODE:</span>
            <button
              onClick={() => setPinMode("start")}
              style={{
                background: pinMode === "start" ? "#2563EB" : "transparent",
                color: pinMode === "start" ? "#FFFFFF" : "var(--text-secondary)",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.78rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <MapPin size={14} /> Origin / Venue
            </button>
            <button
              onClick={() => setPinMode("end")}
              style={{
                background: pinMode === "end" ? "#D97706" : "transparent",
                color: pinMode === "end" ? "#FFFFFF" : "var(--text-secondary)",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.78rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Compass size={14} /> Destination / Route End
            </button>
          </div>
        </div>

        <GoogleMapComponent
          apiKey={apiKey}
          center={mapCenter}
          zoom={13}
          mode="tactical"
          incident={mapIncident}
          barricades={mapBarricades}
          routes={mapRoutes}
          height="460px"
          onLocationSelect={handleLocationSelect}
        />

        {/* Live Coordinate Ribbon */}
        <div style={{
          padding: "14px 24px",
          background: "rgba(15, 23, 42, 0.95)",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          fontSize: "0.82rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <span style={{ color: "#60A5FA", fontWeight: "700" }}>📍 Origin Venue: </span>
              <span style={{ color: "#F1F5F9" }}>{address}</span>
              <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>({lat.toFixed(6)}, {lng.toFixed(6)})</span>
            </div>
            {endAddress && (
              <div>
                <span style={{ color: "#F59E0B", fontWeight: "700" }}>🏁 Route End: </span>
                <span style={{ color: "#F1F5F9" }}>{endAddress}</span>
                <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>({endLat.toFixed(6)}, {endLng.toFixed(6)})</span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <span style={{ background: "rgba(59,130,246,0.15)", color: "#93C5FD", padding: "4px 10px", borderRadius: "6px", fontWeight: "600" }}>
              {corridor}
            </span>
            <span style={{ background: "rgba(16,185,129,0.15)", color: "#86EFAC", padding: "4px 10px", borderRadius: "6px", fontWeight: "600" }}>
              {policeStation} PS
            </span>
            <span style={{ background: "rgba(245,158,11,0.15)", color: "#FCD34D", padding: "4px 10px", borderRadius: "6px", fontWeight: "600" }}>
              {junction}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. FULL DETAIL FORM SECTIONS (NATURAL SCROLLING DOWN)
         ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* SECTION A: EVENT PROFILE & SCALE */}
        <div className="metric-card" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)", marginBottom: "20px" }}>
            <span style={{ fontSize: "1.2rem" }}>🎯</span>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>
                Section 1: Event Identity & Crowd Scaling
              </h3>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Basic disruption nature, scale, crowd size, and road closure regulation
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Event Description & Title (`description`)</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: "0.95rem", padding: "12px 14px" }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Cricket Match at Chinnaswamy Stadium..."
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
              <div className="form-group" style={{ margin: 0 }}>
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

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Event Type (`event_type`)</label>
                <select
                  className="form-select"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                >
                  <option value="planned">planned (Pre-Event Scheduled Disruption)</option>
                  <option value="unplanned">unplanned (Emergency / Unscheduled)</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Priority Tier (`priority`)</label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="High">High (Arterial Corridor Focus)</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Crowd Size with Quick Buttons */}
            <div style={{ background: "rgba(15,23,42,0.6)", padding: "16px 20px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "10px" }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Anticipated Crowd Size (Attendees / Spectators)
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[5000, 15000, 25000, 35000, 50000].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className="btn-secondary"
                      style={{
                        fontSize: "0.72rem",
                        padding: "3px 8px",
                        background: crowdSize === num ? "#2563EB" : "rgba(30,41,59,0.8)",
                        color: crowdSize === num ? "#FFFFFF" : "var(--text-secondary)",
                        border: crowdSize === num ? "1px solid #3B82F6" : "1px solid var(--border-color)"
                      }}
                      onClick={() => setCrowdSize(num)}
                    >
                      {num.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                step="2500"
                min="500"
                className="form-input"
                style={{ fontSize: "1.1rem", fontWeight: "700", color: "#60A5FA" }}
                value={crowdSize}
                onChange={(e) => setCrowdSize(parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Road Closure Option */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
              <div style={{
                background: roadClosure ? "rgba(239, 68, 68, 0.12)" : "rgba(15,23,42,0.6)",
                border: roadClosure ? "1px solid #EF4444" : "1px solid var(--border-color)",
                borderRadius: "10px",
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onClick={() => setRoadClosure(true)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="radio"
                    name="closure_opt"
                    checked={roadClosure === true}
                    onChange={() => setRoadClosure(true)}
                  />
                  <div>
                    <div style={{ fontWeight: "700", color: roadClosure ? "#FCA5A5" : "var(--text-primary)", fontSize: "0.92rem" }}>
                      Full Road Closure Required (`requires_road_closure = True`)
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Vehicles excluded from venue perimeter; mandatory radial diversion routes activated.
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                background: !roadClosure ? "rgba(16, 185, 129, 0.12)" : "rgba(15,23,42,0.6)",
                border: !roadClosure ? "1px solid #10B981" : "1px solid var(--border-color)",
                borderRadius: "10px",
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onClick={() => setRoadClosure(false)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="radio"
                    name="closure_opt"
                    checked={roadClosure === false}
                    onChange={() => setRoadClosure(false)}
                  />
                  <div>
                    <div style={{ fontWeight: "700", color: !roadClosure ? "#86EFAC" : "var(--text-primary)", fontSize: "0.92rem" }}>
                      Traffic Allowed / Lane Regulation (`requires_road_closure = False`)
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Partial carriage closure, parking embargo, and officer flagger guidance.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: SPATIAL & JURISDICTIONS */}
        <div className="metric-card" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)", marginBottom: "20px" }}>
            <span style={{ fontSize: "1.2rem" }}>🗺️</span>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>
                Section 2: Spatial Coordinates & Administrative Jurisdictions
              </h3>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Origin venue, arterial corridors, police stations, junctions, and optional route endpoints
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Origin Details */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "18px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Venue / Origin Address (`address`)</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">GBA Identifier (`gba_identifier`)</label>
                <input
                  type="text"
                  className="form-input"
                  value={gbaIdentifier}
                  onChange={(e) => setGbaIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
              <div className="form-group" style={{ margin: 0 }}>
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

              <div className="form-group" style={{ margin: 0 }}>
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

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Primary Junction (`junction`)</label>
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

              <div className="form-group" style={{ margin: 0 }}>
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Start Latitude (`latitude`)</label>
                <input
                  type="number"
                  step="0.000001"
                  className="form-input"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
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

            {(!isInBengaluru(parseFloat(lat), parseFloat(lng))) && (
              <div style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #EF4444",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "0.82rem",
                color: "#FCA5A5",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                <span>⛔ Start location ({lat}, {lng}) is outside Bengaluru city limits (BTP Jurisdiction).</span>
              </div>
            )}

            {/* Destination / Route End Coordinates */}
            <div style={{
              background: "rgba(15,23,42,0.6)",
              padding: "18px 20px",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#F59E0B", display: "flex", alignItems: "center", gap: "8px" }}>
                <Compass size={16} /> Route Extent & Destination Coordinates (For Convoys, Processions & Marathons)
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Destination Address (`end_address`)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={endAddress}
                    onChange={(e) => setEndAddress(e.target.value)}
                    placeholder="Route destination landmark..."
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">End Latitude (`endlatitude`)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-input"
                    value={endLat}
                    onChange={(e) => setEndLat(parseFloat(e.target.value))}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
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

              {(endLat && endLng && (parseFloat(endLat) !== 0 || parseFloat(endLng) !== 0) && !isInBengaluru(parseFloat(endLat), parseFloat(endLng))) && (
                <div style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid #EF4444",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "0.82rem",
                  color: "#FCA5A5",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                  <span>⛔ Destination location ({endLat}, {endLng}) is outside Bengaluru city limits (BTP Jurisdiction).</span>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
                <div className="form-group" style={{ margin: 0 }}>
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

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Route Coordinates Path (`route_path`)</label>
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
        </div>

        {/* SECTION C: OPERATIONAL SCHEDULE & TIMING */}
        <div className="metric-card" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)", marginBottom: "20px" }}>
            <span style={{ fontSize: "1.2rem" }}>⏱️</span>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>
                Section 3: Operational Schedule & Lead Time
              </h3>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Start, conclusion, egress duration, and 72-hour public notification windows
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {/* Start Window */}
            <div style={{ background: "rgba(15,23,42,0.6)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#60A5FA", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={15} /> Event Start Timestamp (`start_datetime`)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
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

            {/* End Window */}
            <div style={{ background: "rgba(15,23,42,0.6)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#F59E0B", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={15} /> Conclusion & Egress Timestamp (`end_datetime`)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
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
          </div>
        </div>

        {/* SECTION D: LOGISTICS, FLEET & ASTRAM CREDENTIALS */}
        <div className="metric-card" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)", marginBottom: "20px" }}>
            <span style={{ fontSize: "1.2rem" }}>🛡️</span>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>
                Section 4: Logistics, Fleet & Official ASTRAM Credentials
              </h3>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Officer KGID, vehicle fleet identifiers, assigned sector units, and operational comments
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Vehicle Type Involved (`veh_type`)</label>
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

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Vehicle / Convoy Registration (`veh_no`)</label>
                <input
                  type="text"
                  className="form-input"
                  value={vehNo}
                  onChange={(e) => setVehNo(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Cargo / Equipment Logistics (`cargo_material`)</label>
                <input
                  type="text"
                  className="form-input"
                  value={cargoMaterial}
                  onChange={(e) => setCargoMaterial(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Officer KGID (`kgid`)</label>
                <input
                  type="text"
                  className="form-input"
                  value={kgid}
                  onChange={(e) => setKgid(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Planner Created By (`created_by_id`)</label>
                <input
                  type="text"
                  className="form-input"
                  value={createdById}
                  onChange={(e) => setCreatedById(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Assigned Sector Unit (`assigned_to_police_id`)</label>
                <input
                  type="text"
                  className="form-input"
                  value={assignedPoliceId}
                  onChange={(e) => setAssignedPoliceId(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Event Record ID (`id`)</label>
                <input
                  type="text"
                  className="form-input"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Tactical Directives & Operational Notes (`comment`)</label>
              <textarea
                rows="2"
                className="form-input"
                style={{ resize: "vertical" }}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            4. HIGH-VISIBILITY ACTION BAR
           ───────────────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))",
          border: "1px solid #3B82F6",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          borderRadius: "14px",
          padding: "20px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "#F8FAFC" }}>
              Ready to Execute Pre-Event Response Plan
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              Runs Gradient Boosting prediction, OR-Tools manpower calibration, and compiles full 46-column ASTRAM record
            </div>
          </div>

          {(!isInBengaluru(parseFloat(lat), parseFloat(lng)) || (endLat && endLng && (parseFloat(endLat) !== 0 || parseFloat(endLng) !== 0) && !isInBengaluru(parseFloat(endLat), parseFloat(endLng)))) && (
            <div style={{
              width: "100%",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #EF4444",
              borderRadius: "8px",
              padding: "10px 16px",
              fontSize: "0.84rem",
              color: "#FCA5A5",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px"
            }}>
              <AlertTriangle size={18} color="#EF4444" style={{ flexShrink: 0 }} />
              <span>⛔ Location Outside Bengaluru Limits: Pre-event response simulation & live publishing are disabled for out-of-bounds locations.</span>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              className="btn-secondary"
              style={{ fontSize: "0.85rem", padding: "10px 16px" }}
              onClick={handleDownloadCSV}
            >
              <Download size={16} /> Download 46-Col CSV
            </button>

            <button
              className="btn-secondary"
              style={{ fontSize: "0.85rem", padding: "10px 16px" }}
              onClick={handleCopyJSON}
            >
              <Copy size={16} /> {copyStatus || "Copy ASTRAM JSON"}
            </button>

            <button
              className="btn-secondary"
              style={{
                fontSize: "0.85rem",
                padding: "10px 18px",
                background: "rgba(16, 185, 129, 0.15)",
                borderColor: "#10B981",
                color: "#86EFAC",
                opacity: (!isInBengaluru(parseFloat(lat), parseFloat(lng)) || (endLat && endLng && (parseFloat(endLat) !== 0 || parseFloat(endLng) !== 0) && !isInBengaluru(parseFloat(endLat), parseFloat(endLng)))) ? 0.5 : 1,
                cursor: (!isInBengaluru(parseFloat(lat), parseFloat(lng)) || (endLat && endLng && (parseFloat(endLat) !== 0 || parseFloat(endLng) !== 0) && !isInBengaluru(parseFloat(endLat), parseFloat(endLng)))) ? "not-allowed" : "pointer"
              }}
              onClick={handleSaveToDatabase}
              disabled={saveLoading || !isInBengaluru(parseFloat(lat), parseFloat(lng)) || (endLat && endLng && (parseFloat(endLat) !== 0 || parseFloat(endLng) !== 0) && !isInBengaluru(parseFloat(endLat), parseFloat(endLng)))}
            >
              <Save size={16} /> {saveLoading ? "Publishing Live..." : "Publish Live to Dashboard & Database"}
            </button>

            <button
              className="btn-primary"
              style={{
                fontSize: "0.95rem",
                padding: "10px 24px",
                opacity: (!isInBengaluru(parseFloat(lat), parseFloat(lng)) || (endLat && endLng && (parseFloat(endLat) !== 0 || parseFloat(endLng) !== 0) && !isInBengaluru(parseFloat(endLat), parseFloat(endLng)))) ? 0.5 : 1,
                cursor: (!isInBengaluru(parseFloat(lat), parseFloat(lng)) || (endLat && endLng && (parseFloat(endLat) !== 0 || parseFloat(endLng) !== 0) && !isInBengaluru(parseFloat(endLat), parseFloat(endLng)))) ? "not-allowed" : "pointer"
              }}
              onClick={handleSimulate}
              disabled={loading || !isInBengaluru(parseFloat(lat), parseFloat(lng)) || (endLat && endLng && (parseFloat(endLat) !== 0 || parseFloat(endLng) !== 0) && !isInBengaluru(parseFloat(endLat), parseFloat(endLng)))}
            >
              {loading ? (
                <span>Simulating...</span>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>⚡ Simulate Response Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            5. AI SIMULATION & TACTICAL PLAN RESULTS
           ───────────────────────────────────────────────────────────── */}
        {simulationResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              <div className="metric-card" style={{ borderLeft: "4px solid #3B82F6", padding: "20px" }}>
                <div className="metric-title">Recommended Police Force</div>
                <div className="metric-value" style={{ color: "#60A5FA" }}>
                  {simulationResult.recommended_officers} Officers
                </div>
                <div className="metric-sub">Calibrated for {crowdSize.toLocaleString()} attendees</div>
              </div>

              <div className="metric-card" style={{ borderLeft: "4px solid #F59E0B", padding: "20px" }}>
                <div className="metric-title">Security Perimeter Buffer</div>
                <div className="metric-value" style={{ color: "#F59E0B" }}>
                  {simulationResult.buffer_radius}
                </div>
                <div className="metric-sub">Exclusion & diversion cordon</div>
              </div>

              <div className="metric-card" style={{
                borderLeft: `4px solid ${simulationResult.effective_tier === "High" ? "#B91C1C" : simulationResult.effective_tier === "Medium" ? "#D97706" : "#15803D"}`,
                padding: "20px"
              }}>
                <div className="metric-title">Forecast Disruption Tier</div>
                <div className="metric-value" style={{
                  color: simulationResult.effective_tier === "High" ? "#B91C1C" : simulationResult.effective_tier === "Medium" ? "#D97706" : "#15803D"
                }}>
                  {simulationResult.effective_tier} Tier
                </div>
                <div className="metric-sub">Confidence: {((simulationResult.confidence || 0.75) * 100).toFixed(1)}%</div>
              </div>

              <div className="metric-card" style={{ borderLeft: "4px solid #8B5CF6", padding: "20px" }}>
                <div className="metric-title">Barricade & Diversion Urgency</div>
                <div className="metric-value" style={{ color: "#C084FC", fontSize: "1.25rem", marginTop: "10px" }}>
                  {simulationResult.diversion_urgency}
                </div>
                <div className="metric-sub">{simulationResult.barricade_order}</div>
              </div>
            </div>

            {/* 72-Hour Action Timeline */}
            <div className="metric-card" style={{ padding: "24px 28px" }}>
              <h4 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={18} color="#10B981" /> 72-Hour Pre-Event Tactical Checklist
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {simulationResult.timeline_checklist.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      background: "rgba(15,23,42,0.5)",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: "1px solid rgba(59,130,246,0.12)"
                    }}
                  >
                    <span style={{
                      background: "rgba(59,130,246,0.2)",
                      border: "1px solid rgba(59,130,246,0.4)",
                      color: "#93C5FD",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "0.76rem",
                      fontWeight: "700",
                      width: "90px",
                      textAlign: "center",
                      flexShrink: 0
                    }}>
                      {item.time}
                    </span>
                    <CheckSquare size={18} color="#3B82F6" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>{item.action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Public Broadcast Advisories */}
            <div className="metric-card" style={{ padding: "24px 28px" }}>
              <h4 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Radio size={18} color="#60A5FA" /> Public Broadcast & VMS Advisories
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
                <div style={{ background: "rgba(15,23,42,0.7)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#86EFAC" }}>💬 BTP WhatsApp Broadcast</span>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                      onClick={() => copyAdvisory(simulationResult.broadcast_advisories?.whatsapp, "WhatsApp text")}
                    >
                      Copy
                    </button>
                  </div>
                  <pre style={{ fontSize: "0.78rem", color: "var(--text-secondary)", whiteSpace: "pre-wrap", fontFamily: "monospace", margin: 0 }}>
                    {simulationResult.broadcast_advisories?.whatsapp}
                  </pre>
                </div>

                <div style={{ background: "rgba(15,23,42,0.7)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#FCD34D" }}>📟 Electronic VMS Sign Text</span>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                      onClick={() => copyAdvisory(simulationResult.broadcast_advisories?.vms, "VMS text")}
                    >
                      Copy
                    </button>
                  </div>
                  <pre style={{ fontSize: "0.95rem", color: "#FCD34D", fontWeight: "800", background: "#000", padding: "14px", borderRadius: "6px", textAlign: "center", margin: 0, letterSpacing: "0.08em" }}>
                    {simulationResult.broadcast_advisories?.vms}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            6. CANONICAL 46-COLUMN ASTRAM AUDIT & INSPECTOR
           ───────────────────────────────────────────────────────────── */}
        <div className="metric-card" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileText size={20} color="#60A5FA" />
                <h4 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#F8FAFC", margin: 0 }}>
                  Canonical 46-Column ASTRAM Schema Inspector
                </h4>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                100% column-name and index conformity with <code style={{ color: "#93C5FD" }}>bengaluru_traffic_events.csv</code>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input
                type="text"
                className="form-input"
                style={{ width: "240px", padding: "8px 12px", fontSize: "0.82rem" }}
                placeholder="Search 46 columns..."
                value={inspectorFilter}
                onChange={(e) => setInspectorFilter(e.target.value)}
              />
              <div style={{
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.4)",
                color: "#86EFAC",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: "700"
              }}>
                46 / 46 SATISFIED
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid var(--border-color)", borderRadius: "10px", overflow: "hidden" }}>
            <table className="custom-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: "50px", textAlign: "center" }}>#</th>
                  <th style={{ width: "220px" }}>Column Name</th>
                  <th style={{ width: "110px" }}>Data Type</th>
                  <th>Satisfied Value</th>
                  <th style={{ width: "110px", textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(simulationResult?.columns_audit || []).filter(c => 
                  !inspectorFilter || c.column.toLowerCase().includes(inspectorFilter.toLowerCase()) || String(c.value).toLowerCase().includes(inspectorFilter.toLowerCase())
                ).map((col) => (
                  <tr key={col.index}>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "center" }}>{col.index}</td>
                    <td style={{ fontWeight: "700", color: "#F8FAFC", fontFamily: "monospace", fontSize: "0.85rem" }}>
                      {col.column}
                    </td>
                    <td>
                      <span style={{
                        fontSize: "0.72rem",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: "rgba(59,130,246,0.12)",
                        color: "#93C5FD",
                        fontFamily: "monospace"
                      }}>
                        {col.type}
                      </span>
                    </td>
                    <td style={{ maxWidth: "500px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.84rem" }}>
                      {col.value || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>[empty / N/A]</span>}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        fontSize: "0.72rem",
                        padding: "3px 10px",
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

      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. PRE-PLANNED OPERATIONS DATABASE & LIVE REGISTRY
         ───────────────────────────────────────────────────────────── */}
      <section
        id="preevent-database-section"
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))",
          border: "1px solid rgba(59, 130, 246, 0.4)",
          borderRadius: "14px",
          padding: "24px 28px",
          boxShadow: "0 14px 40px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}
      >
        {/* Section Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                background: "rgba(59, 130, 246, 0.2)",
                padding: "8px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(59, 130, 246, 0.4)"
              }}>
                <Database size={22} color="#60A5FA" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>🗄️</span> Pre-Planned Operations Database & Central Registry
                </h3>
                <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Central persistent store for pre-planned disruptions. Live events broadcast directly to the Dashboard bulletin; concluded events archive to historical records.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate('/overview')}
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.5)",
                color: "#FCA5A5",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "0.82rem",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
              title="Navigate to Central Operations Dashboard to view the live broadcast beacon"
            >
              <Radio size={15} color="#EF4444" />
              <span>Go to Live Dashboard Bulletin ➔</span>
            </button>

            <button
              onClick={fetchDbEvents}
              disabled={dbLoading}
              className="btn-secondary"
              style={{ padding: "8px 14px", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "6px" }}
              title="Refresh database records"
            >
              <RefreshCw size={14} className={dbLoading ? "animate-spin" : ""} />
              <span>{dbLoading ? "Refreshing..." : "Refresh DB"}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div style={{
          background: "rgba(15, 23, 42, 0.7)",
          border: "1px solid var(--border-color)",
          borderRadius: "10px",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px"
        }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setDbFilter("all")}
              style={{
                background: dbFilter === "all" ? "#2563EB" : "rgba(255,255,255,0.06)",
                color: dbFilter === "all" ? "#FFFFFF" : "var(--text-secondary)",
                border: "none",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "0.82rem",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              All Records ({dbEvents.length})
            </button>

            <button
              onClick={() => setDbFilter("live")}
              style={{
                background: dbFilter === "live" ? "#DC2626" : "rgba(220, 38, 38, 0.12)",
                color: dbFilter === "live" ? "#FFFFFF" : "#FCA5A5",
                border: `1px solid ${dbFilter === "live" ? "#DC2626" : "rgba(220, 38, 38, 0.3)"}`,
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
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444" }}></span>
              ● Live Operations ({dbEvents.filter(e => e.status === "live").length})
            </button>

            <button
              onClick={() => setDbFilter("completed")}
              style={{
                background: dbFilter === "completed" ? "#059669" : "rgba(16, 185, 129, 0.12)",
                color: dbFilter === "completed" ? "#FFFFFF" : "#86EFAC",
                border: `1px solid ${dbFilter === "completed" ? "#059669" : "rgba(16, 185, 129, 0.3)"}`,
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
              <CheckCircle2 size={13} />
              Priorly Conducted ({dbEvents.filter(e => e.status === "completed").length})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search by title, corridor, station, ID..."
              value={dbSearch}
              onChange={(e) => setDbSearch(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(30, 41, 59, 0.7)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "7px 12px 7px 32px",
                color: "#F8FAFC",
                fontSize: "0.82rem"
              }}
            />
          </div>
        </div>

        {/* Database List / Cards */}
        {(() => {
          const filtered = dbEvents.filter(e => {
            if (dbFilter === "live" && e.status !== "live") return false;
            if (dbFilter === "completed" && e.status !== "completed") return false;
            if (!dbSearch) return true;
            const term = dbSearch.toLowerCase();
            return (
              (e.title && e.title.toLowerCase().includes(term)) ||
              (e.corridor && e.corridor.toLowerCase().includes(term)) ||
              (e.police_station && e.police_station.toLowerCase().includes(term)) ||
              (e.junction && e.junction.toLowerCase().includes(term)) ||
              (e.id && e.id.toLowerCase().includes(term))
            );
          });

          if (filtered.length === 0) {
            return (
              <div style={{
                textAlign: "center",
                padding: "36px 20px",
                background: "rgba(15, 23, 42, 0.4)",
                borderRadius: "10px",
                border: "1px dashed rgba(255, 255, 255, 0.15)",
                color: "var(--text-secondary)"
              }}>
                <Database size={32} color="#64748B" style={{ margin: "0 auto 10px" }} />
                <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#E2E8F0" }}>No Database Records Found</div>
                <div style={{ fontSize: "0.8rem", color: "#94A3B8", marginTop: "4px" }}>
                  {dbEvents.length === 0 ? "No pre-planned events have been saved to the database yet. Click 'Publish Live to Dashboard & Database' above to create one." : "No records match the current filter or search criteria."}
                </div>
              </div>
            );
          }

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filtered.map((ev) => {
                const isLive = ev.status === "live";
                const isHighlighted = highlightedEventId === ev.id;

                return (
                  <div
                    key={ev.id}
                    style={{
                      background: isLive
                        ? "linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(185, 28, 28, 0.12))"
                        : "rgba(15, 23, 42, 0.8)",
                      border: isHighlighted
                        ? "2px solid #10B981"
                        : isLive
                        ? "1px solid rgba(239, 68, 68, 0.4)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "10px",
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                      boxShadow: isHighlighted ? "0 0 20px rgba(16, 185, 129, 0.3)" : "none",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "320px" }}>
                      {/* Top Badges */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <span style={{
                          background: isLive ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.2)",
                          color: isLive ? "#FECACA" : "#86EFAC",
                          border: `1px solid ${isLive ? "#EF4444" : "#10B981"}`,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: "800",
                          fontSize: "0.72rem",
                          letterSpacing: "0.04em",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px"
                        }}>
                          {isLive ? (
                            <>
                              <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#EF4444" }}></span>
                              ● LIVE BROADCASTING ON DASHBOARD
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={12} />
                              ✓ PRIORLY CONDUCTED & ARCHIVED
                            </>
                          )}
                        </span>

                        <span style={{
                          background: ev.effective_tier === "High" ? "rgba(185, 28, 28, 0.35)" : "rgba(217, 119, 6, 0.35)",
                          color: ev.effective_tier === "High" ? "#FCA5A5" : "#FDE047",
                          border: `1px solid ${ev.effective_tier === "High" ? "#B91C1C" : "#D97706"}`,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: "700",
                          fontSize: "0.72rem"
                        }}>
                          {ev.effective_tier || "High"} Impact Tier
                        </span>

                        <span style={{ fontSize: "0.72rem", color: "#94A3B8", fontFamily: "monospace" }}>
                          ID: {ev.id}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h4 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: "800", color: "#F8FAFC" }}>
                        {ev.title || ev.id}
                      </h4>

                      {/* Metadata row */}
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        <span>📍 <strong>Corridor:</strong> {ev.corridor} ({ev.police_station || "BTP Sector Command"})</span>
                        <span>👥 <strong>Attendees:</strong> {(ev.crowd_size || 0).toLocaleString()}</span>
                        <span>👮 <strong>Tactical Force:</strong> {ev.allocated_officers || 14} Officers</span>
                        <span>🚧 <strong>Barricades:</strong> {ev.barricades ? ev.barricades.length : 0} Points</span>
                        <span>🔄 <strong>Detour Routes:</strong> {ev.routes ? ev.routes.length : 0} Channels</span>
                        {ev.road_closure && <span style={{ color: "#F87171", fontWeight: "700" }}>⛔ Road Closure Enacted</span>}
                      </div>

                      {/* Schedule info */}
                      <div style={{ fontSize: "0.74rem", color: "#94A3B8", marginTop: "6px" }}>
                        🕒 <strong>Schedule:</strong> {ev.start_datetime ? new Date(ev.start_datetime).toLocaleString() : "TBD"} → {ev.end_datetime ? new Date(ev.end_datetime).toLocaleString() : "TBD"}
                        {ev.completed_at && (
                          <span style={{ marginLeft: "12px", color: "#86EFAC" }}>
                            • Concluded: {new Date(ev.completed_at).toLocaleString()} by {ev.concluded_by || "BTP Controller"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => setSelectedPlanModal(ev)}
                        style={{
                          background: "rgba(59, 130, 246, 0.18)",
                          border: "1px solid rgba(59, 130, 246, 0.45)",
                          color: "#93C5FD",
                          padding: "7px 12px",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          cursor: "pointer"
                        }}
                        title="View complete tactical blueprint, manpower dispatch, barricades, and detour corridors"
                      >
                        <Eye size={14} /> Blueprint
                      </button>

                      {isLive && (
                        <>
                          <button
                            onClick={() => handleConcludeDbEvent(ev)}
                            disabled={concludingDbId === ev.id}
                            style={{
                              background: "rgba(16, 185, 129, 0.18)",
                              border: "1px solid rgba(16, 185, 129, 0.45)",
                              color: "#86EFAC",
                              padding: "7px 12px",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              fontWeight: "700",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              cursor: "pointer"
                            }}
                            title="Conclude event: closes live dashboard bulletin and registers into Priorly Conducted Events"
                          >
                            <CheckCircle2 size={14} /> {concludingDbId === ev.id ? "Concluding..." : "Conclude Event & Close Alert"}
                          </button>

                          <button
                            onClick={() => navigate('/overview')}
                            style={{
                              background: "rgba(239, 68, 68, 0.18)",
                              border: "1px solid rgba(239, 68, 68, 0.45)",
                              color: "#FCA5A5",
                              padding: "7px 12px",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              fontWeight: "700",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              cursor: "pointer"
                            }}
                            title="Open Overview Dashboard to view the live pulsing operations bulletin"
                          >
                            <ExternalLink size={14} /> Live on Dashboard ➔
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDeleteDbEvent(ev.id)}
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          color: "#F87171",
                          padding: "7px 10px",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          cursor: "pointer"
                        }}
                        title="Delete record from database"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          TACTICAL BLUEPRINT MODAL (IN-DEPTH EVENT & EXECUTION DETAILS)
         ───────────────────────────────────────────────────────────── */}
      {selectedPlanModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(4px)",
          zIndex: 3000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#0F172A",
            border: "1px solid rgba(59, 130, 246, 0.4)",
            borderRadius: "14px",
            width: "100%",
            maxWidth: "960px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(30, 41, 59, 0.5)"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    background: selectedPlanModal.status === "live" ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.2)",
                    color: selectedPlanModal.status === "live" ? "#FCA5A5" : "#86EFAC",
                    border: `1px solid ${selectedPlanModal.status === "live" ? "#EF4444" : "#10B981"}`,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "0.72rem",
                    fontWeight: "800"
                  }}>
                    {selectedPlanModal.status === "live" ? "● LIVE OPERATION IN PROGRESS" : "✓ PRIORLY CONDUCTED EVENT"}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontFamily: "monospace" }}>
                    ID: {selectedPlanModal.id}
                  </span>
                </div>
                <h3 style={{ margin: "6px 0 0", fontSize: "1.2rem", fontWeight: "800", color: "#F8FAFC" }}>
                  {selectedPlanModal.title || selectedPlanModal.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlanModal(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "6px"
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "22px" }}>
              {/* 1. Key Metrics & Overview */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "14px",
                background: "rgba(15, 23, 42, 0.6)",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid var(--border-color)"
              }}>
                <div>
                  <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>Corridor & Station</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#F1F5F9", marginTop: "2px" }}>
                    {selectedPlanModal.corridor} ({selectedPlanModal.police_station || "BTP Sector"})
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>Attendees & Priority</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#FDE047", marginTop: "2px" }}>
                    {(selectedPlanModal.crowd_size || 0).toLocaleString()} • {selectedPlanModal.priority || "High"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>Tactical Force Deployed</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#60A5FA", marginTop: "2px" }}>
                    {selectedPlanModal.allocated_officers || 14} Officers • Buffer: {selectedPlanModal.buffer_radius || "1.5km"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>Road Closure Requirement</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: "700", color: selectedPlanModal.road_closure ? "#F87171" : "#86EFAC", marginTop: "2px" }}>
                    {selectedPlanModal.road_closure ? "Active Road Closure" : "Open with Phased Diversions"}
                  </div>
                </div>
              </div>

              {/* 2. Manpower & Officer Deployment Matrix */}
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: "0.92rem", fontWeight: "700", color: "#93C5FD", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Shield size={16} /> Manpower & Officer Deployment Matrix
                </h4>
                {selectedPlanModal.allocations && selectedPlanModal.allocations.length > 0 ? (
                  <div style={{ border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                      <thead>
                        <tr style={{ background: "rgba(30, 41, 59, 0.8)", borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "#94A3B8" }}>
                          <th style={{ padding: "10px 14px" }}>Junction</th>
                          <th style={{ padding: "10px 14px" }}>Officers</th>
                          <th style={{ padding: "10px 14px" }}>VMS Signs</th>
                          <th style={{ padding: "10px 14px" }}>Barricades</th>
                          <th style={{ padding: "10px 14px" }}>Deployment Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPlanModal.allocations.map((a, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "10px 14px", fontWeight: "700", color: "#F1F5F9" }}>{a.junction}</td>
                            <td style={{ padding: "10px 14px", color: "#60A5FA", fontWeight: "700" }}>{a.officers} Officers</td>
                            <td style={{ padding: "10px 14px" }}>{a.vms_boards || 1} Units</td>
                            <td style={{ padding: "10px 14px" }}>{a.barricades || 2} Points</td>
                            <td style={{ padding: "10px 14px", color: "#CBD5E1" }}>{a.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.82rem", color: "#94A3B8", fontStyle: "italic" }}>
                    Standard sector deployment active ({selectedPlanModal.allocated_officers || 14} officers across entry-points).
                  </div>
                )}
              </div>

              {/* 3. Diversion Corridors & Detour Channels */}
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: "0.92rem", fontWeight: "700", color: "#F59E0B", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Navigation size={16} /> Diversion Corridors & Detour Routing
                </h4>
                {selectedPlanModal.routes && selectedPlanModal.routes.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
                    {selectedPlanModal.routes.map((r, idx) => (
                      <div key={idx} style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "8px", padding: "12px 14px" }}>
                        <div style={{ fontWeight: "700", color: "#FDE047", fontSize: "0.85rem", marginBottom: "4px" }}>{r.corridor}</div>
                        <div style={{ fontSize: "0.8rem", color: "#CBD5E1", lineHeight: "1.4" }}>{r.strategy}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.82rem", color: "#94A3B8", fontStyle: "italic" }}>Standard traffic bypass phased.</div>
                )}
              </div>

              {/* 4. Barricades & Cordon Positions */}
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: "0.92rem", fontWeight: "700", color: "#F87171", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertOctagon size={16} /> Barricade Cordon Coordinates ({selectedPlanModal.barricades ? selectedPlanModal.barricades.length : 0})
                </h4>
                {selectedPlanModal.barricades && selectedPlanModal.barricades.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
                    {selectedPlanModal.barricades.map((b, idx) => (
                      <div key={idx} style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "8px", padding: "12px 14px" }}>
                        <div style={{ fontWeight: "700", color: "#FCA5A5", fontSize: "0.85rem", marginBottom: "4px" }}>{b.name} ({b.road})</div>
                        <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>Coordinates: {b.lat}, {b.lng}</div>
                        <div style={{ fontSize: "0.78rem", color: "#CBD5E1", marginTop: "3px" }}>{b.reason}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.82rem", color: "#94A3B8", fontStyle: "italic" }}>No hard barricades deployed.</div>
                )}
              </div>

              {/* 5. 72-Hour Tactical SOP Checklist */}
              {selectedPlanModal.tactical_checklist && selectedPlanModal.tactical_checklist.length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 10px", fontSize: "0.92rem", fontWeight: "700", color: "#86EFAC", display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={16} /> 72-Hour SOP Execution Checklist
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {selectedPlanModal.tactical_checklist.map((task, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.82rem", color: "#E2E8F0", background: "rgba(15, 23, 42, 0.5)", padding: "8px 12px", borderRadius: "6px" }}>
                        <span style={{ color: "#34D399", fontWeight: "700" }}>✓</span>
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Citizen Broadcasts */}
              {selectedPlanModal.broadcast_advisories && Object.keys(selectedPlanModal.broadcast_advisories).length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 10px", fontSize: "0.92rem", fontWeight: "700", color: "#60A5FA", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Share2 size={16} /> Public Communication & Traffic Advisories
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
                    {selectedPlanModal.broadcast_advisories.whatsapp && (
                      <div style={{ background: "rgba(37, 211, 102, 0.08)", border: "1px solid rgba(37, 211, 102, 0.25)", borderRadius: "8px", padding: "12px 14px" }}>
                        <div style={{ fontWeight: "700", color: "#86EFAC", fontSize: "0.82rem", marginBottom: "4px" }}>💬 WhatsApp Broadcast</div>
                        <div style={{ fontSize: "0.78rem", color: "#E2E8F0" }}>{selectedPlanModal.broadcast_advisories.whatsapp}</div>
                      </div>
                    )}
                    {selectedPlanModal.broadcast_advisories.vms && (
                      <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "8px", padding: "12px 14px" }}>
                        <div style={{ fontWeight: "700", color: "#FDE047", fontSize: "0.82rem", marginBottom: "4px" }}>📟 VMS Highway Signs</div>
                        <div style={{ fontSize: "0.78rem", color: "#E2E8F0", fontFamily: "monospace" }}>{selectedPlanModal.broadcast_advisories.vms}</div>
                      </div>
                    )}
                    {selectedPlanModal.broadcast_advisories.twitter && (
                      <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)", borderRadius: "8px", padding: "12px 14px" }}>
                        <div style={{ fontWeight: "700", color: "#93C5FD", fontSize: "0.82rem", marginBottom: "4px" }}>🐦 Twitter / X Notification</div>
                        <div style={{ fontSize: "0.78rem", color: "#E2E8F0" }}>{selectedPlanModal.broadcast_advisories.twitter}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(30, 41, 59, 0.5)"
            }}>
              <div>
                {selectedPlanModal.status === "completed" && (
                  <span style={{ fontSize: "0.78rem", color: "#86EFAC" }}>
                    ✓ Concluded at {new Date(selectedPlanModal.completed_at).toLocaleString()}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                {selectedPlanModal.status === "live" && (
                  <>
                    <button
                      onClick={() => handleConcludeDbEvent(selectedPlanModal)}
                      disabled={concludingDbId === selectedPlanModal.id}
                      style={{
                        background: "#10B981",
                        border: "none",
                        color: "#064E3B",
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
                      <CheckCircle2 size={15} /> {concludingDbId === selectedPlanModal.id ? "Concluding..." : "Conclude Event & Close Alert"}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPlanModal(null);
                        navigate('/overview');
                      }}
                      style={{
                        background: "rgba(239, 68, 68, 0.2)",
                        border: "1px solid rgba(239, 68, 68, 0.5)",
                        color: "#FCA5A5",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer"
                      }}
                    >
                      <ExternalLink size={14} /> Open Live on Dashboard ➔
                    </button>
                  </>
                )}

                <button
                  onClick={() => setSelectedPlanModal(null)}
                  className="btn-secondary"
                  style={{ padding: "8px 16px", fontSize: "0.82rem" }}
                >
                  Close Blueprint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. RIGHT-EDGE FLOATING TAB & SLIDE-OUT TEMPLATES DRAWER
         ───────────────────────────────────────────────────────────── */}
      {/* Floating edge tab on the right */}
      <button
        onClick={() => setShowTemplatesDrawer(true)}
        title="Open standard scenario template library on the side"
        style={{
          position: "fixed",
          right: 0,
          top: "40%",
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(59, 130, 246, 0.4)",
          borderRight: "none",
          borderRadius: "8px 0 0 8px",
          padding: "12px 10px",
          color: "#93C5FD",
          cursor: "pointer",
          boxShadow: "-6px 6px 20px rgba(0,0,0,0.5)",
          zIndex: 900,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#1E293B";
          e.currentTarget.style.borderColor = "#3B82F6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(15, 23, 42, 0.95)";
          e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.4)";
        }}
      >
        <FileText size={16} color="#60A5FA" />
        <span style={{ fontSize: "0.7rem", fontWeight: "700", writingMode: "vertical-rl", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Templates
        </span>
      </button>

      {/* Backdrop overlay */}
      {showTemplatesDrawer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(2px)",
            zIndex: 1999
          }}
          onClick={() => setShowTemplatesDrawer(false)}
        />
      )}

      {/* Slide-out side drawer */}
      {showTemplatesDrawer && (
        <aside style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "420px",
          maxWidth: "92vw",
          background: "#0F172A",
          borderLeft: "1px solid var(--border-color)",
          boxShadow: "-12px 0 36px rgba(0,0,0,0.75)",
          zIndex: 2000,
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Drawer Header */}
          <div style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(15,23,42,0.95)"
          }}>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: "800", color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={18} color="#60A5FA" />
                <span>Operational Templates</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Reference benchmarks for quick parameter loading
              </div>
            </div>
            <button
              onClick={() => setShowTemplatesDrawer(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "6px"
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px", lineHeight: "1.4" }}>
              Click any standard template below to load benchmark coordinates, crowd sizes, and ASTRAM values into your planner:
            </div>

            {PRESETS.map((p, idx) => (
              <div
                key={idx}
                onClick={() => {
                  applyPreset(p);
                  setShowTemplatesDrawer(false);
                }}
                style={{
                  background: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3B82F6";
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.08)";
                  e.currentTarget.style.transform = "translateX(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.2)";
                  e.currentTarget.style.background = "rgba(15, 23, 42, 0.7)";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "#F1F5F9" }}>{p.name}</span>
                  <span style={{ fontSize: "0.7rem", background: "rgba(59, 130, 246, 0.15)", color: "#93C5FD", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>
                    {p.badge}
                  </span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  {p.description}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--text-muted)", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "8px", marginTop: "4px" }}>
                  <span>📍 {p.corridor}</span>
                  <span>👥 {p.crowd_size.toLocaleString()} attendees</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
