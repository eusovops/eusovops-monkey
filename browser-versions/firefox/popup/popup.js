// EuSovOps-Monkey Popup Script
// Created by Marius Bugaciu @ EUSOVOPS

// Firefox compatibility: Use browser API if available, fallback to chrome
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

async function sendMessage(action, data = {}) {
  console.log('>>> sendMessage called:', action, data);
  return new Promise((resolve) => {
    try {
      const message = { action, ...data };
      console.log('>>> Sending message:', message);

      chrome.runtime.sendMessage(message, (response) => {
        console.log('>>> sendMessage response received for', action, ':', response);
        console.log('>>> Response type:', typeof response);
        console.log('>>> chrome.runtime.lastError:', chrome.runtime.lastError);

        if (chrome.runtime.lastError) {
          console.error('>>> Message error:', chrome.runtime.lastError);
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else if (response === undefined || response === null) {
          console.error('>>> No response received from service worker (undefined/null)');
          resolve({ success: false, error: 'No response from service worker' });
        } else {
          console.log('>>> Resolving with response:', response);
          resolve(response);
        }
      });
    } catch (error) {
      console.error('>>> sendMessage exception:', error);
      resolve({ success: false, error: error.message });
    }
  });
}

async function loadScripts() {
  try {
    console.log('loadScripts: Fetching scripts from service worker');
    const response = await sendMessage('getScripts');
    console.log('loadScripts: Response received:', response);
    if (response.success) {
      console.log('loadScripts: Scripts data:', response.data);
      console.log('loadScripts: Number of scripts:', response.data ? response.data.length : 0);
      displayScripts(response.data || []);
    } else {
      console.error('Failed to load scripts:', response.error);
      const listEl = document.getElementById('scriptsList');
      listEl.textContent = '';
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      emptyDiv.textContent = 'Error loading scripts';
      listEl.appendChild(emptyDiv);
    }
  } catch (error) {
    console.error('Load scripts error:', error);
  }
}

function displayScripts(scripts) {
  console.log('displayScripts: Called with', scripts ? scripts.length : 0, 'scripts');
  const listEl = document.getElementById('scriptsList');
  listEl.textContent = '';

  if (!scripts || scripts.length === 0) {
    console.log('displayScripts: No scripts to display');
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.textContent = 'No scripts installed';
    listEl.appendChild(emptyDiv);
    return;
  }

  // Filter out any malformed scripts
  const validScripts = scripts.filter(script => script && script.id);
  console.log('displayScripts: Valid scripts count:', validScripts.length);

  if (validScripts.length === 0) {
    console.log('displayScripts: No valid scripts found');
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.textContent = 'No valid scripts';
    listEl.appendChild(emptyDiv);
    return;
  }

  validScripts.forEach(script => {
    const scriptId = String(script.id || '');
    const scriptName = script.name || 'Unnamed Script';
    const isEnabled = script.enabled !== false;

    // Create script item container
    const scriptItem = document.createElement('div');
    scriptItem.className = 'script-item';
    scriptItem.dataset.id = scriptId;

    // Create script info section
    const scriptInfo = document.createElement('div');
    scriptInfo.className = 'script-info';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'script-name';
    nameDiv.textContent = scriptName;

    const statusDiv = document.createElement('div');
    statusDiv.className = 'script-status';
    statusDiv.textContent = isEnabled ? 'Enabled' : 'Disabled';

    scriptInfo.appendChild(nameDiv);
    scriptInfo.appendChild(statusDiv);

    // Create script actions section
    const scriptActions = document.createElement('div');
    scriptActions.className = 'script-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = `toggle-btn ${isEnabled ? 'enabled' : 'disabled'}`;
    toggleBtn.dataset.id = scriptId;
    toggleBtn.textContent = isEnabled ? 'ON' : 'OFF';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.dataset.id = scriptId;
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.id = scriptId;
    deleteBtn.textContent = 'Delete';

    scriptActions.appendChild(toggleBtn);
    scriptActions.appendChild(editBtn);
    scriptActions.appendChild(deleteBtn);

    // Assemble the script item
    scriptItem.appendChild(scriptInfo);
    scriptItem.appendChild(scriptActions);

    listEl.appendChild(scriptItem);
  });

  // Attach event listeners
  attachEventListeners();
}

function attachEventListeners() {
  // Toggle buttons
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = e.currentTarget.getAttribute('data-id');
      const response = await sendMessage('toggleScript', { id });
      if (response.success) {
        await loadScripts();
      } else {
        alert('Failed to toggle script: ' + response.error);
      }
    });
  });

  // Edit buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = e.currentTarget.getAttribute('data-id');
      const url = chrome.runtime.getURL(`editor/editor.html?id=${id}`);
      chrome.tabs.create({ url });
    });
  });

  // Delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = e.currentTarget.getAttribute('data-id');

      console.log('Delete button clicked for script ID:', id);

      if (!id) {
        alert('Error: Script ID is missing');
        return;
      }

      // Show custom confirmation modal
      showConfirmModal(id);
    });
  });
}

