// Maimuta Service Worker
// Manifest V3 background script

// Firefox compatibility: Use browser API if available, fallback to chrome
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

console.log('Maimuta service worker loaded');
console.log('Using API:', typeof browser !== 'undefined' ? 'browser' : 'chrome');

// Compatibility helper for script execution (Firefox 89+ support)
// NOTE: eval() usage is intentional and necessary for userscript manager functionality
async function executeScriptCompat(tabId, code, allFrames = true) {
  // Try modern API first (Firefox 102+)
  if (chrome.scripting && chrome.scripting.executeScript) {
    try {
      return await chrome.scripting.executeScript({
        target: { tabId, allFrames },
        func: (scriptCode) => {
          // eval is required for dynamic userscript execution
          // This is the core functionality of a userscript manager
          try {
            (function() {
              eval(scriptCode); // Intentional: userscript execution
            })();
          } catch (e) {
            console.error('Script execution error:', e);
          }
        },
        args: [code],
        world: 'MAIN'
      });
    } catch (e) {
      console.error('scripting.executeScript failed:', e);
      throw e;
    }
  }
  // Fallback to legacy API (Firefox 89-101)
  else if (chrome.tabs && chrome.tabs.executeScript) {
    return new Promise((resolve, reject) => {
      chrome.tabs.executeScript(tabId, {
        code: `(function() { try { ${code} } catch(e) { console.error('Script error:', e); } })();`,
        allFrames,
        runAt: 'document_start'
      }, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  } else {
    throw new Error('No compatible script execution API available');
  }
}

// Compatibility helper for executing functions that return values
async function executeScriptWithResult(tabId, func) {
  // Try modern API first (Firefox 102+)
  if (chrome.scripting && chrome.scripting.executeScript) {
    return await chrome.scripting.executeScript({
      target: { tabId },
      func: func
    });
  }
  // Fallback to legacy API (Firefox 89-101)
  else if (chrome.tabs && chrome.tabs.executeScript) {
    return new Promise((resolve, reject) => {
      chrome.tabs.executeScript(tabId, {
        code: `(${func.toString()})();`,
        runAt: 'document_end'
      }, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          // Wrap result to match modern API format
          resolve([{ result: result && result[0] }]);
        }
      });
    });
  } else {
    throw new Error('No compatible script execution API available');
  }
}

// Storage helper functions
const storage = {
  async getScripts() {
    try {
      console.log('storage.getScripts: Calling storage API');
      const result = await browserAPI.storage.local.get(['scripts']);
      console.log('storage.getScripts: Raw result:', result);
      console.log('storage.getScripts: result type:', typeof result);
      console.log('storage.getScripts: result.scripts:', result.scripts);

      // Handle cases where result is undefined or null
      if (!result || typeof result !== 'object') {
        console.warn('Storage returned invalid result (not an object), initializing empty array');
        return [];
      }

      // Check if scripts key exists
      if (!result.hasOwnProperty('scripts')) {
        console.warn('Storage result missing scripts property, initializing empty array');
        return [];
      }

      const scripts = result.scripts;
      if (!Array.isArray(scripts)) {
        console.warn('Storage scripts is not an array, initializing empty array');
        return [];
      }

      console.log('storage.getScripts: Returning', scripts.length, 'scripts');
      return scripts;
    } catch (error) {
      console.error('Failed to get scripts from storage:', error);
      return [];
    }
  },

  async saveScripts(scripts) {
    try {
      if (!Array.isArray(scripts)) {
        throw new Error('Scripts must be an array');
      }
      console.log('storage.saveScripts: Saving', scripts.length, 'scripts');
      console.log('storage.saveScripts: Scripts array:', scripts);
      await browserAPI.storage.local.set({ scripts });
      console.log('storage.saveScripts: Save completed');

      // Verify the save worked
      const verify = await browserAPI.storage.local.get(['scripts']);
      console.log('storage.saveScripts: Verification read:', verify);
      console.log('storage.saveScripts: Verification scripts count:', verify.scripts ? verify.scripts.length : 'undefined');
    } catch (error) {
      console.error('Failed to save scripts to storage:', error);
      throw error;
    }
  },

  async getScript(id) {
    const scripts = await this.getScripts();
    return scripts.find(s => s.id === id);
  },

  async addScript(script) {
    try {
      console.log('storage.addScript: Getting existing scripts');
      const scripts = await this.getScripts();
      console.log('storage.addScript: Current script count:', scripts.length);

      // Check for duplicate script names
      const duplicateName = scripts.find(s => s.name === script.name);
      if (duplicateName) {
        throw new Error(`A script named "${script.name}" already exists. Please use a different name.`);
      }

      script.id = script.id || `script_${Date.now()}`;
      script.enabled = script.enabled !== false;
      script.created = Date.now();
      script.modified = Date.now();

      // Parse metadata for update URL
      try {
        const metadata = parseMetadata(script.code);
        if (metadata.updateURL && metadata.updateURL[0]) {
          script.updateURL = metadata.updateURL[0];
        } else if (metadata.downloadURL && metadata.downloadURL[0]) {
          script.updateURL = metadata.downloadURL[0];
        }
        if (metadata.version && metadata.version[0]) {
          script.version = metadata.version[0];
        }
      } catch (metaError) {
        console.warn('storage.addScript: Failed to parse metadata:', metaError);
        // Continue anyway, metadata is optional
      }

      scripts.push(script);
      console.log('storage.addScript: Saving scripts, new count:', scripts.length);
      await this.saveScripts(scripts);
      console.log('storage.addScript: Script saved successfully');
      return script;
    } catch (error) {
      console.error('storage.addScript: Error:', error);
      throw error;
    }
  },

  async updateScript(id, updates) {
    const scripts = await this.getScripts();
    const index = scripts.findIndex(s => s.id === id);
    if (index !== -1) {
      scripts[index] = { ...scripts[index], ...updates, modified: Date.now() };
      await this.saveScripts(scripts);
      return scripts[index];
    }
    return null;
  },

  async deleteScript(id) {
    console.log('Storage: deleteScript called for ID:', id);
    let scripts = await this.getScripts();
    console.log('Storage: Current scripts count:', scripts.length);
    const beforeCount = scripts.length;
    scripts = scripts.filter(s => s.id !== id);
    console.log('Storage: After filter, scripts count:', scripts.length);
    console.log('Storage: Deleted?', beforeCount !== scripts.length);
    await this.saveScripts(scripts);
    console.log('Storage: Scripts saved');
  }
};

// Parse userscript metadata
function parseMetadata(code) {
  const metaBlock = code.match(/==UserScript==([\s\S]*?)==\/UserScript==/);
  if (!metaBlock) return {};

  const metadata = {};
  const lines = metaBlock[1].split('\n');

  for (const line of lines) {
    const match = line.match(/@(\w+)\s+(.+)/);
    if (match) {
      const [, key, value] = match;
      if (!metadata[key]) {
        metadata[key] = [];
      }
      metadata[key].push(value.trim());
    }
  }

  return metadata;
}

// Get matching scripts for a URL
async function getMatchingScripts(url) {
  console.log('🟢 getMatchingScripts: Checking URL:', url);
  const scripts = await storage.getScripts();
  console.log('🟢 getMatchingScripts: Total scripts:', scripts.length);

  return scripts.filter(script => {
    console.log('🟢 Checking script:', script.name, '| Enabled:', script.enabled);

    if (!script.enabled) {
      console.log('🔴 Script disabled, skipping');
      return false;
    }

    const metadata = parseMetadata(script.code);
    const matches = metadata.match || [];
    const includes = metadata.include || [];
    const excludes = metadata.exclude || [];

    console.log('🟢 Script patterns - @match:', matches, '| @include:', includes, '| @exclude:', excludes);

    // Check excludes first
    for (const pattern of excludes) {
      if (matchPattern(url, pattern)) {
        console.log('🔴 URL excluded by pattern:', pattern);
        return false;
      }
    }

    // Check matches and includes
    const patterns = [...matches, ...includes];
    if (patterns.length === 0) {
      console.log('🔴 No match/include patterns defined');
      return false;
    }

    for (const pattern of patterns) {
      const isMatch = matchPattern(url, pattern);
      console.log('🟡 Testing pattern:', pattern, '| Match:', isMatch);
      if (isMatch) {
        console.log('✅ Script matches! Will inject:', script.name);
        return true;
      }
    }

    console.log('🔴 No patterns matched');
    return false;
  });
}

// Simple pattern matching (supports wildcards)
function matchPattern(url, pattern) {
  if (pattern === '<all_urls>') return true;
  if (pattern === '*') return true;

  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace(/\*/g, '.*'); // Convert * to .*

  try {
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
  } catch (e) {
    console.error('Invalid pattern:', pattern, e);
    return false;
  }
}

// GM API code to inject
const GM_API_CODE = `
(function() {
  'use strict';

  let requestIdCounter = 0;
  const pendingRequests = new Map();

  // Helper to send messages via bridge
  function sendBridgeMessage(action, payload) {
    return new Promise((resolve, reject) => {
      const requestId = ++requestIdCounter;

      pendingRequests.set(requestId, { resolve, reject });

      window.postMessage({
        type: 'MAIMUTA_GM_REQUEST',
        requestId: requestId,
        action: action,
        payload: payload
      }, '*');

      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingRequests.has(requestId)) {
          pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  // Listen for responses from bridge
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    if (event.data && event.data.type === 'MAIMUTA_GM_RESPONSE') {
      const { requestId, response } = event.data;
      const pending = pendingRequests.get(requestId);

      if (pending) {
        pendingRequests.delete(requestId);
        pending.resolve(response);
      }
    }
  });

  window.GM_xmlhttpRequest = function(details) {
    return sendBridgeMessage('GM_xmlhttpRequest', {
      details: {
        method: details.method || 'GET',
        url: details.url,
        headers: details.headers || {},
        data: details.data,
        timeout: details.timeout,
        responseType: details.responseType || 'text'
      }
    }).then((response) => {
      if (response.success) {
        const result = {
          readyState: 4,
          status: response.status,
          statusText: response.statusText,
          responseText: response.responseText,
          responseHeaders: response.responseHeaders,
          finalUrl: response.finalUrl
        };
        if (details.onload) details.onload(result);
        return result;
      } else {
        const errorResult = {
          readyState: 4,
          status: 0,
          statusText: response.error || 'Error',
          error: response.error
        };
        if (details.onerror) details.onerror(errorResult);
        throw new Error(response.error);
      }
    });
  };

  window.GM_getValue = function(key, defaultValue) {
    return sendBridgeMessage('GM_getValue', { key, defaultValue })
      .then(response => response.value);
  };

  window.GM_setValue = function(key, value) {
    return sendBridgeMessage('GM_setValue', { key, value })
      .then(response => response.success);
  };

  window.GM_deleteValue = function(key) {
    return sendBridgeMessage('GM_deleteValue', { key })
      .then(response => response.success);
  };

  window.GM_listValues = function() {
    return sendBridgeMessage('GM_listValues', {})
      .then(response => response.keys || []);
  };

  window.GM_addStyle = function(css) {
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
    return style;
  };

  window.GM_getResourceText = function(name) {
    console.warn('GM_getResourceText not fully implemented:', name);
    return '';
  };

  window.GM_getResourceURL = function(name) {
    console.warn('GM_getResourceURL not fully implemented:', name);
    return '';
  };

  window.GM_openInTab = function(url, openInBackground) {
    return sendBridgeMessage('GM_openInTab', { url, active: !openInBackground })
      .then(response => response.success);
  };

  window.GM_setClipboard = function(text) {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Failed to set clipboard:', err);
    });
  };

  window.GM_notification = function(details) {
    const text = typeof details === 'string' ? details : details.text;
    const title = typeof details === 'object' ? details.title : 'Maimuta';
    sendBridgeMessage('GM_notification', { title, message: text });
  };

  window.GM_info = {
    script: { name: 'User Script', version: '1.0' },
    scriptHandler: 'Maimuta',
    version: '1.0.0'
  };

  window.unsafeWindow = window;
  console.log('Maimuta GM APIs loaded');
})();
`;

// Inject scripts into tab
async function injectScripts(tabId, url) {
  const scripts = await getMatchingScripts(url);

  if (scripts.length === 0) return;

  // First, inject the GM API library
  try {
    await executeScriptCompat(tabId, GM_API_CODE, true);
  } catch (e) {
    console.error('Failed to inject GM API:', e);
    return;
  }

  // Then inject each matching userscript
  for (const script of scripts) {
    try {
      await executeScriptCompat(tabId, script.code, true);
    } catch (e) {
      console.error('Failed to inject script:', script.name, e);
    }
  }
}

// Intercept .user.js URLs and redirect to install page
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) { // Main frame only
    const url = details.url;
    console.log('Navigation detected:', url);

    // Check if URL ends with .user.js
    if (url.match(/\.user\.js(\?.*)?$/i)) {
      console.log('Userscript detected, redirecting to install page');
      // Immediately redirect to install page
      const installUrl = chrome.runtime.getURL(`install/install.html?url=${encodeURIComponent(url)}`);
      chrome.tabs.update(details.tabId, { url: installUrl });
    }
  }
}, {
  url: [
    { urlMatches: '.*\\.user\\.js(\\?.*)?$' }
  ]
});

