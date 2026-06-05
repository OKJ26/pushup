import React, { useState, useEffect } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { ref, set } from 'firebase/database';
import { db } from '../firebase';

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

function Toggle({ on, onToggle }) {
  return (
    <button role="switch" aria-checked={on} onClick={onToggle} className={`toggle ${on ? 'on' : ''}`}>
      <span className="knob" />
    </button>
  );
}

export default function RemindTab({ challenge }) {
  const [notifStatus, setNotifStatus] = useState('unknown');
  const [morning, setMorning] = useState(() => localStorage.getItem('remind-morning') !== 'false');
  const [streakRisk, setStreakRisk] = useState(() => localStorage.getItem('remind-streak') === 'true');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if ('Notification' in window) setNotifStatus(Notification.permission);
  }, []);

  const enableNotifications = async () => {
    if (!('Notification' in window)) return;
    setRegistering(true);
    try {
      const perm = await Notification.requestPermission();
      setNotifStatus(perm);
      if (perm === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const messaging = getMessaging();
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });
        if (token) {
          const playerId = localStorage.getItem('pushup-player');
          if (playerId) await set(ref(db, `fcmTokens/${playerId}`), token);
          new Notification('Morning Pushups 💪', {
            body: "Notifications on!",
            icon: '/icon-192.png',
          });
        }
      }
    } catch (err) {
      console.error('Notification error:', err);
    }
    setRegistering(false);
  };

  const save = (key, val) => localStorage.setItem(key, String(val));

  return (
    <div className="tab-inner">
      <div className="section-label">Notifications</div>

      {notifStatus !== 'granted' && (
        <button className="enable-notif-btn" onClick={enableNotifications} disabled={registering}>
          {registering ? 'Setting up...' : notifStatus === 'denied'
            ? 'Blocked — enable in browser settings'
            : 'Enable push notifications'}
        </button>
      )}
      {notifStatus === 'granted' && (
        <div className="notif-success">✓ Notifications enabled</div>
      )}

      <div className="notify-row">
        <div className="notify-info">
          <div className="notify-title">Morning reminder</div>
          <div className="notify-sub">Daily pushup nudge at 8am</div>
        </div>
        <Toggle on={morning} onToggle={() => { setMorning(!morning); save('remind-morning', !morning); }} />
      </div>

      <div className="notify-row">
        <div className="notify-info">
          <div className="notify-title">Streak at risk</div>
          <div className="notify-sub">Nudge at 8pm if not logged</div>
        </div>
        <Toggle on={streakRisk} onToggle={() => { setStreakRisk(!streakRisk); save('remind-streak', !streakRisk); }} />
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
