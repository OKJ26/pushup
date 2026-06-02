import React, { useState, useEffect, useRef } from 'react';

function Timer({ onComplete }) {
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  const start = () => {
    setRunning(true);
    setDone(false);
    setSeconds(60);
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setDone(true);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const pct = ((60 - seconds) / 60) * 100;

  return (
    <div className="bpm-timer">
      <div className="timer-circle-wrap">
        <svg viewBox="0 0 100 100" className="timer-svg">
          <circle cx="50" cy="50" r="44" className="timer-track" />
          <circle
            cx="50" cy="50" r="44"
            className="timer-progress"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
          />
        </svg>
        <div className="timer-label">
          {done ? '✓' : running ? seconds : '60'}
          {!done && <span className="timer-unit">s</span>}
        </div>
      </div>
      {!running && !done && (
        <button className="log-btn" onClick={start}>Start 60s timer</button>
      )}
      {running && (
        <p className="timer-hint">Count your inhales...</p>
      )}
      {done && (
        <div className="bpm-done-msg">Time's up! Enter your count below 👇</div>
      )}
    </div>
  );
}

export default function BreathWork({ challenge, playerId }) {
  const { myBreathWork, logBreathWork, myLatestBPM, logBPM } = challenge;
  const [bpmInput, setBpmInput] = useState('');
  const [showTimer, setShowTimer] = useState(false);
  const [bpmSaved, setBpmSaved] = useState(false);

  const isMonday = new Date().getDay() === 1;

  const handleCheck = async (session) => {
    await logBreathWork(session);
  };

  const handleSaveBPM = async () => {
    const val = parseInt(bpmInput);
    if (!val || val < 1 || val > 60) return;
    await logBPM(val);
    setBpmSaved(true);
    setBpmInput('');
    setTimeout(() => setBpmSaved(false), 2000);
  };

  return (
    <div className="breathwork-section">
      <div className="section-label" style={{ marginTop: '1.5rem' }}>Breath Work 🌬️</div>

      <div className="bw-description">
        4/4 breathing — 4 in, 4 out. Activates the vagus nerve.
      </div>

      <div className="bw-checks">
        <button
          className={`bw-check-btn ${myBreathWork.morning ? 'done' : ''}`}
          onClick={() => handleCheck('morning')}
        >
          <span className="bw-check-icon">{myBreathWork.morning ? '✓' : '○'}</span>
          <span>Morning</span>
        </button>
        <button
          className={`bw-check-btn ${myBreathWork.night ? 'done' : ''}`}
          onClick={() => handleCheck('night')}
        >
          <span className="bw-check-icon">{myBreathWork.night ? '✓' : '○'}</span>
          <span>Night</span>
        </button>
      </div>

      <div className="section-label" style={{ marginTop: '1.25rem' }}>
        Breath Rate {isMonday ? '— measure today!' : '(measure Mondays)'}
      </div>

      {myLatestBPM && (
        <div className="bpm-latest">
          <div className="bpm-val-wrap">
            <span className="bpm-val">{myLatestBPM.value}</span>
            <span className="bpm-unit">BPM</span>
          </div>
          <div className="bpm-goal">
            {myLatestBPM.value <= 6
              ? '✓ In target range (4-6)'
              : myLatestBPM.value <= 8
              ? 'Getting there — target is 4-6'
              : 'Keep working — target is 4-6 BPM'}
          </div>
        </div>
      )}

      {isMonday && (
        <>
          {!showTimer ? (
            <button className="bw-timer-btn" onClick={() => setShowTimer(true)}>
              🕐 Use 60s timer to measure
            </button>
          ) : (
            <Timer />
          )}
          <div className="bpm-input-row">
            <input
              type="number"
              className="bpm-input"
              placeholder="Enter BPM"
              value={bpmInput}
              onChange={e => setBpmInput(e.target.value)}
              min="1"
              max="60"
            />
            <button className="bpm-save-btn" onClick={handleSaveBPM}>Save</button>
          </div>
          {bpmSaved && <div className="confirm-msg">BPM saved! 🌬️</div>}
        </>
      )}
    </div>
  );
}
