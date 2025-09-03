// AI Review Assistant Background Script
console.log("AI Review Assistant background script loaded!");

// Function to check if a URL is an Amazon review page
function isAmazonReviewPage(url) {
  return url && url.includes('amazon.com/review/');
}

// Function to extract product information from Amazon product page
async function extractProductInfo(asin) {
  try {
    const productUrl = `https://www.amazon.com/dp/${asin}`;
    console.log("Fetching product info from:", productUrl);
    
    // Create a new tab to fetch the product page
    const tab = await chrome.tabs.create({
      url: productUrl,
      active: false
    });
    
    // Wait for the page to load and inject content script
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Inject content script to extract product info
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        // Extract product title
        const titleElement = document.querySelector('#productTitle');
        const title = titleElement ? titleElement.textContent.trim() : 'Product title not found';
        
        // Extract product image
        const imgWrapper = document.querySelector('#imgTagWrapperId img');
        const imageUrl = imgWrapper ? imgWrapper.src : '';
        
        return { title, imageUrl };
      }
    });
    
    // Close the temporary tab
    await chrome.tabs.remove(tab.id);
    
    if (results && results[0] && results[0].result) {
      const productInfo = results[0].result;
      console.log("Product info extracted:", productInfo);
      return productInfo;
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting product info:", error);
    return null;
  }
}

// Function to update extension state based on current tab
async function updateExtensionState(tabId, url) {
  if (isAmazonReviewPage(url)) {
    // Enable extension for Amazon review pages
    await chrome.action.enable(tabId);
    console.log("Extension enabled for Amazon review page:", url);
  } else {
    // Disable extension for non-review pages
    await chrome.action.disable(tabId);
    console.log("Extension disabled for non-review page:", url);
  }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateExtensionState(tabId, tab.url);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      updateExtensionState(tab.id, tab.url);
    }
  } catch (error) {
    console.error("Error getting active tab:", error);
  }
});

// Message listener for communication with content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);
  
  switch (request.action) {
    case 'getCurrentTab':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          sendResponse({ 
            tab: tabs[0],
            isReviewPage: isAmazonReviewPage(tabs[0].url)
          });
        } else {
          sendResponse({ error: 'No active tab found' });
        }
      });
      return true; // Keep message channel open for async response
      
    case 'extractProductInfo':
      // Extract product info and send back to popup
      extractProductInfo(request.asin).then(productInfo => {
        if (productInfo) {
          // Store product info in both local and sync storage for persistence
          chrome.storage.local.set({ 
            productData: productInfo,
            timestamp: Date.now()
          });
          
          chrome.storage.sync.set({ 
            productData: productInfo
          });
          
          // Try to send message to popup if it's open
          try {
            chrome.runtime.sendMessage({
              action: 'productInfoReceived',
              productInfo: productInfo
            }).catch(error => {
              console.log("Popup not open, storing product info for later:", error);
              // Store the product info for when popup opens
              chrome.storage.local.set({ 
                pendingProductInfo: productInfo,
                timestamp: Date.now()
              });
            });
          } catch (error) {
            console.log("Error sending to popup, storing for later:", error);
            // Store the product info for when popup opens
            chrome.storage.local.set({ 
              pendingProductInfo: productInfo,
              timestamp: Date.now()
            });
          }
        }
      }).catch(error => {
        console.error("Error in extractProductInfo:", error);
        // Try to send error message to popup
        try {
          chrome.runtime.sendMessage({
            action: 'productInfoError',
            error: error.message
          }).catch(() => {
            console.log("Could not send error to popup");
          });
        } catch (e) {
          console.log("Error sending error message:", e);
        }
      });
      sendResponse({ status: 'Product info extraction started' });
      return true;
      
    case 'openPopupAndLoadProduct':
      // Open the popup and start loading product info
      chrome.action.openPopup();
      
      // Wait a moment for popup to open, then show loading state
      setTimeout(() => {
        // Show loading state in popup
        chrome.runtime.sendMessage({
          action: 'showLoading'
        }).catch(error => {
          console.log("Error showing loading state:", error);
        });
        
        // Start loading product info
        extractProductInfo(request.asin).then(productInfo => {
          if (productInfo) {
            // Send product info to popup
            chrome.runtime.sendMessage({
              action: 'productInfoReceived',
              productInfo: productInfo
            }).catch(error => {
              console.log("Error sending product info to popup:", error);
            });
          }
        }).catch(error => {
          console.error("Error loading product info:", error);
          // Send error to popup
          chrome.runtime.sendMessage({
            action: 'productInfoError',
            error: error.message
          }).catch(e => {
            console.log("Could not send error to popup:", e);
          });
        });
      }, 500);
      
      sendResponse({ status: 'Popup opened and product loading started' });
      return true;
      
    case 'getProductInfo':
      // This will be implemented later to get product information
      sendResponse({ status: 'Product info feature coming soon' });
      break;
      
    default:
      sendResponse({ status: 'ok', message: 'Message received' });
  }
});

// Initialize extension state for current tabs
chrome.tabs.query({}, (tabs) => {
  tabs.forEach(tab => {
    if (tab.url) {
      updateExtensionState(tab.id, tab.url);
    }
  });
});
