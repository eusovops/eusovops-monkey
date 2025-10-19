# Development Guide

This file provides guidance for AI assistants and developers when working with code in this repository.

## Project Overview

**EuSovOps-Monkey** is a custom userscript manager built for Chrome with full Manifest V3 compliance. It's based on ViolentMonkey and provides GM_* API support for userscripts. The project is designed for internal EUSOVOPS team use.

## Development Workflow

### Setup
```sh
# Install dependencies (requires Node.js >= 20 and Yarn v1.x)
cd EuSovOps-Monkey
yarn

# Development mode (watch and compile with hot reload)
yarn dev

# Load the extension from 'dist/' folder in Chrome
# Navigate to chrome://extensions/, enable Developer mode, click "Load unpacked", select 'dist/'
```

### Building
```sh
# Production build
yarn build

# Build for self-hosted release with update_url
yarn build:selfHosted

# Analyze bundle size
yarn analyze
```

### Testing and Linting
```sh
# Run linting and tests
yarn ci

# Lint only
yarn lint        # Both JS and YML
yarn lint:js     # JavaScript/Vue files
yarn lint:yml    # YML files

# Run tests
yarn test
```

### Internationalization
```sh
# Extract i18n keys from templates and update locale files
yarn i18n

# Copy i18n files to dist
yarn copyI18n
```

### Version Bumping
```sh
# Bump beta version (increments beta number in package.json)
yarn bump

# Manually bump version
yarn bumpVersion
```

## Architecture

### Directory Structure

- **`src/background/`** - Service worker (Manifest V3) that handles script injection, storage, and extension commands
  - `utils/` - Core utilities (db, storage, requests, script management, updates, tabs, clipboard, notifications)
  - `sync/` - Cloud sync integrations (WebDAV, Google Drive)
  - `plugin/` - Plugin system and event handling

- **`src/injected/`** - Content scripts and userscript execution environment
  - `content/` - Content script bridge for message relay between page and extension
  - `web/` - Userscript injection layer that runs in page context (world: 'MAIN')
  - `util/` - Shared utilities for injected scripts

- **`src/options/`** - Options page (Vue 3 app) for script management and settings
  - `views/` - Vue components (dashboard, editor, settings tabs)

- **`src/popup/`** - Browser action popup (Vue 3 app)

- **`src/confirm/`** - Script installation confirmation page

- **`src/common/`** - Shared utilities and UI components
  - `ui/` - CodeMirror editor setup, autocomplete, and styling

- **`scripts/`** - Build tooling (Webpack config, Gulp tasks, manifest generation, i18n processing)

### Build System

The project uses:
- **Gulp** for task orchestration (icons, i18n, manifest tweaking)
- **Webpack** for bundling with custom plugins
- **Babel** for transpilation with custom safe-bind plugin
- **Vue 3** with SFC compilation
- **PostCSS** for styling (nested, variables, calc)

Key build scripts:
- `gulpfile.js` - Main Gulp tasks
- `scripts/webpack.conf.js` - Webpack configuration with multiple entry points
- `scripts/manifest-helper.js` - Manifest V3 generation from `src/manifest.yml`

### Key Technical Details

**Manifest V3 Architecture:**
- Service worker background script (`src/background/index.js`)
- Content scripts injected at `document_start` with `all_frames: true`
- Uses `chrome.scripting.executeScript` with `world: 'MAIN'` for userscript injection
- Message passing between content script bridge and service worker

**Code Isolation:**
- Files in `src/injected/` have restricted imports - cannot import from `*/common` or `*/common/*`
- Globals are defined in separate files (`safe-globals-shared.js`, etc.) and automatically injected via Webpack
- Custom webpack wrapper adds globals to avoid namespace pollution

**Special Webpack Processing:**
- `injected.js` and `injected-web.js` get special protection against re-injection
- `injected-web.js` is wrapped in a function that takes `IS_FIREFOX`, `PAGE_MODE_HANDSHAKE`, and `VAULT_ID` parameters
- Bootstrap protection plugin prevents execution in potentially compromised environments

### Database and Storage

- Uses `chrome.storage.local` for script persistence
- Database utilities in `src/background/utils/db.js`
- Storage fetch and caching in `src/background/utils/storage-fetch.js` and `storage-cache.js`

### GM API Implementation

GM APIs are implemented in `src/injected/web/` and bridged through content scripts:
- `GM_xmlhttpRequest` - HTTP requests
- `GM_getValue/GM_setValue/GM_deleteValue/GM_listValues` - Storage
- `GM_addStyle` - Dynamic styling
- `GM_openInTab` - Tab management
- `GM_setClipboard` - Clipboard access
- `GM_notification` - Browser notifications
- `GM_info` - Script metadata
- `unsafeWindow` - Page window reference

## Common Development Tasks

### Working with the Manifest
The manifest is defined in YAML format at `src/manifest.yml` and converted to JSON during build. To modify:
1. Edit `src/manifest.yml`
2. Run `yarn dev` or manually run `gulp manifest` to rebuild

### Adding a New GM API
1. Add the API implementation in `src/injected/web/gm-api.js` or related file
2. Update the bridge in `src/injected/content/` if needed
3. Add background handler in `src/background/utils/` if it requires extension APIs
4. Update tests in `test/injected/`

### Running a Single Test
```sh
# Run specific test file
yarn test path/to/test-file.test.js
```

### Working with Locales
- Locale files are in `src/_locales/<lang>/messages.yml`
- The build process converts them to JSON
- Use `yarn i18n` to extract new keys from templates
- Reference keys in code with `__MSG_keyName__` or via the i18n API

## Browser Compatibility

- **Chrome:** Minimum version 61.0 (for URLSearchParams, spread/rest, CSS :focus-within)
- **Firefox:** Minimum version 58.0 (Manifest V3 support limited)
- Uses browser-specific code paths (check `IS_FIREFOX` global)

## Important Notes

- The working directory for this repository is `/Users/mbugaciu/src/coding/eusovops-monkey`
- The `EuSovOps-Monkey/` subdirectory contains the main source code
- Always run commands from the `EuSovOps-Monkey/` directory
- Husky git hooks are configured for pre-commit linting
- Beta releases increment the `beta` field in `package.json`
