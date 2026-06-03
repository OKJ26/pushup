import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

const PLAYERS_CONFIG = {
  jeremy: { name: 'Jeremy', photo: '/jeremy.jpg' },
  grant: { name: 'Grant', photo: '/grant.jpg' },
  henry: { name: 'Henry', photo: '/henry.jpg' },
};
const PLAYER_IDS = ['jeremy', 'grant', 'henry'];

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekStart() {
  const d = new Date();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
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
    const has = dayLog && (dayLog.reps || Object.keys(dayLog.sets || {}).length > 0);
    if (has) { streak++; d.setDate(d.getDate()-1); } else break;
  }
  return streak;
}

function getWeekTotal(logs) {
  const ws = getWeekStart();
  return Object.entries(logs).filter(([d]) => d >= ws).reduce((s,[,l]) => s + getDayTotal(l), 0);
}

function getAllTotal(logs) {
  return Object.values(logs).reduce((s, l) => s + getDayTotal(l), 0);
}

function getLatestBPM(bpmData) {
  const keys = Object.keys(bpmData || {}).sort();
  return keys.length ? bpmData[keys[keys.length-1]] : null;
}

function StatRow({ label, values, highlight }) {
  const max = Math.max(...values.filter(v => typeof v === 'number'));
  return (
    <div className="vs3-row">
      <div className="vs3-label">{label}</div>
      <div className="vs3-cells">
        {values.map((v, i) => (
          <div key={i} className={`vs3-cell ${highlight && typeof v === 'number' && v === max && max > 0 ? 'vs3-winner' : ''}`}>
            {v}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VsTab({ challenge }) {
  const [allData, setAllData] = useState(null);
  const today = getTodayKey();

  useEffect(() => {
    const unsub = onValue(ref(db, 'challenge'), snap => setAllData(snap.val() || {}));
    return () => unsub();
  }, []);

  if (!allData) return <div className="tab-inner"><div className="section-label">Loading...</div></div>;

  const players = PLAYER_IDS.map(id => {
    const data = allData[id] || {};
    const logs = data.logs || {};
    const todayLog = logs[today];
    return {
      id,
      name: PLAYERS_CONFIG[id].name,
      photo: localStorage.getItem(`photo-${id}`) || PLAYERS_CONFIG[id].photo,
      todayReps: getDayTotal(todayLog),
      todayLogged: !!(todayLog && (todayLog.reps || Object.keys(todayLog.sets||{}).length > 0)),
      weekTotal: getWeekTotal(logs),
      allTotal: getAllTotal(logs),
      streak: getStreak(logs),
      bpm: getLatestBPM(data.bpm),
      bwToday: data.breathwork?.[today] || {},
    };
  });

  const ranked = [...players].sort((a, b) => b.weekTotal - a.weekTotal);
  const weekGrand = players.reduce((s, p) => s + p.weekTotal, 0) || 1;
  const myId = challenge.myPlayer.name.toLowerCase();

  const bwLabel = (bw) => bw.morning && bw.night ? '✓✓' : bw.morning || bw.night ? '✓' : '--';

  return (
    <div className="tab-inner">

      {/* Leaderboard podium */}
      <div className="section-label">This week</div>
      {ranked.map((p, i) => (
        <div key={p.id} className={`lb-row ${p.id === myId ? 'lb-me' : ''}`}>
          <div className="lb-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
          <img src={p.photo} alt={p.name} className="avatar avatar-sm" onError={e => e.target.style.display='none'} />
          <div className="lb-info">
            <div className="lb-name">{p.name}{p.id === myId ? ' (you)' : ''}</div>
            <div className="lb-bar-wrap">
              <div className="lb-bar" style={{ width: `${Math.round(p.weekTotal/weekGrand*100)}%` }} />
            </div>
          </div>
          <div className="lb-stats">
            <div className="lb-week">{p.weekTotal}</div>
            <div className="stat-lbl">reps</div>
          </div>
        </div>
      ))}

      {/* 3-column stats table */}
      <div className="vs3-table">
        {/* Header row with photos */}
        <div className="vs3-row vs3-header">
          <div className="vs3-label"></div>
          <div className="vs3-cells">
            {players.map(p => (
              <div key={p.id} className="vs3-cell vs3-name-cell">
                <img src={p.photo} alt={p.name} className="vs3-avatar" onError={e => e.target.style.display='none'} />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vs3-divider">Today</div>
        <StatRow label="Reps" values={players.map(p => p.todayLogged ? p.todayReps : '--')} highlight={true} />

        <div className="vs3-divider">Pushups</div>
        <StatRow label="This week" values={players.map(p => p.weekTotal)} highlight={true} />
        <StatRow label="All time" values={players.map(p => p.allTotal.toLocaleString())} highlight={false} />
        <StatRow label="Streak" values={players.map(p => `${p.streak}d`)} highlight={false} />

        <div className="vs3-divider">Breath Rate</div>
        <StatRow label="BPM" values={players.map(p => p.bpm || '--')} highlight={false} />

        <div className="vs3-divider">Breath Work</div>
        <StatRow label="Today" values={players.map(p => bwLabel(p.bwToday))} highlight={false} />
      </div>

      <div className="bpm-goal-note" style={{ marginTop: '0.5rem' }}>BPM target: 4-6. Lower = better vagus nerve tone.</div>
    </div>
  );
}
