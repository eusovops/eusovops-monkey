#!/bin/bash
# Create Chrome extension test zip
# Copyright (c) 2024 Marius Bugaciu. All rights reserved.

echo "Creating Maimuta v1.4.0 Chrome test extension zip..."

# Navigate to the browser-versions/chrome directory
cd /Users/mbugaciu/src/coding/maimuta_v1-4-0/browser-versions/chrome

# Remove old zip if exists
rm -f ../../Maimuta-v1.4.0-Chrome-Test.zip

# Create new zip with all necessary files
zip -r ../../Maimuta-v1.4.0-Chrome-Test.zip \
    manifest.json \
    background/ \
    content/ \
    popup/ \
    editor/ \
    install/ \
    icons/ \
    README.md \
    -x "*.DS_Store" \
    -x "*__MACOSX*"

echo "✅ Maimuta-v1.4.0-Chrome-Test.zip created successfully!"
echo ""
echo "To test in Chrome:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top-right)"
echo "3. Drag and drop the Maimuta-v1.4.0-Chrome-Test.zip file"
echo "   OR click 'Load unpacked' and select the browser-versions/chrome folder"
echo ""
echo "The extension is ready for testing!"