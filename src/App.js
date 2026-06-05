import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase';
import TodayTab from './components/TodayTab';
import VsTab from './components/VsTab';
import RemindTab from './components/RemindTab';
import ChatTab from './components/ChatTab';
import { useChallenge } from './hooks/useChallenge';
import './App.css';

const DEFAULT_PHOTOS = {
  jeremy: '/jeremy.jpg',
  grant: '/grant.jpg',
  henry: '/henry.jpg',
};

const PINS = { jeremy: '1234', grant: '5678' };

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

function PinEntry({ playerId, playerName, photo, onSuccess, onBack }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      const stored = localStorage.getItem(`pin-${playerId}`);
      const correct = stored || PINS[playerId];
      if (next === correct) {
        if (!stored) localStorage.setItem(`pin-${playerId}`, next);
        setTimeout(() => onSuccess(playerId), 150);
      } else {
        setTimeout(() => { setPin(''); setError(true); }, 300);
      }
    }
  };

  const handleDelete = () => setPin(pin.slice(0, -1));

  return (
    <div className="player-select">
      <img src="/organic-logo-white.png" alt="Organic" className="org-logo" />
      <div className="select-header">
        <img src={photo} alt={playerName} className="avatar" style={{ margin: '0 auto 0.75rem' }} />
        <h1>{playerName}</h1>
        <p>Enter your PIN</p>
      </div>
      <div className="pin-dots">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''} ${error ? 'error' : ''}`} />
        ))}
      </div>
      {error && <div className="pin-error">Wrong PIN, try again</div>}
      <div className="pin-pad">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
          <button
            key={i}
            className={`pin-key ${d === '' ? 'invisible' : ''}`}
            onClick={() => d === '⌫' ? handleDelete() : d !== '' ? handleDigit(d) : null}
          >{d}</button>
        ))}
      </div>
      <button className="pin-back-btn" onClick={onBack}>← Back</button>
    </div>
  );
}

function PlayerSelect({ onSelect }) {
  const [enteringPin, setEnteringPin] = useState(null);

  if (enteringPin) {
    return (
      <PinEntry
        playerId={enteringPin}
        playerName={enteringPin === 'jeremy' ? 'Jeremy' : enteringPin === 'grant' ? 'Grant' : 'Henry'}
        photo={localStorage.getItem(`photo-${enteringPin}`) || DEFAULT_PHOTOS[enteringPin]}
        onSuccess={onSelect}
        onBack={() => setEnteringPin(null)}
      />
    );
  }

  return (
    <div className="player-select">
      <img src="/organic-logo-white.png" alt="Organic" className="org-logo" />
      <div className="select-header">
        <h1>Morning Pushups</h1>
        <p>Who are you?</p>
      </div>
      <div className="player-cards">
        <button className="player-card" onClick={() => setEnteringPin('jeremy')}>
          <img src={localStorage.getItem('photo-jeremy') || DEFAULT_PHOTOS.jeremy} alt="Jeremy" className="avatar" />
          <span>Jeremy</span>
        </button>
        <button className="player-card" onClick={() => setEnteringPin('grant')}>
          <img src={localStorage.getItem('photo-grant') || DEFAULT_PHOTOS.grant} alt="Grant" className="avatar" />
          <span>Grant</span>
        </button>
        <button className="player-card" onClick={() => setEnteringPin('henry')}>
          <img src={localStorage.getItem('photo-henry') || DEFAULT_PHOTOS.henry} alt="Henry" className="avatar" />
          <span>Henry</span>
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
  const [unreadChat, setUnreadChat] = useState(0);
  const [lastSeen, setLastSeen] = useState(() => parseInt(localStorage.getItem('last-seen-chat') || '0'));
  const [updateReady, setUpdateReady] = useState(false);
  const [swReg, setSwReg] = useState(null);
  const challenge = useChallenge(playerId);

  useEffect(() => {
    const handler = (e) => {
      setUpdateReady(true);
      setSwReg(e.detail);
    };
    window.addEventListener('swUpdateAvailable', handler);
    return () => window.removeEventListener('swUpdateAvailable', handler);
  }, []);

  const handleUpdate = () => {
    if (swReg && swReg.waiting) {
      swReg.waiting.postMessage('SKIP_WAITING');
    } else {
      window.location.reload();
    }
  };

  useEffect(() => {
    if (!playerId) return;
    const chatRef = ref(db, 'chat');
    const unsub = onValue(chatRef, (snapshot) => {
      const val = snapshot.val() || {};
      const count = Object.values(val).filter(
        m => m.sender !== playerId && (m.timestamp || 0) > lastSeen
      ).length;
      setUnreadChat(count);
    });
    return () => unsub();
  }, [playerId, lastSeen]);

  const handleSelect = (id) => {
    localStorage.setItem('pushup-player', id);
    setPlayerId(id);
  };

  const handleTab = (t) => {
    setTab(t);
    if (t === 'chat') {
      const now = Date.now();
      localStorage.setItem('last-seen-chat', String(now));
      setLastSeen(now);
      setUnreadChat(0);
    }
  };

  if (!playerId) return <PlayerSelect onSelect={handleSelect} />;
  if (challenge.loading) return <div className="loading"><div className="spinner" /></div>;

  const tabs = [
    { id: 'today', icon: '⚡', label: 'Today' },
    { id: 'vs', icon: '👥', label: 'Versus' },
    { id: 'remind', icon: '🔔', label: 'Remind' },
    { id: 'chat', icon: '💬', label: 'Chat', badge: unreadChat },
  ];

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

      {updateReady && (
        <div className="update-banner" onClick={handleUpdate}>
          🆕 New version available — tap to update
        </div>
      )}
      <nav className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => handleTab(t.id)}>
            <span className="tab-icon-wrap">
              <span className="tab-icon">{t.icon}</span>
              {t.badge > 0 && <span className="tab-badge">{t.badge}</span>}
            </span>
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
