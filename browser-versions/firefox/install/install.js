// Copyright (c) 2024 Marius Bugaciu. All rights reserved.
// Maimuta Install Page
// Created by Marius Bugaciu @ EUSOVOPS

let scriptCode = '';
let scriptUrl = '';
let scriptMetadata = {};

async function init() {
  // Get URL from query parameter
  const params = new URLSearchParams(window.location.search);
  scriptUrl = params.get('url');

  if (!scriptUrl) {
    showError('No script URL provided');
    return;
  }

  // Fetch through background service worker to avoid CORS issues
  chrome.runtime.sendMessage({
    action: 'fetchUserscript',
    url: scriptUrl
  }, (response) => {
    if (response && response.success) {
      scriptCode = response.code;
      scriptMetadata = parseMetadata(scriptCode);
      displayInstallPage();
    } else {
      showError(`Failed to load script: ${response?.error || 'Unknown error'}`);
    }
  });
}

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

function displayInstallPage() {
  const name = scriptMetadata.name ? scriptMetadata.name[0] : 'Unnamed Script';
  const version = scriptMetadata.version ? scriptMetadata.version[0] : 'Unknown';
  const author = scriptMetadata.author ? scriptMetadata.author[0] : 'Unknown';
  const description = scriptMetadata.description ? scriptMetadata.description[0] : 'No description';
  const matches = scriptMetadata.match || scriptMetadata.include || [];

  const container = document.getElementById('container');
  container.textContent = '';

  // Header
  const header = document.createElement('div');
  header.className = 'header';
  const h1 = document.createElement('h1');
  h1.textContent = '📦 Install Userscript';
  const p = document.createElement('p');
  p.textContent = 'Review and install this script into Maimuta';
  header.appendChild(h1);
  header.appendChild(p);

  // Content
  const content = document.createElement('div');
  content.className = 'content';

  // Info box
  const infoBox = document.createElement('div');
  infoBox.className = 'info-box';

  // Helper function to create info rows
  const createInfoRow = (label, value, isHTML = false) => {
    const row = document.createElement('div');
    row.className = 'info-row';
    const labelDiv = document.createElement('div');
    labelDiv.className = 'info-label';
    labelDiv.textContent = label;
    const valueDiv = document.createElement('div');
    valueDiv.className = 'info-value';
    if (isHTML) {
      valueDiv.appendChild(value);
    } else {
      valueDiv.textContent = value;
    }
    row.appendChild(labelDiv);
    row.appendChild(valueDiv);
    return row;
  };

  // Name
  const nameStrong = document.createElement('strong');
  nameStrong.textContent = name;
  infoBox.appendChild(createInfoRow('Name:', nameStrong, true));

  // Version, Author, Description
  infoBox.appendChild(createInfoRow('Version:', version));
  infoBox.appendChild(createInfoRow('Author:', author));
  infoBox.appendChild(createInfoRow('Description:', description));

  // Runs on
  const runsOnValue = document.createElement('div');
  if (matches.length > 0) {
    matches.forEach((match, idx) => {
      if (idx > 0) runsOnValue.appendChild(document.createElement('br'));
      runsOnValue.appendChild(document.createTextNode(match));
    });
  } else {
    runsOnValue.textContent = 'No URL patterns specified';
  }
  const runsOnRow = createInfoRow('Runs on:', runsOnValue, true);
  infoBox.appendChild(runsOnRow);

  // Source
  const sourceLink = document.createElement('a');
  sourceLink.href = scriptUrl;
  sourceLink.target = '_blank';
  sourceLink.style.color = '#667eea';
  sourceLink.style.textDecoration = 'none';
  sourceLink.textContent = scriptUrl;
  infoBox.appendChild(createInfoRow('Source:', sourceLink, true));

  content.appendChild(infoBox);

  // Details (source code)
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.style.cursor = 'pointer';
  summary.style.padding = '12px';
  summary.style.background = '#f8f9fa';
  summary.style.borderRadius = '8px';
  summary.style.marginBottom = '12px';
  summary.style.fontWeight = '600';
  summary.textContent = '📄 View Source Code';

  const codePreview = document.createElement('div');
  codePreview.className = 'code-preview';
  codePreview.textContent = scriptCode;

  details.appendChild(summary);
  details.appendChild(codePreview);
  content.appendChild(details);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.id = 'cancelBtn';
  cancelBtn.textContent = 'Cancel';

  const installBtn = document.createElement('button');
  installBtn.className = 'btn-install';
  installBtn.id = 'installBtn';
  installBtn.textContent = '✓ Install Script';

  actions.appendChild(cancelBtn);
  actions.appendChild(installBtn);
  content.appendChild(actions);

  // Assemble
  container.appendChild(header);
  container.appendChild(content);

  // Add event listeners
  cancelBtn.addEventListener('click', closeTab);
  installBtn.addEventListener('click', installScript);
}

