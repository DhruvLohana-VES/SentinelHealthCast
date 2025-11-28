// src/App.tsx
// Main application with dashboard integration

import React, { useState } from 'react';
import CitizenView from './components/CitizenView';
import OfficialDashboard from './components/OfficialDashboard';
import LoginPage from './components/LoginPage';
import HospitalDashboard from './components/HospitalDashboard';
import CitizenLogin from './components/CitizenLogin';
import CitizenDashboard from './components/CitizenDashboard';
import BMCDashboard from './components/BMCDashboard';
import UserDashboard from './pages/user/Dashboard';

function App() {
  const [view, setView] = useState('citizen_login');
  const [hospitalUser, setHospitalUser] = useState(null);
  const [citizenUser, setCitizenUser] = useState(null);

  const handleHospitalLogin = (user: any) => {
    setHospitalUser(user);
    setView('hospital');
  };

  const handleCitizenLogin = (user: any) => {
    setCitizenUser(user);
    setView('new_dashboard'); // Changed to use new dashboard
  };

  const handleLogout = () => {
    setHospitalUser(null);
    setView('login');
  };

  const handleCitizenLogout = () => {
    setCitizenUser(null);
    setView('citizen_login');
  };

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#1e293b', borderBottom: '1px solid #334155' }}>
        <div className="logo" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>SentinelHealthCast 🛡️</div>
        <div className="nav-links" style={{ display: 'flex', gap: '1rem' }}>
          <button
            className={`btn ${view === 'citizen_login' || view === 'citizen_dashboard' || view === 'new_dashboard' ? 'btn-primary' : ''}`}
            onClick={() => setView(citizenUser ? 'new_dashboard' : 'citizen_login')}
            style={{ background: view === 'citizen_login' || view === 'citizen_dashboard' || view === 'new_dashboard' ? '' : 'transparent', color: view === 'citizen_login' || view === 'citizen_dashboard' || view === 'new_dashboard' ? '' : '#94a3b8' }}
          >
            Citizen View
          </button>
          <button
            className={`btn ${view === 'official' ? 'btn-primary' : ''}`}
            onClick={() => setView('official')}
            style={{ background: view === 'official' ? '' : 'transparent', color: view === 'official' ? '' : '#94a3b8' }}
          >
            Official Dashboard
          </button>
          <button
            className={`btn ${view === 'bmc' ? 'btn-primary' : ''}`}
            onClick={() => setView('bmc')}
            style={{ background: view === 'bmc' ? '' : 'transparent', color: view === 'bmc' ? '' : '#94a3b8' }}
          >
            BMC Dashboard
          </button>
          <button
            className={`btn ${view === 'login' || view === 'hospital' ? 'btn-primary' : ''}`}
            onClick={() => setView(hospitalUser ? 'hospital' : 'login')}
            style={{ background: view === 'login' || view === 'hospital' ? '' : 'transparent', color: view === 'login' || view === 'hospital' ? '' : '#94a3b8' }}
          >
            Hospital Login
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {view === 'citizen_login' && <CitizenLogin onLogin={handleCitizenLogin} />}
        {view === 'citizen_dashboard' && <CitizenDashboard user={citizenUser} onLogout={handleCitizenLogout} />}
        {view === 'new_dashboard' && <UserDashboard />}
        {view === 'official' && <OfficialDashboard />}
        {view === 'bmc' && <BMCDashboard />}
        {view === 'login' && <LoginPage onLogin={handleHospitalLogin} />}
        {view === 'hospital' && <HospitalDashboard user={hospitalUser} onLogout={handleLogout} />}
      </main>
    </div>
  );
}

export default App;
