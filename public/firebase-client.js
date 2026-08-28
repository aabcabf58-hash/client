/*
  Firebase Web Push helper
  - Requests notification permission from a user action.
  - Gets the real FCM registration token.
  - Saves it to the server after authentication succeeds.
*/

const ZOUZOU_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBxuHxhXt3jOpiHttOZsd1y5H3_AiOaEXs",
  authDomain: "abdserver.firebaseapp.com",
  projectId: "abdserver",
  storageBucket: "abdserver.firebasestorage.app",
  messagingSenderId: "1090045428627",
  appId: "1:1090045428627:web:b2aa9de53e9b4d3eda5e66"
};

const ZOUZOU_VAPID_KEY =
  "BCofxZV5smmcYOqlGyfzkXW7MpYBgEa1hftl6yL4hlgNcugCZgIRtTmt5LCnTZ2IQCe-ADSxV05oQXD_dYZXyYE";

const ZOUZOU_FCM_TOKEN_ENDPOINT =
  "https://abdd-production.up.railway.app/auth/fcm-token";

if (!firebase.apps.length) {
  firebase.initializeApp(ZOUZOU_FIREBASE_CONFIG);
}

const zouzouMessaging = firebase.messaging();

async function prepareFcmPermission() {
  try {
    if (!("Notification" in window)) {
      console.warn("Notifications are not supported by this browser.");
      return false;
    }

    if (!("serviceWorker" in navigator)) {
      console.warn("Service workers are not supported by this browser.");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Notification permission error:", error);
    return false;
  }
}

function getOrCreateFcmDeviceId() {
  let deviceId = localStorage.getItem("fcm_device_id");

  if (!deviceId) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      deviceId = window.crypto.randomUUID();
    } else {
      deviceId =
        "web-" +
        Date.now() +
        "-" +
        Math.random().toString(36).slice(2);
    }

    localStorage.setItem("fcm_device_id", deviceId);
  }

  return deviceId;
}

function getFcmDeviceName() {
  const platform =
    navigator.userAgentData?.platform ||
    navigator.platform ||
    "Web";

  return `${platform} - ${navigator.userAgent}`;
}

async function saveFcmTokenAfterAuth(authToken, permissionPromise = null) {
  try {
    if (!authToken) {
      console.warn("FCM: login token is missing.");
      return {
        success: false,
        message: "Login token is missing"
      };
    }

    const permissionGranted = permissionPromise
      ? await permissionPromise
      : await prepareFcmPermission();

    if (!permissionGranted) {
      console.log("FCM: notification permission was not granted.");
      return {
        success: false,
        message: "Notification permission was not granted"
      };
    }

    const registration =
      await navigator.serviceWorker.register(
        "./firebase-messaging-sw.js"
      );

    const fcmToken =
      await zouzouMessaging.getToken({
        vapidKey: ZOUZOU_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

    if (!fcmToken) {
      console.warn("FCM: Firebase did not return a registration token.");
      return {
        success: false,
        message: "FCM token was not returned"
      };
    }

    const response = await fetch(
      ZOUZOU_FCM_TOKEN_ENDPOINT,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          fcm_token: fcmToken,
          device_id: getOrCreateFcmDeviceId(),
          device_name: getFcmDeviceName()
        })
      }
    );

    let data = {};
    try {
      data = await response.json();
    } catch (_) {}

    if (!response.ok || data.success === false) {
      throw new Error(
        data.message ||
        `Failed to save FCM token (${response.status})`
      );
    }

    console.log(
      "FCM token saved:",
      String(fcmToken).slice(0, 18) + "...",
      "length:",
      String(fcmToken).length
    );

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error("saveFcmTokenAfterAuth error:", error);

    return {
      success: false,
      message: error.message
    };
  }
}
