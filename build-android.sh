#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

die() { echo "[Loup-Garou Android Build] ERROR: $*" >&2; exit 1; }

INSTALL_ADB=0
LAUNCH_APP=0

while [ $# -gt 0 ]; do
    case "$1" in
        --install)
            INSTALL_ADB=1
            shift
            ;;
        --launch)
            INSTALL_ADB=1
            LAUNCH_APP=1
            shift
            ;;
        *)
            die "Unknown argument: $1 (Supported: --install, --launch)"
            ;;
    esac
done

# 1. Locate Android SDK & Build Tools
SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
if [ -z "$SDK" ]; then
    for candidate in "$HOME/Android/Sdk" "$HOME/Library/Android/sdk" "${LOCALAPPDATA:-}/Android/Sdk" "/home/pavel/luma-mobile/.local/sdk" /opt/homebrew/share/android-commandlinetools; do
        if [ -n "$candidate" ] && [ -d "$candidate" ]; then SDK="$candidate"; break; fi
    done
fi
[ -n "$SDK" ] || die "Android SDK not found. Set ANDROID_HOME to your Android SDK location."

BT="$SDK/build-tools/36.0.0"
if [ ! -d "$BT" ]; then
    BT="$SDK/build-tools/34.0.0"
fi
ANDROID_JAR="$SDK/platforms/android-34/android.jar"

find_bt() {
    for ext in "" ".exe" ".bat"; do
        if [ -x "$BT/$1$ext" ] || [ -f "$BT/$1$ext" ]; then echo "$BT/$1$ext"; return 0; fi
    done
    die "Missing $BT/$1."
}

AAPT2="$(find_bt aapt2)"
D8="$(find_bt d8)"
ZIPALIGN="$(find_bt zipalign)"
APKSIGNER="$(find_bt apksigner)"
[ -f "$ANDROID_JAR" ] || die "Missing $ANDROID_JAR."

echo "==> [1/5] Exporting offline Expo bundle to dist-web..."
npx expo export --platform web --output-dir dist-web

echo "==> [2/5] Preparing Android native assets & build workspace..."
rm -rf build android-native/assets
mkdir -p build/classes build/dex dist android-native/assets/www
cp -r dist-web/* android-native/assets/www/

echo "==> [3/5] Compiling Android resources with aapt2..."
"$AAPT2" compile --dir android-native/res -o build/resources.zip
"$AAPT2" link \
    -o build/resources.apk \
    -I "$ANDROID_JAR" \
    --manifest android-native/AndroidManifest.xml \
    -A android-native/assets \
    --java build/generated \
    --auto-add-overlay \
    build/resources.zip

echo "==> [4/5] Compiling Java sources & converting to DEX bytecode with d8..."
find android-native/src build/generated -name '*.java' > build/sources.txt
javac -encoding UTF-8 --release 8 -classpath "$ANDROID_JAR" -d build/classes @build/sources.txt

find build/classes -name '*.class' > build/classes.txt
"$D8" --lib "$ANDROID_JAR" --min-api 26 --output build/dex @build/classes.txt

cp build/resources.apk build/unsigned.apk
if command -v zip >/dev/null 2>&1; then
    (cd build/dex && zip -q -u ../unsigned.apk classes.dex)
else
    (cd build/dex && jar -uf ../unsigned.apk classes.dex)
fi

echo "==> [5/5] Zipaligning & signing dist/loup-garou-local.apk..."
"$ZIPALIGN" -f -p 4 build/unsigned.apk build/aligned.apk

KEYSTORE=".signing/local.keystore"
if [ ! -f "$KEYSTORE" ]; then
    mkdir -p .signing
    keytool -genkeypair \
        -keystore "$KEYSTORE" \
        -storepass android \
        -keypass android \
        -alias loup-garou-local \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname 'CN=Loup Garou Thiercelieux Local, O=Local Build'
fi

"$APKSIGNER" sign \
    --ks "$KEYSTORE" \
    --ks-pass pass:android \
    --ks-key-alias loup-garou-local \
    --out dist/loup-garou-local.apk \
    build/aligned.apk

"$APKSIGNER" verify dist/loup-garou-local.apk
ls -lh dist/loup-garou-local.apk

if [ "$INSTALL_ADB" -eq 1 ]; then
    command -v adb >/dev/null 2>&1 || die "adb not found in PATH."
    DEVICES="$(adb devices | awk 'NR>1 && $2=="device" {print $1}')"
    [ -n "$DEVICES" ] || die "No connected Android devices in 'device' state found via 'adb devices'."

    for SERIAL in $DEVICES; do
        echo "==> Installing dist/loup-garou-local.apk onto device [$SERIAL]..."
        adb -s "$SERIAL" install -r dist/loup-garou-local.apk
        if [ "$LAUNCH_APP" -eq 1 ]; then
            echo "==> Launching com.loupgarou.local/.MainActivity on [$SERIAL]..."
            adb -s "$SERIAL" shell am start -n com.loupgarou.local/.MainActivity
        fi
    done
fi
