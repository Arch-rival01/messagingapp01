// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
  apiKey: "AIzaSyB4kfctGSEimVFwVe46zSfgxhTcVPPDxro",
  authDomain: "messaging-app-mern-98ec0.firebaseapp.com",
  projectId: "messaging-app-mern-98ec0",
  storageBucket: "messaging-app-mern-98ec0.firebasestorage.app",
  messagingSenderId: "24814041783",
  appId: "1:24814041783:web:b0acae3f55ff4a5392eb32",
  measurementId: "G-3H0XMBEQ9T"
};

firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
