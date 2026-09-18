import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging.js";

const API_BASE_URL = "https://abdd-production.up.railway.app";
const FCM_SAVE_PATH = "/auth/fcm-token";

const firebaseConfig = {
  apiKey: "AIzaSyBxuHxhXt3jOpiHttOZsd1y5H3_AiOaEXs",
  authDomain: "abdserver.firebaseapp.com",
  projectId: "abdserver",
  storageBucket: "abdserver.firebasestorage.app",
  messagingSenderId: "1090045428627",
  appId: "1:1090045428627:web:b2aa9de53e9b4d3eda5e66"
};

const VAPID_KEY =
  "BCofxZV5smmcYOqlGyfzkXW7MpYBgEa1hftl6yL4hlgNcugCZgIRtTmt5LCnTZ2IQCe-ADSxV05oQXD_dYZXyYE";

const app = initializeApp(firebaseConfig);

let messaging = null;
let serviceWorkerRegistration = null;
let initialized = false;

function getLoginToken() {
  return localStorage.getItem("token");
}

function getOrCreateDeviceId() {
  const storageKey = "zouzou_fcm_device_id";

  let deviceId = localStorage.getItem(storageKey);

  if (deviceId) {
    return deviceId;
  }

  if (globalThis.crypto?.randomUUID) {
    deviceId = globalThis.crypto.randomUUID();
  } else {
    deviceId =
      `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  localStorage.setItem(storageKey, deviceId);

  return deviceId;
}

function getDeviceName() {
  const platform =
    navigator.userAgentData?.platform ||
    navigator.platform ||
    "Web";

  return `${platform} - ${navigator.userAgent}`;
}

function updateNotificationButton(state, message = "") {
  const button = document.getElementById("notificationButton");

  if (!button) return;

  button.classList.remove(
    "notification-enabled",
    "notification-blocked"
  );

  if (state === "enabled") {
    button.textContent = "🔔";
    button.title = "Notifications enabled";
    button.setAttribute("aria-label", "Notifications enabled");
    button.classList.add("notification-enabled");
    button.disabled = false;
    return;
  }

  if (state === "blocked") {
    button.textContent = "🔕";
    button.title =
      message || "Notifications are blocked in browser settings";
    button.setAttribute(
      "aria-label",
      "Notifications are blocked"
    );
    button.classList.add("notification-blocked");
    button.disabled = false;
    return;
  }

  if (state === "loading") {
    button.textContent = "…";
    button.title = "Enabling notifications...";
    button.disabled = true;
    return;
  }

  button.textContent = "🔔";
  button.title = message || "Enable notifications";
  button.setAttribute("aria-label", "Enable notifications");
  button.disabled = false;
}

async function saveFcmToken(fcmToken) {
  const loginToken = getLoginToken();

  if (!loginToken) {
    return {
      success: false,
      message: "Login token not found"
    };
  }

  const response = await fetch(
    `${API_BASE_URL}${FCM_SAVE_PATH}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${loginToken}`
      },
      body: JSON.stringify({
        fcm_token: fcmToken,
        device_id: getOrCreateDeviceId(),
        device_name: getDeviceName()
      })
    }
  );

  let result = {};

  try {
    result = await response.json();
  } catch (_) {}

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message ||
      result.error ||
      `Failed to save FCM token (${response.status})`
    );
  }

  localStorage.setItem("zouzou_last_fcm_token", fcmToken);

  return result;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker is not supported");
  }

  if (serviceWorkerRegistration) {
    return serviceWorkerRegistration;
  }

  serviceWorkerRegistration =
    await navigator.serviceWorker.register(
      "./firebase-messaging-sw.js"
    );

  return serviceWorkerRegistration;
}

async function ensureFirebaseMessaging() {
  if (initialized) {
    return messaging;
  }

  const supported = await isSupported();

  if (!supported) {
    throw new Error(
      "Firebase notifications are not supported by this browser"
    );
  }

  await registerServiceWorker();

  messaging = getMessaging(app);
  initialized = true;

  onMessage(messaging, async (payload) => {
    console.log("FCM foreground message:", payload);

    if (Notification.permission !== "granted") {
      return;
    }

    const registration =
      serviceWorkerRegistration ||
      await navigator.serviceWorker.ready;

    const title =
      payload.notification?.title ||
      payload.data?.title ||
      "Zouzou";

    const notificationBody =
      payload.notification?.body ||
      payload.data?.body ||
      "";

    await registration.showNotification(
      title,
      {
        body: notificationBody,
        data: payload.data || {},
        tag:
          payload.data?.notification_id ||
          payload.data?.order_id ||
          undefined
      }
    );
  });

  return messaging;
}

async function syncFcmToken({
  requestPermission = false
} = {}) {
  const loginToken = getLoginToken();

  if (!loginToken) {
    updateNotificationButton(
      "idle",
      "Login first to enable notifications"
    );

    return {
      success: false,
      message: "Login token not found"
    };
  }

  if (!("Notification" in window)) {
    updateNotificationButton(
      "blocked",
      "Notifications are not supported by this browser"
    );

    return {
      success: false,
      message: "Notifications are not supported"
    };
  }

  if (
    Notification.permission === "default" &&
    requestPermission
  ) {
    const permission =
      await Notification.requestPermission();

    if (permission !== "granted") {
      updateNotificationButton(
        "blocked",
        "Notification permission was not granted"
      );

      return {
        success: false,
        message: "Notification permission was not granted"
      };
    }
  }

  if (Notification.permission === "denied") {
    updateNotificationButton(
      "blocked",
      "Enable notifications from your browser site settings"
    );

    return {
      success: false,
      message: "Notification permission is denied"
    };
  }

  if (Notification.permission !== "granted") {
    updateNotificationButton("idle");

    return {
      success: false,
      message: "Notification permission is not granted"
    };
  }

  const currentMessaging =
    await ensureFirebaseMessaging();

  const registration =
    await registerServiceWorker();

  const fcmToken =
    await getToken(
      currentMessaging,
      {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      }
    );

  if (!fcmToken) {
    throw new Error("Firebase did not return an FCM token");
  }

  const saveResult =
    await saveFcmToken(fcmToken);

  updateNotificationButton("enabled");

  return {
    success: true,
    fcm_token: fcmToken,
    save_result: saveResult
  };
}

window.enableZouzouNotifications = async () => {
  updateNotificationButton("loading");

  try {
    const result =
      await syncFcmToken({
        requestPermission: true
      });

    console.log(
      "Notification setup result:",
      result
    );

    return result;
  } catch (error) {
    console.error(
      "Notification setup error:",
      error
    );

    updateNotificationButton(
      "idle",
      error.message || "Unable to enable notifications"
    );

    return {
      success: false,
      message:
        error.message ||
        "Unable to enable notifications"
    };
  }
};

async function initializeNotificationClient() {
  const button =
    document.getElementById("notificationButton");

  if (button) {
    button.addEventListener(
      "click",
      () => window.enableZouzouNotifications()
    );
  }

  if (!getLoginToken()) {
    return;
  }

  if (
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      await syncFcmToken({
        requestPermission: false
      });
    } catch (error) {
      console.error(
        "FCM automatic sync error:",
        error
      );

      updateNotificationButton(
        "idle",
        "Tap to reconnect notifications"
      );
    }

    return;
  }

  if (
    "Notification" in window &&
    Notification.permission === "denied"
  ) {
    updateNotificationButton(
      "blocked",
      "Enable notifications from your browser site settings"
    );
  } else {
    updateNotificationButton("idle");
  }
}

initializeNotificationClient();
