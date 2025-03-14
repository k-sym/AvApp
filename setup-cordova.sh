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

# Install Cordova plugins
echo "Installing Cordova plugins..."
cordova plugin add cordova-plugin-whitelist
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-ionic-keyboard
cordova plugin add cordova-plugin-screen-orientation
cordova plugin add cordova-plugin-insomnia
cordova plugin add cordova-plugin-media
cordova plugin add cordova-plugin-camera
cordova plugin add cordova-plugin-android-permissions

# Add iOS platform
echo "Adding iOS platform..."
cordova platform add ios

# Add Android platform 
echo "Adding Android platform..."
cordova platform add android

# Fix for iOS issues
echo "Applying iOS-specific fixes..."
if [ -d "platforms/ios" ]; then
    # Add ios-deploy for better iOS deployment
    npm install -g ios-deploy
fi

echo "Cordova setup complete!"
echo "You can now run 'npm run cordova-dev' to start the app in development mode for iOS." 