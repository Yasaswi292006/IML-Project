"""
ASTER — Google Maps Component Integration
==========================================
Provides rich, interactive Google Maps components with:
  1. Live Google Traffic Layer (real-time road congestion)
  2. Tactical Incident Epicenter & Barricade Cordon Visualization
  3. NetworkX Diversion Detour Polylines (K-shortest paths)
  4. MILP Police Officer Headcount Badges
  5. Density & Hotspot Heatmaps with ASTER Dark Tactical Theme
  6. Automatic Auth-Failure Detection & Helpful Troubleshooting Overlay
"""

import json
import pandas as pd
import streamlit.components.v1 as components
from src.utils.config import get_google_maps_api_key

# Custom Dark Tactical Style matching ASTER UI (#0F1729 / #1E2D4E)
DARK_TACTICAL_MAP_STYLE = [
    {"elementType": "geometry", "stylers": [{"color": "#182234"}]},
    {"elementType": "labels.text.stroke", "stylers": [{"color": "#182234"}]},
    {"elementType": "labels.text.fill", "stylers": [{"color": "#94A3B8"}]},
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{"color": "#E2E8F0"}, {"weight": "bold"}],
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{"color": "#64748B"}],
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{"color": "#112A32"}],
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{"color": "#24334D"}],
    },
    {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [{"color": "#1B283E"}],
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{"color": "#3B82F6"}, {"lightness": -30}],
    },
    {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [{"color": "#CBD5E1"}],
    },
    {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [{"color": "#1F2D42"}],
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{"color": "#0B1323"}],
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{"color": "#475569"}],
    },
]


