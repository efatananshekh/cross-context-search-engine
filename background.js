// background.js
// Customer Dashboard Launcher - Configurable version

// ============================================================
// CONFIGURATION SECTION - EDIT THESE VALUES
// ============================================================

// Set your dashboard URL (Metabase or any dashboard that accepts URL parameters)
// Example: "http://YOUR_DASHBOARD_IP:3000/public/dashboard/YOUR_DASHBOARD_ID"
const DASHBOARD_URL = "YOUR_DASHBOARD_URL_HERE";

// Set your source domain (where phone numbers are extracted from)
// Example: "cs.yourcompany.com"
const SOURCE_DOMAIN = "YOUR_DOMAIN_HERE";

// Set your case view path (example: "inquiry-center/cases/view")
const CASE_PATH = "YOUR_CASE_PATH_HERE";

// Set your customer center path (example: "customer-center")
const CUSTOMER_PATH = "YOUR_CUSTOMER_PATH_HERE";

// ============================================================
// END CONFIGURATION
// ============================================================

let dashboardTabId = null;
let currentDashboardPhone = null;
let dashboardLastUpdated = null;

// Store phone numbers for each order tab with metadata
const tabPhones = new Map();

// Track tab activation order (most recent first)
const tabActivationHistory = [];

// Configuration
const MAX_TABS = 100;
const UPDATE_DELAY = 100;
const HEALTH_CHECK_INTERVAL = 10000;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!sender.tab) return;
  
  const tabId = sender.tab.id;
  const senderUrl = sender.tab.url || '';
  
  // Validate origin using configured paths
  const pathPattern = new RegExp(`^https:\\/\\/${SOURCE_DOMAIN.replace(/\./g, '\\.')}\\/(?:${CASE_PATH}|${CUSTOMER_PATH})(?:\\/.*|$)`, 'i');
  if (!pathPattern.test(senderUrl)) {
    return;
  }

  if (msg && msg.action === 'phoneDetected' && msg.phone) {
    const phone = String(msg.phone).replace(/^0+/, '');
    console.log(`📞 Tab ${tabId} phone: ${msg.phone} → ${phone}`);
    
    tabPhones.set(tabId, {
      phone: phone,
      timestamp: Date.now(),
      url: senderUrl,
      title: sender.tab.title || ''
    });
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id === tabId) {
        console.log(`✨ Active tab detected, updating dashboard to: ${phone}`);
        updateDashboard(phone);
      }
    });
    
    sendResponse({ ok: true });
    return true;
  }
  
  if (msg && msg.action === 'ping') {
    sendResponse({ 
      pong: true, 
      currentPhone: currentDashboardPhone,
      tabCount: tabPhones.size 
    });
    return true;
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId;
  console.log(`🔄 Tab activated: ${tabId}`);
  
  tabActivationHistory.unshift(tabId);
  if (tabActivationHistory.length > 50) tabActivationHistory.pop();
  
  checkTabAndUpdate(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log(`📄 Tab ${tabId} finished loading`);
    
    setTimeout(() => {
      checkTabAndUpdate(tabId);
    }, 500);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabPhones.has(tabId)) {
    console.log(`🗑️ Tab ${tabId} closed, removing data`);
    tabPhones.delete(tabId);
  }
  
  const index = tabActivationHistory.indexOf(tabId);
  if (index > -1) tabActivationHistory.splice(index, 1);
  
  if (tabId === dashboardTabId) {
    dashboardTabId = null;
    console.log('📊 Dashboard tab closed');
  }
});

function checkTabAndUpdate(tabId) {
  const tabData = tabPhones.get(tabId);
  
  if (tabData) {
    console.log(`📱 Tab ${tabId} has phone: ${tabData.phone} (current dashboard: ${currentDashboardPhone})`);
    
    if (tabData.phone !== currentDashboardPhone) {
      console.log(`🔄 Phone mismatch, updating dashboard to: ${tabData.phone}`);
      updateDashboard(tabData.phone);
    } else {
      console.log(`✅ Phone matches current dashboard, no update needed`);
    }
  } else {
    console.log(`⏳ Tab ${tabId} has no phone data yet`);
    queryTabForPhone(tabId);
  }
}

function queryTabForPhone(tabId) {
  try {
    chrome.tabs.sendMessage(tabId, { action: 'getPhone' }, (response) => {
      if (chrome.runtime.lastError) {
        return;
      }
      
      if (response && response.phone) {
        const phone = String(response.phone).replace(/^0+/, '');
        console.log(`📞 Direct query got phone for tab ${tabId}: ${phone}`);
        
        tabPhones.set(tabId, {
          phone: phone,
          timestamp: Date.now(),
          url: '',
          title: ''
        });
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (activeTab && activeTab.id === tabId) {
            updateDashboard(phone);
          }
        });
      }
    });
  } catch (e) {
    // Ignore errors
  }
}

