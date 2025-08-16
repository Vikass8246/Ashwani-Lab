
// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// See firebase.ts for initialization values
const firebaseConfig = {
    apiKey: "AIzaSyBRmIBHcS6ZqxRz8fg1pi54bD66FsoGySc",
    authDomain: "ashwani-diagnostic-cente-d2aei.web.app",
    projectId: "ashwani-diagnostic-cente-d2aei",
    storageBucket: "ashwani-diagnostic-cente-d2aei.appspot.com",
    messagingSenderId: "692460395301",
    appId: "1:692460395301:web:b524974e72df7c144058cc",
    measurementId: "G-5YEV8TRC9B"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
