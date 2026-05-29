import React, { useState } from 'react';

function StreakDots({ weekLogs }) {
  return (
    <div className="streak-dots">
      {weekLogs.map((day) => {
        let cls = 'dot';
        if (day.isFuture) cls += ' future';
        else if (day.done) cls += ' done';
        else if (day.isToday) cls += ' today';
        else cls += ' miss';
        return (
          <div key={day.key} className={cls} title={day.reps ? `${day.reps} reps` : day.label}>
            {day.label}
          </div>
        );
      })}
    </div>
  );
}

export default function TodayTab({ challenge, playerId, Avatar }) {
  const [reps, setReps] = useState(50);
  const [confirming, setConfirming] = useState(false);

  const {
    myPlayer, myStreak, myWeekLogs, todayLogged, todayReps,
    otherPlayer, otherTodayLogged, otherTodayReps, logSet,
  } = challenge;

  const handleLog = async () => {
    if (todayLogged) return;
    await logSet(reps);
    setConfirming(true);
    setTimeout(() => setConfirming(false), 3000);
  };

  return (
    <div className="tab-inner">
      <div className="section-label">Your streak this week</div>
      <div className="card player-card-row">
        <Avatar playerId={playerId} size="avatar-sm" />
        <div className="player-info">
          <div className="player-name">{myPlayer.name}</div>
          <div className="player-sub">
            {myStreak > 0 ? `🔥 ${myStreak} day streak` : 'Start your streak today'}
          </div>
        </div>
        <div className="stat-right">
          <div className="stat-big">{todayLogged ? todayReps : '--'}</div>
          <div className="stat-lbl">today</div>
        </div>
      </div>
      <StreakDots weekLogs={myWeekLogs} />

      {otherTodayLogged && !todayLogged && (
        <div className="nudge-bar" style={{ marginTop: '0.75rem' }}>
          {otherPlayer.name} already did {otherTodayReps} today. Your turn!
        </div>
      )}

      <div className="section-label" style={{ marginTop: '1.25rem' }}>Log today's set</div>

      {todayLogged ? (
        <div className="done-card">
          <div className="done-icon">✓</div>
          <div className="done-text">Done! {todayReps} reps logged.</div>
          <div className="done-sub">Streak alive. See you tomorrow.</div>
        </div>
      ) : (
        <>
          <div className="rep-picker">
            <span className="rep-label">Pushups</span>
            <div className="rep-controls">
              <button className="rep-btn" onClick={() => setReps(Math.max(1, reps - 5))}>−5</button>
              <button className="rep-btn" onClick={() => setReps(Math.max(1, reps - 1))}>−1</button>
              <span className="rep-count">{reps}</span>
              <button className="rep-btn" onClick={() => setReps(reps + 1)}>+1</button>
              <button className="rep-btn" onClick={() => setReps(reps + 5)}>+5</button>
            </div>
          </div>
          <button className="log-btn" onClick={handleLog}>Log set ✓</button>
          {confirming && <div className="confirm-msg">Logged! Nice work 💪</div>}
        </>
      )}
    </div>
  );
}