setInterval(() => {
  console.log('🏥 Running health check...');
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab) return;
    
    const tabId = activeTab.id;
    const tabData = tabPhones.get(tabId);
    
    if (tabData) {
      if (tabData.phone !== currentDashboardPhone) {
        console.log(`⚠️ Health check: Dashboard out of sync (${currentDashboardPhone} vs ${tabData.phone}), fixing...`);
        updateDashboard(tabData.phone);
      } else {
        console.log(`✅ Health check: Dashboard in sync with active tab`);
      }
    } else {
      queryTabForPhone(tabId);
    }
  });
  
  verifyDashboardTab();
}, HEALTH_CHECK_INTERVAL);

function verifyDashboardTab() {
  if (!dashboardTabId) return;
  
  try {
    chrome.tabs.get(dashboardTabId, (tab) => {
      if (chrome.runtime.lastError) {
        console.log('📊 Dashboard tab no longer exists');
        dashboardTabId = null;
      }
    });
  } catch (e) {
    dashboardTabId = null;
  }
}

let updateTimeout = null;

function updateDashboard(phone) {
  if (updateTimeout) clearTimeout(updateTimeout);
  
  updateTimeout = setTimeout(() => {
    performDashboardUpdate(phone);
  }, UPDATE_DELAY);
}

async function performDashboardUpdate(phone) {
  try {
    if (phone === currentDashboardPhone) {
      console.log('📊 Phone unchanged, skipping update');
      return;
    }
    
    console.log('📊 Updating dashboard to:', phone);
    
    const url = new URL(DASHBOARD_URL);
    url.searchParams.set('customer_id', '');
    url.searchParams.set('number', '');
    url.searchParams.set('number_1', '');
    url.searchParams.set('number_2', '');
    url.searchParams.set('phone', phone);
    url.searchParams.set('tab', '19-profile');
    
    const dashboardUrl = url.toString();
    
    let targetTabId = dashboardTabId;
    
    if (!targetTabId) {
      const tabs = await chrome.tabs.query({});
      const dashboardIdPattern = DASHBOARD_URL.split('/').pop();
      const existingDashboard = tabs.find(t => 
        t.url && t.url.includes(dashboardIdPattern)
      );
      
      if (existingDashboard) {
        targetTabId = existingDashboard.id;
        dashboardTabId = targetTabId;
        console.log('📊 Found existing dashboard tab:', targetTabId);
      }
    }
    
    if (targetTabId) {
      try {
        await chrome.tabs.update(targetTabId, { 
          url: dashboardUrl, 
          active: false 
        });
        console.log('📊 Updated dashboard tab:', targetTabId);
        currentDashboardPhone = phone;
        dashboardLastUpdated = Date.now();
      } catch (e) {
        console.log('📊 Failed to update existing tab, creating new one');
        const newTab = await chrome.tabs.create({ 
          url: dashboardUrl, 
          active: false 
        });
        dashboardTabId = newTab.id;
        currentDashboardPhone = phone;
        dashboardLastUpdated = Date.now();
      }
    } else {
      const newTab = await chrome.tabs.create({ 
        url: dashboardUrl, 
        active: false 
      });
      dashboardTabId = newTab.id;
      currentDashboardPhone = phone;
      dashboardLastUpdated = Date.now();
      console.log('📊 Created new dashboard tab:', newTab.id);
    }
    
    setTimeout(() => {
      if (currentDashboardPhone === phone) {
        console.log(`✅ Dashboard successfully updated to ${phone}`);
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error updating dashboard:', error);
  }
}

function emergencyRecovery() {
  console.log('🚨 Running emergency recovery...');
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab) return;
    
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => {
        const text = document.body.innerText || '';
        const match = text.match(/\b(01\d{9})\b/);
        return match ? match[1] : null;
      }
    }, (results) => {
      if (results && results[0] && results[0].result) {
        const phone = results[0].result.replace(/^0+/, '');
        console.log('🚑 Emergency recovery got phone:', phone);
        updateDashboard(phone);
      }
    });
  });
}

setInterval(emergencyRecovery, 60000);

setInterval(() => {
  const now = Date.now();
  const THIRTY_MINUTES = 30 * 60 * 1000;
  
  for (const [tabId, data] of tabPhones.entries()) {
    if (now - data.timestamp > THIRTY_MINUTES) {
      console.log(`🧹 Cleaning up stale data for tab ${tabId}`);
      tabPhones.delete(tabId);
    }
  }
}, 5 * 60 * 1000);