def render_google_density_heatmap(
    df: pd.DataFrame,
    api_key: str = None,
    height: int = 530,
    zoom: int = 11,
    center: tuple = (12.9716, 77.5946),
    show_top_markers: bool = True,
):
    """
    Renders an interactive Google Map with:
      - Live Google Traffic Layer toggle
      - Density Glow Circles (High=Red, Medium=Amber, Low=Green)
      - Top hotspot markers with InfoWindows
      - ASTER Dark Tactical styling with Road/Satellite switch
      - Auto auth-failure error banner
    """
    if not api_key:
        api_key = get_google_maps_api_key()

    # Prepare sample points for high performance
    sample_df = df.dropna(subset=["latitude", "longitude"]).copy()

    # Stratified sampling for density circles
    high_sample = sample_df[sample_df["impact_tier"] == "High"].head(160)
    med_sample = sample_df[sample_df["impact_tier"] == "Medium"].head(160)
    low_sample = sample_df[sample_df["impact_tier"] == "Low"].head(80)

    density_points = []
    for _, r in high_sample.iterrows():
        density_points.append({
            "lat": round(float(r["latitude"]), 5),
            "lng": round(float(r["longitude"]), 5),
            "radius": 340,
            "color": "#EF4444",
            "opacity": 0.40,
        })
    for _, r in med_sample.iterrows():
        density_points.append({
            "lat": round(float(r["latitude"]), 5),
            "lng": round(float(r["longitude"]), 5),
            "radius": 240,
            "color": "#F59E0B",
            "opacity": 0.32,
        })
    for _, r in low_sample.iterrows():
        density_points.append({
            "lat": round(float(r["latitude"]), 5),
            "lng": round(float(r["longitude"]), 5),
            "radius": 150,
            "color": "#10B981",
            "opacity": 0.25,
        })

    # Prepare high-impact hotspot sample markers
    hotspot_markers = []
    if show_top_markers:
        high_df = high_sample.head(30)
        for _, r in high_df.iterrows():
            cause = str(r.get("event_cause", "Incident")).replace("_", " ").title()
            corr = str(r.get("corridor", "Corridor"))
            tier = str(r.get("impact_tier", "High"))
            dur = f"{r.get('duration_minutes', 0):.0f} min" if pd.notna(r.get("duration_minutes")) else "N/A"
            hotspot_markers.append({
                "lat": round(float(r["latitude"]), 5),
                "lng": round(float(r["longitude"]), 5),
                "title": f"{cause} ({corr})",
                "info": f"<b>{cause}</b><br>Tier: <span style='color:#EF4444;font-weight:bold;'>{tier}</span><br>Corridor: {corr}<br>Duration: {dur}"
            })

    html_code = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        html, body {{ height: 100%; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, sans-serif; }}
        #map {{ height: 100%; width: 100%; border-radius: 12px; }}
        .map-card {{
          position: relative;
          height: {height}px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.35);
          border: 1px solid rgba(59,130,246,0.3);
          background: #0F1729;
        }}
        .control-panel {{
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(15, 23, 41, 0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(59,130,246,0.35);
          border-radius: 8px;
          padding: 8px 14px;
          color: #E2E8F0;
          font-size: 0.8rem;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 12px;
        }}
        .control-panel label {{
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }}
        .badge-live {{
          background: rgba(34, 197, 94, 0.2);
          color: #86EFAC;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          border: 1px solid rgba(34, 197, 94, 0.4);
        }}
        .gm-style .gm-style-iw-c {{
          background-color: #0F1729 !important;
          color: #E2E8F0 !important;
          border-radius: 8px !important;
          padding: 12px !important;
          border: 1px solid rgba(59,130,246,0.3) !important;
        }}
        .gm-style .gm-style-iw-tc::after {{
          background-color: #0F1729 !important;
        }}
        .error-overlay {{
          display: none;
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 41, 0.95);
          backdrop-filter: blur(6px);
          color: #E2E8F0;
          padding: 28px;
          z-index: 99;
          border-radius: 12px;
          box-sizing: border-box;
          line-height: 1.6;
        }}
      </style>
      <script>
        let map, trafficLayer;
        let densityCircles = [];
        let hotspotMarkers = [];
        let mapInitialized = false;
        const darkStyle = {json.dumps(DARK_TACTICAL_MAP_STYLE)};
        const densityPoints = {json.dumps(density_points)};
        const hotspots = {json.dumps(hotspot_markers)};

        window.gm_authFailure = function() {{
          const err = document.getElementById('errorOverlay');
          if (err) err.style.display = 'block';
          const cp = document.getElementById('controlPanel');
          if (cp) cp.style.display = 'none';
        }};

        function initMap() {{
          mapInitialized = true;
          try {{
            const center = {{ lat: {center[0]}, lng: {center[1]} }};
            map = new google.maps.Map(document.getElementById('map'), {{
              zoom: {zoom},
              center: center,
              styles: darkStyle,
              mapTypeControl: true,
              mapTypeControlOptions: {{
                style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                position: google.maps.ControlPosition.TOP_LEFT
              }},
              streetViewControl: false,
              fullscreenControl: true
            }});

            // Live Google Traffic Layer
            trafficLayer = new google.maps.TrafficLayer();
            trafficLayer.setMap(map);

            // Density Glow Circles (High=Red, Medium=Amber, Low=Green)
            densityCircles = densityPoints.map(p => new google.maps.Circle({{
              center: {{ lat: p.lat, lng: p.lng }},
              radius: p.radius,
              fillColor: p.color,
              fillOpacity: p.opacity,
              strokeColor: p.color,
              strokeOpacity: p.opacity * 1.2,
              strokeWeight: 1,
              map: map
            }}));

            // Hotspot Incident Markers with InfoWindows
            const infoWindow = new google.maps.InfoWindow();
            hotspotMarkers = hotspots.map(h => {{
              const marker = new google.maps.Marker({{
                position: {{ lat: h.lat, lng: h.lng }},
                map: map,
                title: h.title,
                icon: {{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 5,
                  fillColor: '#EF4444',
                  fillOpacity: 0.95,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 1.5
                }}
              }});
              marker.addListener('click', () => {{
                infoWindow.setContent('<div style=\"padding:4px;font-size:0.84rem;color:#E2E8F0;\">' + h.info + '</div>');
                infoWindow.open(map, marker);
              }});
              return marker;
            }});
          }} catch (e) {{
            console.error("Density map initialization error:", e);
          }}
        }}

        function toggleTraffic() {{
          if (!trafficLayer) return;
          const chk = document.getElementById('trafficToggle').checked;
          trafficLayer.setMap(chk ? map : null);
        }}

        function toggleDensity() {{
          const chk = document.getElementById('densityToggle').checked;
          if (densityCircles) densityCircles.forEach(c => c.setMap(chk ? map : null));
          if (hotspotMarkers) hotspotMarkers.forEach(m => m.setMap(chk ? map : null));
        }}
      </script>
      <script async defer src="https://maps.googleapis.com/maps/api/js?key={api_key}&callback=initMap"></script>
    </head>
    <body>
      <div class="map-card">
        <div id="errorOverlay" class="error-overlay">
          <div style="font-size:1.15rem;font-weight:700;color:#FCA5A5;margin-bottom:8px;">⚠️ Google Maps API Key Needs Activation</div>
          <p style="font-size:0.88rem;color:#CBD5E1;margin-bottom:12px;">
            The Google Maps API key provided in <code>.env</code> is recognized, but <strong>Maps JavaScript API</strong> has not been enabled in your Google Cloud Project.
          </p>
          <div style="background:rgba(30,45,78,0.7);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:12px;font-size:0.82rem;margin-bottom:14px;">
            <strong>To activate Google Maps:</strong><br>
            1. Open <a href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" target="_blank" style="color:#60A5FA;font-weight:600;text-decoration:underline;">Google Cloud Console — Maps JavaScript API</a><br>
            2. Click the blue <strong>ENABLE</strong> button for your project.<br>
            3. Ensure billing is linked to your Google Cloud project.
          </div>
          <p style="font-size:0.85rem;color:#94A3B8;">
            👉 <em>To view the map immediately, select <strong>Classic PyDeck (Open-Source)</strong> in the left sidebar under <strong>Map Engine</strong>.</em>
          </p>
        </div>

        <div class="control-panel" id="controlPanel">
          <label>
            <input type="checkbox" id="trafficToggle" checked onchange="toggleTraffic()">
            <span class="badge-live">LIVE</span> Traffic Congestion
          </label>
          <label>
            <input type="checkbox" id="densityToggle" checked onchange="toggleDensity()">
            🔥 Disruption Hotspots
          </label>
        </div>
        <div id="map"></div>
      </div>
    </body>
    </html>
    """
    components.html(html_code, height=height + 10)


def render_google_tactical_dispatch_map(
    incident_lat: float,
    incident_lon: float,
    incident_info: dict,
    barricades: list = None,
    routes: list = None,
    allocations: list = None,
    api_key: str = None,
    height: int = 540,
):
    """
    Renders an end-to-end tactical command map for the incident response:
      - Incident Epicenter with pulsing beacon
      - Live Google Traffic Layer (real-time road conditions)
      - Recommended police barricade cordons surrounding the scene
      - Alternative detour diversion routes (polylines with turn coordinates)
      - Police officer allocations at neighboring junctions
      - Auto auth-failure error banner
    """
    if not api_key:
        api_key = get_google_maps_api_key()

    barricades = barricades or []
    routes = routes or []
    allocations = allocations or []

    # Prepare info window text
    tier = incident_info.get("effective_tier", "High")
    cause = incident_info.get("event_cause", "Incident").replace("_", " ").title()
    corridor = incident_info.get("corridor", "Named Corridor")
    officers = f"{incident_info.get('manpower_min', 2)}-{incident_info.get('manpower_max', 4)}"
    sla = incident_info.get("deployment_time", "< 15 min")
    barricading = incident_info.get("barricading", "None")

    tier_color = "#EF4444" if tier == "High" else "#F59E0B" if tier == "Medium" else "#22C55E"

    # Serialize data for JavaScript injection
    routes_json = json.dumps([
        {
            "id": r.get("route_id", idx + 1),
            "description": r.get("description", f"Detour Route {idx + 1}"),
            "coords": [
                {"lat": float(pt[0]), "lng": float(pt[1])}
                for pt in r.get("path_coordinates", [])
                if len(pt) >= 2
            ],
            "distance_km": round(r.get("distance_m", 0) / 1000.0, 2),
            "travel_time_min": r.get("travel_time_min", 0),
        }
        for idx, r in enumerate(routes)
    ])

    barricades_json = json.dumps([
        {
            "name": b.get("intersection_id", "Intersection"),
            "road": b.get("road_name", "Boundary Cordon"),
            "lat": float(b.get("latitude", incident_lat)),
            "lng": float(b.get("longitude", incident_lon)),
            "reason": b.get("reason", "Barricade Diversion Point"),
        }
        for b in barricades
        if b.get("latitude") and b.get("longitude")
    ])

    allocations_json = json.dumps([
        {
            "junction": a.get("junction", "Junction"),
            "officers": a.get("allocated_officers", 2),
            "lat": float(a.get("latitude", incident_lat)),
            "lng": float(a.get("longitude", incident_lon)),
            "status": a.get("allocation_priority", "Medium"),
        }
        for a in allocations
        if a.get("latitude") and a.get("longitude")
    ])

    html_code = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        html, body {{ height: 100%; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, sans-serif; }}
        #map {{ height: 100%; width: 100%; border-radius: 12px; }}
        .map-card {{
          position: relative;
          height: {height}px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 25px rgba(0,0,0,0.4);
          border: 1px solid rgba(59,130,246,0.35);
          background: #0F1729;
        }}
        .legend-box {{
          position: absolute;
          bottom: 16px;
          left: 14px;
          background: rgba(15, 23, 41, 0.92);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(59,130,246,0.3);
          border-radius: 10px;
          padding: 10px 14px;
          color: #E2E8F0;
          font-size: 0.76rem;
          z-index: 10;
          line-height: 1.6;
        }}
        .legend-item {{ display: flex; align-items: center; gap: 8px; margin: 3px 0; }}
        .dot {{ width: 11px; height: 11px; border-radius: 50%; display: inline-block; }}
        .line-dot {{ width: 18px; height: 4px; border-radius: 2px; display: inline-block; }}
        .control-top {{
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(15, 23, 41, 0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(59,130,246,0.35);
          border-radius: 8px;
          padding: 8px 14px;
          color: #E2E8F0;
          font-size: 0.78rem;
          z-index: 10;
        }}
        .gm-style .gm-style-iw-c {{
          background-color: #0F1729 !important;
          color: #E2E8F0 !important;
          border-radius: 8px !important;
          padding: 12px !important;
          border: 1px solid rgba(59,130,246,0.3) !important;
        }}
        .gm-style .gm-style-iw-tc::after {{
          background-color: #0F1729 !important;
        }}
        .error-overlay {{
          display: none;
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 41, 0.95);
          backdrop-filter: blur(6px);
          color: #E2E8F0;
          padding: 28px;
          z-index: 99;
          border-radius: 12px;
          box-sizing: border-box;
          line-height: 1.6;
        }}
      </style>
      <script>
        let map, trafficLayer;
        let mapInitialized = false;
        const darkStyle = {json.dumps(DARK_TACTICAL_MAP_STYLE)};
        const routesData = {routes_json};
        const barricadesData = {barricades_json};
        const allocData = {allocations_json};

        window.gm_authFailure = function() {{
          const err = document.getElementById('errorOverlayDispatch');
          if (err) err.style.display = 'block';
          const ct = document.getElementById('controlTop');
          if (ct) ct.style.display = 'none';
          const lb = document.getElementById('legendBox');
          if (lb) lb.style.display = 'none';
        }};

        function initMap() {{
          mapInitialized = true;
          try {{
            const incCoords = {{ lat: {incident_lat}, lng: {incident_lon} }};
            map = new google.maps.Map(document.getElementById('map'), {{
              zoom: 13,
              center: incCoords,
              styles: darkStyle,
              mapTypeControl: true,
              mapTypeControlOptions: {{
                style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                position: google.maps.ControlPosition.TOP_LEFT
              }},
              streetViewControl: false,
              fullscreenControl: true
            }});

            // Live Google Traffic Layer
            trafficLayer = new google.maps.TrafficLayer();
            trafficLayer.setMap(map);

            // 1. Incident Epicenter Marker with ripple
            const incMarker = new google.maps.Marker({{
              position: incCoords,
              map: map,
              title: "INCIDENT EPICENTER",
              animation: google.maps.Animation.DROP,
              icon: {{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '{tier_color}',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3
              }}
            }});

            // Impact radius cordon circle (500m)
            new google.maps.Circle({{
              strokeColor: '{tier_color}',
              strokeOpacity: 0.8,
              strokeWeight: 1.5,
              fillColor: '{tier_color}',
              fillOpacity: 0.12,
              map: map,
              center: incCoords,
              radius: 500
            }});

            // InfoWindow for incident
            const incInfoWindow = new google.maps.InfoWindow({{
              content: `
                <div style="font-family:'Segoe UI',sans-serif;color:#E2E8F0;font-size:0.85rem;line-height:1.5;">
                  <div style="font-size:1.05rem;font-weight:700;color:{tier_color};margin-bottom:4px;">🚨 {cause}</div>
                  <div><strong>Effective Tier:</strong> <span style="color:{tier_color};font-weight:bold;">{tier}</span></div>
                  <div><strong>Corridor:</strong> {corridor}</div>
                  <div><strong>Police Dispatch:</strong> {officers} Officers</div>
                  <div><strong>Deployment SLA:</strong> {sla}</div>
                  <div><strong>Barricade Order:</strong> {barricading}</div>
                </div>
              `
            }});
            incMarker.addListener('click', () => incInfoWindow.open(map, incMarker));
            incInfoWindow.open(map, incMarker);

            // 2. Barricade Cordon Markers
            const barInfo = new google.maps.InfoWindow();
            barricadesData.forEach(b => {{
              const bMarker = new google.maps.Marker({{
                position: {{ lat: b.lat, lng: b.lng }},
                map: map,
                title: "Barricade Cordon: " + b.name,
                icon: {{
                  path: "M 0 0 L 10 -18 L -10 -18 Z",
                  scale: 1.2,
                  fillColor: '#F59E0B',
                  fillOpacity: 0.95,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 1.5
                }}
              }});
              bMarker.addListener('click', () => {{
                barInfo.setContent(`
                  <div style="color:#E2E8F0;font-size:0.83rem;">
                    <strong style="color:#FCD34D;">🚧 Barricade Perimeter</strong><br>
                    Intersection: <b>${{b.name}}</b><br>
                    Road: ${{b.road}}<br>
                    Purpose: ${{b.reason}}
                  </div>
                `);
                barInfo.open(map, bMarker);
              }});
            }});

            // 3. Diversion Detour Polylines
            const detourColors = ['#38BDF8', '#C084FC', '#F472B6'];
            routesData.forEach((r, idx) => {{
              if (r.coords && r.coords.length > 1) {{
                const polyline = new google.maps.Polyline({{
                  path: r.coords,
                  geodesic: true,
                  strokeColor: detourColors[idx % detourColors.length],
                  strokeOpacity: 0.9,
                  strokeWeight: 5,
                  map: map
                }});

                const rInfo = new google.maps.InfoWindow();
                polyline.addListener('click', (e) => {{
                  rInfo.setPosition(e.latLng);
                  rInfo.setContent(`
                    <div style="color:#E2E8F0;font-size:0.83rem;">
                      <strong style="color:${{detourColors[idx % detourColors.length]}};">➡️ ${{r.description}}</strong><br>
                      Distance: <b>${{r.distance_km}} km</b><br>
                      Est. Travel Time: <b>~${{r.travel_time_min}} mins</b>
                    </div>
                  `);
                  rInfo.open(map);
                }});
              }}
            }});

            // 4. Officer Allocation Badges at Neighboring Junctions
            const allocInfo = new google.maps.InfoWindow();
            allocData.forEach(a => {{
              const aMarker = new google.maps.Marker({{
                position: {{ lat: a.lat, lng: a.lng }},
                map: map,
                title: a.junction + ": " + a.officers + " Officers",
                label: {{
                  text: String(a.officers),
                  color: "#FFFFFF",
                  fontSize: "11px",
                  fontWeight: "bold"
                }},
                icon: {{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 14,
                  fillColor: '#3B82F6',
                  fillOpacity: 0.85,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 1.5
                }}
              }});
              aMarker.addListener('click', () => {{
                allocInfo.setContent(`
                  <div style="color:#E2E8F0;font-size:0.83rem;">
                    <strong style="color:#93C5FD;">👮 Junction Deployment</strong><br>
                    Junction: <b>${{a.junction}}</b><br>
                    Headcount: <b>${{a.officers}} Officers</b><br>
                    Priority: ${{a.status}}
                  </div>
                `);
                allocInfo.open(map, aMarker);
              }});
            }});
          }} catch (e) {{
            console.error("Tactical dispatch map error:", e);
          }}
        }}

        function toggleTraffic() {{
          if (!trafficLayer) return;
          const chk = document.getElementById('trafficToggle').checked;
          trafficLayer.setMap(chk ? map : null);
        }}
      </script>
      <script async defer src="https://maps.googleapis.com/maps/api/js?key={api_key}&callback=initMap"></script>
    </head>
    <body>
      <div class="map-card">
        <div id="errorOverlayDispatch" class="error-overlay">
          <div style="font-size:1.15rem;font-weight:700;color:#FCA5A5;margin-bottom:8px;">⚠️ Google Maps API Key Needs Activation</div>
          <p style="font-size:0.88rem;color:#CBD5E1;margin-bottom:12px;">
            The Google Maps API key provided in <code>.env</code> is recognized, but <strong>Maps JavaScript API</strong> has not been enabled in your Google Cloud Project.
          </p>
          <div style="background:rgba(30,45,78,0.7);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:12px;font-size:0.82rem;margin-bottom:14px;">
            <strong>To activate Google Maps:</strong><br>
            1. Open <a href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" target="_blank" style="color:#60A5FA;font-weight:600;text-decoration:underline;">Google Cloud Console — Maps JavaScript API</a><br>
            2. Click the blue <strong>ENABLE</strong> button for your project.<br>
            3. Ensure billing is linked to your Google Cloud project.
          </div>
          <p style="font-size:0.85rem;color:#94A3B8;">
            👉 <em>To view the map immediately, select <strong>Classic PyDeck (Open-Source)</strong> in the left sidebar under <strong>Map Engine</strong>.</em>
          </p>
        </div>

        <div class="control-top" id="controlTop">
          <label style="cursor:pointer;display:flex;align-items:center;gap:6px;">
            <input type="checkbox" id="trafficToggle" checked onchange="toggleTraffic()">
            <span style="background:rgba(34,197,94,0.2);color:#86EFAC;padding:2px 6px;border-radius:4px;font-weight:bold;font-size:0.7rem;">LIVE</span> Traffic Congestion
          </label>
        </div>

        <div class="legend-box" id="legendBox">
          <div style="font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#93C5FD;margin-bottom:4px;">Tactical Legend</div>
          <div class="legend-item"><span class="dot" style="background:{tier_color};"></span> Incident Epicenter ({tier})</div>
          <div class="legend-item"><span class="dot" style="background:#F59E0B;"></span> Police Barricade Cordons</div>
          <div class="legend-item"><span class="line-dot" style="background:#38BDF8;"></span> Primary Detour Route</div>
          <div class="legend-item"><span class="line-dot" style="background:#C084FC;"></span> Alternate Detour Route</div>
          <div class="legend-item"><span class="dot" style="background:#3B82F6;"></span> Allocated Police Officers</div>
        </div>

        <div id="map"></div>
      </div>
    </body>
    </html>
    """
    components.html(html_code, height=height + 10)
