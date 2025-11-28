import React, { useState } from 'react';

const LoginPage = ({ onLogin, onCitizenLogin }) => {
    const [activeTab, setActiveTab] = useState('citizen'); // 'citizen', 'hospital', 'official', 'bmc'
    const [isSignUp, setIsSignUp] = useState(false);
    
    // Citizen fields
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [citizenPassword, setCitizenPassword] = useState('');
    
    // Hospital/Admin fields
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCitizenAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isSignUp ? '/api/citizen/signup' : '/api/citizen/login';
        const payload = isSignUp ? { name, phone, password: citizenPassword } : { phone, password: citizenPassword };

        try {
            const response = await fetch(`http://localhost:8000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                onCitizenLogin(data.user);
            } else {
                setError(data.detail || 'Authentication failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleHospitalLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // For demo purposes, check credentials locally for non-hospital tabs
            if (activeTab === 'official') {
                if (username === 'admin' && password === 'admin123') {
                    // Redirect to official dashboard via parent
                    window.location.hash = 'official';
                    return;
                } else {
                    setError('Invalid credentials');
                    setLoading(false);
                    return;
                }
            }
            
            if (activeTab === 'bmc') {
                if (username === 'bmc_admin' && password === 'admin123') {
                    // Redirect to BMC dashboard via parent
                    window.location.hash = 'bmc';
                    return;
                } else {
                    setError('Invalid credentials');
                    setLoading(false);
                    return;
                }
            }

            // Hospital login goes through API
            const response = await fetch('http://localhost:8000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (data.status === 'success') {
                onLogin(data.hospital);
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'citizen', label: 'Citizen', icon: '👤' },
        { id: 'hospital', label: 'Hospital', icon: '🏥' },
        { id: 'official', label: 'Admin', icon: '👨‍💼' },
        { id: 'bmc', label: 'BMC', icon: '🏛️' }
    ];

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo & Header */}
                <div className="mb-8 text-center">
                    <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg">
                        <span className="text-4xl">🛡️</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900">SentinelHealthCast</h1>
                    <p className="mt-2 text-sm font-medium text-gray-500">Epidemic Surveillance & Response Platform</p>
                </div>

                {/* Main Card */}
                <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
                    {/* Tab Navigation */}
                    <div className="grid grid-cols-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setError('');
                                    setIsSignUp(false);
                                }}
                                className={`group relative flex flex-col items-center gap-2 px-4 py-5 text-xs font-bold transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-white text-sky-600'
                                        : 'text-gray-400 hover:bg-white/50 hover:text-gray-600'
                                }`}
                            >
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-blue-500"></div>
                                )}
                                <span className="text-2xl transition-transform group-hover:scale-110">{tab.icon}</span>
                                <span className="uppercase tracking-wide">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Form Content */}
                    <div className="p-8">
                        {error && (
                            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600 shadow-sm">
                                <span className="text-lg">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Citizen Form */}
                        {activeTab === 'citizen' && (
                            <form onSubmit={handleCitizenAuth} className="space-y-5">
                                <div className="mb-6 text-center">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                                    </h2>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {isSignUp ? 'Join the health monitoring network' : 'Sign in to report symptoms & track health'}
                                    </p>
                                </div>

                                {isSignUp && (
                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-gray-700">Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 text-gray-900 transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 text-gray-900 transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                                        placeholder="+91 XXXXXXXXXX"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        value={citizenPassword}
                                        onChange={(e) => setCitizenPassword(e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 text-gray-900 transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 px-6 py-4 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                            Please wait...
                                        </span>
                                    ) : (
                                        isSignUp ? '✨ Create Account' : '🚀 Sign In'
                                    )}
                                </button>

                                {!isSignUp && (
                                    <div className="rounded-xl border-2 border-sky-100 bg-sky-50 p-4">
                                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-sky-600">Demo Credentials</div>
                                        <div className="space-y-1 text-xs text-gray-600">
                                            <div className="flex justify-between">
                                                <span className="font-medium">Phone:</span>
                                                <span className="font-mono font-bold text-gray-900">9876543210</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Password:</span>
                                                <span className="font-mono font-bold text-gray-900">demo123</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="text-center text-sm text-gray-600">
                                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                                    <button
                                        type="button"
                                        onClick={() => setIsSignUp(!isSignUp)}
                                        className="font-bold text-sky-500 hover:text-sky-600 hover:underline"
                                    >
                                        {isSignUp ? 'Sign In' : 'Sign Up'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Hospital/Admin/BMC Form */}
                        {(activeTab === 'hospital' || activeTab === 'official' || activeTab === 'bmc') && (
                            <form onSubmit={handleHospitalLogin} className="space-y-5">
                                <div className="mb-6 text-center">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {activeTab === 'hospital' ? '🏥 Hospital Portal' : activeTab === 'bmc' ? '🏛️ BMC Portal' : '👨‍💼 Admin Portal'}
                                    </h2>
                                    <p className="mt-2 text-sm font-medium text-gray-500">Authorized Personnel Only</p>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 text-gray-900 transition-all focus:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100"
                                        placeholder="Enter your username"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 text-gray-900 transition-all focus:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 px-6 py-4 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                            Authenticating...
                                        </span>
                                    ) : (
                                        '🔐 Secure Sign In'
                                    )}
                                </button>

                                <div className="rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50 p-4">
                                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-600">
                                        {activeTab === 'hospital' ? '🏥 Hospital Demo' : activeTab === 'bmc' ? '🏛️ BMC Demo' : '👨‍💼 Admin Demo'}
                                    </div>
                                    <div className="space-y-1 text-xs text-gray-700">
                                        <div className="flex justify-between">
                                            <span className="font-medium">Username:</span>
                                            <span className="font-mono font-bold text-gray-900">
                                                {activeTab === 'hospital' ? 'lilavati' : activeTab === 'bmc' ? 'bmc_admin' : 'admin'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium">Password:</span>
                                            <span className="font-mono font-bold text-gray-900">admin123</span>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs font-medium text-gray-400">
                        &copy; 2025 SentinelHealthCast • Powered by AI & Public Health Data
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            API Online
                        </span>
                        <span>•</span>
                        <span>Real-time Monitoring</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
