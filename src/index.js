import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {

    const showBanner = () => {
      const banner = document.getElementById('update-banner');
      if (banner) banner.classList.add('visible');
    };

    // Show banner if a new SW is already waiting on load
    if (reg.waiting) showBanner();

    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          showBanner();
        }
      });
    });

  }).catch(err => console.log('SW failed:', err));

  // Reload when new SW takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) { refreshing = true; window.location.reload(); }
  });
}
