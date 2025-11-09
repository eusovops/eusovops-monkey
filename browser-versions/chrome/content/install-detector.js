// Maimuta Install Detector
// Copyright (c) 2024 Marius Bugaciu. All rights reserved.
// Detects .user.js files and prompts for installation

(function() {
  'use strict';

  // Check if current page is a userscript
  const url = window.location.href;

  // Check for .user.js in URL
  if (url.endsWith('.user.js') || url.includes('.user.js?')) {
    // Wait a bit for content to load
    setTimeout(() => {
      const pageContent = document.body ? document.body.textContent : '';

      // Check if page displays userscript code
      if (pageContent.includes('==UserScript==') && pageContent.includes('==/UserScript==')) {
        showInstallBanner();
      }
    }, 500);
  }

  // Also detect if page is already showing code in a <pre> tag
  if (document.contentType === 'text/plain' || document.querySelector('pre')) {
    const pageContent = document.body ? document.body.textContent : '';
    if (pageContent.includes('==UserScript==') && pageContent.includes('==/UserScript==')) {
      setTimeout(() => showInstallBanner(), 500);
    }
  }

  function showInstallBanner() {
    // Check if banner already exists
    if (document.getElementById('maimuta-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'maimuta-install-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #1976d2;
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;

    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="font-size: 18px; font-weight: 500;">Maimuta</div>
        <div>Do you want to install this userscript?</div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="maimuta-install-btn" style="
          background: #4caf50;
          color: white;
          border: none;
          padding: 8px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        ">Install</button>
        <button id="maimuta-close-btn" style="
          background: rgba(255,255,255,0.2);
          color: white;
          border: none;
          padding: 8px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">Close</button>
      </div>
    `;

    document.body.insertBefore(banner, document.body.firstChild);

    // Add event listeners
    document.getElementById('maimuta-install-btn').addEventListener('click', () => {
      installScript();
    });

    document.getElementById('maimuta-close-btn').addEventListener('click', () => {
      banner.remove();
    });
  }

  function installScript() {
    const code = document.body.textContent;

    chrome.runtime.sendMessage({
      action: 'installScript',
      code: code
    }, (response) => {
      if (response && response.success) {
        alert('Script installed successfully!');
        const banner = document.getElementById('maimuta-install-banner');
        if (banner) banner.remove();
      } else {
        alert('Failed to install script: ' + (response?.error || 'Unknown error'));
      }
    });
  }
})();
