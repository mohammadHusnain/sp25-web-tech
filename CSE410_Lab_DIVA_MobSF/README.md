# CSE410 Lab – Automated Mobile Security Assessment using DIVA and MobSF

Complete submission package for the CSE410 (Fall 2026–2027) CLO1 laboratory exercise.

## Contents

| Path | What it is | Lab stage |
|---|---|---|
| `Report/CSE410_DIVA_MobSF_Lab_Report.pdf` | **Final report to submit.** It contains all 14 required headings plus Appendix A, 27 captioned figures, and the results table. | All |
| `Report/CSE410_DIVA_MobSF_Lab_Report.docx` | Editable version of the same report, for filling in your details and adding screenshots. | All |
| `Report/CSE410_DIVA_MobSF_Lab_Report.md` | Source of the report (Markdown). | – |
| `APK/diva-app-debug.apk` (+ `.sha256`) | DIVA APK built from source; this is the file assessed by MobSF. | 1, 3 |
| `MobSF_Reports/` | MobSF's exported PDF report (25 pages), the full JSON report, and the scorecard JSON. | 3 |
| `Screenshots/` | 28 full-resolution evidence images, numbered by stage. | 1–4, Appendix |
| `Build/` | APK build script and logs, native `make` log, Android Studio modernization patch, terminal evidence text, and the Playwright scripts used to capture MobSF evidence. | 1–3 |
| `Source/diva-android/` | Official DIVA source, ready for Android Studio: native `jniLibs` built and the Gradle setup updated for current Android Studio (AGP 8.7.3 / Gradle 8.9 / AndroidX). The vulnerable code and SDK levels are unchanged. | 1 |
| `Demo_Script_Stage6.md` | Talking points and commands for the Stage 6 demonstration. | 6 |

## Key results
- App: **Diva 1.0**, package `jakhar.aseem.diva`, minSdk 15 / targetSdk 23.
- APK SHA-256: `4adc2de8a86d958fce181a067588fa9891f67be58b87aaf0629750ee9fa28331`.
- MobSF **v4.6.2** (Docker): security score **47/100, Grade B (Medium Risk)**. Findings: 2 High, 8 Medium, 1 Info, 1 Secure, 1 Hotspot.
- Selected findings, by priority:
  1. Exported, unprotected `NotesProvider` (fix first).
  2. SQL injection.
  3. Credentials stored on external storage.
  4. Exported credential activities.
  5. Sensitive data written to logs.
- Validation: one false positive (`pkey: notespin`) and several false negatives (hardcoded `vendorsecretkey`, `123secretapikey123`, native key `olsdfgad;lh`).

## Before submitting
1. Open `Report/CSE410_DIVA_MobSF_Lab_Report.docx` and fill in `[Student Name]`, `[Student ID]`, `[Group ID]` and `[Submission Date]` on the cover.
2. Save it as PDF and submit that PDF on Blackboard.

## Reproducing the build without Android Studio
```bash
cd Source/diva-android/app/src/main/jni && make
```
That builds the native library (needs the NDK `ndk-build` on your PATH). Then:
```bash
./Build/build_diva_apk.sh <diva-android-dir> <deps-dir> <out-dir>
```
The script calls aapt2 → javac → d8 → zipalign → apksigner. It needs `ANDROID_HOME` with build-tools 35.0.0 and platform android-34. `<deps-dir>` must hold the support-library 23.1.0 AARs from the SDK's `extras/android/m2repository`, unpacked into `<deps-dir>/x/<artifact>/`.
