// content.js
// Customer Dashboard Launcher - Phone extraction

(function () {
  const DEBUG = true;
  function log(...args) { 
    if (DEBUG) console.log(`[${new Date().toLocaleTimeString()}] [dashboard-launcher]`, ...args); 
  }

  function normalize(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

  function normalizePhone(raw) {
    if (!raw) return '';
    const digits = raw.replace(/\D+/g, '');
    if (digits.length === 11 && digits.startsWith('01')) return digits;
    if (digits.length === 13 && digits.startsWith('8801')) return '0' + digits.slice(3);
    if (digits.length === 12 && digits.startsWith('880') && digits[3] === '1') return '0' + digits.slice(3);
    if (digits.length === 10 && digits.startsWith('1')) return '0' + digits;
    return '';
  }

  function extractPhoneFromText(text) {
    if (!text) return '';
    
    const patterns = [
      /\((?:[^()]*?-\s*)?(\+?8801\d{9}|01\d{9}|0\d{10})\)/,
      /-\s*(\+?8801\d{9}|01\d{9}|0\d{10})\b/,
      /\b(\+?8801\d{9}|01\d{9}|0\d{10})\b/,
      /\b(01\d{9})\b/,
      /\b(1\d{9})\b/
    ];
    
    for (const pattern of patterns) {
      const m = text.match(pattern);
      if (m && m[1]) {
        const phone = normalizePhone(m[1]);
        if (phone) return phone;
      }
    }
    
    return '';
  }

  function findShippingValueCell() {
    const strategies = [
      () => {
        const tables = document.querySelectorAll('table');
        for (const table of tables) {
          const rows = table.querySelectorAll('tr');
          for (const row of rows) {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 2) {
              const label = normalize(cells[0].textContent || '');
              if (/shipping|delivery/i.test(label)) {
                return cells[1];
              }
            }
          }
        }
        return null;
      },
      
      () => {
        const addressElements = document.querySelectorAll('[class*="address"], [class*="Address"]');
        for (const el of addressElements) {
          const text = el.textContent || '';
          if (extractPhoneFromText(text)) {
            return el;
          }
        }
        return null;
      },
      
      () => {
        const allElements = document.querySelectorAll('p, div, span, td');
        for (const el of allElements) {
          const text = el.textContent || '';
          if (extractPhoneFromText(text)) {
            return el;
          }
        }
        return null;
      }
    ];
    
    for (const strategy of strategies) {
      const result = strategy();
      if (result) return result;
    }
    
    return null;
  }

  let lastDetectedPhone = '';
  let detectionAttempts = 0;
  const MAX_ATTEMPTS = 20;

  function detectPhone() {
    const valueCell = findShippingValueCell();
    if (!valueCell) {
      if (detectionAttempts < MAX_ATTEMPTS) {
        detectionAttempts++;
        return null;
      }
      return null;
    }
    
    const text = normalize(valueCell.innerText || valueCell.textContent || '');
    const phone = extractPhoneFromText(text);
    
    if (phone) {
      detectionAttempts = 0;
    }
    
    return phone;
  }

  function sendPhone(phone) {
    if (!phone) return;
    
    try {
      chrome.runtime.sendMessage(
        { action: 'phoneDetected', phone: phone },
        (response) => {
          if (chrome.runtime.lastError) {
            log('Failed to send phone:', chrome.runtime.lastError);
            setTimeout(() => {
              chrome.runtime.sendMessage({ action: 'phoneDetected', phone });
            }, 1000);
          } else {
            log('Phone sent successfully:', phone);
          }
        }
      );
    } catch (e) {
      log('Error sending phone:', e);
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'getPhone') {
      const phone = detectPhone();
      sendResponse({ phone: phone });
      return true;
    }
  });

  function startDetection() {
    let attempts = 0;
    const maxAttempts = 15;
    
    function attempt() {
      const phone = detectPhone();
      
      if (phone) {
        log('Phone detected on attempt', attempts + 1, ':', phone);
        if (phone !== lastDetectedPhone) {
          lastDetectedPhone = phone;
          sendPhone(phone);
        }
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(attempt, 500);
      } else {
        log('No phone found after', maxAttempts, 'attempts');
      }
    }
    
    attempt();
  }

  setTimeout(startDetection, 500);

  let observer = null;
  let observerTimeout = null;

  function setupObserver() {
    if (observer) observer.disconnect();
    
    observer = new MutationObserver((mutations) => {
      if (observerTimeout) clearTimeout(observerTimeout);
      
      observerTimeout = setTimeout(() => {
        const phone = detectPhone();
        if (phone && phone !== lastDetectedPhone) {
          lastDetectedPhone = phone;
          sendPhone(phone);
        }
      }, 300);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  setupObserver();

  setInterval(() => {
    const phone = detectPhone();
    if (phone && phone !== lastDetectedPhone) {
      lastDetectedPhone = phone;
      sendPhone(phone);
    }
  }, 2000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const phone = detectPhone();
      if (phone && phone !== lastDetectedPhone) {
        lastDetectedPhone = phone;
        sendPhone(phone);
      }
    }
  });

  log('Customer Dashboard Launcher initialized');
})();