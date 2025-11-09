# Maimuta v1.3.2 - Multi-Browser Installation Guide

## 🌐 Browser Compatibility

| Browser | Manifest Version | Status | Installation Method |
|---------|-----------------|--------|-------------------|
| Chrome | V3 | ✅ Ready | Chrome Web Store / Manual |
| Firefox | V2 | ✅ Ready | Firefox Add-ons / Manual |
| Edge | V3 | ✅ Ready | Edge Add-ons Store / Manual |
| Safari | V3 | ⚠️ Requires Xcode | Xcode Conversion |

## 📦 Available Packages

All packages are available on Desktop:
- `Maimuta-v1.3.2.zip` - Chrome version
- `Maimuta-Firefox-v1.3.2.zip` - Firefox version
- `Maimuta-Edge-v1.3.2.zip` - Edge version
- `Maimuta-Safari-v1.3.2.zip` - Safari version (requires conversion)

## 🚀 Installation Instructions

### Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Drag and drop `Maimuta-v1.3.2.zip` onto the page
   OR
   - Click "Load unpacked" and select the extracted folder
4. Grant permissions when prompted

### Firefox
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the sidebar
3. Click "Load Temporary Add-on"
4. Select the `Maimuta-Firefox-v1.3.2.zip` file
   OR
   - For permanent installation, submit to Firefox Add-ons

**Note:** Firefox uses Manifest V2 for better compatibility. The extension includes `browser_specific_settings` for proper Firefox integration.

### Microsoft Edge
1. Open Edge and navigate to `edge://extensions/`
2. Enable "Developer mode" (bottom left)
3. Drag and drop `Maimuta-Edge-v1.3.2.zip` onto the page
   OR
   - Click "Load unpacked" and select the extracted folder
4. Grant permissions when prompted

### Safari (macOS only)
Safari requires converting the web extension to a native macOS app:

1. **Install Xcode** from Mac App Store (free)
2. **Extract** `Maimuta-Safari-v1.3.2.zip`
3. **Open Terminal** and navigate to the extracted folder
4. **Run conversion command:**
   ```bash
   xcrun safari-web-extension-converter . --project-location ~/Desktop/SafariExtension
   ```
5. **Open the generated Xcode project**
6. **Run the project** (Cmd+R) to install in Safari
7. **Enable in Safari:** Preferences → Extensions → Check Maimuta

See `SAFARI_INSTRUCTIONS.md` in the Safari folder for detailed instructions.

## 🔄 Updates & Version Info

### Version 1.3.2 Changes
- ✅ Removed unused 'alarms' permission (Chrome Web Store compliance)
- ✅ Multi-browser support added
- ✅ Manifest optimizations for each browser

### Browser-Specific Differences

#### Chrome/Edge (Manifest V3)
- Uses service workers for background scripts
- Separate `host_permissions` field
- `scripting` API for dynamic script injection

#### Firefox (Manifest V2)
- Uses background scripts (non-persistent)
- Combined permissions in single array
- `tabs` API instead of `scripting`
- Added Firefox-specific ID: `eusovops-monkey@oracle.com`

#### Safari (Manifest V3)
- Similar to Chrome but requires Xcode conversion
- Native macOS app wrapper needed
- Supports both Intel and Apple Silicon Macs

## 🧪 Testing Checklist

Before deployment, test these features in each browser:
- [ ] Extension popup opens correctly
- [ ] Scripts load on Oracle domains
- [ ] Script installation from .user.js URLs
- [ ] Storage persistence
- [ ] Context menu items
- [ ] Notifications display

## 📝 Publishing to Stores

### Chrome Web Store
1. Create developer account ($5 one-time fee)
2. Upload `Maimuta-v1.3.2.zip`
3. Fill in store listing details
4. Submit for review

### Firefox Add-ons (AMO)
1. Create Mozilla developer account (free)
2. Upload `Maimuta-Firefox-v1.3.2.zip`
3. Choose self-distribution or public listing
4. Pass automated validation

### Edge Add-ons Store
1. Register as Microsoft Partner (free)
2. Upload `Maimuta-Edge-v1.3.2.zip`
3. Complete certification process
4. Publish to store

### Safari App Store
1. Enroll in Apple Developer Program ($99/year)
2. Convert and build with Xcode
3. Submit through App Store Connect
4. Pass Apple review process

## 🛠️ Troubleshooting

### Common Issues

**Extension not loading:**
- Ensure Developer Mode is enabled
- Check browser version meets minimum requirements
- Verify manifest.json syntax

**Permissions errors:**
- Review and accept all permission prompts
- Check host permissions match your Oracle domains
- Ensure no conflicting extensions

**Scripts not running:**
- Verify content script matches patterns
- Check console for errors
- Ensure JavaScript is enabled

## 📞 Support

For issues or questions:
- Internal Oracle support: Contact EUSOVOPS team
- GitHub Issues: [Report bugs or request features]
- Email: marius.bugaciu@oracle.com

---

**Version:** 1.3.2
**Author:** Marius Bugaciu @ EUSOVOPS
**License:** Oracle Internal Use Only