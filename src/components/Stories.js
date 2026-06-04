import React, { useState, useEffect, useRef } from 'react';
import { ref as dbRef, onValue, push, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';

const STORY_TTL = 24 * 60 * 60 * 1000; // 24 hours

const PLAYER_PHOTOS = {
  jeremy: '/jeremy.jpg',
  grant: '/grant.jpg',
  henry: '/henry.jpg',
};

function isExpired(ts) {
  return Date.now() - ts > STORY_TTL;
}

// Story ring around avatar
export function StoryRing({ playerId, playerName, onView, onAdd, isMe, myStory, theirStory }) {
  const hasStory = theirStory && !isExpired(theirStory.timestamp);
  const myHasStory = myStory && !isExpired(myStory.timestamp);
  const photo = localStorage.getItem(`photo-${playerId}`) || PLAYER_PHOTOS[playerId];

  return (
    <div className="story-ring-wrap" onClick={() => hasStory ? onView(playerId) : isMe ? onAdd() : null}>
      <div className={`story-ring ${hasStory ? 'has-story' : myHasStory && isMe ? 'my-story' : 'no-story'}`}>
        <img src={photo} alt={playerName} className="story-avatar" onError={e => e.target.style.display='none'} />
        {isMe && !myHasStory && (
          <div className="story-add-btn">+</div>
        )}
      </div>
      <div className="story-name">{playerName}</div>
    </div>
  );
}

// Story viewer
function StoryViewer({ story, playerName, playerId, onClose }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const remaining = STORY_TTL - (Date.now() - story.timestamp);
      if (remaining <= 0) { onClose(); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [story, onClose]);

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div className="story-viewer" onClick={e => e.stopPropagation()}>
        <div className="story-viewer-header">
          <img
            src={localStorage.getItem(`photo-${playerId}`) || PLAYER_PHOTOS[playerId]}
            alt={playerName}
            className="story-viewer-avatar"
          />
          <div className="story-viewer-meta">
            <div className="story-viewer-name">{playerName}</div>
            <div className="story-viewer-time">Expires in {timeLeft}</div>
          </div>
          <button className="story-viewer-close" onClick={onClose}>✕</button>
        </div>

        {story.type === 'video' ? (
          <video
            className="story-media"
            src={story.url}
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img className="story-media" src={story.url} alt="Story" />
        )}

        {story.text && (
          <div className="story-text-overlay">{story.text}</div>
        )}
      </div>
    </div>
  );
}

// Story creator
function StoryCreator({ playerId, onClose, onPosted }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setIsVideo(f.type.startsWith('video'));
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handlePost = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `stories/${playerId}/${Date.now()}.${ext}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);

      // Save story metadata to Firebase
      await push(dbRef(db, `stories/${playerId}`), {
        url,
        path,
        text: text.trim(),
        type: isVideo ? 'video' : 'image',
        timestamp: Date.now(),
      });

      onPosted();
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed. Try a smaller file.');
    }
    setUploading(false);
  };

  return (
    <div className="story-viewer-overlay">
      <div className="story-creator">
        <div className="story-creator-header">
          <span className="story-creator-title">Add Story</span>
          <button className="story-viewer-close" onClick={onClose}>✕</button>
        </div>

        {!preview ? (
          <div className="story-pick-area" onClick={() => fileRef.current.click()}>
            <div className="story-pick-icon">📷</div>
            <div className="story-pick-text">Tap to take photo or choose from gallery</div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              className="photo-upload-input"
              onChange={handleFile}
            />
          </div>
        ) : (
          <>
            {isVideo ? (
              <video className="story-media" src={preview} controls playsInline />
            ) : (
              <img className="story-media" src={preview} alt="Preview" />
            )}
            <input
              className="story-text-input"
              placeholder="Add a caption... (optional)"
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={100}
            />
            <div className="story-creator-actions">
              <button className="story-retake-btn" onClick={() => { setPreview(null); setFile(null); }}>
                Retake
              </button>
              <button className="story-post-btn" onClick={handlePost} disabled={uploading}>
                {uploading ? 'Posting...' : 'Post Story'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Main Stories bar
export default function StoriesBar({ playerId }) {
  const [stories, setStories] = useState({});
  const [viewing, setViewing] = useState(null);
  const [creating, setCreating] = useState(false);

  const PLAYERS = ['jeremy', 'grant', 'henry'];
  const NAMES = { jeremy: 'Jeremy', grant: 'Grant', henry: 'Henry' };

  useEffect(() => {
    const unsub = onValue(dbRef(db, 'stories'), async (snap) => {
      const val = snap.val() || {};
      // Clean up expired stories
      const cleaned = {};
      for (const [pid, playerStories] of Object.entries(val)) {
        const active = {};
        for (const [sid, story] of Object.entries(playerStories)) {
          if (isExpired(story.timestamp)) {
            // Delete expired story from storage and db
            try {
              if (story.path) {
                const sRef = storageRef(storage, story.path);
                await deleteObject(sRef).catch(() => {});
              }
              await remove(dbRef(db, `stories/${pid}/${sid}`)).catch(() => {});
            } catch (e) {}
          } else {
            active[sid] = story;
          }
        }
        if (Object.keys(active).length > 0) cleaned[pid] = active;
      }
      setStories(cleaned);
    });
    return () => unsub();
  }, []);

  const getLatestStory = (pid) => {
    const ps = stories[pid];
    if (!ps) return null;
    const entries = Object.values(ps).filter(s => !isExpired(s.timestamp));
    if (!entries.length) return null;
    return entries.sort((a, b) => b.timestamp - a.timestamp)[0];
  };

  return (
    <>
      <div className="stories-bar">
        {PLAYERS.map(pid => (
          <StoryRing
            key={pid}
            playerId={pid}
            playerName={NAMES[pid]}
            isMe={pid === playerId}
            myStory={getLatestStory(playerId)}
            theirStory={getLatestStory(pid)}
            onView={(id) => setViewing(id)}
            onAdd={() => setCreating(true)}
          />
        ))}
      </div>

      {viewing && (
        <StoryViewer
          story={getLatestStory(viewing)}
          playerName={NAMES[viewing]}
          playerId={viewing}
          onClose={() => setViewing(null)}
        />
      )}

      {creating && (
        <StoryCreator
          playerId={playerId}
          onClose={() => setCreating(false)}
          onPosted={() => {}}
        />
      )}
    </>
  );
}
