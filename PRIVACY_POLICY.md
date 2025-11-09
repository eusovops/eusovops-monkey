# Privacy Policy for Maimuta Extension

**Last Updated: November 2024**

## Overview
Maimuta is a userscript manager for Chrome that respects your privacy. We do not collect, store, or transmit any personal data.

## Data Collection
**We do NOT collect:**
- Personal information
- Browsing history
- User analytics
- Telemetry data
- Cookies or tracking data
- Any information about websites you visit

## Data Storage
Maimuta only stores data locally on your device:
- Userscripts you install (stored locally using Chrome's storage API)
- Script settings and preferences (enabled/disabled state)
- Script metadata (name, version, update URLs)
- GM_setValue data for userscript functionality (stored locally)

All data is stored locally on your computer and is never transmitted to external servers.

## Permissions Usage
The extension requires certain permissions to function:
- **Storage**: To save your scripts locally
- **Scripting**: To inject userscripts into web pages
- **Host Permissions**: To allow userscripts to run on websites you choose
- **WebNavigation**: To detect .user.js files for installation
- **Notifications**: For GM_notification API compatibility
- **ContextMenus**: For right-click install options

These permissions are used solely for the extension's core functionality and not for data collection.

## Third-Party Services
Maimuta does not integrate with any third-party analytics, advertising, or tracking services.

## Data Sharing
We do not share, sell, rent, or trade any information with third parties.

## Updates to Scripts
When checking for userscript updates, the extension may connect to the update URLs specified in the userscripts' metadata. These connections are made directly from your browser to the script hosting service (like GitHub, Greasy Fork, etc.) and no data passes through our servers.

## Changes to This Policy
Any changes to this privacy policy will be reflected in the extension updates.

## Contact
For questions about this privacy policy, please open an issue at:
https://github.com/yourusername/maimuta

## Compliance
This extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)

---
© 2024 Marius Bugaciu. All rights reserved.