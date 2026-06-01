importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAa2yIei4ry-z09C8fiQy-qaLFGkOAJiDI",
  authDomain: "push-up-challenge-11.firebaseapp.com",
  databaseURL: "https://push-up-challenge-11-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "push-up-challenge-11",
  storageBucket: "push-up-challenge-11.firebasestorage.app",
  messagingSenderId: "495438972281",
  appId: "1:495438972281:web:e68c3b8e2dbfcfae781ba8",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: 'https://uppush.netlify.app' },
  });
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'));
});

// Cache for offline
const CACHE = 'pushup-v2';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request)
    )
  );
});
