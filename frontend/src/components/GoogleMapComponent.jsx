import React, { useEffect, useRef, useState } from 'react';

const DARK_TACTICAL_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#182234" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#182234" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94A3B8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#E2E8F0" }, { weight: "bold" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64748B" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#112A32" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#24334D" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1B283E" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3B82F6" }, { lightness: -30 }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#CBD5E1" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1F2D42" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0B1323" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
];

export default function GoogleMapComponent({
  apiKey,
  center = { lat: 12.9716, lng: 77.5946 },
  zoom = 11,
  events = [],
  incident = null,
  barricades = [],
  routes = [],
  allocations = [],
  mode = "density",
  height = "520px",
  onLocationSelect = null
}) {
  const mapRef = useRef(null);
  const tacticalObjectsRef = useRef([]);
  const [mapInstance, setMapInstance] = useState(null);
  const [trafficLayer, setTrafficLayer] = useState(null);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [circles, setCircles] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const searchInputRef = useRef(null);

  const HOTSPOTS = [
    { name: "Silk Board", lat: 12.9166, lng: 77.6256, address: "Central Silk Board Junction, Hosur Road, Bengaluru" },
    { name: "Hebbal Flyover", lat: 13.0358, lng: 77.5870, address: "Hebbal Flyover, Bellary Road 1, Bengaluru" },
    { name: "Mekhri Circle", lat: 13.0075, lng: 77.5815, address: "Mekhri Circle, Bellary Road 1, Bengaluru" },
    { name: "Tin Factory", lat: 12.9964, lng: 77.6694, address: "Tin Factory Junction, ORR East 1, Bengaluru" },
    { name: "Majestic", lat: 12.9796, lng: 77.5711, address: "Kempegowda Bus Station, Majestic, Bengaluru" },
    { name: "Electronic City", lat: 12.8452, lng: 77.6602, address: "Electronic City Toll Plaza, Hosur Road, Bengaluru" },
  ];

  const handleHotspotClick = (h) => {
    setSearchQuery(h.name);
    setShowPredictions(false);
    if (mapInstance) {
      mapInstance.panTo({ lat: h.lat, lng: h.lng });
      mapInstance.setZoom(14);
    }
    if (onLocationSelect) {
      onLocationSelect({
        lat: h.lat,
        lng: h.lng,
        googleAddress: h.address
      });
    }
  };

  const executeSearch = async (locationQuery) => {
    if (!locationQuery) return;
    setIsSearching(true);
    setShowPredictions(false);

    // 1. Fast backend spatial dataset search
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/search-places?q=${encodeURIComponent(locationQuery)}`);
      if (resp.ok) {
        const matches = await resp.json();
        if (matches && matches.length > 0) {
          const match = matches[0];
          const targetLat = parseFloat(match.lat.toFixed(6));
          const targetLng = parseFloat(match.lng.toFixed(6));

          if (mapInstance) {
            mapInstance.panTo({ lat: targetLat, lng: targetLng });
            mapInstance.setZoom(14);
          }
          setSearchQuery(match.name);
          setIsSearching(false);

          if (onLocationSelect) {
            onLocationSelect({
              lat: targetLat,
              lng: targetLng,
              googleAddress: match.address
            });
          }
          return;
        }
      }
    } catch (e) {
      console.warn("Backend places search fallback:", e);
    }

    // 2. Google Maps Geocoder as complementary fallback
    if (window.google && mapInstance) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const fullQuery = locationQuery.toLowerCase().includes("bengaluru") || locationQuery.toLowerCase().includes("bangalore")
          ? locationQuery
          : `${locationQuery}, Bengaluru, Karnataka`;

        geocoder.geocode(
          {
            address: fullQuery,
            componentRestrictions: { country: "in" }
          },
          (results, status) => {
            setIsSearching(false);
            if (status === "OK" && results && results[0]) {
              const loc = results[0].geometry.location;
              const targetLat = parseFloat(loc.lat().toFixed(6));
              const targetLng = parseFloat(loc.lng().toFixed(6));
              const formattedAddr = results[0].formatted_address;

              mapInstance.panTo({ lat: targetLat, lng: targetLng });
              mapInstance.setZoom(14);
              setSearchQuery(locationQuery);

              if (onLocationSelect) {
                onLocationSelect({
                  lat: targetLat,
                  lng: targetLng,
                  googleAddress: formattedAddr
                });
              }
            }
          }
        );
        return;
      } catch (err) {
        console.error("Geocoder error:", err);
      }
    }

    setIsSearching(false);
  };

  const handleQueryChange = async (val) => {
    setSearchQuery(val);
    if (!val || val.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    // Live suggestions from backend dataset
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/search-places?q=${encodeURIComponent(val)}`);
      if (resp.ok) {
        const matches = await resp.json();
        if (matches && matches.length > 0) {
          setPredictions(matches.map((m) => ({
            place_id: m.name + m.lat,
            description: m.address || m.name,
            main_text: m.name,
            secondary_text: m.label,
            lat: m.lat,
            lng: m.lng
          })));
          setShowPredictions(true);
          return;
        }
      }
    } catch (e) {
      console.warn("Backend suggestions error:", e);
    }

    // Google Places Autocomplete fallback
    try {
      if (window.google && window.google.maps && window.google.maps.places && window.google.maps.places.AutocompleteService) {
        const autoService = new window.google.maps.places.AutocompleteService();
        autoService.getPlacePredictions(
          {
            input: val,
            componentRestrictions: { country: "in" },
            location: new window.google.maps.LatLng(12.9716, 77.5946),
            radius: 30000
          },
          (preds, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && preds) {
              setPredictions(preds.slice(0, 5).map((p) => ({
                place_id: p.place_id,
                description: p.description,
                main_text: p.structured_formatting?.main_text || p.description,
                secondary_text: p.structured_formatting?.secondary_text
              })));
              setShowPredictions(true);
            } else {
              setPredictions([]);
            }
          }
        );
      }
    } catch (err) {
      console.warn("Places autocomplete error:", err);
    }
  };

  // 1. Dynamic Script Loader
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    if (!apiKey) return;

    window.gm_authFailure = () => {
      console.warn("Google Maps authentication failure");
      setAuthError(true);
    };

    const scriptId = "google-maps-script";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=onGoogleMapsLoaded`;
      script.async = true;
      script.defer = true;

      window.onGoogleMapsLoaded = () => {
        setIsLoaded(true);
      };

      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, [apiKey]);

  // 2. Initialize Map Instance
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstance) return;

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        styles: DARK_TACTICAL_STYLE,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: window.google.maps.ControlPosition.TOP_LEFT
        },
        streetViewControl: false,
        fullscreenControl: true
      });

      const traffic = new window.google.maps.TrafficLayer();
      traffic.setMap(map);

      setMapInstance(map);
      setTrafficLayer(traffic);
    } catch (err) {
      console.error("Map initialization failed", err);
    }
  }, [isLoaded, center, zoom]);

  // 3. Traffic Layer Toggle
  useEffect(() => {
    if (trafficLayer && mapInstance) {
      trafficLayer.setMap(showTraffic ? mapInstance : null);
    }
  }, [showTraffic, trafficLayer, mapInstance]);

  // 4. Render Density Mode Overlays
  useEffect(() => {
    if (!mapInstance || mode !== "density" || !window.google) return;

    // Clear previous
    circles.forEach(c => c.setMap(null));
    markers.forEach(m => m.setMap(null));

    if (!showHotspots) {
      setCircles([]);
      setMarkers([]);
      return;
    }

    const newCircles = [];
    const newMarkers = [];
    const infoWindow = new window.google.maps.InfoWindow();

    // Render density circles
    events.forEach(ev => {
      const isHigh = ev.tier === "High";
      const isMed = ev.tier === "Medium";
      const color = isHigh ? "#EF4444" : isMed ? "#F59E0B" : "#10B981";
      const radius = isHigh ? 360 : isMed ? 240 : 150;
      const opacity = isHigh ? 0.38 : isMed ? 0.28 : 0.20;

      const circle = new window.google.maps.Circle({
        center: { lat: ev.lat, lng: ev.lng },
        radius: radius,
        fillColor: color,
        fillOpacity: opacity,
        strokeColor: color,
        strokeOpacity: opacity * 1.2,
        strokeWeight: 1,
        map: mapInstance
      });
      newCircles.push(circle);
    });

    // Render top 25 high impact clickable pins
    const topHigh = events.filter(e => e.tier === "High").slice(0, 25);
    topHigh.forEach(ev => {
      const marker = new window.google.maps.Marker({
        position: { lat: ev.lat, lng: ev.lng },
        map: mapInstance,
        title: `${ev.cause} (${ev.corridor})`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: "#EF4444",
          fillOpacity: 0.95,
          strokeColor: "#FFFFFF",
          strokeWeight: 1.5
        }
      });

      marker.addListener("click", () => {
        infoWindow.setContent(`
          <div style="font-family:'Segoe UI',sans-serif;color:#E2E8F0;background:#0F1729;padding:8px 12px;border-radius:6px;">
            <strong style="color:#EF4444;font-size:0.95rem;">🚨 ${ev.cause}</strong><br>
            <div style="font-size:0.8rem;margin-top:4px;">
              <b>Corridor:</b> ${ev.corridor}<br>
              <b>Impact Tier:</b> <span style="color:#FCA5A5;font-weight:bold;">${ev.tier}</span><br>
              <b>Resolution:</b> ${ev.duration} mins
            </div>
          </div>
        `);
        infoWindow.open(mapInstance, marker);
      });
      newMarkers.push(marker);
    });

    setCircles(newCircles);
    setMarkers(newMarkers);
  }, [mapInstance, mode, events, showHotspots]);

  // 4b. Location Click Listener with Geocoding
  useEffect(() => {
    if (!mapInstance || !onLocationSelect || !window.google) return;

    const listener = mapInstance.addListener("click", (e) => {
      const clickedLat = parseFloat(e.latLng.lat().toFixed(6));
      const clickedLng = parseFloat(e.latLng.lng().toFixed(6));

      // Attempt reverse geocoding via Google Maps Geocoder
      try {
        if (window.google.maps.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat: clickedLat, lng: clickedLng } }, (results, status) => {
            let googleAddress = null;
            if (status === "OK" && results && results[0]) {
              googleAddress = results[0].formatted_address;
            }
            onLocationSelect({
              lat: clickedLat,
              lng: clickedLng,
              googleAddress
            });
          });
          return;
        }
      } catch (err) {
        console.warn("Geocoder error:", err);
      }

      onLocationSelect({
        lat: clickedLat,
        lng: clickedLng
      });
    });

    return () => {
      if (window.google && window.google.maps && listener) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, [mapInstance, onLocationSelect]);

  // 5. Render Tactical Dispatch Mode Overlays
  useEffect(() => {
    if (!mapInstance || mode !== "tactical" || !window.google) return;

    // Clear previous tactical objects
    tacticalObjectsRef.current.forEach((obj) => obj.setMap(null));
    tacticalObjectsRef.current = [];

    if (!incident || !incident.lat || !incident.lng) return;

    mapInstance.panTo({ lat: incident.lat, lng: incident.lng });

    const infoWindow = new window.google.maps.InfoWindow();

    // Epicenter Pin
    const isHigh = incident.tier === "High";
    const isMed = incident.tier === "Medium";
    const incColor = isHigh ? "#EF4444" : isMed ? "#F59E0B" : incident.tier ? "#10B981" : "#38BDF8";

    const incMarker = new window.google.maps.Marker({
      position: { lat: incident.lat, lng: incident.lng },
      map: mapInstance,
      title: incident.tier ? `INCIDENT EPICENTER (${incident.tier} IMPACT)` : "STAGED INCIDENT LOCATION",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: incColor,
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 3
      }
    });

    incMarker.addListener("click", () => {
      infoWindow.setContent(`
        <div style="font-family:'Segoe UI',sans-serif;color:#E2E8F0;background:#0F1729;padding:8px 12px;border-radius:6px;">
          <strong style="color:${incColor};font-size:0.95rem;">📍 ${incident.tier ? `${incident.tier} Impact Epicenter` : "Pinned Incident Location"}</strong><br>
          <div style="font-size:0.8rem;margin-top:4px;">
            <b>Lat:</b> ${incident.lat.toFixed(6)} | <b>Lng:</b> ${incident.lng.toFixed(6)}<br>
            <i>Click anywhere on the map to relocate pin</i>
          </div>
        </div>
      `);
      infoWindow.open(mapInstance, incMarker);
    });

    tacticalObjectsRef.current.push(incMarker);

    // 500m Cordon Ring (if triage has occurred)
    if (incident.tier) {
      const cordonCircle = new window.google.maps.Circle({
        strokeColor: incColor,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: incColor,
        fillOpacity: 0.12,
        map: mapInstance,
        center: { lat: incident.lat, lng: incident.lng },
        radius: 500
      });
      tacticalObjectsRef.current.push(cordonCircle);
    }

    // Barricade Markers
    barricades.forEach(b => {
      const bMarker = new window.google.maps.Marker({
        position: { lat: b.lat, lng: b.lng },
        map: mapInstance,
        title: "Barricade: " + b.name,
        icon: {
          path: "M 0 0 L 10 -18 L -10 -18 Z",
          scale: 1.2,
          fillColor: "#F59E0B",
          fillOpacity: 0.95,
          strokeColor: "#FFFFFF",
          strokeWeight: 1.5
        }
      });
      bMarker.addListener("click", () => {
        infoWindow.setContent(`
          <div style="font-family:'Segoe UI',sans-serif;color:#E2E8F0;background:#0F1729;padding:6px 10px;border-radius:6px;font-size:0.82rem;">
            <strong style="color:#FCD34D;">🚧 Barricade Perimeter</strong><br>
            Junction: <b>${b.name}</b><br>
            Road: ${b.road}<br>
            Purpose: ${b.reason}
          </div>
        `);
        infoWindow.open(mapInstance, bMarker);
      });
      tacticalObjectsRef.current.push(bMarker);
    });

    // Diversion Detour Polylines
    const detourColors = ["#38BDF8", "#C084FC", "#F472B6"];
    routes.forEach((r, idx) => {
      if (r.coords && r.coords.length > 1) {
        const polyline = new window.google.maps.Polyline({
          path: r.coords,
          geodesic: true,
          strokeColor: detourColors[idx % detourColors.length],
          strokeOpacity: 0.9,
          strokeWeight: 5,
          map: mapInstance
        });
        tacticalObjectsRef.current.push(polyline);
      }
    });

    // Officer Allocation Badges
    allocations.forEach(a => {
      const offMarker = new window.google.maps.Marker({
        position: { lat: a.latitude || a.lat || 12.9716, lng: a.longitude || a.lon || 77.5946 },
        map: mapInstance,
        title: `${a.junction}: ${a.allocated_officers} Officers`,
        label: {
          text: String(a.allocated_officers),
          color: "#FFFFFF",
          fontSize: "11px",
          fontWeight: "bold"
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: "#3B82F6",
          fillOpacity: 0.85,
          strokeColor: "#FFFFFF",
          strokeWeight: 1.5
        }
      });
      tacticalObjectsRef.current.push(offMarker);
    });

  }, [mapInstance, mode, incident, barricades, routes, allocations]);

  return (
    <div style={{ position: "relative", width: "100%", height: height, borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(59,130,246,0.3)" }}>
      {/* Tactical Google Maps Search Bar */}
      {mode === "tactical" && (
        <div style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          zIndex: 20,
          width: "360px",
          maxWidth: "calc(100% - 24px)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(15, 23, 41, 0.94)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(59, 130, 246, 0.5)",
            borderRadius: "8px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.6)",
            overflow: "hidden"
          }}>
            <div style={{ padding: "0 10px", color: "#60A5FA", display: "flex", alignItems: "center" }}>
              🔍
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search Bengaluru landmark, junction, road..."
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  executeSearch(searchQuery);
                }
              }}
              onFocus={() => {
                if (predictions.length > 0) setShowPredictions(true);
              }}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#F8FAFC",
                fontSize: "0.82rem",
                padding: "8px 0"
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPredictions([]);
                  setShowPredictions(false);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "0 8px",
                  fontSize: "0.85rem"
                }}
                title="Clear search query"
              >
                ✕
              </button>
            )}
            <button
              onClick={() => executeSearch(searchQuery)}
              style={{
                background: "rgba(59, 130, 246, 0.25)",
                border: "none",
                borderLeft: "1px solid rgba(59, 130, 246, 0.3)",
                color: "#60A5FA",
                cursor: "pointer",
                padding: "8px 12px",
                fontSize: "0.78rem",
                fontWeight: "600"
              }}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showPredictions && predictions.length > 0 && (
            <div style={{
              marginTop: "4px",
              background: "rgba(15, 23, 41, 0.98)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              borderRadius: "8px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.7)",
              overflow: "hidden"
            }}>
              {predictions.map((p) => (
                <div
                  key={p.place_id}
                  onClick={() => {
                    if (p.lat && p.lng) {
                      if (mapInstance) {
                        mapInstance.panTo({ lat: p.lat, lng: p.lng });
                        mapInstance.setZoom(14);
                      }
                      setSearchQuery(p.main_text || p.description);
                      setShowPredictions(false);
                      if (onLocationSelect) {
                        onLocationSelect({
                          lat: p.lat,
                          lng: p.lng,
                          googleAddress: p.description
                        });
                      }
                    } else {
                      executeSearch(p.description);
                    }
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    fontSize: "0.8rem",
                    color: "#E2E8F0",
                    transition: "background 0.15s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ fontWeight: "600", color: "#93C5FD" }}>
                    📍 {p.main_text || p.description}
                  </div>
                  {p.secondary_text && (
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      {p.secondary_text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Hotspot Quick Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
            {HOTSPOTS.map((h) => (
              <button
                key={h.name}
                onClick={() => handleHotspotClick(h)}
                style={{
                  background: "rgba(15, 23, 41, 0.85)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "12px",
                  padding: "2px 8px",
                  fontSize: "0.68rem",
                  color: "#93C5FD",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#60A5FA")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)")}
              >
                {h.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div style={{
        position: "absolute",
        top: "12px",
        right: "12px",
        background: "rgba(15, 23, 41, 0.92)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(59,130,246,0.35)",
        borderRadius: "8px",
        padding: "8px 14px",
        color: "#E2E8F0",
        fontSize: "0.8rem",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: "14px"
      }}>
        <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}>
          <input
            type="checkbox"
            checked={showTraffic}
            onChange={(e) => setShowTraffic(e.target.checked)}
          />
          <span style={{
            background: "rgba(34, 197, 94, 0.2)",
            color: "#86EFAC",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "0.7rem",
            fontWeight: "700",
            border: "1px solid rgba(34, 197, 94, 0.4)"
          }}>LIVE</span> Traffic Congestion
        </label>

        {mode === "density" && (
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}>
            <input
              type="checkbox"
              checked={showHotspots}
              onChange={(e) => setShowHotspots(e.target.checked)}
            />
            🔥 Disruption Hotspots
          </label>
        )}
      </div>

      {authError && (
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 41, 0.95)",
          color: "#F8FAFC",
          padding: "32px",
          zIndex: 99,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center"
        }}>
          <h3 style={{ color: "#FCA5A5", fontSize: "1.2rem", marginBottom: "8px" }}>⚠️ Google Maps Key Needs Activation</h3>
          <p style={{ color: "#94A3B8", maxWidth: "480px", fontSize: "0.88rem" }}>
            The API key is recognized. Please ensure <strong>Maps JavaScript API</strong> is enabled in your Google Cloud Console.
          </p>
        </div>
      )}

      <div ref={mapRef} style={{ width: "100%", height: "100%", background: "#0F1729" }} />
    </div>
  );
}
