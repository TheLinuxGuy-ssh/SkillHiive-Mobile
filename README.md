# SkillHive Mobile

> The mobile app for SkillHive — A learning and community platform built for people who want to connect, collaborate, and grow together.

Built with **React Native + Expo**, backed by a **self-hosted Supabase** instance. Currently in active development with a focus on shipping community features first.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.83 + Expo SDK 55 |
| Language | TypeScript |
| Routing | Expo Router (file-based) |
| Backend | Supabase (self-hosted) — auth, database, storage, realtime |
| State Management | Zustand + TanStack React Query |
| Video/Audio | LiveKit (`@livekit/react-native`) |
| UI | Expo UI, Lucide icons, React Native Reanimated, Gesture Handler |
| Build | EAS Build |

---

## Project Structure

```
SkillHive-Mobile/
├── app/              # Expo Router file-based routes (screens & layouts)
├── components/       # Reusable UI components
├── constants/        # App-wide constants (colors, config, etc.)
├── hooks/            # Custom React hooks
├── lib/              # Supabase client, LiveKit setup, and other integrations
├── types/            # TypeScript type definitions
├── utils/            # Helper/utility functions
└── assets/           # Images, fonts, and static assets
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A running Supabase instance (self-hosted or cloud)
- For native builds: Android Studio / Xcode

### Installation

```bash
git clone https://github.com/TheLinuxGuy-ssh/SkillHive-Mobile.git
cd SkillHive-Mobile
npm install
```

### Environment Setup

Create a `.env` file at the root (or use Expo's `app.config.js` approach) and set your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-instance.example.com
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> If you're running a self-hosted Supabase instance, make sure the URL points to your reverse proxy endpoint with a valid SSL certificate.

### Running the App

```bash
# Start the Expo dev server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

For the best development experience, use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) rather than Expo Go — the app uses native modules (LiveKit, WebRTC, camera) that aren't supported in Expo Go.

---

## Features (Current)

- **Authentication** — Email/password auth via Supabase, persisted with Expo Secure Store
- **User Profiles** — View and edit profiles, upload profile photos to Supabase Storage
- **Public Profile Viewing** — Browse other users' public profiles
- **Community Feed** — Global post feed with support for project, media, and offer post types
- **Post Composer** — Create posts via a bottom sheet composer
- **Ally System** — Send, accept, and decline ally/alliance requests (`pending / accepted / declined`)
- **Notifications** — In-app notifications screen with a realtime bell indicator in the header
- **LiveKit Video** — Real-time video/audio sessions powered by self-hosted LiveKit

---

## Building for Production

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) for production builds.

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure your project (first time)
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

Build profiles are defined in `eas.json`.

---

## Self-Hosted Infrastructure

SkillHive runs entirely on self-hosted infrastructure:

- **Supabase** — Containerized via Docker, exposed through an Nginx reverse proxy with SSL
- **LiveKit** — Multi-worker nodes with Redis-backed coordination and a load-balanced signalling server
- **Storage** — Supabase Storage for user media (profile images, post attachments)

---

## Roadmap

- [ ] Skills & learning content (courses, resources)
- [ ] Direct messaging
- [ ] Skill endorsements & verification
- [ ] Push notifications
- [ ] App Store / Play Store release

---

## License

Copyright © 2026 SkillHive. Source available under the
[PolyForm Noncommercial License 1.0](https://polyformproject.org/licenses/noncommercial/1.0.0).
Free to view and learn from. Commercial use is not permitted.