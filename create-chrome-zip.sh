#!/bin/bash
# Create Chrome extension zip
# Copyright (c) 2024 Marius Bugaciu. All rights reserved.

echo "Creating updated Maimuta v1.4.0 Chrome extension zip..."

# Remove old zip if exists
rm -f Maimuta-v1.4.0-Chrome.zip

# Create new zip
zip -r Maimuta-v1.4.0-Chrome.zip \
    manifest.json \
    background/ \
    content/ \
    popup/ \
    editor/ \
    install/ \
    icons/ \
    -x "*.DS_Store" \
    -x "*__MACOSX*"

echo "✅ Maimuta-v1.4.0-Chrome.zip created successfully!"
echo "All install page issues fixed:"
echo "  - Romanian flag colors applied"
echo "  - 'Maimuta' branding everywhere"
echo "  - Close button fixed for errors"
echo ""
echo "Ready for Chrome Web Store submission!"