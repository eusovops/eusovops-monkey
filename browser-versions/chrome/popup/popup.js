// Maimuta Popup Script
// Copyright (c) 2024 Marius Bugaciu. All rights reserved.

async function sendMessage(action, data = {}) {
  console.log('sendMessage called:', action, data);
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ action, ...data }, (response) => {
        console.log('sendMessage response received:', response);
        if (chrome.runtime.lastError) {
          console.error('Message error:', chrome.runtime.lastError);
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { success: false, error: 'No response' });
        }
      });
    } catch (error) {
      console.error('sendMessage exception:', error);
      resolve({ success: false, error: error.message });
    }
  });
}

async function loadScripts() {
  try {
    const response = await sendMessage('getScripts');
    if (response.success) {
      displayScripts(response.data || []);
    } else {
      console.error('Failed to load scripts:', response.error);
      document.getElementById('scriptsList').innerHTML =
        '<div class="empty-state">Error loading scripts</div>';
    }
  } catch (error) {
    console.error('Load scripts error:', error);
  }
}

function displayScripts(scripts) {
  const listEl = document.getElementById('scriptsList');

  if (!scripts || scripts.length === 0) {
    listEl.innerHTML = '<div class="empty-state">No scripts installed</div>';
    return;
  }

  // Filter out any malformed scripts
  const validScripts = scripts.filter(script => script && script.id);

  if (validScripts.length === 0) {
    listEl.innerHTML = '<div class="empty-state">No valid scripts</div>';
    return;
  }

  listEl.innerHTML = validScripts.map(script => {
    const scriptId = String(script.id || '');
    const scriptName = escapeHtml(script.name || 'Unnamed Script');
    const isEnabled = script.enabled !== false;

    return `
      <div class="script-item" data-id="${scriptId}">
        <div class="script-info">
          <div class="script-name">${scriptName}</div>
          <div class="script-status">${isEnabled ? 'Enabled' : 'Disabled'}</div>
        </div>
        <div class="script-actions">
          <button class="toggle-btn ${isEnabled ? 'enabled' : 'disabled'}" data-id="${scriptId}">
            ${isEnabled ? 'ON' : 'OFF'}
          </button>
          <button class="edit-btn" data-id="${scriptId}">Edit</button>
          <button class="delete-btn" data-id="${scriptId}">Delete</button>
        </div>
      </div>
    `;
  }).join('');

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
  const result = await chrome.storage.local.get(['autoUpdateEnabled']);
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
  await chrome.storage.local.set({ autoUpdateEnabled: enabled });

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
loadScripts();
loadAutoUpdateSetting();
