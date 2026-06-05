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

    // If there's already a waiting worker on load, show banner immediately
    if (reg.waiting) {
      showBanner();
    }

    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          showBanner();
        }
      });
    });

  }).catch(err => console.log('SW failed:', err));

  // When controller changes (new SW took over), reload
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}
