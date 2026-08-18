# XGoo Customer Mobile

Expo React Native app for XGoo customers to register, book parcels, manage saved
addresses, and track every movement. It supports Android, iOS, and light/dark mode.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`.
3. Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_OFFICE_SLUG`.
4. Start the XGoo backend from the repository root: `npm run dev`
5. Start Expo from this folder: `npm start`

Use `http://10.0.2.2:3000` for the Android emulator, `http://localhost:3000`
for the iOS simulator, or your computer's LAN IP for Expo Go on a physical device.

## Booking maps

The booking flow uses OpenStreetMap by default. To use Google Maps, enable Maps
SDK for Android, Maps SDK for iOS, and Geocoding API in Google Cloud, then set
`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`. Native map configuration is applied by
`app.config.ts`, so changing the key requires a new native build.

For EAS preview builds, add the key to the preview environment before building:

`npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

## Validation

Run `npx tsc --noEmit` and `npm run lint`.

Customer sessions use `x-customer-token`, stored securely with Expo SecureStore
on native devices. Booking, profile, saved-address, and tracking data comes from
the existing XGoo SaaS API. The mobile app and Staff Portal must use the same
API URL and database for submitted bookings to appear in the portal.

