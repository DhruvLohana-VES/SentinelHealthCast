import React, { useState, useEffect } from 'react';
import CitizenView from './components/CitizenView';
import OfficialDashboard from './components/OfficialDashboard';
import LoginPage from './components/LoginPage';
import HospitalDashboard from './components/HospitalDashboard';
import CitizenDashboard from './components/CitizenDashboard';
import BMCDashboard from './components/BMCDashboard';
import UserDashboard from './pages/user/Dashboard';

function App() {
  const [view, setView] = useState('login'); // 'login', 'citizen_dashboard', 'official', 'bmc', 'hospital', 'new_dashboard'
  const [hospitalUser, setHospitalUser] = useState(null);
  const [citizenUser, setCitizenUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'citizen', 'hospital', 'official', 'bmc'

  // Handle hash-based navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'official') {
        setView('official');
        setUserType('official');
      } else if (hash === 'bmc') {
        setView('bmc');
        setUserType('bmc');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleHospitalLogin = (user) => {
    setHospitalUser(user);
    setUserType('hospital');
    setView('hospital');
  };

  const handleCitizenLogin = (user) => {
    setCitizenUser(user);
    setUserType('citizen');
    setView('new_dashboard');
  };

  const handleLogout = () => {
    setHospitalUser(null);
    setCitizenUser(null);
    setUserType(null);
    setView('login');
    window.location.hash = '';
  };

  // If logged in, show nav - but only show relevant nav items
  const showNav = view !== 'login';

  return (
    <div className="app-container min-h-screen bg-gray-50">
      {/* Navigation Bar - Only show when logged in */}
      {showNav && (
        <nav className="border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="text-2xl font-bold text-gray-900">SentinelHealthCast 🛡️</div>
            <div className="flex items-center gap-3">
              {/* Show user type badge */}
              <div className="rounded-full bg-sky-100 px-4 py-1.5 text-xs font-bold text-sky-600">
                {userType === 'citizen' && '👤 Citizen'}
                {userType === 'hospital' && '🏥 Hospital'}
                {userType === 'official' && '👨‍💼 Admin'}
                {userType === 'bmc' && '🏛️ BMC'}
              </div>
              
              {/* Only show relevant dashboard button for logged in user */}
              {userType === 'citizen' && (
                <button
                  className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  onClick={() => setView('new_dashboard')}
                >
                  My Dashboard
                </button>
              )}
              {userType === 'hospital' && (
                <button
                  className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  onClick={() => setView('hospital')}
                >
                  Hospital Dashboard
                </button>
              )}
              {userType === 'official' && (
                <button
                  className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  onClick={() => setView('official')}
                >
                  Admin Dashboard
                </button>
              )}
              {userType === 'bmc' && (
                <button
                  className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  onClick={() => setView('bmc')}
                >
                  BMC Dashboard
                </button>
              )}
              
              <button
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-600"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      )}

      <main className="main-content">
        {view === 'login' && <LoginPage onLogin={handleHospitalLogin} onCitizenLogin={handleCitizenLogin} />}
        {view === 'new_dashboard' && <UserDashboard />}
        {view === 'official' && <OfficialDashboard />}
        {view === 'bmc' && <BMCDashboard />}
        {view === 'hospital' && hospitalUser && <HospitalDashboard hospital={hospitalUser} onLogout={handleLogout} />}
      </main>
    </div>
  );
}

export default App;
