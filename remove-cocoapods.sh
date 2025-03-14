#!/bin/bash

# Script to completely remove CocoaPods from the project
echo "Removing CocoaPods from the project..."

# Path to iOS platform directory
IOS_DIR="src-cordova/platforms/ios"

if [ -d "$IOS_DIR" ]; then
    echo "iOS platform found, removing CocoaPods files..."
    
    # Navigate to iOS directory
    cd "$IOS_DIR"
    
    # Remove CocoaPods files
    echo "Removing Podfile and Podfile.lock..."
    rm -f Podfile Podfile.lock
    
    # Remove Pods directory
    if [ -d "Pods" ]; then
        echo "Removing Pods directory..."
        rm -rf Pods
    fi
    
    # Remove .xcworkspace directory (CocoaPods creates this)
    find . -name "*.xcworkspace" -type d -exec rm -rf {} \; 2>/dev/null || true
    
    # Navigate back to project root
    cd ../../..
    
    echo "CocoaPods files removed from iOS platform."
else
    echo "iOS platform directory not found. Nothing to remove."
fi

# Remove fix-ios-pods.sh script
if [ -f "fix-ios-pods.sh" ]; then
    echo "Removing fix-ios-pods.sh script..."
    rm -f fix-ios-pods.sh
fi

echo "CocoaPods removal complete!"
echo "You may need to rebuild your iOS platform by running:"
echo "cd src-cordova && cordova platform remove ios && cordova platform add ios"
