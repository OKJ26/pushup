import React, { useState } from 'react';
import TodayTab from './components/TodayTab';
import VsTab from './components/VsTab';
import RemindTab from './components/RemindTab';
import ChatTab from './components/ChatTab';
import { useChallenge } from './hooks/useChallenge';
import './App.css';

const DEFAULT_PHOTOS = {
  jeremy: '/jeremy.jpg',
  grant: '/grant.jpg',
};

function Avatar({ playerId, size = '', className = '' }) {
  const [custom, setCustom] = useState(() => localStorage.getItem(`photo-${playerId}`) || null);
  const src = custom || DEFAULT_PHOTOS[playerId];

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      localStorage.setItem(`photo-${playerId}`, ev.target.result);
      setCustom(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="avatar-upload-wrap">
      <img src={src} alt={playerId} className={`avatar ${size} ${className}`} />
      <label className="avatar-upload-btn" title="Change photo">
        +
        <input type="file" accept="image/*" className="photo-upload-input" onChange={handleUpload} />
      </label>
    </div>
  );
}

function PlayerSelect({ onSelect }) {
  return (
    <div className="player-select">
      <img src="/organic-logo-white.png" alt="Organic" className="org-logo" />
      <div className="select-header">
        <h1>Morning Pushups</h1>
        <p>Who are you?</p>
      </div>
      <div className="player-cards">
        <button className="player-card" onClick={() => onSelect('jeremy')}>
          <img src={localStorage.getItem('photo-jeremy') || DEFAULT_PHOTOS.jeremy} alt="Jeremy" className="avatar" />
          <span>Jeremy</span>
          
        </button>
        <button className="player-card" onClick={() => onSelect('grant')}>
          <img src={localStorage.getItem('photo-grant') || DEFAULT_PHOTOS.grant} alt="Grant" className="avatar" />
          <span>Grant</span>
          
        </button>
      </div>
      <img src="/pushup.png" alt="Pushup" className="pushup-illustration" />
    </div>
  );
}

export { Avatar, DEFAULT_PHOTOS };

export default function App() {
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('pushup-player') || null);
  const [tab, setTab] = useState('today');
  const challenge = useChallenge(playerId);

  const handleSelect = (id) => {
    localStorage.setItem('pushup-player', id);
    setPlayerId(id);
  };

  if (!playerId) return <PlayerSelect onSelect={handleSelect} />;
  if (challenge.loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <img src="/organic-logo-white.png" alt="Organic" className="header-logo" />
          <button className="switch-btn" onClick={() => { localStorage.removeItem('pushup-player'); setPlayerId(null); }}>
            Switch
          </button>
        </div>
        <h1>Morning Pushups 💪</h1>
      </header>

      <nav className="tabs">
        {[
          { id: 'today', icon: '⚡', label: 'Today' },
          { id: 'vs', icon: '👥', label: `vs ${challenge.otherPlayer.name}` },
          { id: 'remind', icon: '🔔', label: 'Remind' },
          { id: 'chat', icon: '💬', label: 'Chat' },
        ].map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="tab-content">
        {tab === 'today' && <TodayTab challenge={challenge} playerId={playerId} Avatar={Avatar} />}
        {tab === 'vs' && <VsTab challenge={challenge} Avatar={Avatar} />}
        {tab === 'remind' && <RemindTab challenge={challenge} />}
        {tab === 'chat' && <ChatTab playerId={playerId} myPlayer={challenge.myPlayer} otherPlayer={challenge.otherPlayer} />}
      </main>
    </div>
  );
}
