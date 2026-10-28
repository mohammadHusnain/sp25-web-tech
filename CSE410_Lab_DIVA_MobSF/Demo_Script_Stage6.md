# Stage 6 – Demonstration Script (about 5 minutes)

## 1. DIVA source and build (1 min)
- Open `Source/diva-android` in Android Studio. Show `app/src/main/java/jakhar/aseem/diva/` and `app/src/main/jni/divajni.c`.
- Terminal:
  ```bash
  cd app/src/main/jni && make
  ```
  This builds `libdivajni.so` into `app/src/main/jniLibs/`.
- Run **Build → Make Project** and show `BUILD SUCCESSFUL` and `app/build/outputs/apk/debug/app-debug.apk`.
  - Backup: `APK/diva-app-debug.apk` (SHA-256 in `APK/diva-app-debug.apk.sha256`).

## 2. Running MobSF environment (1 min)
```bash
docker pull opensecurity/mobile-security-framework-mobsf:latest
```
```bash
docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest
```
- Open http://127.0.0.1:8000 and log in with `mobsf` / `mobsf`. Point out the version in the footer (v4.6.2).

## 3. Automated assessment result (1.5 min)
- Upload & Analyze → `diva-app-debug.apk`, then wait for the report.
- Show: score **47/100**, Grade B, 2/17 exported activities, 1/1 exported provider.
- Scorecard: 2 High / 8 Medium / 1 Info.
- Manifest Analysis, Code Analysis, Shared Library Binary Analysis.
- *PDF Report* button (backup copy: `MobSF_Reports/MobSF_DIVA_report.pdf`).

## 4. One important finding and its remediation (1.5 min)
**Finding:** Content Provider `.NotesProvider` is not protected (`android:exported="true"`, no permission).
- Evidence: MobSF Manifest Analysis row 5. In *View AndroidManifest.xml*, line 37.
- Impact: any installed app can query, update or delete the PIN-protected private notes with no permission, e.g.
  ```bash
  adb shell content query --uri content://jakhar.aseem.diva.provider.notesprovider/notes
  ```
- Fix (first priority):
  ```xml
  <provider android:name=".NotesProvider"
            android:authorities="jakhar.aseem.diva.provider.notesprovider"
            android:exported="false" />
  ```
  If sharing is truly needed, protect it with a `signature`-level permission instead. Use `selection "_id=?"` with `selectionArgs` in `NotesProvider`.
- Why first: it can be exploited silently by any co-installed app, without permission or user interaction, and gives full read and write access. The fix is one line.
