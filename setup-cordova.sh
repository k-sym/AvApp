#!/bin/bash

# Setup script for Cordova in the Audio Visualizer app

echo "Setting up Cordova for Audio Visualizer app..."

# Check if Cordova is installed
if ! command -v cordova &> /dev/null; then
    echo "Cordova not found. Installing globally..."
    npm install -g cordova
fi

# Create src-cordova directory if it doesn't exist
if [ ! -d "src-cordova" ]; then
    echo "Creating src-cordova directory..."
    mkdir -p src-cordova
fi

# Navigate to src-cordova directory
cd src-cordova

# Remove platforms if they exist (for clean install)
echo "Cleaning existing platforms..."
cordova platform rm android || true
cordova platform rm ios || true

# Install Cordova plugins (with fixed versions for compatibility)
echo "Installing Cordova plugins..."
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-ionic-keyboard
cordova plugin add cordova-plugin-screen-orientation
cordova plugin add cordova-plugin-insomnia
cordova plugin add cordova-plugin-media
cordova plugin add cordova-plugin-camera
cordova plugin add cordova-plugin-android-permissions
cordova plugin add cordova-plugin-chooser
cordova plugin add cordova-plugin-file
cordova plugin add cordova-plugin-filepath
cordova plugin add cordova-plugin-splashscreen

# Skip problematic plugins
# cordova-plugin-whitelist (deprecated in newer versions)
# cordova-plugin-wkwebview-engine (causing errors)

# Add iOS platform with specific version
echo "Adding iOS platform..."
cordova platform add ios@7.0.0

# Add Android platform with specific version for better compatibility with JDK 21
echo "Adding Android platform..."
cordova platform add android@13.0.0

# Fix for iOS issues
echo "Applying iOS-specific fixes..."
if [ -d "platforms/ios" ]; then
    # Add ios-deploy for better iOS deployment
    npm install -g ios-deploy

    # Add iOS-specific plugin
    cordova plugin add cordova-plugin-wkwebview-file-xhr
fi

# Set additional Gradle properties for Android compatibility with JDK 21
echo "Setting Gradle properties for Android..."
if [ -d "platforms/android" ]; then
    # Create gradle.properties if it doesn't exist
    mkdir -p platforms/android
    cat > platforms/android/gradle.properties << EOF
org.gradle.jvmargs=-Xmx4096m
android.useAndroidX=true
android.enableJetifier=true
EOF
fi

echo "Cordova setup complete!"
echo "You can now run 'npm run cordova-dev' to start the app in development mode for iOS."
echo "Or run 'npm run cordova-android-dev' for Android development." 