// Listen for navigation events on Oracle domains
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId === 0) { // Main frame only
    console.log('🔵 onCommitted fired for URL:', details.url);
    console.log('🔵 Tab ID:', details.tabId);

    const matchingScripts = await getMatchingScripts(details.url);
    console.log('🔵 Found', matchingScripts.length, 'matching scripts for this URL');

    if (matchingScripts.length > 0) {
      matchingScripts.forEach(script => {
        console.log('🔵 Will inject script:', script.name);
      });
    }

    await injectScripts(details.tabId, details.url);
  }
});

// Message handler for popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('=== Message received ===');
  console.log('Action:', message.action);
  console.log('Sender:', sender);
  console.log('Has code?:', message.code ? 'Yes (' + message.code.length + ' chars)' : 'No');

  // Handle async operations properly
  const handleMessage = async () => {
    console.log('handleMessage: Starting for action:', message.action);
    try {
      switch (message.action) {
        case 'getScripts':
          console.log('getScripts: Request received');
          const scripts = await storage.getScripts();
          console.log('getScripts: Retrieved', scripts.length, 'scripts from storage');
          console.log('getScripts: Scripts:', scripts);
          return { success: true, data: scripts };

        case 'getScript':
          const script = await storage.getScript(message.id);
          return { success: true, data: script };

        case 'addScript':
          const added = await storage.addScript(message.script);
          return { success: true, data: added };

        case 'updateScript':
          const updated = await storage.updateScript(message.id, message.updates);
          return { success: true, data: updated };

        case 'deleteScript':
          console.log('Service worker: deleteScript called for ID:', message.id);
          await storage.deleteScript(message.id);
          console.log('Service worker: deleteScript completed successfully');
          return { success: true };

        case 'toggleScript':
          const toggleScript = await storage.getScript(message.id);
          if (toggleScript) {
            await storage.updateScript(message.id, { enabled: !toggleScript.enabled });
          }
          return { success: true };

        case 'installFromUrl':
          console.log('installFromUrl: Starting, URL:', message.url);
          const fetchResponse = await fetch(message.url);
          if (!fetchResponse.ok) {
            throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
          }
          console.log('installFromUrl: Fetch successful');
          const urlCode = await fetchResponse.text();
          console.log('installFromUrl: Code length:', urlCode.length);
          if (!urlCode || urlCode.length === 0) {
            throw new Error('Empty script content received');
          }
          console.log('installFromUrl: Parsing metadata');
          const urlMetadata = parseMetadata(urlCode);
          const urlName = urlMetadata.name ? urlMetadata.name[0] : 'Unnamed Script';
          console.log('installFromUrl: Script name:', urlName);
          console.log('installFromUrl: Adding to storage');
          const urlNewScript = await storage.addScript({ name: urlName, code: urlCode, installURL: message.url });
          console.log('installFromUrl: Script added with ID:', urlNewScript.id);
          return { success: true, data: urlNewScript };

        case 'installScript':
          console.log('installScript: Starting script installation');
          const code = message.code;
          if (!code || typeof code !== 'string') {
            throw new Error('Invalid script code provided');
          }
          console.log('installScript: Parsing metadata');
          const metadata = parseMetadata(code);
          const name = metadata.name ? metadata.name[0] : 'Unnamed Script';
          console.log('installScript: Script name:', name);
          console.log('installScript: Adding script to storage');
          const newScript = await storage.addScript({ name, code });
          console.log('installScript: Script added successfully with ID:', newScript.id);
          return { success: true, data: newScript };

        case 'fetchUserscript':
          try {
            console.log('Fetching userscript from:', message.url);
            // Try direct fetch first (works for most URLs)
            const fetchResp = await fetch(message.url);
            if (!fetchResp.ok) {
              throw new Error(`HTTP ${fetchResp.status}: ${fetchResp.statusText}`);
            }
            const fetchCode = await fetchResp.text();
            console.log('Successfully fetched script, length:', fetchCode.length);
            return { success: true, code: fetchCode };
          } catch (error) {
            console.error('Direct fetch failed:', error.message);
            // Fallback: Open URL in background tab and extract content
            const tab = await chrome.tabs.create({
              url: message.url,
              active: false
            });

            // Wait for tab to load
            await new Promise(resolve => {
              chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                  chrome.tabs.onUpdated.removeListener(listener);
                  resolve();
                }
              });
            });

            // Extract content
            const result = await executeScriptWithResult(tab.id,
              () => document.body.innerText || document.body.textContent || document.documentElement.innerText
            );

            // Close tab
            await chrome.tabs.remove(tab.id);

            if (result && result[0] && result[0].result) {
              console.log('Successfully extracted script from tab');
              return { success: true, code: result[0].result };
            } else {
              throw new Error('Could not extract script content from page');
            }
          }

        case 'closeCurrentTab':
          // Close the tab that sent the message
          if (sender.tab && sender.tab.id) {
            await chrome.tabs.remove(sender.tab.id);
          } else {
            // Fallback to current active tab
            const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (currentTab && currentTab.id) {
              await chrome.tabs.remove(currentTab.id);
            }
          }
          return { success: true };

        case 'activateScripts':
          const activateResult = await activateScriptsOnCurrentTab();
          return activateResult;

        case 'checkUpdates':
          const checkScripts = await storage.getScripts();
          const updates = [];

          for (const script of checkScripts) {
            if (script.updateURL || script.installURL) {
              try {
                const updateUrl = script.updateURL || script.installURL;
                const response = await fetch(updateUrl);
                const newCode = await response.text();
                const newMetadata = parseMetadata(newCode);
                const newVersion = newMetadata.version ? newMetadata.version[0] : null;

                if (newVersion && script.version && newVersion !== script.version) {
                  updates.push({
                    id: script.id,
                    name: script.name,
                    oldVersion: script.version,
                    newVersion: newVersion,
                    code: newCode
                  });
                }
              } catch (e) {
                console.error('Failed to check update for', script.name, e);
              }
            }
          }
          return { success: true, updates };

        case 'applyUpdate':
          const updateMetadata = parseMetadata(message.code);
          const updateData = {
            code: message.code,
            version: updateMetadata.version ? updateMetadata.version[0] : null,
            modified: Date.now()
          };
          await storage.updateScript(message.id, updateData);
          return { success: true };

        case 'checkUpdatesNow':
          const count = await checkAllUpdates(true); // Force check
          return { success: true, count };

        // GM API handlers
        case 'GM_xmlhttpRequest':
          const fetchOptions = {
            method: message.details.method,
            headers: message.details.headers
          };

          if (message.details.data) {
            fetchOptions.body = message.details.data;
          }

          const xhrFetchResponse = await fetch(message.details.url, fetchOptions);
          const responseText = await xhrFetchResponse.text();

          // Format headers as string (like real XMLHttpRequest)
          const headersArray = [];
          xhrFetchResponse.headers.forEach((value, key) => {
            headersArray.push(`${key}: ${value}`);
          });
          const responseHeaders = headersArray.join('\r\n');

          return {
            success: true,
            status: xhrFetchResponse.status,
            statusText: xhrFetchResponse.statusText,
            responseText: responseText,
            responseHeaders: responseHeaders,
            finalUrl: xhrFetchResponse.url
          };

        case 'GM_getValue':
          try {
            const storageKey = `gm_${sender.tab?.id || 'global'}_${message.key}`;
            const gmResult = await browserAPI.storage.local.get([storageKey]);
            return { value: gmResult[storageKey] !== undefined ? gmResult[storageKey] : message.defaultValue };
          } catch (error) {
            return { value: message.defaultValue };
          }

        case 'GM_setValue':
          const setStorageKey = `gm_${sender.tab?.id || 'global'}_${message.key}`;
          await browserAPI.storage.local.set({ [setStorageKey]: message.value });
          return { success: true };

        case 'GM_deleteValue':
          const delStorageKey = `gm_${sender.tab?.id || 'global'}_${message.key}`;
          await browserAPI.storage.local.remove([delStorageKey]);
          return { success: true };

        case 'GM_listValues':
          try {
            const prefix = `gm_${sender.tab?.id || 'global'}_`;
            const allData = await browserAPI.storage.local.get(null);
            const keys = Object.keys(allData).filter(k => k.startsWith(prefix)).map(k => k.substring(prefix.length));
            return { keys };
          } catch (error) {
            return { keys: [] };
          }

        case 'GM_openInTab':
          await chrome.tabs.create({ url: message.url, active: message.active });
          return { success: true };

        case 'GM_notification':
          chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
            title: message.title || 'Maimuta',
            message: message.message || ''
          });
          return { success: true };

        default:
          return { success: false, error: 'Unknown action' };
      }
    } catch (error) {
      console.error('Message handler error:', error);
      return { success: false, error: error.message || String(error) };
    }
  };

  // Execute the async handler and send response
  handleMessage()
    .then(result => {
      console.log('Sending response:', result);
      if (result === undefined) {
        console.error('Handler returned undefined!');
        sendResponse({ success: false, error: 'Handler returned undefined' });
      } else {
        sendResponse(result);
      }
    })
    .catch(error => {
      console.error('Handler failed:', error);
      sendResponse({ success: false, error: error.message || String(error) });
    });

  return true; // Keep channel open for async response
});

