# XGoo Pro

Native store app for XGoo Pro — the same module as the website workspace at `/book?account=pro`.

## Run locally

```bash
cd mobile-pro
npm install
npx expo start
```

Point the API at a running XGoo server:

```
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3000
EXPO_PUBLIC_OFFICE_SLUG=demo-office
```

Optional Google sign-in (same web client ID as the website):

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=....apps.googleusercontent.com
```

## Store listings

- Android package: `com.xgoo.pro`
- iOS bundle: `com.xgoo.pro`
- Play Store and App Store listings are separate from XGoo Go.

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build -p android --profile preview
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest submit -p android
npx eas-cli@latest submit -p ios
```
