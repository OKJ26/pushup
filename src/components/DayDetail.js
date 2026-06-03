import React, { useEffect } from 'react';

export default function DayDetail({ day, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!day) return null;

  const date = new Date(day.key + 'T00:00:00');
  const formatted = date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });

  const sets = day.sets || [];
  const totalReps = sets.reduce((s, x) => s + (x.reps || 0), 0);
  const bw = day.breathwork || {};

  return (
    <div className="day-detail-overlay" onClick={onClose}>
      <div className="day-detail-sheet" onClick={e => e.stopPropagation()}>
        <div className="day-detail-handle" />
        <div className="day-detail-date">{formatted}</div>

        {totalReps > 0 ? (
          <>
            <div className="section-label" style={{ marginTop: '0.75rem' }}>Pushups</div>
            {sets.map((s, i) => (
              <div key={i} className="set-row">
                <span className="set-num">Set {i + 1}</span>
                <span className="set-reps">{s.reps} reps</span>
                <div className="set-actions" />
              </div>
            ))}
            <div className="set-row total">
              <span className="set-num">Total</span>
              <span className="set-reps">{totalReps} reps</span>
              <div className="set-actions" />
            </div>
          </>
        ) : (
          <div className="day-detail-empty">No pushups logged</div>
        )}

        <div className="section-label" style={{ marginTop: '1rem' }}>Breath Work</div>
        <div className="bw-checks" style={{ marginBottom: 0 }}>
          <div className={`bw-check-btn ${bw.morning ? 'done' : ''}`} style={{ cursor: 'default' }}>
            <span className="bw-check-icon">{bw.morning ? '✓' : '○'}</span>
            <span>Morning</span>
          </div>
          <div className={`bw-check-btn ${bw.night ? 'done' : ''}`} style={{ cursor: 'default' }}>
            <span className="bw-check-icon">{bw.night ? '✓' : '○'}</span>
            <span>Night</span>
          </div>
        </div>

        <button className="day-detail-close" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