// Check for script updates
async function checkAllUpdates(force = false) {
  // Check if auto-update is enabled (unless forced)
  if (!force) {
    const result = await browserAPI.storage.local.get(['autoUpdateEnabled']);
    const autoUpdateEnabled = result.autoUpdateEnabled !== false; // Default to true

    if (!autoUpdateEnabled) {
      console.log('Auto-update is disabled. Skipping update check.');
      return 0;
    }
  }

  console.log('Checking for script updates...');
  const scripts = await storage.getScripts();
  let updateCount = 0;

  for (const script of scripts) {
    if (script.updateURL || script.installURL) {
      try {
        const updateUrl = script.updateURL || script.installURL;
        const response = await fetch(updateUrl);
        const newCode = await response.text();
        const newMetadata = parseMetadata(newCode);
        const newVersion = newMetadata.version ? newMetadata.version[0] : null;

        if (newVersion && script.version && newVersion !== script.version) {
          console.log(`Update available for ${script.name}: ${script.version} → ${newVersion}`);
          // Auto-update the script
          await storage.updateScript(script.id, {
            code: newCode,
            version: newVersion,
            modified: Date.now()
          });
          updateCount++;
        }
      } catch (e) {
        console.error('Failed to check update for', script.name, e);
      }
    }
  }

  if (updateCount > 0) {
    // MINIMAL VERSION: Notifications disabled
    console.log(`[Maimuta] Updated ${updateCount} script(s) automatically!`);
    // chrome.notifications.create({
    //   type: 'basic',
    //   iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    //   title: 'Maimuta',
    //   message: `Updated ${updateCount} script(s) automatically!`
    // });
  }

  console.log(`Update check complete. ${updateCount} script(s) updated.`);
  return updateCount;
}

