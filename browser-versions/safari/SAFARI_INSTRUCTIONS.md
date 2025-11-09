# Safari Extension Installation Instructions

## Important Note
Safari requires extensions to be packaged as native macOS apps using Xcode.

## Steps to Convert and Install:

### 1. Prerequisites
- macOS 11.0 or later
- Xcode 12 or later (free from Mac App Store)
- Safari 14 or later

### 2. Convert Web Extension to Safari
```bash
# In Terminal, navigate to this directory and run:
xcrun safari-web-extension-converter . --project-location ~/Desktop/SafariExtension

# This creates an Xcode project
```

### 3. Build and Run in Xcode
1. Open the generated Xcode project
2. Select your development team (if you have one)
3. Click "Run" button or press Cmd+R
4. Safari will open with the extension installed

### 4. Enable the Extension
1. Open Safari Preferences (Safari → Preferences)
2. Go to Extensions tab
3. Check the box next to "EuSovOps-Monkey"
4. Grant necessary permissions when prompted

### 5. For Distribution
- To distribute outside App Store: Create a notarized Developer ID build
- To distribute via App Store: Submit through App Store Connect

## Alternative: Developer Mode
For testing only:
1. Safari → Preferences → Advanced
2. Check "Show Develop menu in menu bar"
3. Develop → Allow Unsigned Extensions (requires restart)
4. Load the extension manually

Note: Unsigned extensions only work until Safari restarts.