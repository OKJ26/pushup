import React from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { useState, useEffect } from 'react';

const PLAYERS = {
  jeremy: { name: 'Jeremy', photo: '/jeremy.jpg' },
  grant: { name: 'Grant', photo: '/grant.jpg' },
  henry: { name: 'Henry', photo: '/henry.jpg' },
};

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;
}

function getDayTotal(dayLog) {
  if (!dayLog) return 0;
  if (dayLog.reps && !dayLog.sets) return dayLog.reps;
  return Object.values(dayLog.sets || {}).reduce((s, x) => s + (x.reps || 0), 0);
}

function getStreak(logs) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dayLog = logs[key];
    const hasSets = dayLog && (dayLog.reps || Object.keys(dayLog.sets || {}).length > 0);
    if (hasSets) { streak++; d.setDate(d.getDate()-1); }
    else break;
  }
  return streak;
}

function getWeekTotal(logs) {
  const weekStart = getWeekStart();
  return Object.entries(logs)
    .filter(([date]) => date >= weekStart)
    .reduce((sum, [, day]) => sum + getDayTotal(day), 0);
}

function getAllTotal(logs) {
  return Object.values(logs).reduce((sum, day) => sum + getDayTotal(day), 0);
}

function getLatestBPM(bpmData) {
  const keys = Object.keys(bpmData || {}).sort();
  return keys.length ? bpmData[keys[keys.length-1]] : null;
}

export default function VsTab({ challenge }) {
  const [allData, setAllData] = useState(null);
  const today = getTodayKey();

  useEffect(() => {
    const unsub = onValue(ref(db, 'challenge'), snap => {
      setAllData(snap.val() || {});
    });
    return () => unsub();
  }, []);

  if (!allData) return <div className="tab-inner"><div className="section-label">Loading...</div></div>;

  const players = ['jeremy', 'grant', 'henry'].map(id => {
    const data = allData[id] || {};
    const logs = data.logs || {};
    const todayLog = logs[today];
    return {
      id,
      name: PLAYERS[id].name,
      photo: localStorage.getItem(`photo-${id}`) || PLAYERS[id].photo,
      todayReps: getDayTotal(todayLog),
      todayLogged: !!(todayLog && (todayLog.reps || Object.keys(todayLog.sets || {}).length > 0)),
      weekTotal: getWeekTotal(logs),
      allTotal: getAllTotal(logs),
      streak: getStreak(logs),
      bpm: getLatestBPM(data.bpm),
      bwToday: data.breathwork?.[today] || {},
    };
  });

  // Sort by week total for leaderboard
  const ranked = [...players].sort((a, b) => b.weekTotal - a.weekTotal);
  const weekGrand = players.reduce((s, p) => s + p.weekTotal, 0) || 1;

  const myPlayer = players.find(p => p.id === challenge.myPlayer.name.toLowerCase()) || players[0];

  return (
    <div className="tab-inner">
      <div className="section-label">This week — leaderboard</div>

      {ranked.map((p, i) => (
        <div key={p.id} className={`lb-row ${p.id === myPlayer.id ? 'lb-me' : ''}`}>
          <div className="lb-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
          <img src={p.photo} alt={p.name} className="avatar avatar-sm" onError={e => { e.target.style.display='none'; }} />
          <div className="lb-info">
            <div className="lb-name">{p.name}{p.id === myPlayer.id ? ' (you)' : ''}</div>
            <div className="lb-bar-wrap">
              <div className="lb-bar" style={{ width: `${Math.round(p.weekTotal/weekGrand*100)}%` }} />
            </div>
          </div>
          <div className="lb-stats">
            <div className="lb-week">{p.weekTotal}</div>
            <div className="stat-lbl">this week</div>
          </div>
        </div>
      ))}

      <div className="section-label" style={{ marginTop: '1.25rem' }}>Today</div>
      <div className="lb-today-grid">
        {players.map(p => (
          <div key={p.id} className={`lb-today-card ${p.todayLogged ? 'done' : ''}`}>
            <img src={p.photo} alt={p.name} className="avatar" style={{ width: 40, height: 40 }} onError={e => { e.target.style.display='none'; }} />
            <div className="lb-today-name">{p.name}</div>
            <div className="lb-today-reps">{p.todayLogged ? p.todayReps : '--'}</div>
            <div className="stat-lbl">reps</div>
          </div>
        ))}
      </div>

      <div className="section-label" style={{ marginTop: '1.25rem' }}>All time</div>
      <div className="stats-grid">
        {players.map(p => (
          <div key={p.id} className="metric">
            <div className="metric-val">{p.allTotal.toLocaleString()}</div>
            <div className="metric-lbl">{p.name} total</div>
          </div>
        ))}
        {players.map(p => (
          <div key={`${p.id}-streak`} className="metric">
            <div className="metric-val">{p.streak}d</div>
            <div className="metric-lbl">{p.name} streak</div>
          </div>
        ))}
      </div>

      <div className="section-label" style={{ marginTop: '0.5rem' }}>Breath Rate (BPM)</div>
      <div className="stats-grid">
        {players.map(p => (
          <div key={`${p.id}-bpm`} className="metric">
            <div className="metric-val">{p.bpm || '--'}</div>
            <div className="metric-lbl">{p.name} BPM</div>
          </div>
        ))}
      </div>
      <div className="bpm-goal-note">Target: 4-6 BPM. Lower = better.</div>

      <div className="section-label" style={{ marginTop: '0.75rem' }}>Breath Work Today</div>
      <div className="stats-grid">
        {players.map(p => (
          <div key={`${p.id}-bw`} className="metric">
            <div className="metric-val">
              {p.bwToday.morning && p.bwToday.night ? '✓✓' : p.bwToday.morning || p.bwToday.night ? '✓' : '--'}
            </div>
            <div className="metric-lbl">{p.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