// Function to manually inject scripts on current tab (kept for manual trigger if needed)
async function activateScriptsOnCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    console.log('Manually activating scripts for:', tab.url);
    await injectScripts(tab.id, tab.url);
    return { success: true, url: tab.url };
  }
  return { success: false, error: 'No active tab found' };
}

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log('Maimuta installed');

  chrome.contextMenus.create({
    id: 'install-userscript',
    title: 'Install with Maimuta',
    contexts: ['link'],
    targetUrlPatterns: ['*://*/*.user.js*']
  });

  // Check for updates on install
  checkAllUpdates();
});

// Check for updates on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Maimuta started');
  checkAllUpdates();
});

// MINIMAL VERSION: Auto-update checking disabled to reduce permissions
// chrome.alarms.create('checkUpdates', { periodInMinutes: 360 });
// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === 'checkUpdates') {
//     checkAllUpdates();
//   }
// });

// MINIMAL VERSION: Context menu handler disabled
// chrome.contextMenus.onClicked.addListener(async (info, tab) => {
//   if (info.menuItemId === 'install-userscript') {
//     try {
//       const response = await fetch(info.linkUrl);
//       const code = await response.text();
//       const metadata = parseMetadata(code);
//       const name = metadata.name ? metadata.name[0] : 'Unnamed Script';
//       await storage.addScript({ name, code, installURL: info.linkUrl });
//
//       // Show notification
//       chrome.notifications.create({
//         type: 'basic',
//         iconUrl: chrome.runtime.getURL('icons/icon48.png'),
//         title: 'Maimuta',
//         message: `Script "${name}" installed successfully!`
//       });
//     } catch (error) {
//       chrome.notifications.create({
//         type: 'basic',
//         iconUrl: chrome.runtime.getURL('icons/icon48.png'),
//         title: 'Maimuta Error',
//         message: `Failed to install script: ${error.message}`
//       });
//     }
//   }
// });