async function installScript(event) {
  console.log('Install button clicked');
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Installing...';

  try {
    console.log('Sending installScript message with code length:', scriptCode.length);

    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'installScript',
        code: scriptCode
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('Raw response received:', response);
          resolve(response);
        }
      });
    });

    console.log('Install response:', response);

    if (response && response.success) {
      console.log('Success! Showing success page');
      showSuccess();
    } else {
      console.error('Install failed:', response);
      showError('Failed to install script: ' + (response?.error || 'Unknown error'));
      btn.disabled = false;
      btn.textContent = '✓ Install Script';
    }
  } catch (error) {
    console.error('Install exception:', error);
    showError('Error: ' + error.message);
    btn.disabled = false;
    btn.textContent = '✓ Install Script';
  }
}

function showSuccess() {
  const container = document.getElementById('container');
  container.textContent = '';

  // Header
  const header = document.createElement('div');
  header.className = 'header';
  const h1 = document.createElement('h1');
  h1.textContent = '✓ Success!';
  const p = document.createElement('p');
  p.textContent = 'Script installed successfully';
  header.appendChild(h1);
  header.appendChild(p);

  // Content
  const content = document.createElement('div');
  content.className = 'content';

  const successDiv = document.createElement('div');
  successDiv.className = 'success';
  const h2 = document.createElement('h2');
  h2.textContent = 'Script Installed!';
  const successP = document.createElement('p');
  successP.textContent = 'The userscript has been installed and enabled in Maimuta.';
  successDiv.appendChild(h2);
  successDiv.appendChild(successP);

  const actions = document.createElement('div');
  actions.className = 'actions';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-install';
  closeBtn.id = 'closeBtn';
  closeBtn.textContent = 'Close';
  actions.appendChild(closeBtn);

  content.appendChild(successDiv);
  content.appendChild(actions);

  container.appendChild(header);
  container.appendChild(content);

  closeBtn.addEventListener('click', () => {
    window.close();
  });
}

function showError(message) {
  const container = document.getElementById('container');
  container.textContent = '';

  // Check if it's a duplicate script error
  const isDuplicateError = message && message.includes('already exists');
  const errorTitle = isDuplicateError ? 'Script Already Installed' : 'Failed to load userscript';

  // Header
  const header = document.createElement('div');
  header.className = 'header';
  const h1 = document.createElement('h1');
  h1.textContent = (isDuplicateError ? '⚠️' : '❌') + ' Error';
  const p = document.createElement('p');
  p.textContent = errorTitle;
  header.appendChild(h1);
  header.appendChild(p);

  // Content
  const content = document.createElement('div');
  content.className = 'content';

  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  const strong = document.createElement('strong');
  strong.textContent = 'Error:';
  errorDiv.appendChild(strong);
  errorDiv.appendChild(document.createTextNode(' ' + message));

  const actions = document.createElement('div');
  actions.className = 'actions';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-cancel';
  closeBtn.id = 'errorCloseBtn';
  closeBtn.textContent = 'Close';
  actions.appendChild(closeBtn);

  content.appendChild(errorDiv);
  content.appendChild(actions);

  container.appendChild(header);
  container.appendChild(content);

  // Add event listener
  document.getElementById('errorCloseBtn').addEventListener('click', closeTab);
}

function closeTab() {
  // Try to close the tab
  chrome.runtime.sendMessage({ action: 'closeCurrentTab' }, () => {
    // Fallback to window.close if message fails
    window.close();
  });
}

function goBack() {
  window.history.back();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load
init();
