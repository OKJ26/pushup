import React, { useState } from 'react';
import BreathWork from './BreathWork';
import DayDetail from './DayDetail';
import StoriesBar from './Stories';

function StreakDots({ weekLogs, onDayTap }) {
  return (
    <div className="streak-dots">
      {weekLogs.map((day) => {
        let cls = 'dot';
        if (day.isFuture) cls += ' future';
        else if (day.done) cls += ' done';
        else if (day.isToday) cls += ' today';
        else cls += ' miss';
        const tappable = !day.isFuture;
        return (
          <div
            key={day.key}
            className={cls + (tappable ? ' tappable' : '')}
            title={day.reps ? `${day.reps} reps` : day.label}
            onClick={() => tappable && onDayTap(day)}
          >
            {day.label}
          </div>
        );
      })}
    </div>
  );
}

function SetRow({ set, index, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(set.reps);

  const handleSave = () => {
    if (editVal > 0) {
      onEdit(set.key, editVal);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="set-row editing">
        <span className="set-num">Set {index + 1}</span>
        <div className="set-edit-controls">
          <button className="set-edit-btn" onClick={() => setEditVal(Math.max(1, editVal - 1))}>−</button>
          <span className="set-edit-val">{editVal}</span>
          <button className="set-edit-btn" onClick={() => setEditVal(editVal + 1)}>+</button>
        </div>
        <div className="set-actions">
          <button className="set-save-btn" onClick={handleSave}>✓</button>
          <button className="set-cancel-btn" onClick={() => { setEditing(false); setEditVal(set.reps); }}>✕</button>
        </div>
      </div>
    );
  }

  return (
    <div className="set-row">
      <span className="set-num">Set {index + 1}</span>
      <span className="set-reps">{set.reps} reps</span>
      <div className="set-actions">
        {set.key !== 'legacy' && (
          <>
            <button className="set-edit-btn icon" onClick={() => setEditing(true)} title="Edit">✏️</button>
            <button className="set-delete-btn icon" onClick={() => onDelete(set.key)} title="Delete">🗑️</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function TodayTab({ challenge, playerId, Avatar }) {
  const [reps, setReps] = useState(10);
  const [confirming, setConfirming] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const {
    myPlayer, myStreak, myWeekLogs, todayLogged, todayReps, todaySets,
    otherPlayer, otherTodayLogged, otherTodayReps, logSet, editSet, deleteSet,
  } = challenge;

  const handleLog = async () => {
    await logSet(reps);
    setConfirming(true);
    setTimeout(() => setConfirming(false), 2000);
  };

  return (
    <div className="tab-inner">
      <StoriesBar playerId={playerId} />
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
          <div className="stat-big">{todayReps > 0 ? todayReps : '--'}</div>
          <div className="stat-lbl">today</div>
        </div>
      </div>
      <StreakDots weekLogs={myWeekLogs} onDayTap={setSelectedDay} />

      {todaySets.length > 0 && (
        <div className="sets-log">
          <div className="section-label" style={{ marginTop: '1rem' }}>Today's sets</div>
          {todaySets.map((s, i) => (
            <SetRow
              key={s.key || i}
              set={s}
              index={i}
              onEdit={editSet}
              onDelete={deleteSet}
            />
          ))}
          <div className="set-row total">
            <span className="set-num">Total</span>
            <span className="set-reps">{todayReps} reps</span>
            <div className="set-actions" />
          </div>
        </div>
      )}

      {otherTodayLogged && !todayLogged && (
        <div className="nudge-bar" style={{ marginTop: '0.75rem' }}>
          {otherPlayer.name} already did {otherTodayReps} today. Your turn!
        </div>
      )}

      <div className="section-label" style={{ marginTop: '1.25rem' }}>
        {todaySets.length > 0 ? 'Log another set' : "Log today's set"}
      </div>

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
      <button className="log-btn" onClick={handleLog}>
        {todaySets.length > 0 ? `Log set ${todaySets.length + 1} ✓` : 'Log set ✓'}
      </button>
      {confirming && <div className="confirm-msg">Set logged! 💪 Keep going.</div>}

      <BreathWork challenge={challenge} playerId={playerId} />

      {selectedDay && (
        <DayDetail day={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
}
