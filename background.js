// background.js

// This function updates the extension icon based on the URL.
const updateIcon = async (tabId, url) => {
  const reviewPagePattern = /^https://www\.amazon\.com\/review\/review-your-purchases\/\?.*asin=/;

  if (url && reviewPagePattern.test(url)) {
    // Set the active (color) icon
    await chrome.action.setIcon({
      path: {
        "16": "images/icon16.png",
        "48": "images/icon48.png",
        "128": "images/icon128.png"
      },
      tabId: tabId
    });
    // Notify the content script to add the button
    chrome.tabs.sendMessage(tabId, { action: "show_write_review_button" });
  } else {
    // Set the inactive (grayscale) icon
    await chrome.action.setIcon({
      path: {
        "16": "images/icon16-inactive.png",
        "48": "images/icon48-inactive.png",
        "128": "images/icon128-inactive.png"
      },
      tabId: tabId
    });
  }
};

// Listen for when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Wait for the tab to finish loading
  if (changeInfo.status === 'complete' && tab.url) {
    updateIcon(tabId, tab.url);
  }
});

// Listen for when the active tab changes
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) {
        // Handle error, e.g., tab might be closed
        console.log(chrome.runtime.lastError.message);
    } else if (tab && tab.url) {
        updateIcon(tab.id, tab.url);
    }
  });
});
