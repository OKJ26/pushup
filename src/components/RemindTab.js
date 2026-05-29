import React, { useState, useEffect } from 'react';

function Toggle({ on, onToggle }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`toggle ${on ? 'on' : ''}`}
    >
      <span className="knob" />
    </button>
  );
}

export default function RemindTab({ challenge }) {
  const [time, setTime] = useState(() => localStorage.getItem('remind-time') || '06:30');
  const [morning, setMorning] = useState(() => localStorage.getItem('remind-morning') !== 'false');
  const [friendAlert, setFriendAlert] = useState(() => localStorage.getItem('remind-friend') !== 'false');
  const [streakRisk, setStreakRisk] = useState(() => localStorage.getItem('remind-streak') === 'true');
  const [notifStatus, setNotifStatus] = useState('unknown');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotifStatus(Notification.permission);
    }
  }, []);

  const requestNotifications = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifStatus(perm);
    if (perm === 'granted') {
      new Notification('Morning pushups', {
        body: "Notifications on! You'll get a nudge each morning.",
        icon: '/icon-192.png',
      });
    }
  };

  const save = (key, val) => localStorage.setItem(key, String(val));

  const handleCopy = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="tab-inner">
      <div className="section-label">Notifications</div>

      {notifStatus !== 'granted' && (
        <button className="enable-notif-btn" onClick={requestNotifications}>
          {notifStatus === 'denied'
            ? 'Notifications blocked — enable in browser settings'
            : 'Enable push notifications'}
        </button>
      )}

      <div className="notify-row">
        <div className="notify-info">
          <div className="notify-title">Morning reminder</div>
          <input
            type="time"
            className="time-input"
            value={time}
            onChange={(e) => { setTime(e.target.value); save('remind-time', e.target.value); }}
          />
        </div>
        <Toggle on={morning} onToggle={() => { setMorning(!morning); save('remind-morning', !morning); }} />
      </div>

      <div className="notify-row">
        <div className="notify-info">
          <div className="notify-title">Friend logs their set</div>
          <div className="notify-sub">Alert when {challenge.otherPlayer.name} logs</div>
        </div>
        <Toggle on={friendAlert} onToggle={() => { setFriendAlert(!friendAlert); save('remind-friend', !friendAlert); }} />
      </div>

      <div className="notify-row">
        <div className="notify-info">
          <div className="notify-title">Streak at risk</div>
          <div className="notify-sub">Nudge at 8pm if not logged</div>
        </div>
        <Toggle on={streakRisk} onToggle={() => { setStreakRisk(!streakRisk); save('remind-streak', !streakRisk); }} />
      </div>

      <div className="section-label" style={{ marginTop: '1.5rem' }}>Invite {challenge.otherPlayer.name}</div>
      <div className="card invite-card">
        <p className="invite-text">Share this link — open in any browser, add to home screen for the app experience.</p>
        <div className="invite-url">{window.location.hostname}</div>
        <button className="log-btn" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy invite link'}
        </button>
      </div>

      <div className="section-label" style={{ marginTop: '1.5rem' }}>Add to home screen</div>
      <div className="card">
        <p className="invite-text" style={{ marginBottom: 0 }}>
          <strong>Android:</strong> Chrome menu → "Add to Home screen"<br />
          <strong>iPhone:</strong> Safari → Share → "Add to Home Screen"
        </p>
      </div>
    </div>
  );
}
