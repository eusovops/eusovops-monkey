// EuSovOps-Monkey Content Script
// Bridge between page context (MAIN world) and extension context
// Created by Marius Bugaciu @ EUSOVOPS

console.log('EuSovOps-Monkey content script loaded');

// Listen for messages from the page (injected GM API)
window.addEventListener('message', (event) => {
  // Only accept messages from same origin
  if (event.source !== window) return;

  // Check if it's a GM API request
  if (event.data && event.data.type === 'EUSOVOPS_GM_REQUEST') {
    const { requestId, action, payload } = event.data;

    // Forward to background service worker
    chrome.runtime.sendMessage({ action, ...payload }, (response) => {
      // Send response back to page
      window.postMessage({
        type: 'EUSOVOPS_GM_RESPONSE',
        requestId: requestId,
        response: response
      }, '*');
    });
  }
});

// Notify page that bridge is ready
window.postMessage({ type: 'EUSOVOPS_BRIDGE_READY' }, '*');
