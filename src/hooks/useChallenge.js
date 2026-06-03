import { useState, useEffect } from 'react';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';

const PLAYERS = {
  jeremy: { name: 'Jeremy', initials: 'JE', color: 'blue' },
  grant: { name: 'Grant', initials: 'GR', color: 'coral' },
  henry: { name: 'Henry', initials: 'HE', color: 'blue' },
};

export function useChallenge(playerId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const challengeRef = ref(db, 'challenge');
    const unsub = onValue(challengeRef, (snapshot) => {
      const val = snapshot.val() || {};
      setData(val);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const getTodayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const editSet = async (setKey, reps) => {
    const today = getTodayKey();
    const { set: fbSet } = await import('firebase/database');
    await fbSet(ref(db, `challenge/${playerId}/logs/${today}/sets/${setKey}/reps`), reps);
  };

  const deleteSet = async (setKey) => {
    const today = getTodayKey();
    const { remove } = await import('firebase/database');
    await remove(ref(db, `challenge/${playerId}/logs/${today}/sets/${setKey}`));
  };

  const logSet = async (reps) => {
    const today = getTodayKey();
    await push(ref(db, `challenge/${playerId}/logs/${today}/sets`), {
      reps,
      timestamp: serverTimestamp(),
    });

    // Notify the other player
    try {
      const getOtherPlayer = () => {
    if (playerId === 'jeremy') return 'grant';
    if (playerId === 'grant') return 'jeremy';
    return 'jeremy'; // henry vs jeremy
  };
  const otherPlayer = getOtherPlayer();
      const myName = PLAYERS[playerId].name;
      const tokenSnap = await new Promise((resolve) => {
        const tokenRef = require('firebase/database').ref;
        onValue(tokenRef(db, `fcmTokens/${otherPlayer}`), resolve, { onlyOnce: true });
      });
      const token = tokenSnap.val();
      if (token) {
        await fetch('/.netlify/functions/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            title: 'Morning Pushups 💪',
            body: `${myName} just logged ${reps} reps!`,
          }),
        });
      }
    } catch (e) {
      // Notifications are optional, don't break the app
      console.log('Notification send failed:', e);
    }
  };

  const hasLoggedDay = (dayLog) => {
    if (!dayLog) return false;
    // Support both old format (reps directly) and new format (sets object)
    if (dayLog.reps) return true;
    if (dayLog.sets && Object.keys(dayLog.sets).length > 0) return true;
    return false;
  };

  const getDayTotal = (dayLog) => {
    if (!dayLog) return 0;
    // Old format: reps stored directly
    if (dayLog.reps && !dayLog.sets) return dayLog.reps;
    // New format: sum all sets
    const sets = Object.values(dayLog.sets || {});
    return sets.reduce((sum, s) => sum + (s.reps || 0), 0);
  };

  const getStreak = (playerLogs = {}) => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (hasLoggedDay(playerLogs[key])) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const getWeekLogs = (playerLogs = {}) => {
    const days = [];
    const d = new Date();
    const dayOfWeek = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));

    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      const label = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i];
      const today = getTodayKey();
      days.push({
        key,
        label,
        reps: getDayTotal(playerLogs[key]),
        done: hasLoggedDay(playerLogs[key]),
        isToday: key === today,
        isFuture: key > today,
      });
    }
    return days;
  };

  const getWeekTotal = (playerLogs = {}) => {
    return getWeekLogs(playerLogs).reduce((sum, d) => sum + (d.reps || 0), 0);
  };

  const getAllTimeBest = (playerLogs = {}) => {
    let best = 0;
    Object.values(playerLogs).forEach(day => {
      const total = getDayTotal(day);
      if (total > best) best = total;
    });
    return best;
  };

  const getTotalReps = (playerLogs = {}) => {
    return Object.values(playerLogs).reduce((sum, day) => sum + getDayTotal(day), 0);
  };

  const todayKey = getTodayKey();
  const myLogs = data?.[playerId]?.logs || {};
  const getOtherPlayer = () => {
    if (playerId === 'jeremy') return 'grant';
    if (playerId === 'grant') return 'jeremy';
    return 'jeremy'; // henry vs jeremy
  };
  const otherPlayer = getOtherPlayer();
  const otherLogs = data?.[otherPlayer]?.logs || {};

  const getTodaySets = (logs) => {
    const dayLog = logs[todayKey];
    if (!dayLog) return [];
    // Old format - wrap single entry as array
    if (dayLog.reps && !dayLog.sets) return [{ reps: dayLog.reps, key: 'legacy' }];
    return Object.entries(dayLog.sets || {}).map(([key, val]) => ({ ...val, key }));
  };

  const getTodayTotal = (logs) => {
    return getTodaySets(logs).reduce((sum, s) => sum + (s.reps || 0), 0);
  };

  const logBreathWork = async (session, value) => {
    // session = 'morning' or 'night', value = true/false
    const today = getTodayKey();
    const { set: fbSet } = await import('firebase/database');
    await fbSet(ref(db, `challenge/${playerId}/breathwork/${today}/${session}`), value);
  };

  const logBPM = async (bpm) => {
    const today = getTodayKey();
    const { set: fbSet } = await import('firebase/database');
    await fbSet(ref(db, `challenge/${playerId}/bpm/${today}`), bpm);
  };

  const getTodayBreathWork = (player) => {
    const today = getTodayKey();
    const bw = data?.[player]?.breathwork?.[today] || {};
    return { morning: !!bw.morning, night: !!bw.night };
  };

  const getLatestBPM = (player) => {
    const bpmData = data?.[player]?.bpm || {};
    const keys = Object.keys(bpmData).sort();
    if (keys.length === 0) return null;
    return { date: keys[keys.length - 1], value: bpmData[keys[keys.length - 1]] };
  };

  const getBPMHistory = (player) => {
    const bpmData = data?.[player]?.bpm || {};
    return Object.entries(bpmData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));
  };

  return {
    loading,
    players: PLAYERS,
    myPlayer: PLAYERS[playerId],
    otherPlayer: PLAYERS[otherPlayer],
    todayLogged: hasLoggedDay(myLogs[todayKey]),
    todaySets: getTodaySets(myLogs),
    todayReps: getTodayTotal(myLogs),
    myStreak: getStreak(myLogs),
    otherStreak: getStreak(otherLogs),
    myWeekLogs: getWeekLogs(myLogs),
    otherWeekLogs: getWeekLogs(otherLogs),
    myWeekTotal: getWeekTotal(myLogs),
    otherWeekTotal: getWeekTotal(otherLogs),
    myBest: getAllTimeBest(myLogs),
    otherBest: getAllTimeBest(otherLogs),
    myTotal: getTotalReps(myLogs),
    otherTotal: getTotalReps(otherLogs),
    otherTodayReps: getTodayTotal(otherLogs),
    otherTodayLogged: hasLoggedDay(otherLogs[todayKey]),
    logSet,
    editSet,
    deleteSet,
    logBreathWork,
    logBPM,
    myBreathWork: getTodayBreathWork(playerId),
    otherBreathWork: getTodayBreathWork(playerId === 'jeremy' ? 'grant' : 'jeremy'),
    myLatestBPM: getLatestBPM(playerId),
    otherLatestBPM: getLatestBPM(playerId === 'jeremy' ? 'grant' : 'jeremy'),
    myBPMHistory: getBPMHistory(playerId),
    otherBPMHistory: getBPMHistory(playerId === 'jeremy' ? 'grant' : 'jeremy'),
  };
}
