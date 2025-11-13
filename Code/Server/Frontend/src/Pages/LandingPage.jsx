/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import { useMessageStore } from '../Store/useMessageStore';
import {
    Trash2, Download, Search, Clock,
    MapPin, AlertTriangle, Info, CheckCircle,
    Map as MapIcon, Navigation, X,
    Radio
} from 'lucide-react';

const LandingPage = () => {
    const { messages, isFetchingMessages, error, fetchMessages, clearMessages } = useMessageStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [urgencyFilter, setUrgencyFilter] = useState('all');
    const [darkMode, setDarkMode] = useState(false);
    const [showAllMap, setShowAllMap] = useState(false);
    const globalMapRef = useRef(null);
    const cardMapRefs = useRef({});

    // Sync dark mode with navbar
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

    // Initial fetch and polling
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(() => {
            fetchMessages();
        }, 2000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    // Initialize global map
    useEffect(() => {
        if (showAllMap && !globalMapRef.current) {
            setTimeout(() => initGlobalMap(), 100);
        }
    }, [showAllMap]);

    // Update global map when messages change
    useEffect(() => {
        if (showAllMap && globalMapRef.current) {
            updateGlobalMap();
        }
    }, [messages, showAllMap, urgencyFilter, filterType, searchTerm]);

    const initGlobalMap = () => {
        const L = window.L;
        if (!L) return;

        const mapElement = document.getElementById('global-map');
        if (!mapElement) return;

        const map = L.map('global-map').setView([31.78, 77.00], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        globalMapRef.current = map;
        updateGlobalMap();
    };

    const updateGlobalMap = () => {
        if (!globalMapRef.current) return;
        const L = window.L;
        if (!L) return;

        globalMapRef.current.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                globalMapRef.current.removeLayer(layer);
            }
        });

        const messagesWithGPS = filteredMessages.filter(msg => msg.gps);

        messagesWithGPS.forEach((msg) => {
            const { latitude, longitude } = msg.gps;

            let iconColor = '#525252';
            if (msg.urgency === 'HIGH') iconColor = '#000000';
            else if (msg.urgency === 'MEDIUM') iconColor = '#404040';
            else if (msg.urgency === 'LOW') iconColor = '#737373';

            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background-color: ${iconColor}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 12px rgba(0,0,0,0.4);"></div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const marker = L.marker([latitude, longitude], { icon: customIcon })
                .bindPopup(`
                    <div style="min-width: 200px; font-family: system-ui;">
                        <div style="margin-bottom: 8px;">
                            <strong style="font-size: 14px;">${msg.sender_name || 'Unknown'}</strong>
                            ${msg.urgency ? `<span style="background: ${iconColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 6px;">${msg.urgency}</span>` : ''}
                        </div>
                        <p style="margin: 6px 0; font-size: 12px; color: #666;">${msg.message}</p>
                        <div style="margin-top: 8px; font-size: 11px; color: #999;">
                            Node ${msg.source_node} → ${msg.current_node} | ID: ${msg.message_id}
                        </div>
                    </div>
                `)
                .addTo(globalMapRef.current);
        });

        if (messagesWithGPS.length > 0) {
            const bounds = L.latLngBounds(messagesWithGPS.map(msg => [msg.gps.latitude, msg.gps.longitude]));
            globalMapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    };

    const initCardMap = (msgId, latitude, longitude, urgency) => {
        const L = window.L;
        if (!L) return;

        const mapElement = document.getElementById(`map-${msgId}`);
        if (!mapElement || cardMapRefs.current[msgId]) return;

        const map = L.map(`map-${msgId}`).setView([latitude, longitude], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(map);

        let iconColor = '#525252';
        if (urgency === 'HIGH') iconColor = '#000000';
        else if (urgency === 'MEDIUM') iconColor = '#404040';
        else if (urgency === 'LOW') iconColor = '#737373';

        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${iconColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
        cardMapRefs.current[msgId] = map;
    };

    // Filter messages
    const filteredMessages = messages.filter(msg => {
        const matchesSearch = searchTerm === '' ||
            msg.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.source_node?.toString().includes(searchTerm) ||
            msg.message_id?.toString().includes(searchTerm);

        const matchesFilter = filterType === 'all' ||
            (filterType === 'withName' && msg.name) ||
            (filterType === 'withoutName' && !msg.name) ||
            (filterType === 'withGPS' && msg.gps);

        const matchesUrgency = urgencyFilter === 'all' ||
            msg.urgency === urgencyFilter;
        const notRescued = !msg.rescued;
        return matchesSearch && matchesFilter && matchesUrgency && notRescued;
    });

    // Export messages
    const handleExport = () => {
        const dataStr = JSON.stringify(messages, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `disaster_messages_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const getUrgencyStyles = (urgency) => {
        const baseStyles = darkMode
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

    const getUrgencyIcon = (urgency) => {
        switch (urgency) {
            case 'HIGH': return <AlertTriangle className="w-4 h-4" />;
            case 'MEDIUM': return <Info className="w-4 h-4" />;
            case 'LOW': return <CheckCircle className="w-4 h-4" />;
            default: return null;
        }
    };

    // Statistics
    const stats = {
        high: messages.filter(m => m.urgency === 'HIGH' && !m.rescued).length,
        medium: messages.filter(m => m.urgency === 'MEDIUM' && !m.rescued).length,
        low: messages.filter(m => m.urgency === 'LOW' && !m.rescued).length,
        withGPS: messages.filter(m => m.gps && !m.rescued).length,
        rescued: messages.filter(m => m.rescued).length
    };

    const bgClass = darkMode ? 'bg-black' : 'bg-white';
    const cardBg = darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200';
    const textPrimary = darkMode ? 'text-white' : 'text-black';
    const textSecondary = darkMode ? 'text-neutral-400' : 'text-neutral-600';
    const inputBg = darkMode ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-black';

    return (
        <div className={`min-h-screen ${bgClass} transition-colors duration-200`}>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Error Alert */}
                {error && (
                    <div className={`mb-6 ${darkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-100 border-neutral-300'} border p-4`}>
                        <div className="flex items-center">
                            <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-200'} p-2 mr-3`}>
                                <AlertTriangle className={`w-5 h-5 ${textPrimary}`} />
                            </div>
                            <div>
                                <p className={`${textPrimary} font-semibold text-sm uppercase tracking-wide`}>Connection Error</p>
                                <p className={`${textSecondary} text-sm mt-0.5`}>{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <div className={`${cardBg} border p-4 transition-colors duration-200`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-xs sm:text-sm ${textSecondary} font-medium uppercase tracking-wider`}>High Priority</p>
                                <p className={`text-xl sm:text-2xl font-bold ${textPrimary} mt-1 font-mono`}>{stats.high}</p>
                            </div>
                            <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'} p-2 sm:p-3`}>
                                <AlertTriangle className={`w-5 h-5 sm:w-6 sm:h-6 ${textPrimary}`} />
                            </div>
                        </div>
                    </div>

                    <div className={`${cardBg} border p-4 transition-colors duration-200`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-xs sm:text-sm ${textSecondary} font-medium uppercase tracking-wider`}>Medium</p>
                                <p className={`text-xl sm:text-2xl font-bold ${textPrimary} mt-1 font-mono`}>{stats.medium}</p>
                            </div>
                            <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'} p-2 sm:p-3`}>
                                <Info className={`w-5 h-5 sm:w-6 sm:h-6 ${textPrimary}`} />
                            </div>
                        </div>
                    </div>

                    <div className={`${cardBg} border p-4 transition-colors duration-200`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-xs sm:text-sm ${textSecondary} font-medium uppercase tracking-wider`}>Low Priority</p>
                                <p className={`text-xl sm:text-2xl font-bold ${textPrimary} mt-1 font-mono`}>{stats.low}</p>
                            </div>
                            <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'} p-2 sm:p-3`}>
                                <CheckCircle className={`w-5 h-5 sm:w-6 sm:h-6 ${textPrimary}`} />
                            </div>
                        </div>
                    </div>

                    <div className={`${cardBg} border p-4 transition-colors duration-200`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-xs sm:text-sm ${textSecondary} font-medium uppercase tracking-wider`}>GPS Tracked</p>
                                <p className={`text-xl sm:text-2xl font-bold ${textPrimary} mt-1 font-mono`}>{stats.withGPS}</p>
                            </div>
                            <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'} p-2 sm:p-3`}>
                                <Navigation className={`w-5 h-5 sm:w-6 sm:h-6 ${textPrimary}`} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className={`${cardBg} border p-4 mb-6 transition-colors duration-200`}>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
                                <input
                                    type="text"
                                    placeholder="SEARCH MESSAGES..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-2.5 border focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-transparent text-sm uppercase tracking-wide ${inputBg} transition-colors duration-200`}
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className={`px-3 py-2.5 border focus:outline-none focus:ring-1 focus:ring-neutral-500 appearance-none cursor-pointer text-sm font-medium uppercase tracking-wide ${inputBg} transition-colors duration-200`}
                        >
                            <option value="all">All Messages</option>
                            <option value="withName">With Name</option>
                            <option value="withoutName">Without Name</option>
                            <option value="withGPS">With GPS</option>
                        </select>

                        <select
                            value={urgencyFilter}
                            onChange={(e) => setUrgencyFilter(e.target.value)}
                            className={`px-3 py-2.5 border focus:outline-none focus:ring-1 focus:ring-neutral-500 appearance-none cursor-pointer text-sm font-medium uppercase tracking-wide ${inputBg} transition-colors duration-200`}
                        >
                            <option value="all">All Urgency</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>

                        {/* Actions */}
                        <button
                            onClick={() => setShowAllMap(!showAllMap)}
                            disabled={messages.filter(m => m.gps).length === 0}
                            className={`flex items-center space-x-2 px-4 py-2.5 ${darkMode ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700' : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200'} border transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium uppercase tracking-wide ${textPrimary}`}
                        >
                            <MapIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">{showAllMap ? 'Hide' : 'Show'} Map</span>
                        </button>

                        <button
                            onClick={handleExport}
                            disabled={messages.length === 0}
                            className={`flex items-center space-x-2 px-4 py-2.5 ${darkMode ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700' : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200'} border transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium uppercase tracking-wide ${textPrimary}`}
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                        </button>

                        <button
                            onClick={clearMessages}
                            disabled={messages.length === 0}
                            className={`flex items-center space-x-2 px-4 py-2.5 ${darkMode ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700' : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200'} border transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium uppercase tracking-wide ${textPrimary}`}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Clear</span>
                        </button>
                    </div>
                </div>

                {/* Global Map Modal */}
                {showAllMap && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className={`${cardBg} w-full max-w-6xl max-h-[90vh] flex flex-col transition-colors duration-200`}>
                            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
                                <div className="flex items-center space-x-3">
                                    <MapIcon className={`w-6 h-6 ${textPrimary}`} />
                                    <h2 className={`text-xl font-bold uppercase tracking-wide ${textPrimary}`}>All Locations Map</h2>
                                    <span className={`px-3 py-1 ${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-300'} border text-sm font-semibold font-mono ${textPrimary}`}>
                                        {filteredMessages.filter(m => m.gps).length} locations
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowAllMap(false)}
                                    className={`p-2 ${darkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'} transition-colors`}
                                >
                                    <X className={`w-5 h-5 ${textSecondary}`} />
                                </button>
                            </div>
                            <div id="global-map" className="flex-1"></div>
                        </div>
                    </div>
                )}

                {/* Messages Grid */}
                {isFetchingMessages && messages.length === 0 ? (
                    <div className={`${cardBg} border p-16 flex flex-col items-center justify-center transition-colors duration-200`}>
                        <div className="relative">
                            <div className={`w-16 h-16 border-4 ${darkMode ? 'border-neutral-800 border-t-white' : 'border-neutral-200 border-t-black'} rounded-full animate-spin`}></div>
                        </div>
                        <p className={`${textSecondary} font-medium mt-4 uppercase tracking-wide`}>Connecting to network...</p>
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className={`${cardBg} border p-16 flex flex-col items-center justify-center transition-colors duration-200`}>
                        <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'} p-6 mb-4`}>
                            <MapPin className={`w-12 h-12 ${textSecondary}`} />
                        </div>
                        <p className={`${textPrimary} font-semibold text-lg uppercase tracking-wide`}>All Cases Resolved</p>
                        <p className={`${textSecondary} text-sm mt-1 uppercase tracking-wide`}>No Active Cases</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {filteredMessages.map((msg, index) => {
                            const msgId = `${msg.src}-${msg.msg_id}-${index}`;

                            if (msg.gps) {
                                setTimeout(() => {
                                    if (!cardMapRefs.current[msgId]) {
                                        initCardMap(msgId, msg.gps.latitude, msg.gps.longitude, msg.urgency);
                                    }
                                }, 100);
                            }

                            return (
                                <div
                                    key={msgId}
                                    className={`${cardBg} border overflow-hidden hover:shadow-2xl transition-all duration-200`}
                                >
                                    <div className={`p-4 border-b ${darkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                {msg.name && (
                                                    <h3 className={`text-lg font-bold ${textPrimary} mb-1 uppercase tracking-wide`}>
                                                        {msg.name}
                                                    </h3>
                                                )}
                                                <p className={`text-sm ${textPrimary} leading-relaxed`}>
                                                    {msg.message}
                                                </p>
                                            </div>
                                            {msg.urgency && (
                                                <span className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-bold border ml-3 ${getUrgencyStyles(msg.urgency)} uppercase tracking-wider`}>
                                                    {getUrgencyIcon(msg.urgency)}
                                                    <span>{msg.urgency}</span>
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-1 ${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-300'} text-xs font-semibold border font-mono ${textPrimary}`}>
                                                NODE {msg.source_node} → {msg.current_node}
                                            </span>
                                            <span className={`inline-flex items-center px-2.5 py-1 ${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-300'} text-xs font-semibold border font-mono ${textPrimary}`}>
                                                ID: {msg.message_id}
                                            </span>
                                            {msg.gps && (
                                                <span className={`inline-flex items-center space-x-1 px-2.5 py-1 ${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-300'} text-xs font-semibold border ${textPrimary}`}>
                                                    <MapPin className="w-3 h-3" />
                                                    <span>GPS</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {msg.gps && (
                                        <div className="relative">
                                            <div id={`map-${msgId}`} className="h-48 w-full"></div>
                                            <div className={`absolute bottom-3 left-3 right-3 ${darkMode ? 'bg-black/90 border-neutral-700' : 'bg-white/90 border-neutral-300'} px-3 py-2 border`}>
                                                <p className={`text-xs font-mono ${textSecondary}`}>
                                                    {msg.gps.latitude.toFixed(6)}, {msg.gps.longitude.toFixed(6)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`px-4 py-3 ${darkMode ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'} border-t`}>
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center space-x-2">
                                                <Clock className={`w-3.5 h-3.5 ${textSecondary}`} />
                                                <span className={`${textSecondary} font-medium font-mono`}>
                                                    {new Date().toLocaleTimeString()}
                                                </span>
                                            </div>
                                            {!msg.gps && (
                                                <span className={`px-2 py-1 ${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-200 border-neutral-300'} border text-xs font-medium uppercase tracking-wide ${textPrimary}`}>
                                                    No GPS Data
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="px-4 py-3 flex justify-end">
                                        {!msg.rescued ? (
                                            <button
                                                onClick={() => useMessageStore.getState().markRescued(msg.log_id)}
                                                className={`px-3 py-1.5 text-xs font-semibold border transition-all uppercase tracking-wider
        ${darkMode
                                                        ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white'
                                                        : 'bg-neutral-900 border-neutral-900 hover:bg-black text-white'
                                                    }`}
                                            >
                                                Mark Rescued
                                            </button>
                                        ) : (
                                            <span
                                                className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold border uppercase tracking-wider
        ${darkMode
                                                        ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                                                        : 'bg-neutral-100 border-neutral-300 text-neutral-700'
                                                    }`}
                                            >
                                                Rescued
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Rescued Messages Section */}
                {stats.rescued > 0 && (
                    <div className="mt-12">
                        <div className="mb-6">
                            <div className="flex items-center space-x-3 mb-2">
                                <CheckCircle className={`w-6 h-6 ${textPrimary}`} />
                                <h2 className={`text-2xl font-bold uppercase tracking-wide ${textPrimary}`}>Rescued Cases</h2>
                                <span className={`px-4 py-1 ${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-300'} border text-sm font-semibold font-mono ${textPrimary}`}>
                                    {stats.rescued} resolved
                                </span>
                            </div>
                            <p className={`${textSecondary} text-sm uppercase tracking-wide`}>Successfully rescued and resolved cases</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {messages
                                .filter(msg => msg.rescued)
                                .map((msg, index) => {
                                    const msgId = `${msg.src}-${msg.msg_id}-rescued-${index}`;

                                    return (
                                        <div
                                            key={msgId}
                                            className={`${cardBg} border opacity-70 hover:opacity-100 transition-all duration-200`}
                                        >
                                            <div className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        {msg.name && (
                                                            <h3 className={`text-lg font-bold ${textPrimary} mb-1 uppercase tracking-wide line-through`}>
                                                                {msg.name}
                                                            </h3>
                                                        )}
                                                        <p className={`text-sm ${textPrimary} leading-relaxed line-through`}>
                                                            {msg.message}
                                                        </p>
                                                    </div>
                                                    <span className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-bold border ml-3 ${darkMode ? 'bg-green-900 border-green-700 text-green-300' : 'bg-green-100 border-green-300 text-green-800'} uppercase tracking-wider`}>
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span>RESCUED</span>
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`inline-flex items-center px-2.5 py-1 ${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-300'} text-xs font-semibold border font-mono ${textPrimary}`}>
                                                        NODE {msg.source_node} → {msg.current_node}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2.5 py-1 ${darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-300'} text-xs font-semibold border font-mono ${textPrimary}`}>
                                                        ID: {msg.message_id}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={`px-4 py-3 ${darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'} border-t`}>
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center space-x-2">
                                                        <Clock className={`w-3.5 h-3.5 ${textSecondary}`} />
                                                        <span className={`${textSecondary} font-medium font-mono`}>
                                                            {new Date().toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    <span className={`px-2 py-1 ${darkMode ? 'bg-green-900 border-green-700' : 'bg-green-100 border-green-300'} border text-xs font-medium text-green-800 uppercase tracking-wide`}>
                                                        Case Resolved
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default LandingPage;