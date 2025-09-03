// background.js

// --- Dynamic Icon Generation ---
// This function creates an icon using the OffscreenCanvas API.
// It draws a letter onto a colored background, removing the need for static image files.
const createIcon = (color, text) => {
  const size = 128; // Create a high-res icon, Chrome will scale it down.
  const canvas = new OffscreenCanvas(size, size);
  const context = canvas.getContext('2d');

  // Draw background
  context.fillStyle = color;
  context.fillRect(0, 0, size, size);

  // Draw text
  context.fillStyle = 'white';
  context.font = 'bold 90px "Arial"';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, size / 2, size / 2 + 10); // Adjust for vertical centering

  return context.getImageData(0, 0, size, size);
};

// Generate icons once and store them
const ACTIVE_ICON = createIcon('#1976D2', 'A'); // Blue background for active, now with 'A'
const INACTIVE_ICON = createIcon('#78909C', 'A'); // Gray background for inactive, now with 'A'

// UPDATED: This regex now treats the trailing slash before the '?' as optional (\/?)
// This makes it more robust for different URL variations.
const reviewPagePattern = /^https:\/\/www\.amazon\.com\/review\/review-your-purchases\/?\?.*asin=/;

// This function updates the extension icon based on the URL.
const updateIcon = async (tabId, url) => {
  if (url && reviewPagePattern.test(url)) {
    // Set the active (color) icon
    await chrome.action.setIcon({ imageData: ACTIVE_ICON, tabId: tabId });
    // Notify the content script to add the button
    chrome.tabs.sendMessage(tabId, { action: "show_write_review_button" });
  } else {
    // Set the inactive (grayscale) icon
    await chrome.action.setIcon({ imageData: INACTIVE_ICON, tabId: tabId });
  }
};

// Set the initial inactive icon when the extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setIcon({ imageData: INACTIVE_ICON });
});

// Listen for when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateIcon(tabId, tab.url);
  }
});

// Listen for when the active tab changes
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message);
    } else if (tab && tab.url) {
      updateIcon(tab.id, tab.url);
    }
  });
});

