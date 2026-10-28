#!/usr/bin/env bash
# Builds the DIVA APK from the original source using Android SDK command-line build tools.
# Equivalent of Android Studio "Build -> Make Project" (assembleDebug) without Gradle/AGP:
#   aapt2 compile/link -> javac -> d8 -> package native libs -> zipalign -> apksigner (debug key)
set -euo pipefail

SRC=${1:?usage: build_diva_apk.sh <diva-android-dir> <deps-dir> <out-dir>}
DEPS=${2:?}
OUT=${3:?}
SDK=${ANDROID_HOME:?set ANDROID_HOME to your Android SDK}
BT=$SDK/build-tools/35.0.0
ANDROID_JAR=$SDK/platforms/android-34/android.jar
APP=$SRC/app/src/main
LIBS="appcompat-v7 design support-v4 recyclerview-v7"

rm -rf "$OUT" && mkdir -p "$OUT"/{flat,gen,classes,dex,apk}

echo "== [1/7] aapt2 compile resources (app + support libraries 23.1.0)"
"$BT/aapt2" compile --dir "$APP/res" -o "$OUT/flat/app.zip"
for l in $LIBS; do
  "$BT/aapt2" compile --dir "$DEPS/x/$l/res" -o "$OUT/flat/$l.zip"
done

echo "== [2/7] aapt2 link (manifest, resources.arsc, R.java)"
"$BT/aapt2" link -o "$OUT/apk/base.apk" -I "$ANDROID_JAR" \
  --manifest "$APP/AndroidManifest.xml" \
  --min-sdk-version 15 --target-sdk-version 23 --version-code 1 --version-name 1.0 \
  --auto-add-overlay \
  --extra-packages android.support.v7.appcompat:android.support.design:android.support.v7.recyclerview:android.support.v4 \
  -R "$OUT/flat/support-v4.zip" -R "$OUT/flat/recyclerview-v7.zip" \
  -R "$OUT/flat/appcompat-v7.zip" -R "$OUT/flat/design.zip" \
  "$OUT/flat/app.zip" \
  --java "$OUT/gen"

CP="$DEPS/support-annotations/support-annotations-23.1.0.jar:$DEPS/x/support-v4/libs/internal_impl-23.1.0.jar"
for l in $LIBS; do CP="$CP:$DEPS/x/$l/classes.jar"; done

echo "== [3/7] javac (Java sources + generated R)"
javac -nowarn -source 8 -target 8 -encoding UTF-8 -Xlint:-options \
  -bootclasspath "$ANDROID_JAR" -classpath "$CP" -d "$OUT/classes" \
  $(find "$APP/java" "$OUT/gen" -name '*.java')

echo "== [4/7] d8 (dex app classes + libraries)"
"$BT/d8" --debug --min-api 15 --lib "$ANDROID_JAR" --output "$OUT/dex" \
  $(find "$OUT/classes" -name '*.class') ${CP//:/ }

echo "== [5/7] package classes.dex + jniLibs (libdivajni.so)"
( cd "$OUT/dex" && zip -q -j "$OUT/apk/base.apk" classes*.dex )
mkdir -p "$OUT/native/lib" && cp -r "$APP/jniLibs/"* "$OUT/native/lib/"
( cd "$OUT/native" && zip -q -r "$OUT/apk/base.apk" lib )

echo "== [6/7] zipalign"
"$BT/zipalign" -f -p 4 "$OUT/apk/base.apk" "$OUT/apk/aligned.apk"

echo "== [7/7] apksigner (Android debug keystore)"
KS=$OUT/debug.keystore
keytool -genkeypair -keystore "$KS" -storepass android -keypass android -alias androiddebugkey \
  -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US" >/dev/null 2>&1
"$BT/apksigner" sign --ks "$KS" --ks-pass pass:android --key-pass pass:android \
  --out "$OUT/app-debug.apk" "$OUT/apk/aligned.apk"
"$BT/apksigner" verify --print-certs "$OUT/app-debug.apk" | head -3

echo "BUILD SUCCESSFUL -> $OUT/app-debug.apk"
ls -l "$OUT/app-debug.apk"
sha256sum "$OUT/app-debug.apk"
