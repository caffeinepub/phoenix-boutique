#!/bin/bash

# Build script for Phoenix Boutique Android Release APK
# This script builds the release APK and copies it to a documented output location

set -e  # Exit on error

echo "🔨 Building Phoenix Boutique Android Release APK..."
echo ""

# Ensure we're in the frontend directory
cd "$(dirname "$0")/.."

# Check if android directory exists
if [ ! -d "android" ]; then
  echo "❌ Error: android/ directory not found."
  echo "   Run 'npx cap add android' first to initialize the Android project."
  exit 1
fi

# Create build-outputs directory if it doesn't exist
mkdir -p build-outputs

echo "📦 Step 1: Building web assets..."
pnpm build:skip-bindings

echo ""
echo "🔄 Step 2: Syncing with Android project..."
npx cap sync android

echo ""
echo "🏗️  Step 3: Building Android release APK..."
cd android
./gradlew assembleRelease

echo ""
echo "📋 Step 4: Copying APK to build-outputs/..."
cd ..

# Find the release APK (handle different possible output locations)
APK_SOURCE="android/app/build/outputs/apk/release/app-release.apk"
APK_DEST="build-outputs/PhoenixBoutique-release.apk"

if [ -f "$APK_SOURCE" ]; then
  cp "$APK_SOURCE" "$APK_DEST"
  echo "✅ Release APK built successfully!"
  echo ""
  echo "📍 Location: frontend/$APK_DEST"
  echo ""
  echo "📱 You can now install this APK on Android devices."
  
  # Display file size
  if command -v du &> /dev/null; then
    SIZE=$(du -h "$APK_DEST" | cut -f1)
    echo "📦 APK Size: $SIZE"
  fi
else
  echo "❌ Error: Release APK not found at expected location."
  echo "   Expected: $APK_SOURCE"
  echo "   Check the Gradle build output above for errors."
  exit 1
fi

echo ""
echo "⚠️  Note: For production distribution, ensure the APK is signed with a release keystore."
echo "   See frontend/ANDROID_RELEASE.md for signing instructions."
