import React, { useState, useEffect, useRef } from 'react';
import { ref, push, onValue, serverTimestamp, set, remove } from 'firebase/database';
import { db } from '../firebase';

export default function ChatTab({ playerId, myPlayer, otherPlayer }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(null); // { id, text }
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [menuFor, setMenuFor] = useState(null); // message id showing menu
  const bottomRef = useRef(null);

  useEffect(() => {
    const chatRef = ref(db, 'chat');
    const unsub = onValue(chatRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) return setMessages([]);
      const msgs = Object.entries(val)
        .map(([id, m]) => ({ id, ...m }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(msgs);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    await push(ref(db, 'chat'), {
      text,
      sender: playerId,
      name: myPlayer.name,
      timestamp: serverTimestamp(),
    });
    setSending(false);
  };

  const saveEdit = async () => {
    if (!editing || !editing.text.trim()) return;
    await set(ref(db, `chat/${editing.id}/text`), editing.text.trim());
    await set(ref(db, `chat/${editing.id}/edited`), true);
    setEditing(null);
  };

  const deleteMessage = async (id) => {
    await remove(ref(db, `chat/${id}`));
    setMenuFor(null);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleLongPressStart = (msg) => {
    if (msg.sender !== playerId) return;
    const timer = setTimeout(() => {
      setMenuFor(msg.id);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });
  };

  const getPhoto = (sender) => {
    return localStorage.getItem(`photo-${sender}`) ||
      (sender === 'jeremy' ? '/jeremy.jpg' : sender === 'grant' ? '/grant.jpg' : '/henry.jpg');
  };

  const grouped = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const dateStr = formatDate(msg.timestamp);
    if (dateStr !== lastDate) {
      grouped.push({ type: 'date', label: dateStr, id: `date-${msg.id}` });
      lastDate = dateStr;
    }
    grouped.push({ type: 'msg', ...msg });
  });

  return (
    <div className="chat-wrap">
      {menuFor && <div className="chat-menu-overlay" onClick={() => setMenuFor(null)} />}

      <div className="chat-messages">
        {grouped.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <div className="chat-empty-text">No messages yet</div>
            <div className="chat-empty-sub">Send some trash talk</div>
          </div>
        )}
        {grouped.map((item) =>
          item.type === 'date' ? (
            <div key={item.id} className="chat-date-divider">{item.label}</div>
          ) : (
            <div key={item.id} className={`chat-bubble-wrap ${item.sender === playerId ? 'mine' : 'theirs'}`}>
              {item.sender !== playerId && (
                <img src={getPhoto(item.sender)} alt={item.name} className="chat-avatar" />
              )}
              <div className="chat-bubble-inner">
                {item.sender !== playerId && (
                  <div className="chat-sender-name">{item.name}</div>
                )}
                <div
                  className={`chat-bubble ${item.sender === playerId ? 'mine' : 'theirs'}`}
                  onTouchStart={() => handleLongPressStart(item)}
                  onTouchEnd={handleLongPressEnd}
                  onMouseDown={() => handleLongPressStart(item)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                >
                  {editing?.id === item.id ? (
                    <div className="chat-edit-wrap">
                      <input
                        className="chat-edit-input"
                        value={editing.text}
                        onChange={e => setEditing({ ...editing, text: e.target.value })}
                        autoFocus
                      />
                      <div className="chat-edit-actions">
                        <button className="chat-edit-cancel" onClick={() => setEditing(null)}>Cancel</button>
                        <button className="chat-edit-save" onClick={saveEdit}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="chat-text">{item.text}{item.edited && <span className="chat-edited"> (edited)</span>}</div>
                      <div className="chat-time">{formatTime(item.timestamp)}</div>
                    </>
                  )}
                </div>

                {/* Long press menu */}
                {menuFor === item.id && item.sender === playerId && (
                  <div className="chat-context-menu">
                    <button onClick={() => { setEditing({ id: item.id, text: item.text }); setMenuFor(null); }}>✏️ Edit</button>
                    <button onClick={() => deleteMessage(item.id)}>🗑️ Delete</button>
                    <button onClick={() => setMenuFor(null)}>Cancel</button>
                  </div>
                )}
              </div>
              {item.sender === playerId && (
                <img src={getPhoto(item.sender)} alt={item.name} className="chat-avatar" />
              )}
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <input
          className="chat-input"
          type="text"
          placeholder="Message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className="chat-send-btn" onClick={sendMessage} disabled={!input.trim() || sending}>
          ➤
        </button>
      </div>
    </div>
  );
}