// Custom confirmation modal
function showConfirmModal(scriptId) {
  const modal = document.getElementById('confirmModal');
  modal.style.display = 'flex';

  const yesBtn = document.getElementById('confirmYes');
  const noBtn = document.getElementById('confirmNo');

  // Remove old listeners
  const newYesBtn = yesBtn.cloneNode(true);
  const newNoBtn = noBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
  noBtn.parentNode.replaceChild(newNoBtn, noBtn);

  // Add new listeners
  document.getElementById('confirmYes').addEventListener('click', async () => {
    modal.style.display = 'none';
    await performDelete(scriptId);
  });

  document.getElementById('confirmNo').addEventListener('click', () => {
    modal.style.display = 'none';
  });
}

async function performDelete(id) {
  try {
    console.log('Sending deleteScript message...');
    const response = await sendMessage('deleteScript', { id });
    console.log('Delete response:', response);

    if (response && response.success) {
      console.log('Script deleted successfully, reloading...');
      await loadScripts();
    } else {
      alert('Failed to delete script: ' + (response?.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('Error deleting script: ' + error.message);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// New Script button
document.getElementById('newScript').addEventListener('click', () => {
  const url = chrome.runtime.getURL('editor/editor.html');
  chrome.tabs.create({ url });
});

// Install from URL
document.getElementById('installBtn').addEventListener('click', async () => {
  const url = document.getElementById('installUrl').value.trim();
  if (!url) {
    alert('Please enter a URL');
    return;
  }

  const btn = document.getElementById('installBtn');
  btn.disabled = true;
  btn.textContent = 'Installing...';

  const response = await sendMessage('installFromUrl', { url });

  if (response.success) {
    document.getElementById('installUrl').value = '';
    await loadScripts();
    alert('Script installed successfully!');
  } else {
    alert('Failed to install script: ' + response.error);
  }

  btn.disabled = false;
  btn.textContent = 'Install from URL';
});

// Install from File
document.getElementById('installFileBtn').addEventListener('click', () => {
  document.getElementById('installFile').click();
});

document.getElementById('installFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const code = await file.text();
    const response = await sendMessage('installScript', { code });

    if (response.success) {
      await loadScripts();
      alert('Script installed successfully from file!');
    } else {
      alert('Failed to install script: ' + response.error);
    }
  } catch (error) {
    alert('Failed to read file: ' + error.message);
  }

  e.target.value = '';
});

// Auto-Update Toggle
async function loadAutoUpdateSetting() {
  const result = await browserAPI.storage.local.get(['autoUpdateEnabled']);
  const autoUpdateEnabled = result.autoUpdateEnabled !== false; // Default to true

  const toggle = document.getElementById('autoUpdateToggle');
  if (autoUpdateEnabled) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }

  return autoUpdateEnabled;
}

async function setAutoUpdateSetting(enabled) {
  await browserAPI.storage.local.set({ autoUpdateEnabled: enabled });

  const toggle = document.getElementById('autoUpdateToggle');
  if (enabled) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }
}

document.getElementById('autoUpdateToggle').addEventListener('click', async () => {
  const currentSetting = await loadAutoUpdateSetting();
  const newSetting = !currentSetting;

  await setAutoUpdateSetting(newSetting);

  if (newSetting) {
    // Trigger immediate update check when enabling
    const response = await sendMessage('checkUpdatesNow');
    if (response.success && response.count > 0) {
      alert(`Auto-update enabled! Updated ${response.count} script(s).`);
      await loadScripts();
    } else {
      alert('Auto-update enabled! Scripts will be checked every 6 hours.');
    }
  } else {
    alert('Auto-update disabled. Scripts will not be automatically updated.');
  }
});

// Load scripts and auto-update setting on popup open
console.log('=== POPUP SCRIPT LOADED ===');
console.log('About to call loadScripts()');

// Ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, loading scripts...');
    loadScripts();
    loadAutoUpdateSetting();
  });
} else {
  console.log('DOM already ready, loading scripts immediately...');
  loadScripts();
  loadAutoUpdateSetting();
}
