import { PushNotifications } from '@capacitor/push-notifications';

export async function registerPush() {
    // Request permission
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive !== 'granted') {
        permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
        console.warn('Push notification permission not granted');
        return;
    }

    // Register for push
    await PushNotifications.register();

    // Get FCM token
    PushNotifications.addListener('registration', (token) => {
        console.log('FCM Token:', token.value);
        // Send token to your backend to store for sending pushes later
    });

    PushNotifications.addListener('registrationError', (err) => {
        console.error('Push registration error:', err);
    });

    // Listen for pushes while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notif) => {
        console.log('Push received:', notif);
    });

    // Listen for action when notification tapped
    PushNotifications.addListener('pushNotificationActionPerformed', (notif) => {
        console.log('Push action performed:', notif);
    });
}
