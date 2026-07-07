importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDaWAOPDZeATTSL7kQ-CDkbFstyvpTMkNM",
    authDomain: "hr-poc-cdec5.firebaseapp.com",
    projectId: "hr-poc-cdec5",
    storageBucket: "hr-poc-cdec5.appspot.com",
    messagingSenderId: "348496003604",
    appId: "1:348496003604:web:5cb59a6f7851c5d0279d01",
    measurementId: "G-D9B88Z16TC"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'Notification';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/icons/icon-192.png', // PWA brand icon (was /vite.svg)
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // Always navigate to dashboard based on role or data, defaulting to root
    const urlToOpen = new URL(event.notification.data?.click_action || '/', self.location.origin).href;

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        let matchingClient = null;
        for (let i = 0; i < windowClients.length; i++) {
            const windowClient = windowClients[i];
            if (windowClient.url === urlToOpen) {
                matchingClient = windowClient;
                break;
            }
        }
        if (matchingClient) {
            return matchingClient.focus();
        } else {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});
