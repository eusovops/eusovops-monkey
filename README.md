# EuSovOps-Monkey

**Userscript Manager for Chrome (Manifest V3)**

Created by **Marius Bugaciu @ EUSOVOPS**

## About

EuSovOps-Monkey is a custom userscript manager built for Chrome with full Manifest V3 compliance. It's designed specifically for internal EUSOVOPS team use and supports all standard Greasemonkey/ViolentMonkey/TamperMonkey userscripts.

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
5. Select the `EuSovOps-Monkey-Built` folder
6. Done! The extension is now installed

## Usage

### Install Scripts

**From URL:**
1. Click the EuSovOps-Monkey icon
2. Paste a .user.js URL in the input field
3. Click "Install from URL"

**From File:**
1. Click the EuSovOps-Monkey icon
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

## Version

Current version: 1.2.0

### What's New in 1.2.0
- 🎨 Modern futuristic purple gradient UI
- 🎨 GitHub-style dark theme editor
- 🔗 Automatic .user.js URL detection and installation
- 🔄 Automatic update checking (every 6 hours + on startup)
- ✅ Fixed delete functionality with custom modal
- ✅ Robust error handling throughout

## License

Internal use only for EUSOVOPS team.

---

**Created by Marius Bugaciu @ EUSOVOPS**

