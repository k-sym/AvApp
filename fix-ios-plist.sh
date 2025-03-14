#!/bin/bash

# Script to directly modify Info.plist for iOS to fix white screen issues
echo "Fixing Info.plist for iOS..."

# Path to the Info.plist file
INFO_PLIST="src-cordova/platforms/ios/AudioVisualizer/AudioVisualizer-Info.plist"

if [ -f "$INFO_PLIST" ]; then
    echo "Modifying $INFO_PLIST..."
    
    # Add UIWebViewDelegate key if not present
    if ! grep -q "UIWebViewDelegate" "$INFO_PLIST"; then
        echo "Adding UIWebViewDelegate..."
        sed -i '' -e '/<\/dict>/i\
	<key>NSAppTransportSecurity</key>\
	<dict>\
		<key>NSAllowsArbitraryLoads</key>\
		<true/>\
	</dict>' "$INFO_PLIST"
    fi
    
    # Add configuration for WKWebView if not present
    if ! grep -q "WKWebViewOnly" "$INFO_PLIST"; then
        echo "Adding WKWebView configuration..."
        sed -i '' -e '/<\/dict>/i\
	<key>WKWebViewOnly</key>\
	<true/>' "$INFO_PLIST"
    fi
    
    # Enable inline media playback
    if ! grep -q "AllowInlineMediaPlayback" "$INFO_PLIST"; then
        echo "Enabling inline media playback..."
        sed -i '' -e '/<\/dict>/i\
	<key>AllowInlineMediaPlayback</key>\
	<true/>' "$INFO_PLIST"
    fi
    
    echo "Successfully modified $INFO_PLIST"
else
    echo "Warning: $INFO_PLIST not found"
fi 