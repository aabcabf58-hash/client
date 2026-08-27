importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBxuHxhXt3jOpiHttOZsd1y5H3_AiOaEXs",
  authDomain: "abdserver.firebaseapp.com",
  projectId: "abdserver",
  storageBucket: "abdserver.firebasestorage.app",
  messagingSenderId: "1090045428627",
  appId: "1:1090045428627:web:b2aa9de53e9b4d3eda5e66"
});

firebase.messaging();

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const notificationData =
      event.notification?.data || {};

    const fcmData =
      notificationData.FCM_MSG?.data || {};

    const fcmOptions =
      notificationData.FCM_MSG?.fcmOptions || {};

    const target =
      notificationData.url ||
      notificationData.link ||
      fcmData.url ||
      fcmData.link ||
      fcmOptions.link ||
      "./home.html";

    const targetUrl =
      new URL(target, self.location.origin).href;

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then((clientList) => {
          for (const client of clientList) {
            if (
              "focus" in client &&
              client.url.startsWith(
                self.location.origin
              )
            ) {
              if ("navigate" in client) {
                return client
                  .navigate(targetUrl)
                  .then(() => client.focus());
              }

              return client.focus();
            }
          }

          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }

          return undefined;
        })
    );
  }
);
