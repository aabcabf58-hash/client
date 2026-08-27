CUSTOMER SITE — LIGHT / DARK THEME

Files:
- login.html
- otp-login.html
- register.html
- home.html
- categories.html
- childcategories.html
- activity.html
- auth.css
- site.css
- theme.css
- theme.js

Theme behaviour:
- The round button at the bottom-right switches light/dark mode.
- The choice is saved in localStorage under customer_theme.
- The same choice is used across every page.
- On first use, the website follows the device theme.

The API logic and endpoints were not changed.


FCM WEB NOTIFICATIONS
---------------------
Firebase project: abdserver

New files:
- firebase-notifications.js
- firebase-messaging-sw.js

Server endpoint used by the client:
PUT /auth/fcm-token
Authorization: Bearer <login token>
JSON body:
{
  "fcm_token": "...",
  "device_id": "...",
  "device_name": "..."
}

The Home page now contains a bell button.
The browser asks for notification permission only after the user presses the bell.
If permission is already granted, authenticated pages automatically re-sync the FCM token.

Important:
- Production must be served over HTTPS.
- firebase-messaging-sw.js must stay in the same public root as home.html.
- The Firebase web config and VAPID public key are public client configuration.
- Never place the Firebase Admin private key or service-account JSON in this public folder.
