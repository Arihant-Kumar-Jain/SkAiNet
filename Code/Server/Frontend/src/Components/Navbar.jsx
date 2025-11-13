import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Radio, Home, Layers, Menu, X, Signal, Sun, Moon } from 'lucide-react';
import { useMessageStore } from '../Store/useMessageStore';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const location = useLocation();
    const { messages, error } = useMessageStore();

    const isConnected = !error && messages.length >= 0;

    const navLinks = [
        { path: '/', name: 'Dashboard', icon: Home },
        { path: '/concentration-map', name: 'Concentration Map', icon: Layers }
    ];

    const isActive = (path) => location.pathname === path;

    // Sync dark mode with local storage
    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedMode);
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('darkMode', newMode);
        document.documentElement.classList.toggle('dark', newMode);
    };

    const bgClass = darkMode ? 'bg-black' : 'bg-white';
    const borderClass = darkMode ? 'border-neutral-800' : 'border-neutral-200';
    const textPrimary = darkMode ? 'text-white' : 'text-black';
    const textSecondary = darkMode ? 'text-neutral-400' : 'text-neutral-600';

    return (
        <nav className={`${bgClass} border-b ${borderClass} sticky top-0 z-50 shadow-sm transition-colors duration-200`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo & Brand */}
                    <Link to="/" className="flex items-center space-x-3 group">
                        <div className="relative">
                            <div className={`${darkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-100 border-neutral-300'} p-2.5 rounded-xl border group-hover:bg-neutral-200 ${darkMode ? 'group-hover:bg-neutral-800' : ''} transition-all`}>
                                <Radio className={`w-6 h-6 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`} />
                            </div>
                            <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 ${isConnected ? 'bg-neutral-500' : 'bg-neutral-400'} rounded-full ring-2 ${darkMode ? 'ring-black' : 'ring-white'} ${isConnected ? 'animate-pulse' : ''}`}></div>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className={`text-lg font-bold uppercase tracking-wide ${textPrimary}`}>skAiNet</h1>
                            <p className={`text-xs ${textSecondary} font-medium -mt-1 uppercase tracking-wide`}>Disaster Response</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-2">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all uppercase tracking-wide ${
                                        isActive(link.path)
                                            ? darkMode 
                                                ? 'bg-neutral-800 text-white border border-neutral-700'
                                                : 'bg-neutral-100 text-black border border-neutral-300'
                                            : darkMode
                                                ? 'text-neutral-400 hover:bg-neutral-900 hover:text-white border border-transparent'
                                                : 'text-neutral-600 hover:bg-neutral-50 hover:text-black border border-transparent'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{link.name}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Side Controls */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className={`p-2.5 rounded-xl border ${darkMode ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700' : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200'} transition-all`}
                        >
                            {darkMode ? <Sun className="w-5 h-5 text-neutral-300" /> : <Moon className="w-5 h-5 text-neutral-600" />}
                        </button>

                        {/* Status Indicator - Desktop */}
                        <div className={`hidden md:flex items-center space-x-2 px-3 py-2 rounded-xl border ${
                            isConnected 
                                ? darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-neutral-100 border-neutral-300 text-neutral-700'
                                : darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-400' : 'bg-neutral-100 border-neutral-300 text-neutral-500'
                        }`}>
                            <Signal className="w-4 h-4" />
                            <span className="text-sm font-semibold uppercase tracking-wide">{isConnected ? 'Live' : 'Offline'}</span>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`md:hidden p-2 rounded-lg ${darkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'} transition-colors`}
                        >
                            {isOpen ? (
                                <X className={`w-6 h-6 ${textSecondary}`} />
                            ) : (
                                <Menu className={`w-6 h-6 ${textSecondary}`} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className={`md:hidden py-4 border-t ${borderClass}`}>
                        <div className="flex flex-col space-y-2">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all uppercase tracking-wide ${
                                            isActive(link.path)
                                                ? darkMode
                                                    ? 'bg-neutral-800 text-white border border-neutral-700'
                                                    : 'bg-neutral-100 text-black border border-neutral-300'
                                                : darkMode
                                                    ? 'text-neutral-400 hover:bg-neutral-900 hover:text-white border border-transparent'
                                                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-black border border-transparent'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{link.name}</span>
                                    </Link>
                                );
                            })}
                            
                            {/* Status - Mobile */}
                            <div className={`flex items-center space-x-2 px-4 py-3 rounded-xl border mt-2 ${
                                isConnected 
                                    ? darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-neutral-100 border-neutral-300 text-neutral-700'
                                    : darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-400' : 'bg-neutral-100 border-neutral-300 text-neutral-500'
                            }`}>
                                <Signal className="w-4 h-4" />
                                <span className="text-sm font-semibold uppercase tracking-wide">{isConnected ? 'System Live' : 'System Offline'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;