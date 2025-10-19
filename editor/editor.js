// EuSovOps-Monkey Editor Script
// Created by Marius Bugaciu @ EUSOVOPS

let currentScriptId = null;

async function sendMessage(action, data = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action, ...data }, resolve);
  });
}

// Parse metadata from code
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

// Load script for editing
async function loadScript(id) {
  const response = await sendMessage('getScript', { id });
  if (response.success && response.data) {
    const script = response.data;
    document.getElementById('name').value = script.name || '';
    document.getElementById('code').value = script.code || '';
    currentScriptId = id;
  }
}

// Save script
async function saveScript() {
  const name = document.getElementById('name').value.trim();
  const code = document.getElementById('code').value.trim();

  if (!name || !code) {
    alert('Please enter both name and code');
    return;
  }

  // Try to extract name from metadata if not provided
  let scriptName = name;
  if (!scriptName) {
    const metadata = parseMetadata(code);
    scriptName = metadata.name ? metadata.name[0] : 'Unnamed Script';
  }

  if (currentScriptId) {
    // Update existing script
    const response = await sendMessage('updateScript', {
      id: currentScriptId,
      updates: { name: scriptName, code }
    });

    if (response.success) {
      alert('Script saved successfully!');
    } else {
      alert('Failed to save script: ' + response.error);
    }
  } else {
    // Add new script
    const response = await sendMessage('addScript', {
      script: { name: scriptName, code }
    });

    if (response.success) {
      alert('Script created successfully!');
      currentScriptId = response.data.id;
    } else {
      alert('Failed to create script: ' + response.error);
    }
  }
}

// Event listeners
document.getElementById('saveBtn').addEventListener('click', saveScript);

document.getElementById('cancelBtn').addEventListener('click', () => {
  window.close();
});

// Auto-extract name from code when it changes
document.getElementById('code').addEventListener('blur', () => {
  const nameInput = document.getElementById('name');
  if (!nameInput.value) {
    const code = document.getElementById('code').value;
    const metadata = parseMetadata(code);
    if (metadata.name && metadata.name[0]) {
      nameInput.value = metadata.name[0];
    }
  }
});

// Load script if editing
const urlParams = new URLSearchParams(window.location.search);
const scriptId = urlParams.get('id');
if (scriptId) {
  loadScript(scriptId);
}
