import React from 'react';

function StatCard({ label, value }) {
  return (
    <div className="metric">
      <div className="metric-val">{value}</div>
      <div className="metric-lbl">{label}</div>
    </div>
  );
}

function WeekBar({ myTotal, otherTotal, myName, otherName }) {
  const grand = myTotal + otherTotal || 1;
  const myPct = Math.round((myTotal / grand) * 100);
  const otherPct = 100 - myPct;
  return (
    <div className="vs-bar-wrap">
      <div className="vs-bar-labels">
        <span className="j-text">{myName}</span>
        <span className="g-text">{otherName}</span>
      </div>
      <div className="vs-track">
        <div className="vs-fill j-fill" style={{ width: `${myPct}%` }} />
        <div className="vs-fill g-fill" style={{ width: `${otherPct}%` }} />
      </div>
      <div className="vs-bar-totals">
        <span>{myTotal.toLocaleString()}</span>
        <span>{otherTotal.toLocaleString()}</span>
      </div>
    </div>
  );
}

function MiniStreak({ weekLogs }) {
  return (
    <div className="mini-streak">
      {weekLogs.map((day) => {
        let cls = 'mini-dot';
        if (day.isFuture || (!day.done && !day.isToday)) cls += ' empty';
        else if (!day.done && day.isToday) cls += ' ring';
        return <div key={day.key} className={cls} />;
      })}
    </div>
  );
}

export default function VsTab({ challenge, Avatar }) {
  const {
    myPlayer, otherPlayer,
    myStreak, otherStreak,
    myWeekTotal, otherWeekTotal,
    myBest, otherBest,
    myTotal, otherTotal,
    myWeekLogs, otherWeekLogs,
    otherTodayLogged, otherTodayReps,
  } = challenge;

  const otherId = myPlayer.name === 'Jeremy' ? 'grant' : 'jeremy';

  return (
    <div className="tab-inner">
      <div className="section-label">This week</div>
      <WeekBar
        myTotal={myWeekTotal}
        otherTotal={otherWeekTotal}
        myName={myPlayer.name}
        otherName={otherPlayer.name}
      />

      {myWeekTotal > otherWeekTotal && (
        <div className="nudge-bar green">
          You're ahead by {myWeekTotal - otherWeekTotal} reps this week 💪
        </div>
      )}
      {myWeekTotal < otherWeekTotal && (
        <div className="nudge-bar amber">
          {otherPlayer.name} is ahead by {otherWeekTotal - myWeekTotal} reps. Close the gap!
        </div>
      )}

      <div className="stats-grid">
        <StatCard label="Your streak" value={`${myStreak}d`} />
        <StatCard label={`${otherPlayer.name}'s streak`} value={`${otherStreak}d`} />
        <StatCard label="Your best set" value={myBest} />
        <StatCard label={`${otherPlayer.name}'s best`} value={otherBest} />
        <StatCard label="Your total reps" value={myTotal.toLocaleString()} />
        <StatCard label={`${otherPlayer.name}'s total`} value={otherTotal.toLocaleString()} />
      </div>

      <div className="section-label" style={{ marginTop: '0.5rem' }}>{otherPlayer.name}'s week</div>
      <div className="card player-card-row">
        <Avatar playerId={otherId} size="avatar-sm" />
        <div className="player-info">
          <div className="player-name">{otherPlayer.name}</div>
          <div className="player-sub">
            {otherStreak > 0 ? `🔥 ${otherStreak} day streak` : 'No streak yet'}
          </div>
          <MiniStreak weekLogs={otherWeekLogs} />
        </div>
        <div className="stat-right">
          <div className="stat-big">{otherTodayLogged ? otherTodayReps : '--'}</div>
          <div className="stat-lbl">today</div>
        </div>
      </div>
    </div>
  );
}
