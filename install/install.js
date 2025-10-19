// EuSovOps-Monkey Install Page
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

  try {
    // Fetch the script
    const response = await fetch(scriptUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    scriptCode = await response.text();
    scriptMetadata = parseMetadata(scriptCode);

    // Display the install page
    displayInstallPage();
  } catch (error) {
    showError(`Failed to load script: ${error.message}`);
  }
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
  container.innerHTML = `
    <div class="header">
      <h1>📦 Install Userscript</h1>
      <p>Review and install this script into EuSovOps-Monkey</p>
    </div>

    <div class="content">
      <div class="info-box">
        <div class="info-row">
          <div class="info-label">Name:</div>
          <div class="info-value"><strong>${escapeHtml(name)}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Version:</div>
          <div class="info-value">${escapeHtml(version)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Author:</div>
          <div class="info-value">${escapeHtml(author)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Description:</div>
          <div class="info-value">${escapeHtml(description)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Runs on:</div>
          <div class="info-value">${matches.length > 0 ? matches.map(m => escapeHtml(m)).join('<br>') : 'No URL patterns specified'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Source:</div>
          <div class="info-value"><a href="${escapeHtml(scriptUrl)}" target="_blank" style="color: #667eea; text-decoration: none;">${escapeHtml(scriptUrl)}</a></div>
        </div>
      </div>

      <details>
        <summary style="cursor: pointer; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 12px; font-weight: 600;">
          📄 View Source Code
        </summary>
        <div class="code-preview">${escapeHtml(scriptCode)}</div>
      </details>

      <div class="actions">
        <button class="btn-cancel" id="cancelBtn">Cancel</button>
        <button class="btn-install" id="installBtn">✓ Install Script</button>
      </div>
    </div>
  `;

  // Add event listeners
  document.getElementById('cancelBtn').addEventListener('click', goBack);
  document.getElementById('installBtn').addEventListener('click', installScript);
}

async function installScript(event) {
  console.log('Install button clicked');
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Installing...';

  try {
    console.log('Sending installScript message with code length:', scriptCode.length);

    const response = await chrome.runtime.sendMessage({
      action: 'installScript',
      code: scriptCode
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
  container.innerHTML = `
    <div class="header">
      <h1>✓ Success!</h1>
      <p>Script installed successfully</p>
    </div>

    <div class="content">
      <div class="success">
        <h2>Script Installed!</h2>
        <p>The userscript has been installed and enabled in EuSovOps-Monkey.</p>
      </div>

      <div class="actions">
        <button class="btn-install" id="closeBtn">Close</button>
      </div>
    </div>
  `;

  document.getElementById('closeBtn').addEventListener('click', () => {
    window.close();
  });
}

function showError(message) {
  const container = document.getElementById('container');
  container.innerHTML = `
    <div class="header">
      <h1>❌ Error</h1>
      <p>Failed to load userscript</p>
    </div>

    <div class="content">
      <div class="error">
        <strong>Error:</strong> ${escapeHtml(message)}
      </div>

      <div class="actions">
        <button class="btn-cancel" onclick="goBack()">Go Back</button>
      </div>
    </div>
  `;
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
