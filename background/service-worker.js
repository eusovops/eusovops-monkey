// EuSovOps-Monkey Service Worker
// Manifest V3 background script
// Created by Marius Bugaciu @ EUSOVOPS

console.log('EuSovOps-Monkey service worker loaded');

// Storage helper functions
const storage = {
  async getScripts() {
    const result = await chrome.storage.local.get(['scripts']);
    return result.scripts || [];
  },

  async saveScripts(scripts) {
    await chrome.storage.local.set({ scripts });
  },

  async getScript(id) {
    const scripts = await this.getScripts();
    return scripts.find(s => s.id === id);
  },

  async addScript(script) {
    const scripts = await this.getScripts();

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
    const metadata = parseMetadata(script.code);
    if (metadata.updateURL && metadata.updateURL[0]) {
      script.updateURL = metadata.updateURL[0];
    } else if (metadata.downloadURL && metadata.downloadURL[0]) {
      script.updateURL = metadata.downloadURL[0];
    }
    if (metadata.version && metadata.version[0]) {
      script.version = metadata.version[0];
    }

    scripts.push(script);
    await this.saveScripts(scripts);
    return script;
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
  const scripts = await storage.getScripts();
  return scripts.filter(script => {
    if (!script.enabled) return false;

    const metadata = parseMetadata(script.code);
    const matches = metadata.match || [];
    const includes = metadata.include || [];
    const excludes = metadata.exclude || [];

    // Check excludes first
    for (const pattern of excludes) {
      if (matchPattern(url, pattern)) return false;
    }

    // Check matches and includes
    const patterns = [...matches, ...includes];
    if (patterns.length === 0) return false;

    for (const pattern of patterns) {
      if (matchPattern(url, pattern)) return true;
    }

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
        type: 'EUSOVOPS_GM_REQUEST',
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

    if (event.data && event.data.type === 'EUSOVOPS_GM_RESPONSE') {
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

  // MINIMAL VERSION: GM_notification disabled to reduce permissions
  // window.GM_notification = function(details) {
  //   const text = typeof details === 'string' ? details : details.text;
  //   const title = typeof details === 'object' ? details.title : 'EuSovOps-Monkey';
  //   sendBridgeMessage('GM_notification', { title, message: text });
  // };
  window.GM_notification = function(details) {
    console.log('[EuSovOps-Monkey] GM_notification called but notifications are disabled in minimal version');
  };

  window.GM_info = {
    script: { name: 'User Script', version: '1.0' },
    scriptHandler: 'EuSovOps-Monkey',
    version: '1.0.0'
  };

  window.unsafeWindow = window;
  console.log('EuSovOps-Monkey GM APIs loaded');
})();
`;

// Inject scripts into tab
async function injectScripts(tabId, url) {
  const scripts = await getMatchingScripts(url);

  if (scripts.length === 0) return;

  // First, inject the GM API library
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: (apiCode) => {
        eval(apiCode);
      },
      args: [GM_API_CODE],
      world: 'MAIN'
    });
  } catch (e) {
    console.error('Failed to inject GM API:', e);
    return;
  }

  // Then inject each matching userscript
  for (const script of scripts) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        func: (code) => {
          try {
            // Create isolated scope
            (function() {
              eval(code);
            })();
          } catch (e) {
            console.error('EuSovOps-Monkey script error:', e);
          }
        },
        args: [script.code],
        world: 'MAIN'
      });
    } catch (e) {
      console.error('Failed to inject script:', script.name, e);
    }
  }
}

// Intercept .user.js URLs and redirect to install page (works with activeTab)
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) { // Main frame only
    const url = details.url;

    // Check if URL ends with .user.js
    if (url.match(/\.user\.js(\?.*)?$/i)) {
      // Redirect to install page
      const installUrl = chrome.runtime.getURL(`install/install.html?url=${encodeURIComponent(url)}`);
      chrome.tabs.update(details.tabId, { url: installUrl });
    }
  }
});

// ACTIVE TAB MODE: Scripts are injected when user clicks extension icon
// Navigation listener disabled for activeTab mode
// chrome.webNavigation.onCommitted.addListener(async (details) => {
//   if (details.frameId === 0) { // Main frame only
//     await injectScripts(details.tabId, details.url);
//   }
// });

// Message handler for popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'getScripts':
          const scripts = await storage.getScripts();
          sendResponse({ success: true, data: scripts });
          break;

        case 'getScript':
          const script = await storage.getScript(message.id);
          sendResponse({ success: true, data: script });
          break;

        case 'addScript':
          const added = await storage.addScript(message.script);
          sendResponse({ success: true, data: added });
          break;

        case 'updateScript':
          const updated = await storage.updateScript(message.id, message.updates);
          sendResponse({ success: true, data: updated });
          break;

        case 'deleteScript':
          console.log('Service worker: deleteScript called for ID:', message.id);
          try {
            await storage.deleteScript(message.id);
            console.log('Service worker: deleteScript completed successfully');
            sendResponse({ success: true });
          } catch (error) {
            console.error('Service worker: deleteScript error:', error);
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'toggleScript':
          const toggleScript = await storage.getScript(message.id);
          if (toggleScript) {
            await storage.updateScript(message.id, { enabled: !toggleScript.enabled });
          }
          sendResponse({ success: true });
          break;

        case 'installFromUrl':
          try {
            const response = await fetch(message.url);
            const code = await response.text();
            const metadata = parseMetadata(code);
            const name = metadata.name ? metadata.name[0] : 'Unnamed Script';
            const newScript = await storage.addScript({ name, code, installURL: message.url });
            sendResponse({ success: true, data: newScript });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'installScript':
          try {
            const code = message.code;
            const metadata = parseMetadata(code);
            const name = metadata.name ? metadata.name[0] : 'Unnamed Script';
            const newScript = await storage.addScript({ name, code });
            sendResponse({ success: true, data: newScript });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'fetchUserscript':
          (async () => {
            try {
              console.log('Fetching userscript from:', message.url);
              // Try direct fetch first (works for most URLs)
              const response = await fetch(message.url);
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              const code = await response.text();
              console.log('Successfully fetched script, length:', code.length);
              sendResponse({ success: true, code });
            } catch (error) {
              console.error('Direct fetch failed:', error.message);
              // Fallback: Open URL in background tab and extract content
              try {
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
                const result = await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  func: () => document.body.innerText || document.body.textContent || document.documentElement.innerText
                });

                // Close tab
                await chrome.tabs.remove(tab.id);

                if (result && result[0] && result[0].result) {
                  console.log('Successfully extracted script from tab');
                  sendResponse({ success: true, code: result[0].result });
                } else {
                  throw new Error('Could not extract script content from page');
                }
              } catch (fallbackError) {
                console.error('Fallback failed:', fallbackError);
                sendResponse({
                  success: false,
                  error: `Failed to load script. Original error: ${error.message}. Fallback error: ${fallbackError.message}`
                });
              }
            }
          })();
          return true; // Will respond asynchronously

        case 'activateScripts':
          try {
            const result = await activateScriptsOnCurrentTab();
            sendResponse(result);
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'checkUpdates':
          try {
            const scripts = await storage.getScripts();
            const updates = [];

            for (const script of scripts) {
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

            sendResponse({ success: true, updates });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'applyUpdate':
          try {
            const { id, code } = message;
            const metadata = parseMetadata(code);
            const updates = {
              code,
              version: metadata.version ? metadata.version[0] : null,
              modified: Date.now()
            };
            await storage.updateScript(id, updates);
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'checkUpdatesNow':
          try {
            const count = await checkAllUpdates(true); // Force check
            sendResponse({ success: true, count });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        // GM API handlers
        case 'GM_xmlhttpRequest':
          try {
            const fetchOptions = {
              method: message.details.method,
              headers: message.details.headers
            };

            if (message.details.data) {
              fetchOptions.body = message.details.data;
            }

            const fetchResponse = await fetch(message.details.url, fetchOptions);
            const responseText = await fetchResponse.text();

            // Format headers as string (like real XMLHttpRequest)
            const headersArray = [];
            fetchResponse.headers.forEach((value, key) => {
              headersArray.push(`${key}: ${value}`);
            });
            const responseHeaders = headersArray.join('\r\n');

            sendResponse({
              success: true,
              status: fetchResponse.status,
              statusText: fetchResponse.statusText,
              responseText: responseText,
              responseHeaders: responseHeaders,
              finalUrl: fetchResponse.url
            });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'GM_getValue':
          try {
            const storageKey = `gm_${sender.tab?.id || 'global'}_${message.key}`;
            const result = await chrome.storage.local.get([storageKey]);
            sendResponse({ value: result[storageKey] !== undefined ? result[storageKey] : message.defaultValue });
          } catch (error) {
            sendResponse({ value: message.defaultValue });
          }
          break;

        case 'GM_setValue':
          try {
            const storageKey = `gm_${sender.tab?.id || 'global'}_${message.key}`;
            await chrome.storage.local.set({ [storageKey]: message.value });
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'GM_deleteValue':
          try {
            const storageKey = `gm_${sender.tab?.id || 'global'}_${message.key}`;
            await chrome.storage.local.remove([storageKey]);
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'GM_listValues':
          try {
            const prefix = `gm_${sender.tab?.id || 'global'}_`;
            const allData = await chrome.storage.local.get(null);
            const keys = Object.keys(allData).filter(k => k.startsWith(prefix)).map(k => k.substring(prefix.length));
            sendResponse({ keys });
          } catch (error) {
            sendResponse({ keys: [] });
          }
          break;

        case 'GM_openInTab':
          try {
            await chrome.tabs.create({ url: message.url, active: message.active });
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        // MINIMAL VERSION: Notifications disabled
        case 'GM_notification':
          console.log('[EuSovOps-Monkey] GM_notification received but notifications are disabled in minimal version');
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Keep channel open for async response
});

// Check for script updates
async function checkAllUpdates(force = false) {
  // Check if auto-update is enabled (unless forced)
  if (!force) {
    const result = await chrome.storage.local.get(['autoUpdateEnabled']);
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
    console.log(`[EuSovOps-Monkey] Updated ${updateCount} script(s) automatically!`);
    // chrome.notifications.create({
    //   type: 'basic',
    //   iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    //   title: 'EuSovOps-Monkey',
    //   message: `Updated ${updateCount} script(s) automatically!`
    // });
  }

  console.log(`Update check complete. ${updateCount} script(s) updated.`);
  return updateCount;
}

// ACTIVE TAB MODE: Function to inject scripts on current tab
async function activateScriptsOnCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    console.log('Activating scripts for:', tab.url);
    await injectScripts(tab.id, tab.url);
    return { success: true, url: tab.url };
  }
  return { success: false, error: 'No active tab found' };
}

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log('EuSovOps-Monkey installed - ActiveTab Mode');

  // MINIMAL VERSION: Context menu disabled to reduce permissions
  // chrome.contextMenus.create({
  //   id: 'install-userscript',
  //   title: 'Install with EuSovOps-Monkey',
  //   contexts: ['link'],
  //   targetUrlPatterns: ['*://*/*.user.js*']
  // });

  // Check for updates on install
  checkAllUpdates();
});

// Check for updates on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('EuSovOps-Monkey started');
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
//         title: 'EuSovOps-Monkey',
//         message: `Script "${name}" installed successfully!`
//       });
//     } catch (error) {
//       chrome.notifications.create({
//         type: 'basic',
//         iconUrl: chrome.runtime.getURL('icons/icon48.png'),
//         title: 'EuSovOps-Monkey Error',
//         message: `Failed to install script: ${error.message}`
//       });
//     }
//   }
// });
