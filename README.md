# SpecsBiz | Smart Business Manager

This is a professional business management application built with Next.js, Firebase, and Tailwind CSS.

## 🚀 How to build APK (Android)
1. Download this project and extract it on your computer.
2. Install **Node.js** (LTS version) from nodejs.org.
3. Open your terminal/command prompt in the project folder and run:
   ```bash
   npm install
   ```
4. Build the static project files:
   ```bash
   npm run build
   ```
5. Add the Android platform (if not already added):
   ```bash
   npx cap add android
   ```
6. Sync the code to Android:
   ```bash
   npx cap sync
   ```
7. Open the project in **Android Studio**:
   ```bash
   npx cap open android
   ```
8. Inside Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**. Your APK will be ready!

## 💻 How to build EXE (Windows)
1. Ensure you have run `npm install`.
2. Build the project to generate static files:
   ```bash
   npm run build
   ```
3. Generate the Windows installer:
   ```bash
   npm run electron:build
   ```
4. Your `.exe` installer will be found in the `dist` folder.

## ⚠️ Important Configuration for Firebase
Before using the APK/EXE, you **MUST** do this to avoid "Unauthorized Domain" errors:
1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **Authentication > Settings > Authorized Domains**.
3. Click **Add Domain** and type `localhost`.
4. Save it. Now your app can securely talk to the database from any device.

---
Developed by SpecsXR.
