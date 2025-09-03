// Simple icon management for Amazon review pages
console.log("Background script loaded");

const activeIconCanvas = new OffscreenCanvas(16, 16);
const activeIconCtx = activeIconCanvas.getContext('2d');
activeIconCtx.fillStyle = '#2196F3';
activeIconCtx.fillRect(0, 0, 16, 16);
activeIconCtx.fillStyle = 'white';
activeIconCtx.font = 'bold 12px sans-serif';
activeIconCtx.fillText('A', 4, 12);
const activeIcon = activeIconCtx.getImageData(0, 0, 16, 16);

const inactiveIconCanvas = new OffscreenCanvas(16, 16);
const inactiveIconCtx = inactiveIconCanvas.getContext('2d');
inactiveIconCtx.fillStyle = '#757575';
inactiveIconCtx.fillRect(0, 0, 16, 16);
inactiveIconCtx.fillStyle = 'white';
inactiveIconCtx.font = 'bold 12px sans-serif';
inactiveIconCtx.fillText('A', 4, 12);
const inactiveIcon = inactiveIconCtx.getImageData(0, 0, 16, 16);

// Update icon based on current page
const updateIcon = async (tabId, url) => {
  console.log(`updateIcon called for tab ${tabId} with URL:`, url);
  
  const isReviewPage = url && 
    url.includes("amazon.com/review/review-your-purchases") && 
    url.includes("asin=");
  
  console.log("URL analysis:", {
    hasUrl: !!url,
    includesAmazon: url?.includes("amazon.com"),
    includesReview: url?.includes("review/review-your-purchases"),
    includesAsin: url?.includes("asin="),
    isReviewPage: isReviewPage
  });
  
  const icon = isReviewPage ? activeIcon : inactiveIcon;
  const iconType = isReviewPage ? 'active (blue)' : 'inactive (gray)';
  
  console.log(`Setting icon to: ${iconType}`);
  
  try {
    await chrome.action.setIcon({ imageData: icon, tabId: tabId });
    console.log(`Icon updated successfully to ${iconType} for tab ${tabId}`);
    
    if (isReviewPage) {
      console.log("Review page detected, injecting content script...");
      // Inject content script and show button
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["content-scripts/amazon.js"]
        });
        console.log("Content script injected successfully");
      } catch (error) {
        console.error("Failed to inject content script:", error);
      }
    }
  } catch (error) {
    console.error("Error updating icon:", error);
  }
};

// Listen for tab updates and activation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log(`Tab updated: ${tabId}`, changeInfo);
  if (changeInfo.url) {
    console.log(`URL changed to: ${changeInfo.url}`);
    updateIcon(tabId, changeInfo.url);
  }
});

chrome.tabs.onActivated.addListener(activeInfo => {
  console.log(`Tab activated: ${activeInfo.tabId}`);
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      console.log(`Active tab URL: ${tab.url}`);
      updateIcon(tab.id, tab.url);
    }
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);
  if (request.action === "start_review_process") {
    handleStartReviewProcess(sender.tab);
  }
});

// Start the review process by opening product page
function handleStartReviewProcess(amazonTab) {
  console.log("Starting review process for tab:", amazonTab.id);
  const url = amazonTab.url;
  const asinMatch = url.match(/asin=([A-Z0-9]{10})/);
  if (asinMatch && asinMatch[1]) {
    const asin = asinMatch[1];
    const productPageUrl = `https://www.amazon.com/dp/${asin}`;
    console.log(`Extracted ASIN: ${asin}, opening: ${productPageUrl}`);
    chrome.storage.local.set({ originalAmazonTabId: amazonTab.id });
    chrome.tabs.create({ url: productPageUrl, active: false });
  }
}

