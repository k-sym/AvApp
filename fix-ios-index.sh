#!/bin/bash

# Script to fix iOS white screen issues by replacing index.html file with our custom template
echo "Applying fixes to iOS index.html file..."

# Path to iOS index.html file in development and production builds
DEV_INDEX="src-cordova/platforms/ios/www/index.html"
PROD_INDEX="src-cordova/www/index.html"
TEMPLATE="src-cordova/ios-index-template.html"

# Function to copy template to index.html location
replace_index_html() {
    local index_file=$1
    
    if [ -f "$index_file" ]; then
        echo "Replacing $index_file with iOS template..."
        
        if [ -f "$TEMPLATE" ]; then
            # Make backup of original file
            cp "$index_file" "$index_file.bak"
            
            # Copy our custom template
            cp "$TEMPLATE" "$index_file"
            
            echo "Successfully replaced $index_file with iOS template"
        else
            echo "Error: Template file $TEMPLATE not found!"
        fi
    else
        echo "Warning: $index_file not found"
    fi
}

# Replace both development and production index files
replace_index_html "$DEV_INDEX"
replace_index_html "$PROD_INDEX"

echo "Completed applying fixes to iOS index.html files"
