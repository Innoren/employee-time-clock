# Publishing Time Clock to the App Store and Google Play

The iPhone and Android apps are Capacitor shells. They load your live Next.js site and use native GPS so tracking can continue after the phone is locked. Shipping a new GPS rule later is usually a **web deploy**, not a store resubmit, unless you change plugins or permissions.

Bundle / application ID: `com.sinclairatelier.timeclock`

## Before you start

You need all of these:

1. A public **HTTPS** URL for the app (Vercel production). Localhost will be rejected.
2. `NEXT_PUBLIC_APP_URL` set to that URL (and `CAPACITOR_SERVER_URL` if you want to override it).
3. The privacy policy live at `https://employee-time-clock-opal.vercel.app/privacy`.
4. [Apple Developer Program](https://developer.apple.com/programs/) ($99 / year).
5. [Google Play Console](https://play.google.com/console) ($25 one-time).
6. A 1024×1024 App Store icon and Play Store graphics (feature graphic 1024×500, plus screenshots).

Then point the native shells at production and sync:

```bash
# In .env.local
NEXT_PUBLIC_APP_URL=https://employee-time-clock-opal.vercel.app

npx dotenv -e .env.local -- npx cap sync
```

Confirm `ios/App/App/capacitor.config.json` and `android/app/src/main/assets/capacitor.config.json` show the HTTPS URL, not `http://localhost:3000`.

---

## iOS (App Store)

### 1. Open Xcode

```bash
npm run cap:ios
```

### 2. Signing and version

- Select the **App** target → **Signing & Capabilities**.
- Choose your Team. Enable **Automatically manage signing**.
- Bundle Identifier must stay `com.sinclairatelier.timeclock`.
- Set a unique **Version** (e.g. `1.0.0`) and **Build** (increment every upload, e.g. `1`, `2`, `3`).
- Confirm **Background Modes → Location updates** is on (already in `Info.plist`).
- Confirm location usage strings are present (already in `ios/App/App/Info.plist`).

### 3. Icons

Add a 1024×1024 marketing icon in `ios/App/App/Assets.xcassets/AppIcon.appiconset`. Xcode 14+ can generate the rest from that one image.

### 4. Archive and upload

1. Device destination: **Any iOS Device (arm64)**.
2. **Product → Archive**.
3. **Distribute App → App Store Connect → Upload**.
4. Wait until the build appears in App Store Connect (often 5–20 minutes, plus processing).

### 5. App Store Connect listing

Create the app if it does not exist (bundle ID `com.sinclairatelier.timeclock`).

Fill in:

- Name, subtitle, description, keywords, support URL, marketing URL.
- **Privacy Policy URL:** `https://employee-time-clock-opal.vercel.app/privacy`
- Category: Business / Productivity.
- Screenshots for the required device sizes.
- Age rating (typically 4+).

**App Privacy (nutrition labels)**

- Location → Precise Location.
- Collected: Yes. Used for **App Functionality**.
- Linked to identity: Yes (it is tied to the employee account).
- Used for tracking: **No**.
- Not sold. Not used for advertising.

**Review notes** (paste something like this):

> Time Clock is a workplace timekeeping app. Employees clock in on a personal phone. GPS is required on each punch and continues in the background until clock-out so the employer can confirm the employee is at the job site. Choose Always Allow when iOS asks. Tracking stops on clock-out.
>
> Demo: alex.rivera@riverside.demo PIN 1001 (manager) and james.okonkwo@riverside.demo PIN 7390 (employee).
>
> Attach a screen recording: clock in → lock the phone → location still updates on the manager Live floor → clock out → GPS stops.

### 6. Submit

Submit for review. Always-location apps often get a follow-up. Reply with the privacy URL and that location is collected only while on the clock, for the employer, and stops at clock-out.

---

## Android (Google Play)

### 1. Upload keystore (once)

Create a keystore **outside this repo**. Never commit it.

```bash
keytool -genkey -v -keystore ~/timeclock-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias timeclock
```

Keep the file and passwords in a password manager. Losing this keystore means you cannot update the Play listing.

### 2. Open Android Studio

```bash
npx dotenv -e .env.local -- npx cap sync
npm run cap:android
```

### 3. Sign a release App Bundle

1. **Build → Generate Signed App Bundle / APK**.
2. Choose the upload keystore.
3. Build type: **release**.
4. Produce an **.aab** (Play does not accept APK for new apps).

Application ID must stay `com.sinclairatelier.timeclock`. Increment `versionCode` and `versionName` in `android/app/build.gradle` for every upload.

### 4. Play Console listing

Create the app. Complete:

- Store listing (title, short/full description, screenshots, feature graphic).
- Privacy policy: `https://employee-time-clock-opal.vercel.app/privacy`
- Content rating questionnaire.
- Target audience / news app declarations.
- **Data safety:** Location (approximate and precise) is collected, optional to the user only in the sense they can deny permission (punches then fail), used for app functionality, not sold, not shared for advertising, encrypted in transit.

**Background location**

Play requires:

1. The in-app disclosure on the clock (already shown while on shift).
2. A video of clock-in, the persistent “On the clock” notification, locking the phone, then clock-out stopping tracking.
3. A declaration that background location is used only while the employee is on the clock.

### 5. Test, then production

1. Upload the AAB to an **internal testing** track.
2. Install from the testing link on a real phone. Grant **Allow all the time**. Confirm pings continue after lock.
3. Promote to production when that works.

---

## After a store release

| Change | Do you need a new store build? |
| --- | --- |
| Clock UI, punch rules, live floor | No — deploy the website |
| Privacy copy on `/privacy` | No — deploy the website |
| GPS plugins, permissions, bundle ID, or the Capacitor server URL | Yes — bump version, `cap sync`, archive / AAB, resubmit |

Local device testing (not for the stores):

```bash
CAPACITOR_SERVER_URL=http://localhost:3000 npx cap sync   # iOS Simulator
CAPACITOR_SERVER_URL=http://10.0.2.2:3000 npx cap sync     # Android emulator
CAPACITOR_SERVER_URL=http://YOUR-LAN-IP:3000 npx cap sync  # physical phone on same Wi-Fi
```
