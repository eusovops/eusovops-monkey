# Maimuta

**Load your personal scripts using Manifest V3**

## About

Maimuta is a custom userscript manager built for Safari with Manifest V3 compliance. It supports all standard Greasemonkey/ViolentMonkey/TamperMonkey userscripts.

## Features

- ✅ Full Manifest V3 compliance
- ✅ GM_* API support (GM_xmlhttpRequest, GM_getValue, GM_setValue, etc.)
- ✅ Auto-install from .user.js URLs
- ✅ Install from local files
- ✅ Auto-update checking for scripts
- ✅ Script editor with metadata parsing
- ✅ Enable/disable scripts
- ✅ Pattern matching (@match, @include, @exclude)

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the extension folder containing all directories (background, content, editor, icons, install, popup)
6. Done! The extension is now installed

## Usage

### Install Scripts

**From URL:**
1. Click the Maimuta icon
2. Paste a .user.js URL in the input field
3. Click "Install from URL"

**From File:**
1. Click the Maimuta icon
2. Click "Install from File"
3. Select your .user.js file

### Manage Scripts

- **Enable/Disable:** Click the ON/OFF toggle button
- **Edit:** Click the Edit button to modify script code
- **Delete:** Click Delete to remove a script
- **Check Updates:** Click "Check Updates" to check for script updates

### Create New Scripts

1. Click "+ New" in the popup
2. Enter script name and code
3. Use @match or @include to specify URLs
4. Click Save

## Supported GM APIs

- GM_xmlhttpRequest
- GM_getValue / GM_setValue
- GM_deleteValue / GM_listValues
- GM_addStyle
- GM_openInTab
- GM_setClipboard
- GM_notification
- GM_info
- unsafeWindow

## Technical Details

- **Manifest Version:** 3
- **Service Worker:** Background script for script injection
- **Content Script Bridge:** Message relay between page and extension
- **Storage:** chrome.storage.local for script persistence
- **Injection:** chrome.scripting.executeScript with world: 'MAIN'

## Build Instructions

To create a release ZIP for Chrome Web Store:

```bash
zip -r Maimuta-release.zip manifest.json background/ content/ editor/ icons/ install/ popup/ -x "*.DS_Store"
```

**Important:** Always include the `install/` folder - it's required for userscript installation from web pages!

## Version

Current version: 1.2.5

### What's New in 1.2.5
- 🚀 Minimal permissions version for faster Chrome Web Store approval
- ✅ Core functionality preserved with only essential permissions
- 🔧 Optimized for quick review process (2-5 days expected)
- 📦 Production-ready build for Chrome Web Store submission

### Previous v1.2.3-1.2.4 Updates
- 🔧 Fixed Chrome Web Store permission violations
- 🔧 Removed unnecessary 'webRequest' and 'tabs' permissions
- 🔧 Fixed userscript installation from web pages
- ✅ All permissions now properly justified and used

### Previous Updates (1.2.0-1.2.2)
- 🎨 Modern futuristic purple gradient UI
- 🎨 GitHub-style dark theme editor with syntax highlighting
- 🔗 Automatic .user.js URL detection and installation
- 🔄 Automatic update checking (every 6 hours + on startup)
- ✅ Fixed delete functionality with custom modal
- ✅ Robust error handling throughout

## License

Internal use only for EUSOVOPS team.

---

**Created by Marius Bugaciu @ EUSOVOPS**

