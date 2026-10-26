# LumaChat Premium

LumaChat is a premium offline-first messaging app built with React Native + Expo. It supports phone-number login, encrypted local storage, contact management, and an offline messaging flow designed for premium user experience.

## Features

- Phone-number login with OTP-style demo verification
- Offline message storage using secure local persistence
- Contact management panel
- Premium dark UI design
- Push notification setup for real devices
- Backend-ready sync layer for future server integration
- Works in Expo web and mobile environments

## Live Demo

Open the app in a browser using Expo Web:

- Start the app: `npx expo start --web`
- Open the local Expo URL in your browser

## Download the Project

You can download the repository source code from GitHub:

- GitHub repository: https://github.com/rudraray15/premium-offline-chat
- Download ZIP: https://github.com/rudraray15/premium-offline-chat/archive/refs/heads/main.zip

## Installation

### 1. Prerequisites

Install the following:

- Node.js 18 or later
- npm or yarn
- Expo CLI (installed automatically with `npx`)

### 2. Clone the repository

```bash
git clone https://github.com/rudraray15/premium-offline-chat.git
cd premium-offline-chat
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the app locally

#### Run in web browser

```bash
npx expo start --web
```

Then open the generated local URL in your browser, usually:

- http://localhost:8081

#### Run on Android/iOS emulator or device

```bash
npx expo start
```

Then:

- press `a` for Android emulator
- press `i` for iOS simulator
- scan the QR code with the Expo Go app on your phone

## Project Structure

```text
premium-offline-chat/
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
├── src/
│   ├── services/
│   │   ├── notifications.ts
│   │   ├── storage.ts
│   │   └── sync.ts
│   ├── types.ts
│   └── ...
├── README.md
└── .gitignore
```

## OTP Login Demo

The login flow includes a simulated OTP process for local development. The app generates a 6-digit demo code and shows it in the UI so you can test the login flow without a real backend.

## Push Notifications

Push notifications are wired for real devices and gracefully fall back to simulation mode in emulators or browser environments.

## Sync Layer

The app includes a backend-ready sync service in `src/services/sync.ts`. It prepares payloads for future backend integration while keeping the app fully usable offline.

## Security Notes

- Messages are stored locally in encrypted form using AES encryption and secure storage.
- This app is designed as a premium offline-first prototype.
- For production deployment, connect it to a real backend, SMS OTP provider, and secure sync API.

## License

MIT

## Author

Rudra Ray
