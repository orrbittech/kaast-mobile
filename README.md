# KAAST Mobile

iOS and Android controller app for **KAAST** — manage devices, media, and playlists across store locations.

Built by **Brandon Nkawu** for [Orrbit Systems](https://www.orrbit.co.za/). Proprietary product — see [LICENSE](./LICENSE).

## Stack

- Expo 56 + Expo Router
- Clerk (`@clerk/clerk-expo`)
- React Query + NativeWind

## Setup

```bash
yarn install
cp .env.example .env
yarn start
```

## Features

- Organization-scoped device pairing and control
- Media library with GCS direct upload (image, video, audio)
- Trial/subscription gate via Clerk Billing
- Data export and account deletion (Settings)

## Legal

- Privacy: https://kaast.app/privacy
- Terms: https://kaast.app/terms
