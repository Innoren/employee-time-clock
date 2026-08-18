# Time Clock

Phone-first employee time clock for **Complete Doors and Hardware**. Staff use their own iPhone or Android. Managers create accounts under the business domain. Punch times are recorded on the server.

The **iOS and Android apps** are Capacitor shells around this Next.js app. They exist so GPS can stay on after the phone is locked, until the employee clocks out.

## Company

Seed creates these accounts. Everyone signs in with starter PIN **1234**, then must set a new PIN before using the app.

| Role | Name | Email |
| --- | --- | --- |
| Owner (admin) | Bobby | bobby@completedoorsandhardware.com |
| COO (admin) | Jessie | jessie@completedoorsandhardware.com |
| Payroll Specialist (admin) | Aaliyah Conforme | aaliyah.conforme@completedoorsandhardware.com |

Bobby, Jessie, and Aaliyah all have full admin access: live floor, timesheets, team, and worksite. New staff also start with PIN 1234 and change it on first sign-in.

## Local web

```bash
npm install
npx dotenv -e .env.local -- drizzle-kit push
npm run db:seed
npm run dev
```

## Native iOS and Android

The native projects live in `ios/` and `android/`. They load the live Next.js app (local or production) and use native background location.

1. Start the web app (`npm run dev`) or set `CAPACITOR_SERVER_URL` / `NEXT_PUBLIC_APP_URL` to the HTTPS site.
2. Sync native projects:

```bash
npx cap sync
```

3. Open the store IDEs:

```bash
npm run cap:ios       # Xcode — needs an Apple Developer account to ship
npm run cap:android   # Android Studio — needs a Google Play Console account to ship
```

### Device testing

- **iOS Simulator:** `CAPACITOR_SERVER_URL=http://localhost:3000 npx cap sync` then run from Xcode. Grant **Always** location.
- **Android emulator:** `CAPACITOR_SERVER_URL=http://10.0.2.2:3000 npx cap sync`.
- **Physical phone:** use your Mac's LAN IP, e.g. `CAPACITOR_SERVER_URL=http://192.168.1.20:3000 npx cap sync`. The phone and Mac must be on the same Wi-Fi.

Store builds must point at HTTPS (`NEXT_PUBLIC_APP_URL`). Apple and Google will reject a listing that only loads localhost.

### Store submission

See [PUBLISHING.md](PUBLISHING.md) for the App Store and Google Play checklist.

You still need:

- Apple Developer Program and App Store Connect listing (bundle ID `com.sinclairatelier.timeclock`)
- Google Play Console listing (application ID `com.sinclairatelier.timeclock`)
- Privacy policy URL: `/privacy`
- App Store location purpose: GPS while clocked in, including background, to confirm the employee is at the worksite
- Play Console: declare background location and show the in-app disclosure before requesting **Allow all the time**

This repo does not upload binaries to the stores. Archive in Xcode / generate a signed AAB in Android Studio after those accounts are in place.
