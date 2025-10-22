// EuSovOps-Monkey Editor Script
// Created by Marius Bugaciu @ EUSOVOPS

let currentScriptId = null;

// Syntax highlighting function - Enhanced with more colors!
function highlightCode(code) {
  // Escape HTML first
  code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Create a placeholder system to protect already-highlighted code
  const placeholders = [];
  let placeholderIndex = 0;

  function createPlaceholder(content) {
    const id = `__PLACEHOLDER_${placeholderIndex++}__`;
    placeholders.push({ id, content });
    return id;
  }

  function restorePlaceholders(text) {
    placeholders.forEach(({ id, content }) => {
      text = text.replace(new RegExp(id, 'g'), content);
    });
    return text;
  }

  // Highlight userscript metadata comments (FIRST - highest priority)
  code = code.replace(/(\/\/ @\w+.*)/g, (match) => {
    return createPlaceholder(`<span class="token-metadata">${match}</span>`);
  });

  // Highlight multi-line comments
  code = code.replace(/(\/\*[\s\S]*?\*\/)/g, (match) => {
    return createPlaceholder(`<span class="token-comment">${match}</span>`);
  });

  // Highlight single-line comments (but not metadata)
  code = code.replace(/(\/\/(?! @).*)/g, (match) => {
    return createPlaceholder(`<span class="token-comment">${match}</span>`);
  });

  // Highlight template literals (before regular strings)
  code = code.replace(/(`(?:\\.|[^`\\])*`)/g, (match) => {
    return createPlaceholder(`<span class="token-string">${match}</span>`);
  });

  // Highlight strings (double quotes)
  code = code.replace(/("(?:\\.|[^"\\])*")/g, (match) => {
    return createPlaceholder(`<span class="token-string">${match}</span>`);
  });

  // Highlight strings (single quotes)
  code = code.replace(/('(?:\\.|[^'\\])*')/g, (match) => {
    return createPlaceholder(`<span class="token-string">${match}</span>`);
  });

  // Highlight numbers (including decimals and hex) - PROTECT IMMEDIATELY
  code = code.replace(/\b(0x[0-9a-fA-F]+|\d+\.?\d*)\b/g, (match) => {
    return createPlaceholder(`<span class="token-number">${match}</span>`);
  });

  // Highlight booleans and special values - PROTECT IMMEDIATELY
  code = code.replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g, (match) => {
    return createPlaceholder(`<span class="token-boolean">${match}</span>`);
  });

  // Highlight 'this' and 'super' (special keywords) - PROTECT IMMEDIATELY
  code = code.replace(/\b(this|super)\b/g, (match) => {
    return createPlaceholder(`<span class="token-this">${match}</span>`);
  });

  // Highlight built-in objects - PROTECT IMMEDIATELY
  const builtins = ['console', 'window', 'document', 'localStorage', 'sessionStorage', 'Math', 'Date',
                    'Array', 'Object', 'String', 'Number', 'Boolean', 'RegExp', 'Error', 'JSON',
                    'Promise', 'Set', 'Map', 'WeakMap', 'WeakSet', 'Symbol', 'Proxy', 'Reflect'];

  builtins.forEach(builtin => {
    const regex = new RegExp(`\\b(${builtin})\\b`, 'g');
    code = code.replace(regex, (match) => {
      return createPlaceholder(`<span class="token-builtin">${match}</span>`);
    });
  });

  // Highlight control flow keywords (purple) - PROTECT IMMEDIATELY
  const controlKeywords = ['if', 'else', 'switch', 'case', 'default', 'for', 'while', 'do',
                          'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw'];

  controlKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
    code = code.replace(regex, (match) => {
      return createPlaceholder(`<span class="token-control">${match}</span>`);
    });
  });

  // Highlight declaration keywords (pink) - PROTECT IMMEDIATELY
  const declarationKeywords = ['function', 'const', 'let', 'var', 'class', 'extends', 'new',
                               'async', 'await', 'yield', 'import', 'export', 'from', 'default',
                               'static', 'get', 'set', 'typeof', 'instanceof', 'in', 'of',
                               'delete', 'void', 'debugger', 'with'];

  declarationKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
    code = code.replace(regex, (match) => {
      return createPlaceholder(`<span class="token-keyword">${match}</span>`);
    });
  });

  // Highlight function names - PROTECT IMMEDIATELY
  code = code.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, (match, funcName) => {
    return createPlaceholder(`<span class="token-function">${funcName}</span>`) + '(';
  });

  // Highlight object properties (after dot) - PROTECT IMMEDIATELY
  code = code.replace(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, (match, propName) => {
    return '.' + createPlaceholder(`<span class="token-property">${propName}</span>`);
  });

  // Restore all placeholders (comments and strings)
  code = restorePlaceholders(code);

  return code;
}

// Update syntax highlighting
function updateHighlight() {
  const textarea = document.getElementById('code');
  const highlight = document.getElementById('codeHighlight');
  const code = textarea.value;

  const highlighted = highlightCode(code);
  console.log('Highlighted code sample:', highlighted.substring(0, 200));
  highlight.innerHTML = highlighted;

  // Sync scroll
  highlight.scrollTop = textarea.scrollTop;
  highlight.scrollLeft = textarea.scrollLeft;
}

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

document.getElementById('saveCloseBtn').addEventListener('click', async () => {
  await saveScript();
  window.close();
});

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
  loadScript(scriptId).then(() => {
    // Update highlighting after loading script
    updateHighlight();
  });
}

// Initialize syntax highlighting
const codeTextarea = document.getElementById('code');
const codeHighlight = document.getElementById('codeHighlight');

// Update highlighting on input
codeTextarea.addEventListener('input', updateHighlight);

// Sync scroll between textarea and highlight
codeTextarea.addEventListener('scroll', () => {
  codeHighlight.scrollTop = codeTextarea.scrollTop;
  codeHighlight.scrollLeft = codeTextarea.scrollLeft;
});

// Support Tab key for indentation
codeTextarea.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = codeTextarea.selectionStart;
    const end = codeTextarea.selectionEnd;
    const value = codeTextarea.value;

    // Insert 2 spaces at cursor position
    codeTextarea.value = value.substring(0, start) + '  ' + value.substring(end);
    codeTextarea.selectionStart = codeTextarea.selectionEnd = start + 2;

    // Update highlighting
    updateHighlight();
  }
});

// Initial highlight
updateHighlight();
