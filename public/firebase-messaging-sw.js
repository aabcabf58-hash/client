importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js"
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
