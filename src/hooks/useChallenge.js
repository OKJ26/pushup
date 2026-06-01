import { useState, useEffect } from 'react';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';

const PLAYERS = {
  jeremy: { name: 'Jeremy', initials: 'JE', color: 'blue' },
  grant: { name: 'Grant', initials: 'GR', color: 'coral' },
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

  const logSet = async (reps) => {
    const today = getTodayKey();
    await push(ref(db, `challenge/${playerId}/logs/${today}/sets`), {
      reps,
      timestamp: serverTimestamp(),
    });
  };

  const getStreak = (playerLogs = {}) => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const hasSets = Object.keys(playerLogs[key]?.sets || {}).length > 0;
      if (hasSets) {
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
      const sets = Object.values(playerLogs[key]?.sets || {});
      const dayTotal = sets.reduce((s, x) => s + (x.reps || 0), 0);
      days.push({
        key,
        label,
        reps: dayTotal,
        done: sets.length > 0,
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
      const sets = Object.values(day?.sets || {});
      sets.forEach(s => { if ((s.reps || 0) > best) best = s.reps; });
    });
    return best;
  };

  const getTotalReps = (playerLogs = {}) => {
    let total = 0;
    Object.values(playerLogs).forEach(day => {
      const sets = Object.values(day?.sets || {});
      sets.forEach(s => { total += s.reps || 0; });
    });
    return total;
  };

  const todayKey = getTodayKey();
  const myLogs = data?.[playerId]?.logs || {};
  const otherPlayer = playerId === 'jeremy' ? 'grant' : 'jeremy';
  const otherLogs = data?.[otherPlayer]?.logs || {};

  const getTodaySets = (logs) => {
    const sets = logs[todayKey]?.sets || {};
    return Object.values(sets);
  };

  const getTodayTotal = (logs) => {
    return getTodaySets(logs).reduce((sum, s) => sum + (s.reps || 0), 0);
  };

  return {
    loading,
    players: PLAYERS,
    myPlayer: PLAYERS[playerId],
    otherPlayer: PLAYERS[otherPlayer],
    todayLogged: getTodaySets(myLogs).length > 0,
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
    otherTodayLogged: Object.keys(otherLogs[todayKey]?.sets || {}).length > 0,
    logSet,
  };
}
