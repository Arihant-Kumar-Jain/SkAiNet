/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, AlertTriangle, Info, CheckCircle, Layers, Navigation, Radio } from 'lucide-react';
import { useMessageStore } from '../Store/useMessageStore';
import * as L from 'leaflet';
window.L = L;

const ConcentrationMapPage = () => {
  const { messages, fetchMessages } = useMessageStore();
  const [filteredData, setFilteredData] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(13);
  const [isInitialized, setIsInitialized] = useState(false);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const clusterMarkersRef = useRef([]);

  // Watch for dark mode changes
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);

    const observer = new MutationObserver(() => {
      const isDark = localStorage.getItem('darkMode') === 'true';
      setDarkMode(isDark);
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Fetch live messages periodically
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Filter and prepare live messages
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const gpsMessages = messages
      .filter(m => m.gps && m.gps.latitude && m.gps.longitude && !m.rescued)
      .map(m => ({
        src: String(m.source_node || ''),
        cur: String(m.current_node || ''),
        msg_id: String(m.message_id || ''),
        name: m.sender_name || 'Unknown',
        message: m.message || '',
        gps: {
          latitude: parseFloat(m.gps.latitude),
          longitude: parseFloat(m.gps.longitude)
        },
        urgency: m.urgency || 'NONE'
      }));

    // Remove duplicates by (src + msg_id)
    const unique = gpsMessages.filter(
      (item, idx, self) =>
        idx === self.findIndex(t => t.src === item.src && t.msg_id === item.msg_id)
    );

    console.log(`Loaded ${unique.length} live unrescued messages with GPS`);
    setFilteredData(unique);
  }, [messages]);

  // Initialize map
  useEffect(() => {
    const L = window.L;
    if (!L || isInitialized) return;

    const map = L.map('concentration-map').setView([31.78, 77.00], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    map.on('zoomend', () => setCurrentZoom(map.getZoom()));

    mapRef.current = map;
    setIsInitialized(true);
  }, [isInitialized]);

  // Update map when data or zoom changes
  useEffect(() => {
    if (mapRef.current && filteredData.length > 0) {
      updateMap();
    }
  }, [filteredData, currentZoom]);

  // Cluster logic
  const calculateClusters = (points, zoom) => {
    let clusterDistance;
    if (zoom < 10) clusterDistance = 0.1;
    else if (zoom < 12) clusterDistance = 0.03;
    else if (zoom < 14) clusterDistance = 0.005;
    else if (zoom < 16) clusterDistance = 0.002;
    else clusterDistance = 0.0005;

    const clusters = [];
    const processed = new Set();

    points.forEach((point, idx) => {
      if (processed.has(idx)) return;

      const cluster = {
        center: { lat: point.gps.latitude, lon: point.gps.longitude },
        points: [point],
        urgencyCounts: { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 }
      };
      cluster.urgencyCounts[point.urgency || 'NONE']++;
      processed.add(idx);

      points.forEach((other, j) => {
        if (processed.has(j)) return;
        const distance = Math.sqrt(
          Math.pow(point.gps.latitude - other.gps.latitude, 2) +
            Math.pow(point.gps.longitude - other.gps.longitude, 2)
        );
        if (distance < clusterDistance) {
          cluster.points.push(other);
          cluster.urgencyCounts[other.urgency || 'NONE']++;
          processed.add(j);
        }
      });

      cluster.center.lat =
        cluster.points.reduce((a, p) => a + p.gps.latitude, 0) /
        cluster.points.length;
      cluster.center.lon =
        cluster.points.reduce((a, p) => a + p.gps.longitude, 0) /
        cluster.points.length;

      clusters.push(cluster);
    });

    return clusters;
  };

  const getMajorityThreatColor = counts => {
    const high = counts.HIGH || 0,
      med = counts.MEDIUM || 0,
      low = counts.LOW || 0,
      none = counts.NONE || 0;
    const max = Math.max(high, med, low, none);
    if (high === max && high > 0) return { color: '#ef4444', text: 'CRITICAL' };
    if (med === max && med > 0) return { color: '#f59e0b', text: 'WARNING' };
    if (low === max && low > 0) return { color: '#10b981', text: 'LOW' };
    return { color: '#3b82f6', text: 'INFO' };
  };

  // Core map update logic
  const updateMap = () => {
    const L = window.L;
    if (!L || !mapRef.current) return;

    markersRef.current.forEach(m => mapRef.current.removeLayer(m));
    clusterMarkersRef.current.forEach(m => mapRef.current.removeLayer(m));
    markersRef.current = [];
    clusterMarkersRef.current = [];

    const zoom = mapRef.current.getZoom();

    if (zoom >= 14) {
      // Individual markers
      filteredData.forEach((msg, index) => {
        const { latitude, longitude } = msg.gps;
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) return;

        let iconColor = '#525252';
        if (msg.urgency === 'HIGH') iconColor = '#000000';
        else if (msg.urgency === 'MEDIUM') iconColor = '#404040';
        else if (msg.urgency === 'LOW') iconColor = '#737373';

        const marker = L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color:${iconColor};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).bindPopup(`
          <div style="min-width:200px;font-family:system-ui;">
            <div style="margin-bottom: 8px;">
              <strong style="font-size: 14px;">${msg.name}</strong>
              <span style="background:${iconColor};color:white;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:6px;">${msg.urgency}</span>
            </div>
            <p style="margin:6px 0;font-size:12px;color:#666;">${msg.message}</p>
            <div style="margin-top:8px;font-size:11px;color:#999;">
              Node ${msg.src} → ${msg.cur} | ID: ${msg.msg_id}
            </div>
            <div style="font-size:10px;color:#aaa;">${latitude.toFixed(5)}, ${longitude.toFixed(5)}</div>
          </div>
        `);
        marker.addTo(mapRef.current);
        markersRef.current.push(marker);
      });
    } else {
      // Clustered view
      const clusters = calculateClusters(filteredData, zoom);
      clusters.forEach(cluster => {
        const { color, text } = getMajorityThreatColor(cluster.urgencyCounts);
        const size = Math.min(60, 20 + cluster.points.length * 2);
        const marker = L.marker([cluster.center.lat, cluster.center.lon], {
          icon: L.divIcon({
            className: 'cluster-marker',
            html: `
              <div style="
                background:${color};
                width:${size}px;height:${size}px;
                border-radius:50%;
                border:4px solid white;
                box-shadow:0 4px 16px rgba(0,0,0,0.4);
                display:flex;align-items:center;justify-content:center;
                color:white;font-weight:bold;font-size:${Math.max(12, size / 4)}px;">
                ${cluster.points.length}
              </div>`
          })
        }).bindPopup(`
          <div style="min-width:250px;font-family:system-ui;">
            <strong style="color:${color};font-size:16px;">${text} ZONE</strong>
            <p style="font-size:13px;color:#666;margin:8px 0;">${cluster.points.length} incidents in this area</p>
            <div style="font-size:11px;color:#999;">
              High: ${cluster.urgencyCounts.HIGH} | Medium: ${cluster.urgencyCounts.MEDIUM} | Low: ${cluster.urgencyCounts.LOW}
            </div>
          </div>
        `);
        marker.addTo(mapRef.current);
        clusterMarkersRef.current.push(marker);
      });
    }
  };

  // Stats
  const stats = {
    total: filteredData.length,
    high: filteredData.filter(m => m.urgency === 'HIGH').length,
    medium: filteredData.filter(m => m.urgency === 'MEDIUM').length,
    low: filteredData.filter(m => m.urgency === 'LOW').length,
    live: messages.filter(m => m.gps && m.gps.latitude && m.gps.longitude && !m.rescued).length,
    rescued: messages.filter(m => m.gps && m.gps.latitude && m.gps.longitude && m.rescued).length
  };

  const bgClass = darkMode ? 'bg-black' : 'bg-white';
  const cardBg = darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200';
  const textPrimary = darkMode ? 'text-white' : 'text-black';
  const textSecondary = darkMode ? 'text-neutral-400' : 'text-neutral-600';
  const inputBg = darkMode ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-black';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-200`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <StatCard 
            title="Active Points" 
            value={stats.total} 
            icon={<MapPin className="w-5 h-5" />} 
            dark={darkMode} 
          />
          <StatCard 
            title="High" 
            value={stats.high} 
            icon={<AlertTriangle className="w-5 h-5" />} 
            dark={darkMode} 
            urgency="HIGH"
          />
          <StatCard 
            title="Medium" 
            value={stats.medium} 
            icon={<Info className="w-5 h-5" />} 
            dark={darkMode} 
            urgency="MEDIUM"
          />
          <StatCard 
            title="Low" 
            value={stats.low} 
            icon={<CheckCircle className="w-5 h-5" />} 
            dark={darkMode} 
            urgency="LOW"
          />
          <StatCard 
            title="Live" 
            value={stats.live} 
            icon={<Radio className="w-5 h-5" />} 
            dark={darkMode} 
            live 
          />
        </div>

        {/* Info */}
         

        {/* Map */}
        <div className={`${cardBg} border overflow-hidden transition-colors duration-200`}>
          <div className={`p-4 border-b ${darkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Layers className={`w-5 h-5 ${textSecondary}`} />
                <div>
                  <h2 className={`text-lg font-bold uppercase tracking-wide ${textPrimary}`}>LIVE CONCENTRATION VIEW</h2>
                  <p className={`text-xs ${textSecondary} uppercase tracking-wide`}>
                    Zoom: {currentZoom} | Markers: {currentZoom >= 14 ? markersRef.current.length : clusterMarkersRef.current.length}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1.5 ${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-300'} border text-sm font-semibold uppercase tracking-wide ${textPrimary}`}>
                {currentZoom >= 14 ? 'INDIVIDUAL VIEW' : 'CLUSTER VIEW'}
              </div>
            </div>
          </div>
          <div id="concentration-map" className="w-full" style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}></div>
        </div>

        {/* Rescued Cases Summary */}
        {stats.rescued > 0 && (
          <div className="mt-12">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <CheckCircle className={`w-6 h-6 ${textPrimary}`} />
                <h2 className={`text-2xl font-bold uppercase tracking-wide ${textPrimary}`}>Rescued Cases</h2>
                <span className={`px-4 py-1 ${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-300'} border text-sm font-semibold font-mono ${textPrimary}`}>
                  {stats.rescued} RESOLVED
                </span>
              </div>
              <p className={`${textSecondary} text-sm uppercase tracking-wide`}>Successfully rescued incidents with GPS data</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {messages
                .filter(m => m.gps && m.gps.latitude && m.gps.longitude && m.rescued)
                .map((msg, idx) => (
                  <div key={`rescued-${idx}`} className={`${cardBg} border p-4 opacity-70 hover:opacity-100 transition-all duration-200`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className={`text-sm font-bold uppercase tracking-wide ${textPrimary}`}>
                          {msg.sender_name || 'Unknown'}
                        </h3>
                        <p className={`text-xs ${darkMode ? 'text-neutral-300' : 'text-neutral-600'} mt-1`}>
                          {msg.message}
                        </p>
                      </div>
                      <span className={`flex items-center space-x-1 px-2.5 py-1 text-xs font-bold border ml-3 uppercase tracking-wider ${darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-neutral-100 border-neutral-300 text-neutral-700'}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>RESCUED</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`px-2 py-1 ${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-300'} border font-mono ${textPrimary}`}>
                        NODE {msg.source_node} → {msg.current_node}
                      </span>
                      <span className={`px-2 py-1 ${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-300'} border font-mono ${textPrimary}`}>
                        ID: {msg.message_id}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// StatCard component with black/white theme
const StatCard = ({ title, value, icon, dark, urgency, live }) => {
  const getUrgencyStyles = (urgency) => {
    const baseStyles = dark
      ? {
          HIGH: 'bg-black border-white text-white',
          MEDIUM: 'bg-neutral-800 border-neutral-400 text-neutral-200',
          LOW: 'bg-neutral-700 border-neutral-500 text-neutral-300',
          default: 'bg-neutral-800 border-neutral-600 text-neutral-300'
        }
      : {
          HIGH: 'bg-black border-black text-white',
          MEDIUM: 'bg-neutral-700 border-neutral-700 text-white',
          LOW: 'bg-neutral-400 border-neutral-400 text-white',
          default: 'bg-neutral-200 border-neutral-300 text-neutral-900'
        };
    return baseStyles[urgency] || baseStyles.default;
  };

  const cardBg = dark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200';
  const textSecondary = dark ? 'text-neutral-400' : 'text-neutral-600';
  
  return (
    <div className={`${cardBg} border p-4 transition-colors duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs sm:text-sm ${textSecondary} font-medium uppercase tracking-wider`}>{title}</p>
          <p className={`text-xl sm:text-2xl font-bold ${dark ? 'text-white' : 'text-black'} mt-1 font-mono`}>{value}</p>
        </div>
        {live ? (
          <div className="w-3 h-3 bg-neutral-500 rounded-full animate-pulse"></div>
        ) : urgency ? (
          <div className={`p-2 ${getUrgencyStyles(urgency)}`}>
            {icon}
          </div>
        ) : (
          <div className={`p-2 ${dark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConcentrationMapPage;