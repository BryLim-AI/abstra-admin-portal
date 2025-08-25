importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDr1D8s5pCeD7PHNv1TsDV5dx_GaNcI_PI",
    authDomain: "hestia-c0294.firebaseapp.com",
    projectId: "hestia-c0294",
    storageBucket: "hestia-c0294.firebasestorage.app",
    messagingSenderId: "81240939214",
    appId: "1:81240939214:web:1c6be5442d07f47f034e9f",
    measurementId: "G-FTP8C7GG2N"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('Received background message ', payload);

    const notificationTitle = payload.notification?.title || "New Notification";
    const notificationOptions = {
        body: payload.notification?.body || "You have a new message",
        icon: '/icon.png', // optional: add your app icon here
        data: {
            url: payload.notification?.click_action || '/' // default to homepage
        }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const clickUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(windowClients => {
            // Focus an open window if one exists
            for (let client of windowClients) {
                if (client.url === clickUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window
            if (clients.openWindow) {
                return clients.openWindow(clickUrl);
            }
        })
    );
});