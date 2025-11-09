#!/bin/bash
# Package Maimuta for Chrome Web Store
# Copyright (c) 2024 Marius Bugaciu. All rights reserved.

echo "Creating Chrome extension package..."

# Clean up any existing zip
rm -f Maimuta-v1.4.0-Chrome.zip

# Create the zip file
zip -r Maimuta-v1.4.0-Chrome.zip \
    manifest.json \
    background/ \
    content/ \
    popup/ \
    editor/ \
    install/ \
    icons/ \
    -x "*.DS_Store" \
    -x "*__MACOSX*" \
    -x "*.map"

# Check if successful
if [ -f Maimuta-v1.4.0-Chrome.zip ]; then
    echo "✅ Package created successfully!"
    echo "File size: $(ls -lh Maimuta-v1.4.0-Chrome.zip | awk '{print $5}')"
    echo "Ready for Chrome Web Store submission!"
else
    echo "❌ Failed to create package"
    exit 1
fi